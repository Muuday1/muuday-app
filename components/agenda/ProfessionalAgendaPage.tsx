'use client'

import { useState } from 'react'

import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Link2, Video, Lock } from 'lucide-react'
import BookingActions from '@/components/booking/BookingActions'
import RequestBookingActions from '@/components/booking/RequestBookingActions'
import { ProfessionalCalendarSyncModal } from '@/components/agenda/ProfessionalCalendarSyncModal'
import { ProfessionalAvailabilityCalendar } from '@/components/agenda/ProfessionalAvailabilityCalendar'
import { ProfessionalAvailabilityWorkspace } from '@/components/agenda/ProfessionalAvailabilityWorkspace'
import { ProfessionalBookingRulesPanel } from '@/components/agenda/ProfessionalBookingRulesPanel'
import type { PlanConfig } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'
import { addAvailabilityException } from '@/lib/actions/availability-exceptions'

type AgendaView = 'overview' | 'inbox' | 'availability_rules'
type InboxFilter = 'all' | 'confirmations' | 'requests'

type BookingRecord = Record<string, any>
type RequestRecord = Record<string, any>

type ProfessionalAgendaPageProps = {
  activeView: AgendaView
  inboxFilter: InboxFilter
  userTimezone: string
  pendingConfirmations: BookingRecord[]
  upcoming: BookingRecord[]
  past: BookingRecord[]
  activeRequests: RequestRecord[]
  calendarTimezone: string
  activeAvailabilityCount: number
  calendarIntegrationConnected: boolean
  calendarIntegrationProvider: string
  calendarIntegrationStatus: 'disconnected' | 'pending' | 'connected' | 'error'
  calendarIntegrationLastSyncAt: string
  calendarIntegrationAccountEmail: string
  calendarIntegrationLastSyncError: string
  overviewAvailabilityRules: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
  }>
  overviewAvailabilityExceptions?: Array<{
    date_local: string
    is_available: boolean
    start_time_local: string | null
    end_time_local: string | null
  }>
  overviewCalendarBookings: Array<{
    id: string
    start_utc: string
    end_utc: string
    status: string
    client_name?: string
  }>
  professionalBookingRulesPanelProps: {
    userId: string
    professionalId: string
    tier: string
    initialPlanConfig: PlanConfig
    initialForm: BookingSettingsForm
  } | null
}

