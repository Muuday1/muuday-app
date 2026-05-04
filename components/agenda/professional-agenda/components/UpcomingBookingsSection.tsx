'use client'

import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Video } from 'lucide-react'
import { bookingModeMeta } from '../helpers'
import type { BookingRecord } from '../types'

interface UpcomingBookingsSectionProps {
  upcoming: BookingRecord[]
  userTimezone: string
}

export function UpcomingBookingsSection({ upcoming, userTimezone }: UpcomingBookingsSectionProps) {
  return (
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
  )
}
