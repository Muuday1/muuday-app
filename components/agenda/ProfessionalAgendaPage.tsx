'use client'

import { useState } from 'react'

import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Link2 } from 'lucide-react'
import BookingActions from '@/components/booking/BookingActions'
import RequestBookingActions from '@/components/booking/RequestBookingActions'
import { ProfessionalCalendarSyncModal } from '@/components/agenda/ProfessionalCalendarSyncModal'
import { ProfessionalAvailabilityCalendar } from '@/components/calendar/ProfessionalAvailabilityCalendar'
import { ProfessionalAvailabilityWorkspace } from '@/components/agenda/ProfessionalAvailabilityWorkspace'
import { ProfessionalBookingRulesPanel } from '@/components/agenda/ProfessionalBookingRulesPanel'
import type { PlanConfig } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'

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
  overviewCalendarBookings: Array<{
    id: string
    start_utc: string
    end_utc: string
    status: string
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

function bookingModeMeta(booking: Record<string, any>) {
  const bookingType = String(booking.booking_type || '')
  if (booking.recurrence_group_id || bookingType.startsWith('recurring')) {
    return { label: 'Recorrencia', className: 'bg-blue-50 text-blue-700' }
  }
  if (booking.batch_booking_group_id) {
    return { label: 'Varias datas', className: 'bg-purple-50 text-purple-700' }
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
  overviewCalendarBookings,
  professionalBookingRulesPanelProps,
}: ProfessionalAgendaPageProps) {
  const [showCalendarSyncModal, setShowCalendarSyncModal] = useState(false)

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
        ? 'Conexao pendente'
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Agenda profissional
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-neutral-950">
            Operacao de agenda mais clara e mais rapida de navegar
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            O calendario completo fica na frente, as pendencias viram uma inbox unica e as regras ficam concentradas em uma unica area de edicao.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="professional-agenda-view-switcher">
          <Link
            href="/agenda?view=overview"
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'overview')}`}
          >
            Visao geral
          </Link>
          <Link
            href="/agenda?view=inbox&filter=all"
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'inbox')}`}
          >
            Pendencias
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
        <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Confirmacoes pendentes
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{pendingConfirmations.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Requests em aberto
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{activeRequests.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Proximas sessoes
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{upcoming.length}</p>
        </div>
      </div>

      {activeView === 'overview' ? (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Proximas sessoes
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-neutral-950">
                  Proximas 5 sessoes
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  Veja o que ja esta reservado antes de mexer na disponibilidade ou responder novas pendencias.
                </p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                Nenhuma sessao futura agendada no momento.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-5">
                {upcoming.slice(0, 5).map(booking => {
                  const otherPerson = booking.profiles?.full_name || 'Cliente'
                  const modeMeta = bookingModeMeta(booking)
                  return (
                    <div key={booking.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-900">{otherPerson}</p>
                          <p className="mt-1 text-sm text-neutral-500">
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
                      <div className="mt-4 space-y-2 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-neutral-400" />
                          <span>
                            {formatInTimeZone(new Date(booking.scheduled_at), userTimezone, 'HH:mm', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <span>{booking.duration_minutes || 50} min</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Visao geral
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-neutral-950">
                  Calendario completo em primeiro plano
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Acompanhe disponibilidade base, sessoes confirmadas e ocupacoes externas sem sair da agenda.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    Fuso: {calendarTimezone.replaceAll('_', ' ')}
                  </span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                    {connectionLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCalendarSyncModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600"
                  >
                    <Link2 className="h-4 w-4" />
                    Gerenciar sync
                  </button>
                </div>
                {calendarIntegrationLastSyncAt ? (
                  <p className="text-xs text-neutral-500">
                    Ultimo sync: {new Date(calendarIntegrationLastSyncAt).toLocaleString('pt-BR', { hour12: false })}
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
            />
          </section>

        </div>
      ) : null}

      {activeView === 'inbox' ? (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Pendencias
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-neutral-950">
                  Inbox unica de confirmacoes e requests
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/agenda?view=inbox&filter=all"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    inboxFilter === 'all'
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  Todas
                </Link>
                <Link
                  href="/agenda?view=inbox&filter=confirmations"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    inboxFilter === 'confirmations'
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  Confirmacoes
                </Link>
                <Link
                  href="/agenda?view=inbox&filter=requests"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    inboxFilter === 'requests'
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  Requests
                </Link>
              </div>
            </div>
          </section>

          {filteredInboxItems.length === 0 ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center">
              <p className="font-semibold text-neutral-900">Nenhuma pendencia neste filtro.</p>
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
                    <div key={booking.id} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display font-bold text-brand-600">
                          {otherPerson?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-neutral-900">{otherPerson || 'Cliente'}</p>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Confirmacao pendente
                            </span>
                            {slaLabel ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                {slaLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
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
                              Prazo de confirmacao:{' '}
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
                  <div key={request.id} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-neutral-900">{otherPerson || 'Cliente'}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Preferencia enviada por {request.user_timezone?.replaceAll('_', ' ') || 'fuso nao definido'}
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
                      {proposalWindowLabel ? (
                        <p>
                          <span className="font-medium text-neutral-700">Proposta:</span> {proposalWindowLabel}
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
    </div>
  )
}


