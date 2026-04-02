import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RtcRole, RtcTokenBuilder } from 'agora-access-token'
import { createClient } from '@/lib/supabase/server'

const payloadSchema = z.object({
  bookingId: z.string().uuid(),
})

const JOIN_WINDOW_BEFORE_MINUTES = 20
const JOIN_WINDOW_AFTER_MINUTES = 240

function toSafeIso(value: unknown) {
  if (!value || typeof value !== 'string') return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export async function POST(request: NextRequest) {
  const appId = process.env.AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE
  if (!appId || !appCertificate) {
    return NextResponse.json(
      { error: 'Sessão de vídeo indisponível: configuração do Agora ausente.' },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos para token de sessão.' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
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
    return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })
  }

  const professionalOwnerId =
    Array.isArray(booking.professionals)
      ? booking.professionals[0]?.user_id
      : (booking.professionals as { user_id?: string } | null)?.user_id

  const isParticipant =
    booking.user_id === user.id || professionalOwnerId === user.id || profile?.role === 'admin'
  if (!isParticipant) {
    return NextResponse.json({ error: 'Você não tem acesso a esta sessão.' }, { status: 403 })
  }

  if (!['pending_confirmation', 'confirmed', 'completed'].includes(String(booking.status || ''))) {
    return NextResponse.json(
      { error: 'A sessão não está em estado válido para chamada de vídeo.' },
      { status: 409 },
    )
  }

  const startIso = toSafeIso(booking.start_time_utc) || toSafeIso(booking.scheduled_at)
  if (!startIso) {
    return NextResponse.json({ error: 'Horário da sessão inválido.' }, { status: 409 })
  }
  const startAt = new Date(startIso)
  const durationMinutes = Number(booking.duration_minutes || 60)
  const endAt = toSafeIso(booking.end_time_utc)
    ? new Date(String(booking.end_time_utc))
    : new Date(startAt.getTime() + durationMinutes * 60 * 1000)

  const now = new Date()
  const joinStart = new Date(startAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000)
  const joinEnd = new Date(endAt.getTime() + JOIN_WINDOW_AFTER_MINUTES * 60 * 1000)

  if (now < joinStart || now > joinEnd) {
    return NextResponse.json(
      {
        error:
          'Entrada na sessão liberada somente na janela permitida (20 min antes até 4h após o fim).',
      },
      { status: 403 },
    )
  }

  const channelName = `booking-${booking.id}`
  const account = user.id
  const expiresInSeconds = 2 * 60 * 60
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expiresInSeconds

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    account,
    RtcRole.PUBLISHER,
    privilegeExpiredTs,
  )

  return NextResponse.json({
    appId,
    token,
    channelName,
    uid: account,
    expiresAtUtc: new Date(privilegeExpiredTs * 1000).toISOString(),
    windowStartUtc: joinStart.toISOString(),
    windowEndUtc: joinEnd.toISOString(),
  })
}

