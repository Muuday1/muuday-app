import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

type StripeWebhookEventRow = {
  id: string
  provider_event_id: string
  event_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'ignored'
  attempt_count: number
  max_attempts: number
}

type StripeRetryQueueRow = {
  id: string
  payment_id: string | null
  provider_payment_id: string | null
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  attempt_count: number
  max_attempts: number
}

type StripeSubscriptionCheckRow = {
  id: string
  stripe_subscription_id: string
  professional_id: string | null
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  attempt_count: number
  max_attempts: number
}

const DEFAULT_MAX_WEBHOOK_ATTEMPTS = 8
const DEFAULT_MAX_RETRY_ATTEMPTS = 5

type StripeWebhookRecordInput = {
  providerEventId: string
  eventType: string
  apiVersion?: string | null
  livemode: boolean
  payload: Record<string, unknown>
  signatureHeader?: string | null
}

type StripeJobRunStart = {
  id: string
  started: boolean
}

type StripeWebhookProcessSummary = {
  fetched: number
  claimed: number
  processed: number
  failed: number
  ignored: number
}

type PayoutScanSummary = {
  scannedPayments: number
  eligiblePayments: number
  eligibleProfessionals: number
  eligibleAmountByCurrency: Record<string, number>
}

type SubscriptionCheckSummary = {
  queued: number
  processed: number
  failed: number
  missingProfessional: number
}

type FailedPaymentRetrySummary = {
  fetched: number
  processed: number
  succeeded: number
  failed: number
  cancelled: number
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function asIdFromStringOrObject(value: unknown): string | null {
  const direct = asString(value)
  if (direct) return direct
  const record = asRecord(value)
  return asString(record.id)
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function truncateErrorMessage(message: string, max = 500) {
  if (message.length <= max) return message
  return `${message.slice(0, max - 3)}...`
}

function buildNextRetryDate(attempt: number, now: Date) {
  // Progressive backoff without creating very long dead-time.
  const minutes = Math.min(60, Math.max(1, Math.pow(2, Math.min(attempt, 6))))
  return new Date(now.getTime() + minutes * 60 * 1000)
}

function createStripeClientIfConfigured() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null
  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}

function isStripeRuntimeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
}

