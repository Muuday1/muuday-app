import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'muuday-app',
  eventKey: process.env.INNGEST_EVENT_KEY || undefined,
})
