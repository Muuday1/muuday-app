import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createStripeClientIfConfigured } from './client'
import { asRecord, asString, asNumber, truncateErrorMessage, buildNextRetryDate, toIsoWeekKey } from './helpers'
import { tryStartJobRun, finishJobRun } from './jobs'
import { fetchStripeFeeForPaymentIntent } from './webhook-handlers'
import {
  buildPaymentCaptureTransaction,
  createLedgerTransaction,
} from '@/lib/payments/ledger/entries'
import { updateProfessionalBalance } from '@/lib/payments/ledger/balance'
export type PayoutScanSummary = {
  scannedPayments: number
  eligiblePayments: number
  eligibleProfessionals: number
  eligibleAmountByCurrency: Record<string, number>
}

export type SubscriptionCheckSummary = {
  queued: number
  processed: number
  failed: number
  missingProfessional: number
}

export type FailedPaymentRetrySummary = {
  fetched: number
  processed: number
  succeeded: number
  failed: number
  cancelled: number
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

const DEFAULT_MAX_RETRY_ATTEMPTS = 5

export async function enqueuePaymentRetry(
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

export async function enqueueSubscriptionCheck(
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
    if (!createStripeClientIfConfigured()) {
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
          // Sync legacy billing_card_on_file flag (must match syncBillingCardOnFile in manager.ts)
          const billingCardOnFile = !['incomplete', 'incomplete_expired', 'unpaid', 'canceled'].includes(subscription.status)
          const { error: settingsUpdateError } = await admin
            .from('professional_settings')
            .upsert({
              professional_id: professionalId,
              billing_card_on_file: billingCardOnFile,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'professional_id' })

          if (settingsUpdateError) {
            Sentry.captureException(settingsUpdateError, { tags: { area: 'stripe_cron', subArea: 'subscription_check_sync_billing' } })
          }
        }

        const { error: queueUpdateError } = await admin
          .from('stripe_subscription_check_queue')
          .update({
            status: 'succeeded',
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (queueUpdateError) {
          Sentry.captureException(queueUpdateError, { tags: { area: 'stripe_cron', subArea: 'subscription_check_queue' } })
        } else {
          processed += 1
        }
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
            // Load current payment state to check idempotency
            const { data: paymentRow, error: paymentLoadError } = await admin
              .from('payments')
              .select('id, booking_id, professional_id, amount_total_minor, status, captured_at')
              .eq('id', row.payment_id)
              .maybeSingle()

            if (paymentLoadError) {
              Sentry.captureException(paymentLoadError, { tags: { area: 'stripe_cron', subArea: 'payment_retry_load' } })
            }

            const wasAlreadyCaptured = paymentRow?.status === 'captured'

            if (!wasAlreadyCaptured) {
              const { error: paymentUpdateError } = await admin
                .from('payments')
                .update({
                  status: 'captured',
                  captured_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', row.payment_id)

              if (paymentUpdateError) {
                Sentry.captureException(paymentUpdateError, { tags: { area: 'stripe_cron', subArea: 'payment_retry_status' } })
              }
            }

            // Create ledger entry and update balance if not already done
            if (paymentRow && !wasAlreadyCaptured) {
              try {
                const amountMinor = BigInt(paymentRow.amount_total_minor || 0)
                if (amountMinor > BigInt(0)) {
                  const { stripeFeeMinor, platformFeeMinor } = await fetchStripeFeeForPaymentIntent(
                    row.provider_payment_id,
                    amountMinor,
                  )

                  const ledgerInput = buildPaymentCaptureTransaction({
                    amount: amountMinor,
                    stripeFeeAmount: stripeFeeMinor,
                    platformFeeAmount: platformFeeMinor,
                    bookingId: paymentRow.booking_id,
                    paymentId: paymentRow.id,
                  })
                  await createLedgerTransaction(admin, ledgerInput)

                  await updateProfessionalBalance(admin, paymentRow.professional_id, {
                    availableDelta: amountMinor - platformFeeMinor,
                  })
                }
              } catch (ledgerError) {
                Sentry.captureException(ledgerError instanceof Error ? ledgerError : new Error(String(ledgerError)), {
                  tags: { area: 'stripe_cron', subArea: 'payment_retry_ledger' },
                })
              }
            }
          }
          const { error: queueUpdateError } = await admin
            .from('stripe_payment_retry_queue')
            .update({
              status: 'succeeded',
              last_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)

          if (queueUpdateError) {
            Sentry.captureException(queueUpdateError, { tags: { area: 'stripe_cron', subArea: 'payment_retry_queue' } })
          } else {
            succeeded += 1
          }
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
