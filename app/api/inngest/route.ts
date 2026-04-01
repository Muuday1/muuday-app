import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { releaseRecurringReservedSlots, syncBookingReminders } from '@/inngest/functions'

// Only export GET and POST — PUT is unnecessary and increases API surface
export const { GET, POST } = serve({
  client: inngest,
  functions: [syncBookingReminders, releaseRecurringReservedSlots],
})