async function tryStartJobRun(
  admin: SupabaseClient,
  jobName: string,
  runKey: string,
  context: Record<string, unknown> = {},
): Promise<StripeJobRunStart> {
  const { data: existing } = await admin
    .from('stripe_job_runs')
    .select('id, status')
    .eq('job_name', jobName)
    .eq('run_key', runKey)
    .maybeSingle()

  if (existing?.id && existing.status === 'completed') {
    return { id: String(existing.id), started: false }
  }

  if (existing?.id && existing.status === 'started') {
    return { id: String(existing.id), started: false }
  }

  if (existing?.id && existing.status === 'failed') {
    const { data: restarted, error: restartError } = await admin
      .from('stripe_job_runs')
      .update({
        status: 'started',
        error_message: null,
        summary: {},
        context,
        started_at: new Date().toISOString(),
        finished_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single()

    if (restartError || !restarted) {
      throw new Error(`Failed to restart stripe job run: ${restartError?.message || 'unknown'}`)
    }
    return { id: String(restarted.id), started: true }
  }

  const { data: created, error: createError } = await admin
    .from('stripe_job_runs')
    .insert({
      job_name: jobName,
      run_key: runKey,
      status: 'started',
      context,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (createError || !created) {
    throw new Error(`Failed to start stripe job run: ${createError?.message || 'unknown'}`)
  }
  return { id: String(created.id), started: true }
}

async function finishJobRun(
  admin: SupabaseClient,
  jobRunId: string,
  status: 'completed' | 'failed',
  summary: Record<string, unknown>,
  errorMessage?: string | null,
) {
  const { error } = await admin
    .from('stripe_job_runs')
    .update({
      status,
      summary,
      error_message: errorMessage ? truncateErrorMessage(errorMessage, 800) : null,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobRunId)

  if (error) {
    throw new Error(`Failed to finish stripe job run: ${error.message}`)
  }
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

function toIsoWeekKey(date: Date) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = normalized.getUTCDay() || 7
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((normalized.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const year = normalized.getUTCFullYear()
  return `${year}-W${String(weekNo).padStart(2, '0')}`
}

export async function runStripeWeeklyPayoutEligibilityScan(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<PayoutScanSummary & { runExecuted: boolean; reason?: string }> {
  const now = new Date(nowInput)
  const runKey = toIsoWeekKey(now)
  const job = await tryStartJobRun(admin, 'stripe.weekly_payout_eligibility_scan', runKey, {
    at_utc: now.toISOString(),
  })

  if (!job.started) {
    return {
      runExecuted: false,
      reason: 'already-ran-for-window',
      scannedPayments: 0,
      eligiblePayments: 0,
      eligibleProfessionals: 0,
      eligibleAmountByCurrency: {},
    }
  }

  try {
    if (!isStripeRuntimeConfigured()) {
      const summary = {
        runExecuted: true,
        reason: 'stripe-not-configured',
        scannedPayments: 0,
        eligiblePayments: 0,
        eligibleProfessionals: 0,
        eligibleAmountByCurrency: {},
      }
      await finishJobRun(admin, job.id, 'completed', summary)
      return summary
    }

    const cutoffIso = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
    const { data: payments, error } = await admin
      .from('payments')
      .select('id, professional_id, amount_total, currency, metadata, provider, status, captured_at')
      .eq('provider', 'stripe')
      .eq('status', 'captured')
      .lte('captured_at', cutoffIso)
      .limit(5000)

    if (error) {
      throw new Error(`Failed to scan eligible payouts: ${error.message}`)
    }

    const byProfessional = new Set<string>()
    const byCurrency: Record<string, number> = {}
    let eligiblePayments = 0
    for (const row of payments || []) {
      const metadata = asRecord(row.metadata)
      if (asString(metadata.payout_transfer_id)) continue
      eligiblePayments += 1
      const professionalId = asString(row.professional_id)
      if (professionalId) byProfessional.add(professionalId)
      const currency = asString(row.currency) || 'BRL'
      const amount = asNumber(row.amount_total) || 0
      byCurrency[currency] = (byCurrency[currency] || 0) + amount
    }

    const summary = {
      runExecuted: true,
      scannedPayments: payments?.length || 0,
      eligiblePayments,
      eligibleProfessionals: byProfessional.size,
      eligibleAmountByCurrency: byCurrency,
    }

    await finishJobRun(admin, job.id, 'completed', summary)
    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown payout scan error'
    await finishJobRun(admin, job.id, 'failed', {}, message)
    throw error
  }
}

export async function runStripeSubscriptionRenewalChecks(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<SubscriptionCheckSummary & { runExecuted: boolean; reason?: string }> {
  const now = new Date(nowInput)
  const runKey = now.toISOString().slice(0, 10)
  const job = await tryStartJobRun(admin, 'stripe.subscription_renewal_checks', runKey, {
    at_utc: now.toISOString(),
  })

  if (!job.started) {
    return {
      runExecuted: false,
      reason: 'already-ran-for-window',
      queued: 0,
      processed: 0,
      failed: 0,
      missingProfessional: 0,
    }
  }

  try {
    const stripeClient = createStripeClientIfConfigured()
    if (!stripeClient) {
      const summary = {
        runExecuted: true,
        reason: 'stripe-not-configured',
        queued: 0,
        processed: 0,
        failed: 0,
        missingProfessional: 0,
      }
      await finishJobRun(admin, job.id, 'completed', summary)
      return summary
    }

    const { data: queueRows, error } = await admin
      .from('stripe_subscription_check_queue')
      .select('id, stripe_subscription_id, professional_id, status, attempt_count, max_attempts')
      .in('status', ['queued', 'failed'])
      .lte('next_attempt_at', now.toISOString())
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw new Error(`Failed to load subscription check queue: ${error.message}`)

    let processed = 0
    let failed = 0
    let missingProfessional = 0
    for (const row of (queueRows || []) as unknown as StripeSubscriptionCheckRow[]) {
      const claim = await admin
        .from('stripe_subscription_check_queue')
        .update({
          status: 'processing',
          attempt_count: row.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('status', row.status)
        .eq('attempt_count', row.attempt_count)
        .select('id')
        .maybeSingle()

      if (claim.error || !claim.data) continue

      try {
        const subscription = await stripeClient.subscriptions.retrieve(row.stripe_subscription_id)
        const metadata = asRecord(subscription.metadata)
        const professionalId =
          row.professional_id || asString(metadata.professional_id) || asString(metadata.professionalId)

        if (!professionalId) {
          missingProfessional += 1
        } else {
          const billingCardOnFile = !['incomplete_expired', 'unpaid'].includes(subscription.status)
          await admin
            .from('professional_settings')
            .update({
              billing_card_on_file: billingCardOnFile,
              updated_at: new Date().toISOString(),
            })
            .eq('professional_id', professionalId)
        }

        await admin
          .from('stripe_subscription_check_queue')
          .update({
            status: 'succeeded',
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)
        processed += 1
      } catch (processingError) {
        failed += 1
        const nextRetryAt = buildNextRetryDate(row.attempt_count + 1, now).toISOString()
        const exceeded = row.attempt_count + 1 >= row.max_attempts
        const errorMessage =
          processingError instanceof Error ? processingError.message : 'unknown subscription check error'

        await admin
          .from('stripe_subscription_check_queue')
          .update({
            status: exceeded ? 'cancelled' : 'failed',
            next_attempt_at: exceeded ? new Date().toISOString() : nextRetryAt,
            last_error: truncateErrorMessage(errorMessage),
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)
      }
    }

    const summary = {
      runExecuted: true,
      queued: queueRows?.length || 0,
      processed,
      failed,
      missingProfessional,
    }

    await finishJobRun(admin, job.id, 'completed', summary)
    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown renewal-check error'
    await finishJobRun(admin, job.id, 'failed', {}, message)
    throw error
  }
}

export async function runStripeFailedPaymentRetries(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<FailedPaymentRetrySummary & { runExecuted: boolean; reason?: string }> {
  const now = new Date(nowInput)
  const runKey = now.toISOString().slice(0, 13)
  const job = await tryStartJobRun(admin, 'stripe.failed_payment_retry', runKey, {
    at_utc: now.toISOString(),
  })

  if (!job.started) {
    return {
      runExecuted: false,
      reason: 'already-ran-for-window',
      fetched: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    }
  }

  try {
    const stripeClient = createStripeClientIfConfigured()
    if (!stripeClient) {
      const summary = {
        runExecuted: true,
        reason: 'stripe-not-configured',
        fetched: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        cancelled: 0,
      }
      await finishJobRun(admin, job.id, 'completed', summary)
      return summary
    }

    const { data: retryRows, error } = await admin
      .from('stripe_payment_retry_queue')
      .select('id, payment_id, provider_payment_id, status, attempt_count, max_attempts')
      .in('status', ['queued', 'failed'])
      .lte('next_attempt_at', now.toISOString())
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw new Error(`Failed to load payment retry queue: ${error.message}`)

    let processed = 0
    let succeeded = 0
    let failed = 0
    let cancelled = 0

    for (const row of (retryRows || []) as unknown as StripeRetryQueueRow[]) {
      const claim = await admin
        .from('stripe_payment_retry_queue')
        .update({
          status: 'processing',
          attempt_count: row.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('status', row.status)
        .eq('attempt_count', row.attempt_count)
        .select('id')
        .maybeSingle()

      if (claim.error || !claim.data) continue

      processed += 1
      try {
        if (!row.provider_payment_id) {
          await admin
            .from('stripe_payment_retry_queue')
            .update({
              status: 'cancelled',
              last_error: 'missing_provider_payment_id',
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)
          cancelled += 1
          continue
        }

        const paymentIntent = await stripeClient.paymentIntents.retrieve(row.provider_payment_id)
        const stripeStatus = paymentIntent.status
        if (stripeStatus === 'succeeded' || stripeStatus === 'processing') {
          if (row.payment_id) {
            await admin
              .from('payments')
              .update({
                status: 'captured',
                captured_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', row.payment_id)
          }
          await admin
            .from('stripe_payment_retry_queue')
            .update({
              status: 'succeeded',
              last_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)
          succeeded += 1
          continue
        }

        if (stripeStatus === 'canceled') {
          await admin
            .from('stripe_payment_retry_queue')
            .update({
              status: 'cancelled',
              last_error: 'payment_intent_canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)
          cancelled += 1
          continue
        }

        const exceeded = row.attempt_count + 1 >= row.max_attempts
        await admin
          .from('stripe_payment_retry_queue')
          .update({
            status: exceeded ? 'cancelled' : 'failed',
            next_attempt_at: exceeded
              ? new Date().toISOString()
              : buildNextRetryDate(row.attempt_count + 1, now).toISOString(),
            last_error: `payment_intent_status_${stripeStatus}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (exceeded) cancelled += 1
        else failed += 1
      } catch (processingError) {
        const message =
          processingError instanceof Error ? processingError.message : 'unknown payment retry error'
        const exceeded = row.attempt_count + 1 >= row.max_attempts
        await admin
          .from('stripe_payment_retry_queue')
          .update({
            status: exceeded ? 'cancelled' : 'failed',
            next_attempt_at: exceeded
              ? new Date().toISOString()
              : buildNextRetryDate(row.attempt_count + 1, now).toISOString(),
            last_error: truncateErrorMessage(message),
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (exceeded) cancelled += 1
        else failed += 1
      }
    }

    const summary = {
      runExecuted: true,
      fetched: retryRows?.length || 0,
      processed,
      succeeded,
      failed,
      cancelled,
    }
    await finishJobRun(admin, job.id, 'completed', summary)
    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown failed-payment-retry error'
    await finishJobRun(admin, job.id, 'failed', {}, message)
    throw error
  }
}
