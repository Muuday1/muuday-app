import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { asRecord, asString, asIdFromStringOrObject, truncateErrorMessage, buildNextRetryDate } from './helpers'
import { getStripeClient } from './client'
import {
  buildPaymentCaptureTransaction,
  buildRefundTransaction,
  createLedgerTransaction,
} from '@/lib/payments/ledger/entries'
import { updateProfessionalBalance } from '@/lib/payments/ledger/balance'

const DEFAULT_MAX_WEBHOOK_ATTEMPTS = 8

export type StripeWebhookRecordInput = {
  providerEventId: string
  eventType: string
  apiVersion?: string | null
  livemode: boolean
  payload: Record<string, unknown>
  signatureHeader?: string | null
}

export type StripeWebhookProcessSummary = {
  fetched: number
  claimed: number
  processed: number
  failed: number
  ignored: number
}

type StripeWebhookEventRow = {
  id: string
  provider_event_id: string
  event_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'ignored'
  attempt_count: number
  max_attempts: number
}

export async function recordStripeWebhookEvent(
  admin: SupabaseClient,
  input: StripeWebhookRecordInput,
) {
  const { data: existing, error: existingError } = await admin
    .from('stripe_webhook_events')
    .select('id, status')
    .eq('provider_event_id', input.providerEventId)
    .maybeSingle()

  if (existingError) {
    console.error('[stripe/webhook] failed to check existing event:', existingError.message)
  }

  if (existing?.id) {
    return {
      id: String(existing.id),
      status: String(existing.status),
      inserted: false,
    }
  }

  const { data: inserted, error } = await admin
    .from('stripe_webhook_events')
    .insert({
      provider_event_id: input.providerEventId,
      event_type: input.eventType,
      api_version: input.apiVersion || null,
      livemode: input.livemode,
      payload: input.payload,
      signature_header: input.signatureHeader || null,
      status: 'pending',
      attempt_count: 0,
      max_attempts: DEFAULT_MAX_WEBHOOK_ATTEMPTS,
      next_retry_at: new Date().toISOString(),
    })
    .select('id, status')
    .single()

  if (error || !inserted) {
    throw new Error(`Failed to persist stripe webhook event: ${error?.message || 'unknown'}`)
  }

  return {
    id: String(inserted.id),
    status: String(inserted.status),
    inserted: true,
  }
}

function extractPaymentIntentIdFromStripeEvent(event: Stripe.Event) {
  if (event.type.startsWith('payment_intent.')) {
    const payload = event.data.object as Stripe.PaymentIntent
    return asString(payload?.id)
  }
  if (event.type === 'charge.refunded' || event.type === 'charge.succeeded') {
    const payload = event.data.object as Stripe.Charge
    return asIdFromStringOrObject(payload?.payment_intent)
  }
  if (event.type === 'refund.created' || event.type === 'refund.updated') {
    const payload = event.data.object as Stripe.Refund
    return asIdFromStringOrObject(payload?.payment_intent)
  }
  return null
}

type PaymentRowForWebhook = {
  id: string
  booking_id: string
  professional_id: string
  amount_total_minor: number
  metadata: Record<string, unknown>
  status: string
}

async function setPaymentStatusFromWebhook(
  admin: SupabaseClient,
  providerPaymentId: string,
  status: 'captured' | 'failed' | 'refunded',
  extraMetadata: Record<string, unknown>,
): Promise<PaymentRowForWebhook[]> {
  const nowIso = new Date().toISOString()
  const { data: rows, error: loadError } = await admin
    .from('payments')
    .select('id, booking_id, professional_id, amount_total_minor, metadata, status')
    .eq('provider', 'stripe')
    .eq('provider_payment_id', providerPaymentId)

  if (loadError) {
    throw new Error(`Failed to load payment rows: ${loadError.message}`)
  }

  if (!rows || rows.length === 0) {
    return []
  }

  const updated: PaymentRowForWebhook[] = []
  for (const row of rows) {
    const metadata = asRecord(row.metadata)
    const mergedMetadata = {
      ...metadata,
      ...extraMetadata,
      webhook_processed_at: nowIso,
    }

    const patch: Record<string, unknown> = {
      status,
      metadata: mergedMetadata,
      updated_at: nowIso,
    }
    if (status === 'captured') patch.captured_at = nowIso
    if (status === 'refunded') patch.refunded_at = nowIso

    const { error: updateError } = await admin.from('payments').update(patch).eq('id', row.id)
    if (updateError) {
      throw new Error(`Failed to update payment status: ${updateError.message}`)
    }
    updated.push(row as unknown as PaymentRowForWebhook)
  }

  return updated
}

