'use client'

import { Link2 } from 'lucide-react'
import { ProfessionalAvailabilityCalendar } from '../../ProfessionalAvailabilityCalendar'
import type { AvailabilityRule, AvailabilityException, CalendarBooking } from '../types'

interface OverviewCalendarSectionProps {
  calendarTimezone: string
  connectionLabel: string
  calendarIntegrationLastSyncAt: string
  calendarIntegrationLastSyncError: string
  overviewAvailabilityRules: AvailabilityRule[]
  overviewAvailabilityExceptions: AvailabilityException[]
  overviewCalendarBookings: CalendarBooking[]
  onSlotClick: (date: Date, startMinutes: number) => void
  onManageSync: () => void
}

export function OverviewCalendarSection({
  calendarTimezone,
  connectionLabel,
  calendarIntegrationLastSyncAt,
  calendarIntegrationLastSyncError,
  overviewAvailabilityRules,
  overviewAvailabilityExceptions,
  overviewCalendarBookings,
  onSlotClick,
  onManageSync,
}: OverviewCalendarSectionProps) {
  return (
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
              onClick={onManageSync}
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
        onSlotClick={onSlotClick}
      />
    </section>
  )
}
