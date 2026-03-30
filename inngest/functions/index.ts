import { createAdminClient } from '@/lib/supabase/admin'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'
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