async function enqueuePaymentRetry(
  admin: SupabaseClient,
  paymentId: string | null,
  providerPaymentId: string | null,
  metadata: Record<string, unknown>,
) {
  if (!paymentId && !providerPaymentId) return

  const nextAttemptAt = new Date().toISOString()
  const DEFAULT_MAX_RETRY_ATTEMPTS = 5
  const { error } = await admin.from('stripe_payment_retry_queue').insert({
    payment_id: paymentId,
    provider_payment_id: providerPaymentId,
    status: 'queued',
    attempt_count: 0,
    max_attempts: DEFAULT_MAX_RETRY_ATTEMPTS,
    next_attempt_at: nextAttemptAt,
    metadata,
  })

  if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
    throw new Error(`Failed to enqueue payment retry: ${error.message}`)
  }
}

async function enqueueSubscriptionCheck(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
  professionalId: string | null,
  metadata: Record<string, unknown>,
) {
  const DEFAULT_MAX_RETRY_ATTEMPTS = 5
  const { error } = await admin.from('stripe_subscription_check_queue').insert({
    stripe_subscription_id: stripeSubscriptionId,
    professional_id: professionalId,
    status: 'queued',
    attempt_count: 0,
    max_attempts: DEFAULT_MAX_RETRY_ATTEMPTS,
    next_attempt_at: new Date().toISOString(),
    metadata,
  })

  if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
    throw new Error(`Failed to enqueue subscription check: ${error.message}`)
  }
}

/**
 * Fetch the actual Stripe fee from a PaymentIntent by looking up its latest charge.
 * Falls back to an estimate if the API call fails.
 */
async function fetchStripeFeeForPaymentIntent(
  paymentIntentId: string,
  amountMinor: bigint,
): Promise<{ stripeFeeMinor: bigint; platformFeeMinor: bigint }> {
  const stripe = getStripeClient()
  if (!stripe) {
    // Fallback estimate: 2.9% + 30 cents for BRL
    const estimatedFee = (amountMinor * BigInt(29)) / BigInt(1000) + BigInt(30)
    const platformFee = (amountMinor * BigInt(15)) / BigInt(100) // 15% platform fee
    return { stripeFeeMinor: estimatedFee, platformFeeMinor: platformFee }
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.balance_transaction'],
    })

    const charge = pi.latest_charge
    if (charge && typeof charge === 'object' && 'balance_transaction' in charge) {
      const bt = charge.balance_transaction
      if (bt && typeof bt === 'object' && 'fee' in bt) {
        const fee = BigInt(Math.round((bt.fee || 0)))
        const platformFee = (amountMinor * BigInt(15)) / BigInt(100) // 15% platform fee
        return { stripeFeeMinor: fee, platformFeeMinor: platformFee }
      }
    }
  } catch (error) {
    console.error(`[stripe/webhook] failed to fetch fee for PI ${paymentIntentId}:`, error)
  }

  // Fallback estimate
  const estimatedFee = (amountMinor * BigInt(29)) / BigInt(1000) + BigInt(30)
  const platformFee = (amountMinor * BigInt(15)) / BigInt(100)
  return { stripeFeeMinor: estimatedFee, platformFeeMinor: platformFee }
}

