import { createAdminClient } from '@/lib/supabase/admin'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'
import { runRecurringReservedSlotRelease } from '@/lib/ops/recurring-slot-release'
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
