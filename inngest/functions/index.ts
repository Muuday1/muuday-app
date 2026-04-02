import { createAdminClient } from '@/lib/supabase/admin'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'
import { runRecurringReservedSlotRelease } from '@/lib/ops/recurring-slot-release'
import {
  processStripeWebhookInbox,
  runStripeFailedPaymentRetries,
  runStripeSubscriptionRenewalChecks,
  runStripeWeeklyPayoutEligibilityScan,
} from '@/lib/ops/stripe-resilience'
import { inngest } from '../client'

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
