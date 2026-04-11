import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'
import { runRecurringReservedSlotRelease } from '@/lib/ops/recurring-slot-release'
import {
  processStripeWebhookInbox,
  runStripeFailedPaymentRetries,
  runStripeSubscriptionRenewalChecks,
  runStripeWeeklyPayoutEligibilityScan,
} from '@/lib/ops/stripe-resilience'
import { inngest } from '../client'

type SupabaseDbChangeEventData = {
  source?: string
  schema?: string
  table?: string
  operation?: string
  record?: Record<string, unknown> | null
  oldRecord?: Record<string, unknown> | null
  receivedAt?: string
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
) {
  const { data, error } = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('booking_id', bookingId)
    .eq('type', type)
    .limit(1)
    .maybeSingle()

  if (error) return false
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

        return {
          ignored: false,
          handledAs: 'captured',
          paymentId,
          bookingId,
          nextStatus,
          insertedForUser,
          insertedForProfessional,
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

        return {
          ignored: false,
          handledAs: 'failed',
          paymentId,
          bookingId,
          nextStatus: 'cancelled',
          insertedForUser,
          insertedForProfessional,
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