function viewLinkClass(activeView: AgendaView, currentView: AgendaView) {
  return activeView === currentView
    ? 'bg-[#9FE870] text-white border-[#9FE870]'
    : 'bg-white text-slate-600 border-slate-200 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
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
    open: { label: 'Aberta', className: 'bg-slate-100 text-slate-700' },
    offered: { label: 'Proposta enviada', className: 'bg-amber-50 text-amber-700' },
    accepted: { label: 'Aceita', className: 'bg-green-50 text-green-700' },
    converted: { label: 'Convertida', className: 'bg-green-50 text-green-700' },
    declined: { label: 'Recusada', className: 'bg-red-50 text-red-700' },
    expired: { label: 'Expirada', className: 'bg-slate-100 text-slate-500' },
    cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-500' },
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

export function ProfessionalAgendaPage({
  activeView,
  inboxFilter,
  userTimezone,
  pendingConfirmations,
  upcoming,
  past: _past,
  activeRequests,
  calendarTimezone,
  activeAvailabilityCount: _activeAvailabilityCount,
  calendarIntegrationConnected,
  calendarIntegrationProvider,
  calendarIntegrationStatus,
  calendarIntegrationLastSyncAt,
  calendarIntegrationAccountEmail,
  calendarIntegrationLastSyncError,
  overviewAvailabilityRules,
  overviewAvailabilityExceptions = [],
  overviewCalendarBookings,
  professionalBookingRulesPanelProps,
}: ProfessionalAgendaPageProps) {
  const [showCalendarSyncModal, setShowCalendarSyncModal] = useState(false)
  const [blockModal, setBlockModal] = useState<{
    open: boolean
    date: Date
    startMinutes: number
  } | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const inboxItems = [
    ...pendingConfirmations.map((booking: BookingRecord) => ({
      kind: 'confirmation' as const,
      sortAt:
        getConfirmationDeadline(booking)?.getTime() ||
        new Date(String(booking.scheduled_at || new Date().toISOString())).getTime(),
      booking,
    })),
    ...activeRequests.map((request: RequestRecord) => ({
      kind: 'request' as const,
      sortAt: new Date(
        String(
          request.proposal_expires_at ||
            request.preferred_start_utc ||
            request.created_at ||
            new Date().toISOString(),
        ),
      ).getTime(),
      request,
    })),
  ].sort((left, right) => left.sortAt - right.sortAt)

  const filteredInboxItems = inboxItems.filter(item => {
    if (inboxFilter === 'all') return true
    if (inboxFilter === 'confirmations') return item.kind === 'confirmation'
    return item.kind === 'request'
  })

  const connectionLabel =
    calendarIntegrationStatus === 'connected'
      ? `${calendarIntegrationProvider === 'outlook' ? 'Outlook' : calendarIntegrationProvider === 'apple' ? 'Apple' : 'Google'} conectado`
      : calendarIntegrationStatus === 'pending'
        ? 'Conexão pendente'
        : calendarIntegrationStatus === 'error'
          ? 'Sync com erro'
          : 'Sem sync externo'

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <ProfessionalCalendarSyncModal
        isOpen={showCalendarSyncModal}
        onClose={() => setShowCalendarSyncModal(false)}
        initialProvider={calendarIntegrationProvider}
        initialConnected={calendarIntegrationConnected}
        initialConnectionStatus={calendarIntegrationStatus}
        initialAccountEmail={calendarIntegrationAccountEmail}
        initialLastSyncAt={calendarIntegrationLastSyncAt}
        initialLastSyncError={calendarIntegrationLastSyncError}
        premiumProvidersEnabled={Boolean(
          professionalBookingRulesPanelProps?.initialPlanConfig.features.includes('outlook_sync'),
        )}
      />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Agenda profissional
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-950">
            Operação de agenda mais clara e mais rápida de navegar
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            O calendário completo fica na frente, as pendências viram uma inbox única e as regras ficam concentradas em uma única área de edição.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="professional-agenda-view-switcher">
          <Link
            href="/agenda?view=overview"
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'overview')}`}
          >
            Visão geral
          </Link>
          <Link
            href="/agenda?view=inbox&filter=all"
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'inbox')}`}
          >
            Pendências
          </Link>
          <Link
            href="/agenda?view=availability_rules"
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'availability_rules')}`}
          >
            Regras e disponibilidades
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confirmações pendentes
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{pendingConfirmations.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Solicitações em aberto
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{activeRequests.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Próximas sessões
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{upcoming.length}</p>
        </div>
      </div>

      {activeView === 'overview' ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Próximas sessões
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  Próximas 5 sessões
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Veja o que já está reservado antes de mexer na disponibilidade ou responder novas pendências.
                </p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
                Nenhuma sessão futura agendada no momento.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-5">
                {upcoming.slice(0, 5).map(booking => {
                  const otherPerson = booking.profiles?.full_name || 'Cliente'
                  const modeMeta = bookingModeMeta(booking)
                  return (
                    <div key={booking.id} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{otherPerson}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatInTimeZone(new Date(booking.scheduled_at), userTimezone, 'EEE, d MMM', {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {modeMeta ? (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${modeMeta.className}`}>
                            {modeMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {formatInTimeZone(new Date(booking.scheduled_at), userTimezone, 'HH:mm', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{booking.duration_minutes || 50} min</span>
                        </div>
                      </div>
                      {booking.status === 'confirmed' || booking.status === 'pending_confirmation' ? (
                        <Link
                          href={`/sessao/${booking.id}`}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f]"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Entrar na sessão
                        </Link>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Visão geral
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  Calendário completo em primeiro plano
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Acompanhe disponibilidade base, sessões confirmadas e ocupações externas sem sair da agenda.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Fuso: {calendarTimezone.replaceAll('_', ' ')}
                  </span>
                  <span className="rounded-full bg-[#9FE870]/8 px-3 py-1 text-xs font-medium text-[#3d6b1f]">
                    {connectionLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCalendarSyncModal(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
                  >
                    <Link2 className="h-4 w-4" />
                    Gerenciar sync
                  </button>
                </div>
                {calendarIntegrationLastSyncAt ? (
                  <p className="text-xs text-slate-500">
                    Último sync: {new Date(calendarIntegrationLastSyncAt).toLocaleString('pt-BR', { hour12: false })}
                  </p>
                ) : null}
                {calendarIntegrationLastSyncError ? (
                  <p className="text-xs font-medium text-red-700">{calendarIntegrationLastSyncError}</p>
                ) : null}
              </div>
            </div>
            <ProfessionalAvailabilityCalendar
              timezone={calendarTimezone}
              availabilityRules={overviewAvailabilityRules}
              bookings={overviewCalendarBookings}
              exceptions={overviewAvailabilityExceptions}
              onSlotClick={(date, startMinutes) => {
                setBlockModal({ open: true, date, startMinutes })
                setBlockReason('')
                setBlockError(null)
              }}
            />
          </section>

        </div>
      ) : null}

      {activeView === 'inbox' ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Pendências
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  Inbox única de confirmações e solicitações
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/agenda?view=inbox&filter=all"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    inboxFilter === 'all'
                      ? 'border-[#9FE870] bg-[#9FE870] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
                  }`}
                >
                  Todas
                </Link>
                <Link
                  href="/agenda?view=inbox&filter=confirmations"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    inboxFilter === 'confirmations'
                      ? 'border-[#9FE870] bg-[#9FE870] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
                  }`}
                >
                  Confirmações
                </Link>
                <Link
                  href="/agenda?view=inbox&filter=requests"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    inboxFilter === 'requests'
                      ? 'border-[#9FE870] bg-[#9FE870] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
                  }`}
                >
                  Solicitações
                </Link>
              </div>
            </div>
          </section>

          {filteredInboxItems.length === 0 ? (
            <div className="rounded-lg border border-slate-200/80 bg-white p-8 text-center">
              <p className="font-semibold text-slate-900">Nenhuma pendência neste filtro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInboxItems.map(item => {
                if (item.kind === 'confirmation') {
                  const booking = item.booking
                  const otherPerson = booking.profiles?.full_name
                  const confirmationDeadline = getConfirmationDeadline(booking)
                  const slaLabel = confirmationDeadline ? getSlaLabel(confirmationDeadline) : null

                  return (
                    <div key={booking.id} className="rounded-lg border border-slate-200/80 bg-white p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#9FE870]/8 font-display font-bold text-[#3d6b1f]">
                          {otherPerson?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{otherPerson || 'Cliente'}</p>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Confirmação pendente
                            </span>
                            {slaLabel ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                {slaLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatInTimeZone(new Date(booking.scheduled_at), userTimezone, 'EEE, d MMM HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                            <span>{booking.duration_minutes || 50}min</span>
                          </div>
                          {confirmationDeadline ? (
                            <p className="mt-2 text-xs text-amber-700">
                              Prazo de confirmação:{' '}
                              {confirmationDeadline.toLocaleString('pt-BR', { hour12: false })}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <BookingActions
                        bookingId={booking.id}
                        status={booking.status}
                        sessionLink={booking.session_link}
                        scheduledAt={booking.scheduled_at}
                        isProfessional
                        bookingType={booking.booking_type}
                        recurrenceGroupId={booking.recurrence_group_id}
                        professionalName={otherPerson}
                      />
                    </div>
                  )
                }

                const request = item.request
                const otherPerson = request.profiles?.full_name
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
                  <div key={request.id} className="rounded-lg border border-slate-200/80 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{otherPerson || 'Cliente'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Preferência enviada por {request.user_timezone?.replaceAll('_', ' ') || 'fuso não definido'}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusUi.className}`}>
                        {statusUi.label}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-700">Janela preferida:</span>{' '}
                        {preferredWindowLabel} ({userTimezone.replaceAll('_', ' ')})
                      </p>
                      {proposalWindowLabel ? (
                        <p>
                          <span className="font-medium text-slate-700">Proposta:</span> {proposalWindowLabel}
                          {request.proposal_timezone
                            ? ` (${String(request.proposal_timezone).replaceAll('_', ' ')})`
                            : ''}
                        </p>
                      ) : null}
                      {request.proposal_expires_at && request.status === 'offered' ? (
                        <p className="text-xs text-amber-700">
                          Expira em{' '}
                          {new Date(request.proposal_expires_at).toLocaleString('pt-BR', {
                            hour12: false,
                          })}
                        </p>
                      ) : null}
                    </div>

                    <RequestBookingActions
                      requestId={request.id}
                      status={request.status}
                      isProfessional
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
            </div>
          )}
        </div>
      ) : null}

      {activeView === 'availability_rules' ? (
        <div className="space-y-8">
          <ProfessionalAvailabilityWorkspace variant="embedded" />
          {professionalBookingRulesPanelProps ? (
            <ProfessionalBookingRulesPanel {...professionalBookingRulesPanelProps} />
          ) : null}
        </div>
      ) : null}

      {/* Block time slot modal */}
      {blockModal?.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-500" />
              <h3 className="font-semibold text-slate-900">Bloquear horário</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {formatInTimeZone(blockModal.date, calendarTimezone, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              {' às '}
              {String(Math.floor(blockModal.startMinutes / 60)).padStart(2, '0')}:
              {String(blockModal.startMinutes % 60).padStart(2, '0')}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">Motivo (opcional)</label>
              <input
                type="text"
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Ex: Compromisso pessoal"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#9FE870] focus:outline-none focus:ring-1 focus:ring-[#9FE870]"
              />
            </div>
            {blockError ? <p className="mt-2 text-sm text-red-600">{blockError}</p> : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setBlockLoading(true)
                  setBlockError(null)
                  const dateLocal = formatInTimeZone(blockModal.date, calendarTimezone, 'yyyy-MM-dd')
                  const endMinutes = blockModal.startMinutes + 60
                  const startTimeLocal = `${String(Math.floor(blockModal.startMinutes / 60)).padStart(2, '0')}:${String(blockModal.startMinutes % 60).padStart(2, '0')}`
                  const endTimeLocal = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
                  const result = await addAvailabilityException(dateLocal, {
                    isAvailable: false,
                    startTimeLocal,
                    endTimeLocal,
                    timezone: calendarTimezone,
                    reason: blockReason.trim() || 'Bloqueio manual pelo calendário',
                  })
                  setBlockLoading(false)
                  if (result.success) {
                    setBlockModal(null)
                    window.location.reload()
                  } else {
                    setBlockError(result.error || 'Erro ao bloquear horário.')
                  }
                }}
                disabled={blockLoading}
                className="flex-1 rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-50"
              >
                {blockLoading ? 'Salvando...' : 'Bloquear'}
              </button>
              <button
                type="button"
                onClick={() => setBlockModal(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


