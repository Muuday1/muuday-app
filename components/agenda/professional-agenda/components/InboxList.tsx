'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import BookingActions from '@/components/booking/BookingActions'
import RequestBookingActions from '@/components/booking/RequestBookingActions'
import { getConfirmationDeadline, getSlaLabel, getRequestStatusUi, getDurationMinutes } from '../helpers'
import type { BookingRecord, RequestRecord } from '../types'

interface InboxItem {
  kind: 'confirmation' | 'request'
  sortAt: number
  booking?: BookingRecord
  request?: RequestRecord
}

interface InboxListProps {
  items: InboxItem[]
  userTimezone: string
}

export function InboxList({ items, userTimezone }: InboxListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-white p-8 text-center">
        <p className="font-semibold text-slate-900">Nenhuma pendência neste filtro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        if (item.kind === 'confirmation' && item.booking) {
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

        const request = item.request!
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
  )
}
