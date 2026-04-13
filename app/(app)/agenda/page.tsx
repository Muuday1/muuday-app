export const metadata = { title: 'Agenda | Muuday' }

import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  Layers,
  MessageCircle,
  Settings,
  Star,
  Video,
} from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingActions from '@/components/booking/BookingActions'
import RequestBookingActions from '@/components/booking/RequestBookingActions'
import { buildProfessionalWorkspaceAlerts } from '@/lib/professional/workspace-health'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

type RequestBookingStatus =
  | 'open'
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'converted'

type AgendaView = 'overview' | 'pending' | 'requests' | 'settings'

function normalizeView(rawView: string | undefined, isProfessional: boolean): AgendaView {
  if (!isProfessional) return 'overview'
  const allowed: AgendaView[] = ['overview', 'pending', 'requests', 'settings']
  return allowed.includes((rawView || '') as AgendaView)
    ? (rawView as AgendaView)
    : 'overview'
}

function viewLinkClass(activeView: AgendaView, currentView: AgendaView) {
  return activeView === currentView
    ? 'bg-brand-500 text-white border-brand-500'
    : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300 hover:text-brand-700'
}

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

function getRequestStatusUi(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: 'Aberta', className: 'bg-neutral-100 text-neutral-700' },
    offered: { label: 'Proposta enviada', className: 'bg-amber-50 text-amber-700' },
    accepted: { label: 'Aceita', className: 'bg-green-50 text-green-700' },
    converted: { label: 'Convertida', className: 'bg-green-50 text-green-700' },
    declined: { label: 'Recusada', className: 'bg-red-50 text-red-700' },
    expired: { label: 'Expirada', className: 'bg-neutral-100 text-neutral-500' },
    cancelled: { label: 'Cancelada', className: 'bg-neutral-100 text-neutral-500' },
  }
  return map[status] || map.open
}

function getDurationMinutes(startValue: string | null, endValue: string | null) {
  if (!startValue || !endValue) return 60
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return 60
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000))
}

function alertClasses(level: 'info' | 'warning' | 'critical') {
  if (level === 'critical') {
    return {
      wrapper: 'border-red-200 bg-red-50',
      title: 'text-red-800',
      description: 'text-red-700',
    }
  }
  if (level === 'warning') {
    return {
      wrapper: 'border-amber-200 bg-amber-50',
      title: 'text-amber-800',
      description: 'text-amber-700',
    }
  }
  return {
    wrapper: 'border-blue-200 bg-blue-50',
    title: 'text-blue-800',
    description: 'text-blue-700',
  }
}

