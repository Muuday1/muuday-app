import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { clearCalendarIntegrationSecrets } from '@/lib/calendar/integration-repo'
import { resolveAuthenticatedProfessionalContext } from '@/lib/calendar/auth-context'
import type { CalendarProvider } from '@/lib/calendar/types'

const bodySchema = z.object({
  provider: z.enum(['google', 'outlook', 'apple']).optional(),
})

export async function POST(request: NextRequest) {
  const context = await resolveAuthenticatedProfessionalContext()
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const supabase = createClient()

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Payload invalido.' }, { status: 400 })
  }

  const provider = parsed.data.provider as CalendarProvider | undefined

  await clearCalendarIntegrationSecrets(supabase, context.professionalId)

  await supabase
    .from('external_calendar_busy_slots')
    .delete()
    .eq('professional_id', context.professionalId)

  if (!provider) {
    await supabase
      .from('professional_settings')
      .update({
        calendar_sync_provider: null,
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', context.professionalId)
  }

  return NextResponse.json({ success: true })
}
