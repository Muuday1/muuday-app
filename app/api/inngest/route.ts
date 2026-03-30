import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { helloMuuday } from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloMuuday],
})
