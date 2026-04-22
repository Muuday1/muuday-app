import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

const querySchema = z.object({
  bookingId: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sessao expirada. Faca login novamente.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({ bookingId: searchParams.get('bookingId') })
  if (!parsed.success) {
    return NextResponse.json({ error: 'ID da sessao invalido.' }, { status: 400 })
  }

  const rl = await rateLimit('bookingManage', `sessao-status:${user.id}:${getClientIp(request)}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisicoes. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, rl.retryAfterSeconds)) },
      },
    )
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      'id,user_id,professional_id,status,scheduled_at,start_time_utc,end_time_utc,duration_minutes,professional_ready_at,professionals!bookings_professional_id_fkey(user_id,profiles!professionals_user_id_fkey(full_name))',
    )
    .eq('id', parsed.data.bookingId)
    .maybeSingle()

  if (!booking) {
    return NextResponse.json({ error: 'Sessao nao encontrada.' }, { status: 404 })
  }

  const professionalOwnerId = Array.isArray(booking.professionals)
    ? booking.professionals[0]?.user_id
    : (booking.professionals as { user_id?: string } | null)?.user_id

  const professionalRelation = Array.isArray(booking.professionals)
    ? booking.professionals[0]
    : (booking.professionals as {
        user_id?: string
        profiles?: { full_name?: string } | Array<{ full_name?: string }>
      } | null)

  const professionalProfile = Array.isArray(professionalRelation?.profiles)
    ? professionalRelation?.profiles[0]
    : professionalRelation?.profiles

  const isParticipant =
    booking.user_id === user.id || professionalOwnerId === user.id
  if (!isParticipant) {
    return NextResponse.json({ error: 'Voce nao tem acesso a esta sessao.' }, { status: 403 })
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
  const canJoinWindow = joinStart && joinEnd ? now >= joinStart && now <= joinEnd : false

  return NextResponse.json({
    ready: !!booking.professional_ready_at,
    readyAt: booking.professional_ready_at,
    scheduledAt: booking.scheduled_at,
    professionalName: professionalProfile?.full_name || 'Profissional',
    canJoinWindow,
  })
}
