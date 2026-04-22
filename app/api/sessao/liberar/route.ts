import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

const payloadSchema = z.object({
  bookingId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sessao expirada. Faca login novamente.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const rl = await rateLimit('bookingManage', `sessao-liberar:${user.id}:${getClientIp(request)}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, rl.retryAfterSeconds)) },
      },
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', user.id)
    .maybeSingle()

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      'id,user_id,professional_id,status,scheduled_at,start_time_utc,end_time_utc,duration_minutes,professionals!bookings_professional_id_fkey(user_id)',
    )
    .eq('id', parsed.data.bookingId)
    .maybeSingle()

  if (!booking) {
    return NextResponse.json({ error: 'Sessao nao encontrada.' }, { status: 404 })
  }

  const professionalOwnerId = Array.isArray(booking.professionals)
    ? booking.professionals[0]?.user_id
    : (booking.professionals as { user_id?: string } | null)?.user_id

  const isProfessional = professionalOwnerId === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isProfessional && !isAdmin) {
    return NextResponse.json(
      { error: 'Apenas o profissional pode liberar esta sessao.' },
      { status: 403 },
    )
  }

  if (!['confirmed', 'completed'].includes(String(booking.status || ''))) {
    return NextResponse.json(
      { error: 'A sessao nao esta em estado valido para liberacao.' },
      { status: 409 },
    )
  }

  const startIso = booking.start_time_utc || booking.scheduled_at
  const startAt = startIso ? new Date(startIso) : null
  const durationMinutes = Number(booking.duration_minutes || 60)
  const endAt = booking.end_time_utc
    ? new Date(booking.end_time_utc)
    : startAt
      ? new Date(startAt.getTime() + durationMinutes * 60 * 1000)
      : null

  const now = new Date()
  const joinStart = startAt ? new Date(startAt.getTime() - 20 * 60 * 1000) : null
  const joinEnd = endAt ? new Date(endAt.getTime() + 240 * 60 * 1000) : null

  if (!joinStart || !joinEnd || now < joinStart || now > joinEnd) {
    return NextResponse.json(
      {
        error:
          'Liberacao permitida somente na janela de entrada (20 min antes ate 4h apos o fim).',
      },
      { status: 403 },
    )
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ professional_ready_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', parsed.data.bookingId)
    .select('professional_ready_at')
    .maybeSingle()

  if (updateError || !updated) {
    console.error('[sessao/liberar] update error:', updateError?.message)
    return NextResponse.json({ error: 'Falha ao liberar sessao. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    readyAt: updated.professional_ready_at,
  })
}
