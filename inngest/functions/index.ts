import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'
import { runPublicVisibilitySync } from '@/lib/ops/public-visibility-sync'
import { runRecurringReservedSlotRelease } from '@/lib/ops/recurring-slot-release'
import {
  cancelBookingInExternalCalendar,
  syncExternalBusySlotsForProfessional,
  upsertBookingInExternalCalendar,
} from '@/lib/calendar/sync/service'
import {
  processStripeWebhookInbox,
  runStripeFailedPaymentRetries,
  runStripeSubscriptionRenewalChecks,
  runStripeWeeklyPayoutEligibilityScan,
} from '@/lib/ops/stripe-resilience'
import { runReviewReminderSync } from '@/lib/ops/review-reminders'
import { runNoShowDetection } from '@/lib/ops/no-show-detection'
import { runSlotLockCleanup } from '@/lib/ops/slot-lock-cleanup'
import { runPendingPaymentTimeout } from '@/lib/ops/pending-payment-timeout'
import type { CalendarProvider } from '@/lib/calendar/types'
import * as Sentry from '@sentry/nextjs'
import { inngest } from '../client'
import {
  emitUserBookingConfirmed,
  emitUserPaymentFailed,
  emitProfessionalBookingConfirmed,
} from '@/lib/email/resend-events'
import {
  runUserInactivityScan,
  runProfessionalInactivityScan,
} from '@/lib/ops/resend-inactivity-events'
import { runAbandonedSearchSync } from '@/lib/ops/abandoned-search'
import { runAbandonedCheckoutSync } from '@/lib/ops/abandoned-checkout'
import { treasuryBalanceSnapshot } from './treasury-snapshot'
import { treasuryReconciliation } from './treasury-reconciliation'
import { payoutBatchCreate } from './payout-batch-create'
import { processTrolleyWebhook } from './trolley-webhook-processor'

type SupabaseDbChangeEventData = {
  source?: string
  schema?: string
  table?: string
  operation?: string
  record?: Record<string, unknown> | null
  oldRecord?: Record<string, unknown> | null
  receivedAt?: string
}

type CalendarBookingSyncEventData = {
  bookingId?: string
  action?: 'upsert_booking' | 'cancel_booking' | 'poll_busy'
  provider?: CalendarProvider
  professionalId?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asCalendarProvider(value: unknown): CalendarProvider | null {
  if (value === 'google' || value === 'outlook' || value === 'apple') {
    return value
  }
  return null
}

function isBookingStatus(value: string | null): value is
  | 'draft'
  | 'pending_payment'
  | 'pending_confirmation'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled' {
  return (
    value === 'draft' ||
    value === 'pending_payment' ||
    value === 'pending_confirmation' ||
    value === 'confirmed' ||
    value === 'cancelled' ||
    value === 'completed' ||
    value === 'no_show' ||
    value === 'rescheduled'
  )
}

async function notificationExists(
  admin: SupabaseClient,
  userId: string,
  bookingId: string,
  type: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('booking_id', bookingId)
    .eq('type', type)
    .limit(1)
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, {
      tags: { area: 'inngest', context: 'notification_exists_query' },
      extra: { userId, bookingId, type },
    })
    // Fail closed: assume notification exists to prevent duplicates
    return true
  }
  return Boolean(data?.id)
}

async function insertNotificationIfMissing(
  admin: SupabaseClient,
  input: {
    userId: string
    bookingId: string
    type: string
    title: string
    body: string
    payload?: Record<string, unknown>
  },
) {
  const exists = await notificationExists(admin, input.userId, input.bookingId, input.type)
  if (exists) return false

  const { error } = await admin.from('notifications').insert({
    user_id: input.userId,
    booking_id: input.bookingId,
    type: input.type,
    title: input.title,
    body: input.body,
    payload: input.payload || {},
  })

  if (error) {
    throw new Error(`Failed to insert notification (${input.type}): ${error.message}`)
  }

  return true
}