async function handleStripeWebhookEvent(admin: SupabaseClient, event: Stripe.Event) {
  const paymentIntentId = extractPaymentIntentIdFromStripeEvent(event)
  const eventObject = asRecord(event.data.object as unknown)
  const metadata = asRecord(eventObject.metadata)

  if (event.type === 'payment_intent.succeeded' && paymentIntentId) {
    const payments = await setPaymentStatusFromWebhook(admin, paymentIntentId, 'captured', {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })

    // Ledger + balance integration for each payment row updated
    for (const payment of payments) {
      try {
        const amountMinor = BigInt(payment.amount_total_minor || 0)
        if (amountMinor <= BigInt(0)) continue

        const { stripeFeeMinor, platformFeeMinor } = await fetchStripeFeeForPaymentIntent(
          paymentIntentId,
          amountMinor,
        )

        // Create ledger entry
        const ledgerInput = buildPaymentCaptureTransaction({
          amount: amountMinor,
          stripeFeeAmount: stripeFeeMinor,
          platformFeeAmount: platformFeeMinor,
          bookingId: payment.booking_id,
          paymentId: payment.id,
        })
        await createLedgerTransaction(admin, ledgerInput)

        // Update professional balance: increment pending_balance
        await updateProfessionalBalance(admin, payment.professional_id, {
          pendingDelta: amountMinor - platformFeeMinor,
        })
      } catch (ledgerError) {
        console.error(
          `[stripe/webhook] ledger/balance error for payment ${payment.id}:`,
          ledgerError instanceof Error ? ledgerError.message : ledgerError,
        )
        // Non-blocking: webhook should still succeed even if ledger fails
        // The ledger can be reconstructed later from the payment data
      }
    }

    return { outcome: 'processed', paymentRowsUpdated: payments.length }
  }

  if (event.type === 'payment_intent.payment_failed' && paymentIntentId) {
    const payments = await setPaymentStatusFromWebhook(admin, paymentIntentId, 'failed', {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })

    const { data: paymentRows, error: paymentRowsError } = await admin
      .from('payments')
      .select('id')
      .eq('provider', 'stripe')
      .eq('provider_payment_id', paymentIntentId)

    if (paymentRowsError) {
      console.error('[stripe/webhook] failed to load payment rows for retry:', paymentRowsError.message)
    }

    const paymentId = paymentRows?.[0]?.id ? String(paymentRows[0].id) : null
    await enqueuePaymentRetry(admin, paymentId, paymentIntentId, {
      source: 'webhook',
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })
    return { outcome: 'processed', paymentRowsUpdated: payments.length, retryQueued: true }
  }

  if ((event.type === 'charge.refunded' || event.type === 'refund.created') && paymentIntentId) {
    const payments = await setPaymentStatusFromWebhook(admin, paymentIntentId, 'refunded', {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })

    // Ledger integration for refunds
    for (const payment of payments) {
      try {
        const amountMinor = BigInt(payment.amount_total_minor || 0)
        if (amountMinor <= BigInt(0)) continue

        const ledgerInput = buildRefundTransaction({
          refundAmount: amountMinor,
          bookingId: payment.booking_id,
          paymentId: payment.id,
        })
        await createLedgerTransaction(admin, ledgerInput)
      } catch (ledgerError) {
        console.error(
          `[stripe/webhook] ledger error for refund ${payment.id}:`,
          ledgerError instanceof Error ? ledgerError.message : ledgerError,
        )
      }
    }

    return { outcome: 'processed', paymentRowsUpdated: payments.length }
  }

  if (
    event.type === 'invoice.payment_failed' ||
    event.type === 'invoice.paid' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscriptionId = asString(eventObject.id)
    const professionalId = asString(metadata.professional_id)
    if (subscriptionId) {
      await enqueueSubscriptionCheck(admin, subscriptionId, professionalId, {
        source: 'webhook',
        stripe_event_id: event.id,
        stripe_event_type: event.type,
      })
      return { outcome: 'processed', subscriptionCheckQueued: true }
    }
  }

  // We keep unsupported events as ignored instead of failing retries forever.
  return { outcome: 'ignored' }
}

export async function processStripeWebhookInbox(
  admin: SupabaseClient,
  options?: { limit?: number; now?: Date },
): Promise<StripeWebhookProcessSummary> {
  const now = options?.now ?? new Date()
  const limit = Math.min(Math.max(options?.limit || 20, 1), 100)

  const { data: rows, error } = await admin
    .from('stripe_webhook_events')
    .select('id, provider_event_id, event_type, payload, status, attempt_count, max_attempts')
    .in('status', ['pending', 'failed'])
    .lte('next_retry_at', now.toISOString())
    .order('received_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to load stripe webhook inbox: ${error.message}`)
  }

  const summary: StripeWebhookProcessSummary = {
    fetched: rows?.length || 0,
    claimed: 0,
    processed: 0,
    failed: 0,
    ignored: 0,
  }

  for (const rawRow of (rows || []) as unknown as StripeWebhookEventRow[]) {
    const claimAttempt = rawRow.attempt_count + 1
    const { data: claimed, error: claimError } = await admin
      .from('stripe_webhook_events')
      .update({
        status: 'processing',
        attempt_count: claimAttempt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rawRow.id)
      .eq('status', rawRow.status)
      .eq('attempt_count', rawRow.attempt_count)
      .select('id')
      .maybeSingle()

    if (claimError || !claimed) continue
    summary.claimed += 1

    try {
      const eventPayload = rawRow.payload as unknown as Stripe.Event
      const outcome = await handleStripeWebhookEvent(admin, eventPayload)
      const finalStatus = outcome.outcome === 'ignored' ? 'ignored' : 'processed'

      const { error: completeError } = await admin
        .from('stripe_webhook_events')
        .update({
          status: finalStatus,
          processed_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rawRow.id)

      if (completeError) {
        throw new Error(`Failed to mark webhook event as ${finalStatus}: ${completeError.message}`)
      }

      if (finalStatus === 'ignored') summary.ignored += 1
      else summary.processed += 1
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : 'unknown stripe webhook processing error'
      const exceeded = claimAttempt >= rawRow.max_attempts
      const nextRetryAt = buildNextRetryDate(claimAttempt, now).toISOString()

      const { error: failUpdateError } = await admin
        .from('stripe_webhook_events')
        .update({
          status: exceeded ? 'ignored' : 'failed',
          last_error: truncateErrorMessage(message),
          next_retry_at: exceeded ? new Date().toISOString() : nextRetryAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rawRow.id)

      if (failUpdateError) {
        throw new Error(`Failed to mark webhook event failure: ${failUpdateError.message}`)
      }

      if (exceeded) summary.ignored += 1
      else summary.failed += 1
    }
  }

  return summary
}
