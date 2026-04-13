export const metadata = { title: 'Sessao de video | Muuday' }

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'
import { ArrowLeft, Clock, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import VideoSession from '@/components/booking/VideoSession'

const JOIN_WINDOW_BEFORE_MINUTES = 20
const JOIN_WINDOW_AFTER_MINUTES = 240

function parseDate(value: unknown) {
  if (!value || typeof value !== 'string') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export default async function VideoSessionPage({
  params,
}: {
  params: { bookingId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id,role,timezone').eq('id', user.id).maybeSingle()

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      'id,user_id,professional_id,status,scheduled_at,start_time_utc,end_time_utc,duration_minutes,professionals!bookings_professional_id_fkey(user_id,profiles!professionals_user_id_fkey(full_name)),profiles!bookings_user_id_fkey(full_name)',
    )
    .eq('id', params.bookingId)
    .maybeSingle()

  if (!booking) notFound()

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
  const bookingUserProfile = Array.isArray((booking as any).profiles) ? (booking as any).profiles[0] : (booking as any).profiles

  const isParticipant = booking.user_id === user.id || professionalOwnerId === user.id || profile?.role === 'admin'
  if (!isParticipant) redirect('/agenda')

  const timezone = profile?.timezone || 'America/Sao_Paulo'
  const startAt = parseDate(booking.start_time_utc) || parseDate(booking.scheduled_at)
  if (!startAt) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <h1 className="text-xl font-bold text-neutral-900">Sessao indisponivel</h1>
        <p className="mt-2 text-sm text-neutral-600">Nao foi possivel identificar o horario da sessao.</p>
      </div>
    )
  }

  const videoAllowedStatuses = ['confirmed', 'completed']
  if (!videoAllowedStatuses.includes(String(booking.status || ''))) {
    return (
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <Link href="/agenda" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar para agenda
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Esta sessao ainda nao pode abrir videochamada. Aguarde confirmacao do agendamento.
        </div>
      </div>
    )
  }

  const endAt = parseDate(booking.end_time_utc) || new Date(startAt.getTime() + Number(booking.duration_minutes || 60) * 60 * 1000)
  const joinStart = new Date(startAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000)
  const joinEnd = new Date(endAt.getTime() + JOIN_WINDOW_AFTER_MINUTES * 60 * 1000)
  const now = new Date()
  const canJoin = now >= joinStart && now <= joinEnd

  const userName = bookingUserProfile?.full_name || 'Cliente'
  const professionalName = professionalProfile?.full_name || 'Profissional'

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <Link href="/agenda" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-neutral-700">
        <ArrowLeft className="h-4 w-4" />
        Voltar para agenda
      </Link>

      <div className="mb-5 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-brand-500" />
          <h1 className="text-xl font-bold text-neutral-900">Sessao por video</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          {userName} com {professionalName}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
          <Clock className="h-3.5 w-3.5" />
          Janela de entrada: {formatInTimeZone(joinStart, timezone, 'dd/MM HH:mm')} ate {formatInTimeZone(joinEnd, timezone, 'dd/MM HH:mm')}
        </p>
      </div>

      {!canJoin ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          A entrada fica disponivel 20 minutos antes do inicio e ate 4 horas apos o fim da sessao.
        </div>
      ) : (
        <VideoSession bookingId={params.bookingId} />
      )}
    </div>
  )
}
