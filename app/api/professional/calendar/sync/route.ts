import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveAuthenticatedProfessionalContext } from '@/lib/calendar/auth-context'
import { syncExternalBusySlotsForProfessional } from '@/lib/calendar/sync/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { validateCsrfOrigin } from '@/lib/http/csrf'

const bodySchema = z.object({
  provider: z.enum(['google', 'outlook', 'apple']).optional(),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit('calendarSync', `calendar-sync:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  const csrfCheck = validateCsrfOrigin(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const context = await resolveAuthenticatedProfessionalContext()
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Payload invalido.' }, { status: 400 })
  }

  const supabase = createClient()
  const result = await syncExternalBusySlotsForProfessional(
    supabase,
    context.professionalId,
    parsed.data.provider,
  )

  if ('ok' in result && result.ok === false) {
    return NextResponse.json({ success: false, ...result }, { status: 500 })
  }

  return NextResponse.json({ success: true, result })
}