async function resolveProfessionalAccountUserId(
  admin: SupabaseClient,
  professionalId: string | null,
) {
  if (!professionalId) return null
  const { data, error } = await admin
    .from('professionals')
    .select('user_id')
    .eq('id', professionalId)
    .maybeSingle()

  if (error || !data?.user_id) return null
  return String(data.user_id)
}

async function resolveUserEmail(
  admin: SupabaseClient,
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null
  const { data, error } = await admin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.email) return null
  return String(data.email)
}

async function resolveUserName(
  admin: SupabaseClient,
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null
  const { data, error } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.full_name) return null
  return String(data.full_name)
}

export const syncBookingReminders = inngest.createFunction(
  {
    id: 'sync-booking-reminders',
    name: 'Sync booking reminders',
    triggers: [{ cron: '*/5 * * * *' }, { event: 'ops/booking-reminders.sync.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-reminder-sync', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for Inngest reminder sync.')
      }
      return runBookingReminderSync(admin)
    })

    logger.info('Booking reminders synchronized.', {
      trigger: event.name,
      checked: result.checked,
      inserted: result.inserted,
      at: result.at,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncUserInactivity30d = inngest.createFunction(
  {
    id: 'sync-user-inactivity-30d',
    name: 'Sync user inactivity (30d)',
    triggers: [{ cron: '0 9 * * 1' }], // Mondays at 9am UTC
  },
  async ({ step, event, logger }) => {
    const result = await step.run('scan-inactive-users-30d', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for inactivity scan.')
      }
      return runUserInactivityScan(admin, 30)
    })

    logger.info('User inactivity 30d scan complete.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncUserInactivity60d = inngest.createFunction(
  {
    id: 'sync-user-inactivity-60d',
    name: 'Sync user inactivity (60d)',
    triggers: [{ cron: '0 9 * * 1' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('scan-inactive-users-60d', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for inactivity scan.')
      }
      return runUserInactivityScan(admin, 60)
    })

    logger.info('User inactivity 60d scan complete.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncUserInactivity90d = inngest.createFunction(
  {
    id: 'sync-user-inactivity-90d',
    name: 'Sync user inactivity (90d)',
    triggers: [{ cron: '0 9 * * 1' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('scan-inactive-users-90d', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for inactivity scan.')
      }
      return runUserInactivityScan(admin, 90)
    })

    logger.info('User inactivity 90d scan complete.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncProfessionalInactivity30d = inngest.createFunction(
  {
    id: 'sync-professional-inactivity-30d',
    name: 'Sync professional inactivity (30d)',
    triggers: [{ cron: '0 9 * * 1' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('scan-inactive-professionals-30d', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for inactivity scan.')
      }
      return runProfessionalInactivityScan(admin)
    })

    logger.info('Professional inactivity 30d scan complete.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncAbandonedSearch = inngest.createFunction(
  {
    id: 'sync-abandoned-search',
    name: 'Sync abandoned search events',
    triggers: [{ cron: '*/30 * * * *' }, { event: 'ops/abandoned-search.sync.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('scan-abandoned-searches', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for abandoned search scan.')
      }
      return runAbandonedSearchSync(admin)
    })

    logger.info('Abandoned search scan complete.', {
      trigger: event.name,
      checked: result.checked,
      emitted: result.emitted,
      at: result.at,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncAbandonedCheckout = inngest.createFunction(
  {
    id: 'sync-abandoned-checkout',
    name: 'Sync abandoned checkout events',
    triggers: [{ cron: '*/30 * * * *' }, { event: 'ops/abandoned-checkout.sync.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('scan-abandoned-checkouts', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for abandoned checkout scan.')
      }
      return runAbandonedCheckoutSync(admin)
    })

    logger.info('Abandoned checkout scan complete.', {
      trigger: event.name,
      checked: result.checked,
      emitted: result.emitted,
      at: result.at,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const releaseRecurringReservedSlots = inngest.createFunction(
  {
    id: 'release-recurring-reserved-slots',
    name: 'Release recurring reserved slots',
    triggers: [{ cron: '0 * * * *' }, { event: 'ops/recurring.release.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('release-recurring-deadlines', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for recurring deadline release.')
      }
      return runRecurringReservedSlotRelease(admin)
    })

    logger.info('Recurring reserved slots released.', {
      trigger: event.name,
      checked: result.checked,
      eligible: result.eligible,
      releasedSessions: result.releasedSessions,
      releasedBookings: result.releasedBookings,
      at: result.at,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncPublicVisibilityFlags = inngest.createFunction(
  {
    id: 'sync-public-visibility-flags',
    name: 'Sync public visibility flags',
    triggers: [{ cron: '*/15 * * * *' }, { event: 'ops/public-visibility.sync.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-public-visibility-sync', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for public visibility sync.')
      }
      return runPublicVisibilitySync(admin, { batchSize: 250, maxBatches: 20 })
    })

    logger.info('Public visibility flags synchronized.', {
      trigger: event.name,
      ...result,
    })

    return { source: 'inngest', ...result }
  },
)

export const processStripeWebhookInboxQueue = inngest.createFunction(
  {
    id: 'process-stripe-webhook-inbox',
    name: 'Process Stripe webhook inbox',
    triggers: [{ cron: '*/2 * * * *' }, { event: 'stripe/webhook.received' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('process-stripe-webhook-inbox', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for Stripe webhook inbox processing.')
      }
      return processStripeWebhookInbox(admin, { limit: 30 })
    })

    logger.info('Stripe webhook inbox processed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const stripeWeeklyPayoutEligibilityScan = inngest.createFunction(
  {
    id: 'stripe-weekly-payout-eligibility-scan',
    name: 'Stripe weekly payout eligibility scan',
    triggers: [{ cron: '0 8 * * 1' }, { event: 'stripe/payout.scan.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-weekly-payout-eligibility-scan', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for Stripe payout scan.')
      }
      return runStripeWeeklyPayoutEligibilityScan(admin)
    })

    logger.info('Stripe weekly payout scan executed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const stripeSubscriptionRenewalChecks = inngest.createFunction(
  {
    id: 'stripe-subscription-renewal-checks',
    name: 'Stripe subscription renewal checks',
    triggers: [{ cron: '0 */6 * * *' }, { event: 'stripe/subscription.check.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-subscription-renewal-checks', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for subscription renewal checks.')
      }
      return runStripeSubscriptionRenewalChecks(admin)
    })

    logger.info('Stripe subscription renewal checks executed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const stripeFailedPaymentRetries = inngest.createFunction(
  {
    id: 'stripe-failed-payment-retries',
    name: 'Stripe failed payment retries',
    triggers: [{ cron: '*/15 * * * *' }, { event: 'stripe/payment.retry.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-failed-payment-retries', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for failed payment retries.')
      }
      return runStripeFailedPaymentRetries(admin)
    })

    logger.info('Stripe failed payment retries executed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const sendReviewReminders = inngest.createFunction(
  {
    id: 'send-review-reminders',
    name: 'Send review reminders',
    triggers: [{ cron: '0 10 * * *' }, { event: 'ops/review-reminders.send.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-review-reminder-sync', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for review reminder sync.')
      }
      return runReviewReminderSync(admin)
    })

    logger.info('Review reminders sent.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const autoDetectNoShow = inngest.createFunction(
  {
    id: 'auto-detect-no-show',
    name: 'Auto detect no-show bookings',
    triggers: [{ cron: '*/5 * * * *' }, { event: 'ops/no-show.detect.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-no-show-detection', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for no-show detection.')
      }
      return runNoShowDetection(admin)
    })

    logger.info('No-show detection executed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const cleanupExpiredSlotLocks = inngest.createFunction(
  {
    id: 'cleanup-expired-slot-locks',
    name: 'Cleanup expired slot locks',
    triggers: [{ cron: '*/15 * * * *' }, { event: 'ops/slot-locks.cleanup.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-slot-lock-cleanup', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for slot lock cleanup.')
      }
      return runSlotLockCleanup(admin)
    })

    logger.info('Expired slot locks cleaned up.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const cancelStalePendingPayments = inngest.createFunction(
  {
    id: 'cancel-stale-pending-payments',
    name: 'Cancel stale pending payment bookings',
    triggers: [{ cron: '*/10 * * * *' }, { event: 'ops/pending-payment-timeout.run.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-pending-payment-timeout', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for pending payment timeout.')
      }
      return runPendingPaymentTimeout(admin)
    })

    logger.info('Stale pending payment bookings cancelled.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const syncExternalCalendarIntegrations = inngest.createFunction(
  {
    id: 'sync-external-calendar-integrations',
    name: 'Sync external calendar integrations',
    triggers: [{ cron: '*/10 * * * *' }, { event: 'calendar/integrations.sync.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('sync-external-calendar-integrations', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for calendar integration sync.')
      }

      const payload = asRecord(event.data)
      const requestedProfessionalId = asString(payload.professionalId)
      const requestedProvider = asCalendarProvider(payload.provider)

      let query = admin
        .from('calendar_integrations')
        .select('professional_id, provider, sync_enabled, connection_status')
        .eq('sync_enabled', true)
        .in('connection_status', ['connected', 'pending', 'error'])

      if (requestedProfessionalId) {
        query = query.eq('professional_id', requestedProfessionalId)
      }
      if (requestedProvider) {
        query = query.eq('provider', requestedProvider)
      }

      const { data: integrations, error } = await query
      if (error) {
        throw new Error(`Failed to load calendar integrations for sync: ${error.message}`)
      }

      let synced = 0
      let failed = 0
      const failures: Array<{ professionalId: string; provider: string; error: string }> = []

      for (const row of integrations || []) {
        const professionalId = asString((row as Record<string, unknown>).professional_id)
        const provider = asCalendarProvider((row as Record<string, unknown>).provider)
        if (!professionalId || !provider) continue

        const syncResult = await syncExternalBusySlotsForProfessional(admin, professionalId, provider)
        if ('ok' in syncResult && syncResult.ok === false) {
          failed += 1
          failures.push({
            professionalId,
            provider,
            error: syncResult.error,
          })
          continue
        }
        synced += 1
      }

      return {
        requestedProfessionalId,
        requestedProvider,
        total: (integrations || []).length,
        synced,
        failed,
        failures: failures.slice(0, 20),
      }
    })

    logger.info('External calendar integrations sync executed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export const processCalendarBookingSync = inngest.createFunction(
  {
    id: 'process-calendar-booking-sync',
    name: 'Process calendar booking sync',
    triggers: [{ event: 'calendar/booking.sync.requested' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('process-calendar-booking-sync', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for calendar booking sync.')
      }

      const payload = asRecord(event.data) as CalendarBookingSyncEventData
      const bookingId = asString(payload.bookingId)
      const action = payload.action
      const provider = asCalendarProvider(payload.provider)
      const professionalId = asString(payload.professionalId)

      if (action === 'poll_busy') {
        if (!professionalId) {
          return { ignored: true, reason: 'missing_professional_id' }
        }
        const syncResult = await syncExternalBusySlotsForProfessional(admin, professionalId, provider || undefined)
        return { ignored: false, action, professionalId, provider, syncResult }
      }

      if (!bookingId) {
        return { ignored: true, reason: 'missing_booking_id' }
      }

      if (action === 'cancel_booking') {
        const cancelResult = await cancelBookingInExternalCalendar(admin, bookingId)
        return { ignored: false, action, bookingId, cancelResult }
      }

      const upsertResult = await upsertBookingInExternalCalendar(admin, bookingId)
      return { ignored: false, action: 'upsert_booking', bookingId, upsertResult }
    })

    logger.info('Calendar booking sync processed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)

export { treasuryBalanceSnapshot, treasuryReconciliation, payoutBatchCreate, processTrolleyWebhook }

export const processSupabasePaymentsChange = inngest.createFunction(
  {
    id: 'process-supabase-payments-change',
    name: 'Process Supabase payments change',
    triggers: [{ event: 'supabase/payments.changed' }],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('process-supabase-payments-change', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for Supabase DB webhook processing.')
      }

      const payload = asRecord(event.data) as SupabaseDbChangeEventData
      const table = asString(payload.table)
      if (table !== 'payments') {
        return { ignored: true, reason: 'table_not_payments' }
      }

      const operation = asString(payload.operation)
      if (operation !== 'INSERT' && operation !== 'UPDATE') {
        return { ignored: true, reason: 'operation_not_supported' }
      }

      const record = asRecord(payload.record)
      const oldRecord = asRecord(payload.oldRecord)
      const paymentId = asString(record.id)
      const bookingId = asString(record.booking_id)
      const status = asString(record.status)
      const previousStatus = asString(oldRecord.status)

      if (!bookingId || !status) {
        return { ignored: true, reason: 'missing_booking_or_status', paymentId, bookingId, status }
      }

      if (operation === 'UPDATE' && status === previousStatus) {
        return { ignored: true, reason: 'status_unchanged', paymentId, bookingId, status }
      }

      const { data: booking, error: bookingError } = await admin
        .from('bookings')
        .select('id, status, user_id, professional_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (bookingError) {
        throw new Error(`Failed to load booking for payment webhook: ${bookingError.message}`)
      }

      if (!booking?.id) {
        return { ignored: true, reason: 'booking_not_found', paymentId, bookingId, status }
      }

      const bookingStatus = asString(booking.status)
      if (!isBookingStatus(bookingStatus)) {
        return { ignored: true, reason: 'unknown_booking_status', paymentId, bookingId, bookingStatus, status }
      }

      const bookingUserId = asString(booking.user_id)
      const professionalId = asString(booking.professional_id)
      const professionalUserId = await resolveProfessionalAccountUserId(admin, professionalId)
      const notificationPayload = {
        source: 'supabase_db_webhook',
        paymentId,
        bookingId,
        paymentStatus: status,
      }

      if (status === 'captured') {
        if (bookingStatus !== 'pending_payment') {
          return {
            ignored: true,
            reason: 'booking_not_in_pending_payment',
            paymentId,
            bookingId,
            bookingStatus,
            status,
          }
        }

        let confirmationMode: 'auto_accept' | 'manual' = 'auto_accept'
        if (professionalId) {
          const { data: settings, error: settingsError } = await admin
            .from('professional_settings')
            .select('confirmation_mode')
            .eq('professional_id', professionalId)
            .maybeSingle()

          if (settingsError) {
            throw new Error(`Failed to load professional settings for payment webhook: ${settingsError.message}`)
          }
          if (settings?.confirmation_mode === 'manual') {
            confirmationMode = 'manual'
          }
        }

        const nextStatus = confirmationMode === 'manual' ? 'pending_confirmation' : 'confirmed'
        const { error: updateError } = await admin
          .from('bookings')
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .eq('status', 'pending_payment')

        if (updateError) {
          throw new Error(`Failed to update booking status from payment webhook: ${updateError.message}`)
        }

        const userNotificationType =
          nextStatus === 'confirmed' ? 'booking_confirmed' : 'booking_pending_confirmation'
        const userNotificationBody =
          nextStatus === 'confirmed'
            ? 'Pagamento confirmado. Sua sessão foi confirmada.'
            : 'Pagamento confirmado. A sessão agora aguarda confirmação do profissional.'

        const insertedForUser = bookingUserId
          ? await insertNotificationIfMissing(admin, {
              userId: bookingUserId,
              bookingId,
              type: userNotificationType,
              title: 'Atualização do agendamento',
              body: userNotificationBody,
              payload: notificationPayload,
            })
          : false

        const insertedForProfessional = professionalUserId
          ? await insertNotificationIfMissing(admin, {
              userId: professionalUserId,
              bookingId,
              type: 'payment_captured',
              title: 'Pagamento confirmado',
              body: 'O pagamento da sessão foi confirmado pelo cliente.',
              payload: notificationPayload,
            })
          : false

        // Emit Resend automation events (non-blocking)
        const [userEmail, userName, professionalEmail] = await Promise.all([
          resolveUserEmail(admin, bookingUserId),
          resolveUserName(admin, bookingUserId),
          resolveUserEmail(admin, professionalUserId),
        ])
        if (userEmail) {
          emitUserBookingConfirmed(userEmail, {
            booking_id: bookingId,
            service: 'Sessão',
            professional_id: professionalId || '',
          })
        }
        if (professionalEmail) {
          emitProfessionalBookingConfirmed(professionalEmail, {
            booking_id: bookingId,
            client_name: userName || 'Cliente',
          })
        }

        let calendarSync: string = 'skipped'
        try {
          const syncResult = await upsertBookingInExternalCalendar(admin, bookingId)
          calendarSync = JSON.stringify(syncResult)
        } catch (calendarError) {
          const message = calendarError instanceof Error ? calendarError.message : String(calendarError)
          calendarSync = `error:${message}`
          Sentry.captureException(calendarError, {
            tags: { area: 'calendar_sync', subArea: 'booking_confirmation_webhook' },
            extra: { bookingId, paymentId },
          })
        }

        return {
          ignored: false,
          handledAs: 'captured',
          paymentId,
          bookingId,
          nextStatus,
          insertedForUser,
          insertedForProfessional,
          calendarSync,
        }
      }

      if (status === 'failed') {
        if (bookingStatus !== 'pending_payment' && bookingStatus !== 'pending_confirmation') {
          return {
            ignored: true,
            reason: 'booking_not_cancelable_for_failed_payment',
            paymentId,
            bookingId,
            bookingStatus,
            status,
          }
        }

        const { error: updateError } = await admin
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: 'Falha ao processar pagamento. Nenhum agendamento foi confirmado.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .in('status', ['pending_payment', 'pending_confirmation'])

        if (updateError) {
          throw new Error(`Failed to cancel booking after payment failure: ${updateError.message}`)
        }

        const insertedForUser = bookingUserId
          ? await insertNotificationIfMissing(admin, {
              userId: bookingUserId,
              bookingId,
              type: 'payment_failed',
              title: 'Pagamento não concluído',
              body: 'Falha ao processar pagamento. Nenhum agendamento foi confirmado.',
              payload: notificationPayload,
            })
          : false

        const insertedForProfessional = professionalUserId
          ? await insertNotificationIfMissing(admin, {
              userId: professionalUserId,
              bookingId,
              type: 'payment_failed',
              title: 'Pagamento do cliente falhou',
              body: 'O pagamento do cliente falhou e o agendamento foi cancelado.',
              payload: notificationPayload,
            })
          : false

        // Emit Resend automation events (non-blocking)
        const userEmailFailed = await resolveUserEmail(admin, bookingUserId)
        if (userEmailFailed) {
          const amount = asString(record.amount_total) || '0'
          emitUserPaymentFailed(userEmailFailed, {
            booking_id: bookingId,
            amount,
          })
        }

        let calendarSync: string = 'skipped'
        try {
          const syncResult = await cancelBookingInExternalCalendar(admin, bookingId)
          calendarSync = JSON.stringify(syncResult)
        } catch (calendarError) {
          calendarSync = `error:${calendarError instanceof Error ? calendarError.message : String(calendarError)}`
        }

        return {
          ignored: false,
          handledAs: 'failed',
          paymentId,
          bookingId,
          nextStatus: 'cancelled',
          insertedForUser,
          insertedForProfessional,
          calendarSync,
        }
      }

      return { ignored: true, reason: 'status_not_handled', paymentId, bookingId, status }
    })

    logger.info('Supabase payments change processed.', {
      trigger: event.name,
      ...result,
    })

    return { ok: true, source: 'inngest', ...result }
  },
)
