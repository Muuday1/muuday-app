export const metadata = { title: 'Agenda | Muuday' }

import Link from 'next/link'
import { Calendar, Clock, Video, ChevronRight, Star, AlertTriangle } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingActions from '@/components/booking/BookingActions'

function getConfirmationDeadline(booking: Record<string, any>): Date | null {
  const deadlineRaw = booking?.metadata?.confirmation_deadline_utc
  if (!deadlineRaw || typeof deadlineRaw !== 'string') return null

  const deadline = new Date(deadlineRaw)
  if (Number.isNaN(deadline.getTime())) return null
  return deadline
}

function getSlaLabel(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now()
  if (diffMs <= 0) return 'SLA expirado'

  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000))
  if (diffHours < 24) return `Expira em ${diffHours}h`

  const diffDays = Math.ceil(diffHours / 24)
  return `Expira em ${diffDays} dia${diffDays === 1 ? '' : 's'}`
}

export default async function AgendaPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const professionalId: string | null = professional?.id ?? null
  const isProfessional = Boolean(professionalId)
  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const nowIso = new Date().toISOString()

  const upcomingQuery =
    isProfessional && professionalId
      ? supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(*), professionals(*, profiles(*))')
          .eq('professional_id', professionalId)
      : isProfessional
        ? null
        : supabase
            .from('bookings')
            .select('*, professionals(*, profiles(*))')
            .eq('user_id', user.id)

  const pastQuery =
    isProfessional && professionalId
      ? supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(*), professionals(*, profiles(*))')
          .eq('professional_id', professionalId)
      : isProfessional
        ? null
        : supabase
            .from('bookings')
            .select('*, professionals(*, profiles(*))')
            .eq('user_id', user.id)

  const { data: upcomingBookings } = upcomingQuery
    ? await upcomingQuery
        .in('status', ['pending', 'pending_confirmation', 'confirmed'])
        .gte('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: true })
    : { data: [] as any[] }

  const { data: pastBookings } = pastQuery
    ? await pastQuery
        .in('status', ['completed', 'cancelled', 'no_show', 'pending', 'pending_confirmation', 'confirmed'])
        .lt('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: false })
        .limit(20)
    : { data: [] as any[] }

  const upcoming = upcomingBookings || []
  const past = pastBookings || []

  const pendingConfirmations = isProfessional
    ? upcoming.filter((booking: any) => booking.status === 'pending_confirmation')
    : []

  const completedBookingIds = past
    .filter((booking: any) => booking.status === 'completed')
    .map((booking: any) => booking.id)

  const reviewedBookingIds = new Set<string>()
  if (!isProfessional && completedBookingIds.length > 0) {
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('booking_id')
      .in('booking_id', completedBookingIds)
      .eq('user_id', user.id)
    ;(existingReviews || []).forEach((review: any) => reviewedBookingIds.add(review.booking_id))
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold text-neutral-900 font-display">Agenda</h1>
        <p className="text-neutral-500">
          {isProfessional ? 'Gerencie suas sessoes com clientes' : 'Suas sessoes agendadas'}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 font-display">
          <Calendar className="h-5 w-5 text-brand-500" />
          Proximas sessoes
        </h2>

        {isProfessional && pendingConfirmations.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {pendingConfirmations.length} solicitacao{pendingConfirmations.length === 1 ? '' : 'oes'} aguardando confirmacao
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Confirme ou recuse dentro do SLA para evitar cancelamento automatico com reembolso.
                </p>
              </div>
            </div>
          </div>
        )}

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
              <Calendar className="h-7 w-7 text-neutral-300" />
            </div>
            <p className="mb-1 font-semibold text-neutral-900">Nenhuma sessao agendada</p>
            <p className="mb-4 text-sm text-neutral-500">
              {isProfessional
                ? 'Quando clientes agendarem sessoes, elas aparecerao aqui.'
                : 'Encontre um profissional e agende sua primeira sessao.'}
            </p>
            {!isProfessional && (
              <a
                href="/buscar"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600"
              >
                Buscar profissional
                <ChevronRight className="h-4 w-4" />
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking: any) => {
              const otherPerson = isProfessional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name
              const confirmationDeadline =
                booking.status === 'pending_confirmation' ? getConfirmationDeadline(booking) : null
              const slaLabel = confirmationDeadline ? getSlaLabel(confirmationDeadline) : null

              const statusLabel =
                booking.status === 'confirmed'
                  ? 'Confirmado'
                  : booking.status === 'pending_confirmation'
                    ? 'Aguardando confirmacao'
                    : 'Pendente'

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-neutral-100 bg-white p-5 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-600 font-display">
                      {otherPerson?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900">{otherPerson || 'Profissional'}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatInTimeZone(
                            new Date(booking.scheduled_at),
                            userTimezone,
                            'EEE, d MMM HH:mm',
                            { locale: ptBR },
                          )}
                        </span>
                        <span>{booking.duration_minutes || 50}min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {statusLabel}
                      </span>
                      {slaLabel && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            slaLabel === 'SLA expirado'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {slaLabel}
                        </span>
                      )}
                      {booking.session_link && (
                        <a
                          href={booking.session_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-brand-600"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Entrar
                        </a>
                      )}
                    </div>
                  </div>
                  {slaLabel && (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Prazo de confirmacao: {confirmationDeadline?.toLocaleString('pt-BR', { hour12: false })}
                    </div>
                  )}
                  <BookingActions
                    bookingId={booking.id}
                    status={booking.status}
                    sessionLink={booking.session_link}
                    scheduledAt={booking.scheduled_at}
                    isProfessional={isProfessional}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 font-display">
            <Clock className="h-5 w-5 text-neutral-400" />
            Historico
          </h2>
          <div className="space-y-2">
            {past.map((booking: any) => {
              const otherPerson = isProfessional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name

              const statusConfig: Record<string, { label: string; className: string }> = {
                completed: { label: 'Concluido', className: 'bg-green-50 text-green-700' },
                cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
                no_show: { label: 'Nao compareceu', className: 'bg-neutral-100 text-neutral-500' },
                confirmed: { label: 'Confirmado (passado)', className: 'bg-amber-50 text-amber-700' },
                pending_confirmation: {
                  label: 'Aguardando confirmacao',
                  className: 'bg-amber-50 text-amber-700',
                },
                pending: { label: 'Pendente (passado)', className: 'bg-amber-50 text-amber-700' },
              }
              const status = statusConfig[booking.status] || statusConfig.completed

              const canReview =
                !isProfessional &&
                booking.status === 'completed' &&
                !reviewedBookingIds.has(booking.id)

              return (
                <div key={booking.id} className="rounded-xl border border-neutral-100 bg-white p-4 opacity-80">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-sm font-bold text-neutral-400 font-display">
                      {otherPerson?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-700">{otherPerson || 'Profissional'}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {formatInTimeZone(new Date(booking.scheduled_at), userTimezone, 'd MMM yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canReview && (
                        <Link
                          href={`/avaliar/${booking.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 transition-all hover:bg-accent-100"
                        >
                          <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                          Avaliar
                        </Link>
                      )}
                      {!canReview && booking.status === 'completed' && !isProfessional && (
                        <span className="text-xs font-medium text-neutral-300">Avaliado</span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {['pending', 'pending_confirmation', 'confirmed'].includes(booking.status) && (
                    <BookingActions
                      bookingId={booking.id}
                      status={booking.status}
                      sessionLink={booking.session_link}
                      scheduledAt={booking.scheduled_at}
                      isProfessional={isProfessional}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
