import { inngest } from '../client'

// Placeholder function — replace with real logic as workflows are migrated from cron
export const helloMuuday = inngest.createFunction(
  { id: 'hello-muuday' },
  { event: 'test/hello' },
  async ({ event }) => {
    return { message: `Hello from Inngest, ${event.data?.name ?? 'muuday'}` }
  }
)
