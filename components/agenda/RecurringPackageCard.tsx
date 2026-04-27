'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Package, Clock, CalendarDays } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { AppCard } from '@/components/ui/AppCard'
import BookingActions from '@/components/booking/BookingActions'

interface RecurringBooking {
  id: string
  status: string
  scheduled_at: string
  duration_minutes: number
  session_link: string | null
  booking_type: string | null
  recurrence_group_id: string | null
  recurrence_periodicity: string | null
  recurrence_occurrence_index: number | null
  professionals?: {
    profiles?: {
      full_name?: string | null
    } | null
  } | null
  profiles?: {
    full_name?: string | null
  } | null
}

interface RecurringPackageCardProps {
  bookings: RecurringBooking[]
  isProfessional: boolean
  userTimezone: string
}

function periodicityLabel(periodicity: string | null): string {
  switch (periodicity) {
    case 'weekly':
      return 'Semanal'
    case 'biweekly':
      return 'Quinzenal'
    case 'monthly':
      return 'Mensal'
    case 'custom_days':
      return 'Personalizado'
    default:
      return 'Recorrente'
  }
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
    pending_confirmation: { label: 'Aguardando confirmação', className: 'bg-amber-50 text-amber-700' },
    confirmed: { label: 'Confirmada', className: 'bg-green-50 text-green-700' },
    completed: { label: 'Concluída', className: 'bg-slate-100 text-slate-500' },
    cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-500' },
    no_show: { label: 'No-show', className: 'bg-red-50 text-red-700' },
  }
  const mapped = map[status] || { label: status, className: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${mapped.className}`}>{mapped.label}</span>
  )
}

export function RecurringPackageCard({ bookings, isProfessional, userTimezone }: RecurringPackageCardProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )

  const first = sorted[0]
  if (!first) return null

  const professionalName = isProfessional
    ? first.profiles?.full_name
    : first.professionals?.profiles?.full_name

  const periodicity = first.recurrence_periodicity
  const totalSessions = sorted.length
  const upcomingSessions = sorted.filter(b => {
    const s = new Date(b.scheduled_at)
    return s.getTime() > Date.now() && ['pending', 'pending_confirmation', 'confirmed'].includes(b.status)
  })
  const remainingCount = upcomingSessions.length
  const nextSession = upcomingSessions[0]

  return (
    <AppCard>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-blue-50">
          <Package className="h-6 w-6 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{professionalName || 'Profissional'}</p>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {periodicityLabel(periodicity)}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {nextSession ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Próxima:{' '}
                {formatInTimeZone(new Date(nextSession.scheduled_at), userTimezone, "EEE, d MMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Nenhuma sessão futura
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {remainingCount} de {totalSessions} restante{remainingCount === 1 ? '' : 's'}
            </span>
          </div>

          <button
            onClick={() => setExpanded(prev => !prev)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#3d6b1f] transition-colors hover:text-[#2a4d15]"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Ocultar sessões
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Ver todas as sessões
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessões do pacote</p>
          <div className="space-y-2">
            {sorted.map(booking => {
              const isPast = new Date(booking.scheduled_at).getTime() <= Date.now()
              return (
                <div
                  key={booking.id}
                  className={`rounded-lg border p-3 ${
                    isPast ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-700">
                        {formatInTimeZone(
                          new Date(booking.scheduled_at),
                          userTimezone,
                          "EEE, d MMM 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{booking.duration_minutes || 50}min</span>
                      {booking.recurrence_occurrence_index ? (
                        <span className="text-xs text-slate-400">#{booking.recurrence_occurrence_index}</span>
                      ) : null}
                    </div>
                    {statusBadge(booking.status)}
                  </div>

                  {['pending', 'pending_confirmation', 'confirmed'].includes(booking.status) && !isPast && (
                    <div className="mt-2">
                      <BookingActions
                        bookingId={booking.id}
                        status={booking.status}
                        sessionLink={booking.session_link}
                        scheduledAt={booking.scheduled_at}
                        isProfessional={isProfessional}
                        bookingType={booking.booking_type}
                        recurrenceGroupId={booking.recurrence_group_id}
                        professionalName={professionalName}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AppCard>
  )
}
