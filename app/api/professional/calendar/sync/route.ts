import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAuthenticatedProfessionalContext } from '@/lib/calendar/auth-context'
import { syncExternalBusySlotsForProfessional } from '@/lib/calendar/sync/service'

const bodySchema = z.object({
  provider: z.enum(['google', 'outlook', 'apple']).optional(),
})

export async function POST(request: NextRequest) {
  const context = await resolveAuthenticatedProfessionalContext()
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured.' }, { status: 500 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Payload invalido.' }, { status: 400 })
  }

  const result = await syncExternalBusySlotsForProfessional(
    admin,
    context.professionalId,
    parsed.data.provider,
  )

  if ('ok' in result && result.ok === false) {
    return NextResponse.json({ success: false, ...result }, { status: 500 })
  }

  return NextResponse.json({ success: true, result })
}
