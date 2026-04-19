import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { asRecord, asString, asIdFromStringOrObject, truncateErrorMessage, buildNextRetryDate } from './helpers'

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
  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('id, status')
    .eq('provider_event_id', input.providerEventId)
    .maybeSingle()

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

async function setPaymentStatusFromWebhook(
  admin: SupabaseClient,
  providerPaymentId: string,
  status: 'captured' | 'failed' | 'refunded',
  extraMetadata: Record<string, unknown>,
) {
  const nowIso = new Date().toISOString()
  const { data: rows, error: loadError } = await admin
    .from('payments')
    .select('id, metadata, status')
    .eq('provider', 'stripe')
    .eq('provider_payment_id', providerPaymentId)

  if (loadError) {
    throw new Error(`Failed to load payment rows: ${loadError.message}`)
  }

  if (!rows || rows.length === 0) {
    return 0
  }

  let updated = 0
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
    updated += 1
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

async function handleStripeWebhookEvent(admin: SupabaseClient, event: Stripe.Event) {
  const paymentIntentId = extractPaymentIntentIdFromStripeEvent(event)
  const eventObject = asRecord(event.data.object as unknown)
  const metadata = asRecord(eventObject.metadata)

  if (event.type === 'payment_intent.succeeded' && paymentIntentId) {
    const updated = await setPaymentStatusFromWebhook(admin, paymentIntentId, 'captured', {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })
    return { outcome: 'processed', paymentRowsUpdated: updated }
  }

  if (event.type === 'payment_intent.payment_failed' && paymentIntentId) {
    const updated = await setPaymentStatusFromWebhook(admin, paymentIntentId, 'failed', {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })

    const { data: paymentRows } = await admin
      .from('payments')
      .select('id')
      .eq('provider', 'stripe')
      .eq('provider_payment_id', paymentIntentId)

    const paymentId = paymentRows?.[0]?.id ? String(paymentRows[0].id) : null
    await enqueuePaymentRetry(admin, paymentId, paymentIntentId, {
      source: 'webhook',
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })
    return { outcome: 'processed', paymentRowsUpdated: updated, retryQueued: true }
  }

  if ((event.type === 'charge.refunded' || event.type === 'refund.created') && paymentIntentId) {
    const updated = await setPaymentStatusFromWebhook(admin, paymentIntentId, 'refunded', {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    })
    return { outcome: 'processed', paymentRowsUpdated: updated }
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