function bookingModeMeta(booking: Record<string, any>) {
  const bookingType = String(booking.booking_type || '')
  if (booking.recurrence_group_id || bookingType.startsWith('recurring')) {
    return { label: 'Recorrência', className: 'bg-blue-50 text-blue-700' }
  }
  if (booking.batch_booking_group_id) {
    return { label: 'Várias datas', className: 'bg-purple-50 text-purple-700' }
  }
  return null
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams?: { view?: string; booking?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role,timezone')
    .eq('id', user.id)
    .single()
  const isProfessionalRole = profile?.role === 'profissional'

  const { data: professional } = isProfessionalRole
    ? await getPrimaryProfessionalForUser(
        supabase,
        user.id,
        'id, status, tier, bio, category, session_price_brl, session_duration_minutes, first_booking_enabled, first_booking_gate_note',
      )
    : { data: null as any }

  const professionalId: string | null = professional?.id ?? null
  const isProfessional = isProfessionalRole && Boolean(professionalId)
  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const nowIso = new Date().toISOString()
  const activeView = normalizeView(searchParams?.view, isProfessional)

  if (isProfessional && professionalId) {
    await supabase
      .from('request_bookings')
      .update({ status: 'expired', expired_at: nowIso })
      .eq('professional_id', professionalId)
      .eq('status', 'offered')
      .lt('proposal_expires_at', nowIso)
  } else {
    await supabase
      .from('request_bookings')
      .update({ status: 'expired', expired_at: nowIso })
      .eq('user_id', user.id)
      .eq('status', 'offered')
      .lt('proposal_expires_at', nowIso)
  }

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

  const requestBookingsQuery =
    isProfessional && professionalId
      ? supabase
          .from('request_bookings')
          .select('*, profiles!request_bookings_user_id_fkey(*), professionals(*, profiles(*))')
          .eq('professional_id', professionalId)
      : isProfessional
        ? null
        : supabase
            .from('request_bookings')
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

  const { data: requestBookings } = requestBookingsQuery
    ? await requestBookingsQuery.order('created_at', { ascending: false }).limit(30)
    : { data: [] as any[] }

  let professionalSettings: Record<string, any> | null = null
  let activeAvailabilityCount = 0
  let calendarIntegrationConnected = false
  let acceptedBookingsCount = 0

  if (professionalId) {
    const { data: settings } = await supabase
      .from('professional_settings')
      .select(
        'timezone, minimum_notice_hours, max_booking_window_days, confirmation_mode, enable_recurring, buffer_minutes, session_duration_minutes',
      )
      .eq('professional_id', professionalId)
      .maybeSingle()

    const { count: availabilityCount } = await supabase
      .from('availability')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('is_active', true)

    const { data: calendarIntegration } = await supabase
      .from('calendar_integrations')
      .select('id, sync_enabled')
      .eq('professional_id', professionalId)
      .maybeSingle()

    const { count: acceptedCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .in('status', ['pending', 'pending_confirmation', 'confirmed', 'completed', 'no_show', 'rescheduled'])

    professionalSettings = settings as Record<string, any> | null
    activeAvailabilityCount = availabilityCount || 0
    calendarIntegrationConnected = Boolean(calendarIntegration?.sync_enabled)
    acceptedBookingsCount = acceptedCount || 0
  }

  const upcoming = upcomingBookings || []
  const past = pastBookings || []
  const requestList = (requestBookings || []) as Array<Record<string, any>>
  const openRequestStatuses: RequestBookingStatus[] = ['open', 'offered']
  const activeRequests = requestList.filter(request =>
    openRequestStatuses.includes((request.status || 'open') as RequestBookingStatus),
  )
  const closedRequests = requestList.filter(
    request => !openRequestStatuses.includes((request.status || 'open') as RequestBookingStatus),
  )

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

  const professionalAlerts =
    isProfessional && professional
      ? buildProfessionalWorkspaceAlerts({
          professional,
          settings: professionalSettings,
          pendingConfirmations: pendingConfirmations.length,
          openRequests: activeRequests.length,
          hasCalendarIntegration: calendarIntegrationConnected,
          hasActiveAvailability: activeAvailabilityCount > 0,
          hasAcceptedBookings: acceptedBookingsCount > 0,
        })
      : []

  const shouldShowRequests = !isProfessional || ['overview', 'requests'].includes(activeView)
  const shouldShowUpcoming = !isProfessional || ['overview', 'pending'].includes(activeView)
  const shouldShowHistory = !isProfessional || ['overview', 'pending', 'requests'].includes(activeView)

  const upcomingVisible =
    isProfessional && activeView === 'pending' ? pendingConfirmations : upcoming

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold text-neutral-900 font-display">Agenda</h1>
        <p className="text-neutral-500">
          {isProfessional ? 'Control center das suas sessoes e solicitacoes.' : 'Suas sessoes agendadas'}
        </p>
      </div>

      {isProfessional && (
        <section className="mb-6">
          <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="professional-agenda-view-switcher">
            <Link href="/agenda?view=overview" className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'overview')}`}>
              Visao geral
            </Link>
            <Link href="/agenda?view=pending" className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'pending')}`}>
              Pendencias
            </Link>
            <Link href="/agenda?view=requests" className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'requests')}`}>
              Requests
            </Link>
            <Link href="/agenda?view=settings" className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'settings')}`}>
              Regras e calendário
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Aguardando confirmação</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{pendingConfirmations.length}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Solicitações abertas</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{activeRequests.length}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Disponibilidade ativa</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{activeAvailabilityCount}</p>
            </div>
          </div>
        </section>
      )}

      {professionalAlerts.length > 0 && (
        <section className="mb-6 space-y-3" data-testid="professional-agenda-alerts">
          {professionalAlerts.map(alert => {
            const styles = alertClasses(alert.level)
            return (
              <div key={alert.id} className={`rounded-2xl border px-4 py-3 ${styles.wrapper}`}>
                <p className={`text-sm font-semibold ${styles.title}`}>{alert.title}</p>
                <p className={`mt-1 text-xs ${styles.description}`}>{alert.description}</p>
                {alert.actionHref && alert.actionLabel && (
                  <Link
                    href={alert.actionHref}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {alert.actionLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )
          })}
        </section>
      )}

      {isProfessional && activeView === 'settings' && (
        <section className="mb-8 rounded-2xl border border-neutral-100 bg-white p-6" data-testid="professional-calendar-control-center">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-neutral-900">
            <Settings className="h-5 w-5 text-brand-500" />
            Calendário e regras de agendamento
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Modo de confirmação</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {professionalSettings?.confirmation_mode === 'manual' ? 'Manual (SLA 24h)' : 'Aceite automática'}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Antecedência mínima</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {Number(professionalSettings?.minimum_notice_hours || 24)}h
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Janela máxima</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {Number(professionalSettings?.max_booking_window_days || 30)} dias
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Fuso profissional</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {String(professionalSettings?.timezone || userTimezone).replaceAll('_', ' ')}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Calendário externo</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {calendarIntegrationConnected ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recorrência</p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {professionalSettings?.enable_recurring ? 'Ativa' : 'Desativada'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/disponibilidade"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
            >
              <CalendarDays className="h-4 w-4" />
              Ajustar disponibilidade
            </Link>
            <Link
              href="/configuracoes-agendamento"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
            >
              <Layers className="h-4 w-4" />
              Regras avancadas
            </Link>
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
            >
              <Settings className="h-4 w-4" />
              Business setup
            </Link>
          </div>
        </section>
      )}

      {shouldShowRequests && (
        <div className="mb-8" data-testid="agenda-requests-section">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 font-display">
          <MessageCircle className="h-5 w-5 text-brand-500" />
          Solicitações de horário
        </h2>

        {activeRequests.length === 0 && closedRequests.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 text-center">
            <p className="text-sm font-medium text-neutral-700">Nenhuma solicitação de horário no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((request: any) => {
              const otherPerson = isProfessional
                ? request.profiles?.full_name
                : request.professionals?.profiles?.full_name
              const statusUi = getRequestStatusUi(request.status)
              const preferredWindowLabel = `${formatInTimeZone(
                new Date(request.preferred_start_utc),
                userTimezone,
                'EEE, d MMM HH:mm',
                { locale: ptBR },
              )} - ${formatInTimeZone(new Date(request.preferred_end_utc), userTimezone, 'HH:mm')}`
              const proposalWindowLabel =
                request.proposal_start_utc && request.proposal_end_utc
                  ? `${formatInTimeZone(
                      new Date(request.proposal_start_utc),
                      userTimezone,
                      'EEE, d MMM HH:mm',
                      { locale: ptBR },
                    )} - ${formatInTimeZone(new Date(request.proposal_end_utc), userTimezone, 'HH:mm')}`
                  : null

              return (
                <div key={request.id} className="rounded-2xl border border-neutral-100 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">{otherPerson || 'Profissional'}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Preferência enviada por {request.user_timezone?.replaceAll('_', ' ') || 'fuso não definido'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusUi.className}`}>
                      {statusUi.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-neutral-600">
                    <p>
                      <span className="font-medium text-neutral-700">Janela preferida:</span>{' '}
                      {preferredWindowLabel} ({userTimezone.replaceAll('_', ' ')})
                    </p>
                    {proposalWindowLabel && (
                      <p>
                        <span className="font-medium text-neutral-700">Proposta:</span> {proposalWindowLabel}
                        {request.proposal_timezone
                          ? ` (${String(request.proposal_timezone).replaceAll('_', ' ')})`
                          : ''}
                      </p>
                    )}
                    {request.proposal_expires_at && request.status === 'offered' && (
                      <p className="text-xs text-amber-700">
                        Expira em{' '}
                        {new Date(request.proposal_expires_at).toLocaleString('pt-BR', {
                          hour12: false,
                        })}
                      </p>
                    )}
                    {request.user_message && (
                      <p className="text-xs text-neutral-500">Mensagem: {request.user_message}</p>
                    )}
                  </div>

                  <RequestBookingActions
                    requestId={request.id}
                    status={request.status}
                    isProfessional={isProfessional}
                    proposalTimezone={request.proposal_timezone}
                    defaultProposalStartLocal={request.proposal_start_utc || request.preferred_start_utc}
                    defaultDurationMinutes={getDurationMinutes(
                      request.preferred_start_utc,
                      request.preferred_end_utc,
                    )}
                  />
                </div>
              )
            })}

            {closedRequests.length > 0 && (
              <div className="rounded-2xl border border-neutral-100 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Historico de solicitacoes
                </p>
                <div className="space-y-2">
                  {closedRequests.slice(0, 8).map((request: any) => {
                    const otherPerson = isProfessional
                      ? request.profiles?.full_name
                      : request.professionals?.profiles?.full_name
                    const statusUi = getRequestStatusUi(request.status)
                    return (
                      <div key={request.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-700">
                            {otherPerson || 'Profissional'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {formatInTimeZone(
                              new Date(request.preferred_start_utc),
                              userTimezone,
                              'd MMM yyyy HH:mm',
                              { locale: ptBR },
                            )}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusUi.className}`}>
                          {statusUi.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {shouldShowUpcoming && (
        <div className="mb-8" data-testid="agenda-upcoming-section">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 font-display">
          <Calendar className="h-5 w-5 text-brand-500" />
            {isProfessional && activeView === 'pending' ? 'Pendências de confirmação' : 'Próximas sessões'}
        </h2>

        {isProfessional && pendingConfirmations.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {pendingConfirmations.length} solicitação{pendingConfirmations.length === 1 ? '' : 'ões'} aguardando confirmação
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Confirme ou recuse dentro do SLA para evitar cancelamento automatico com reembolso.
                </p>
              </div>
            </div>
          </div>
        )}

        {upcomingVisible.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
              <Calendar className="h-7 w-7 text-neutral-300" />
            </div>
            <p className="mb-1 font-semibold text-neutral-900">Nenhuma sessão agendada</p>
            <p className="mb-4 text-sm text-neutral-500">
              {isProfessional
                ? 'Não há sessões no contexto selecionado.'
                : 'Encontre um profissional e agende sua primeira sessão.'}
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
            {upcomingVisible.map((booking: any) => {
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
                    ? 'Aguardando confirma??o'
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
                      {bookingModeMeta(booking) ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${bookingModeMeta(booking)?.className}`}
                        >
                          {bookingModeMeta(booking)?.label}
                        </span>
                      ) : null}
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
                      {['pending_confirmation', 'confirmed'].includes(booking.status) ? (
                        <Link
                          href={`/sessao/${booking.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-brand-600"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Entrar na sessão
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {slaLabel && (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Prazo de confirmação: {confirmationDeadline?.toLocaleString('pt-BR', { hour12: false })}
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
      )}

      {shouldShowHistory && past.length > 0 && (
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
                no_show: { label: 'Não compareceu', className: 'bg-neutral-100 text-neutral-500' },
                confirmed: { label: 'Confirmado (passado)', className: 'bg-amber-50 text-amber-700' },
                pending_confirmation: {
                  label: 'Aguardando confirma??o',
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
                      {bookingModeMeta(booking) ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${bookingModeMeta(booking)?.className}`}
                        >
                          {bookingModeMeta(booking)?.label}
                        </span>
                      ) : null}
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

                  {['pending', 'pending_confirmation', 'confirmed'].includes(booking.status) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <BookingActions
                        bookingId={booking.id}
                        status={booking.status}
                        sessionLink={booking.session_link}
                        scheduledAt={booking.scheduled_at}
                        isProfessional={isProfessional}
                      />
                      <Link
                        href={`/sessao/${booking.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Abrir sessão
                      </Link>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}



