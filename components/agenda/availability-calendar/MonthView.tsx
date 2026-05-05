'use client'

import { isSameDay } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { getDateKey, weekdayFromDate } from './helpers'
import type { AvailabilityRule, BookingSlot, AvailabilityException } from './types'

interface MonthViewProps {
  days: Date[]
  timezone: string
  activeRules: AvailabilityRule[]
  bookingsByDate: Map<string, { start: number; end: number; status: string; id: string; client_name?: string }[]>
  exceptionsByDate: Map<string, { startMinutes: number; endMinutes: number }[]>
  onDayClick: (day: Date) => void
}

export function MonthView({ days, timezone, activeRules, bookingsByDate, exceptionsByDate, onDayClick }: MonthViewProps) {
  return (
    <div className="p-3 md:p-4">
      <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-slate-500">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(label => (
          <div key={label} className="px-2 py-1">{label}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map(day => {
          const key = getDateKey(day, timezone)
          const isToday = isSameDay(day, toZonedTime(new Date(), timezone))
          const weekday = weekdayFromDate(day, timezone)
          const availabilityCount = activeRules.filter(rule => rule.day_of_week === weekday).length
          const bookedCount = (bookingsByDate.get(key) || []).length
          const dayExceptions = exceptionsByDate.get(key) || []
          const hasFullDayBlock = dayExceptions.some(exc => exc.startMinutes === 0 && exc.endMinutes === 24 * 60)
          const hasPartialBlock = dayExceptions.some(exc => !(exc.startMinutes === 0 && exc.endMinutes === 24 * 60))
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              className={`min-h-[74px] rounded-lg border p-2 text-left ${
                isToday ? 'border-[#9FE870]/40 bg-[#9FE870]/8' : 'border-slate-200/80 bg-slate-50/40 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-semibold text-slate-800">{formatInTimeZone(day, timezone, 'd')}</p>
              {hasFullDayBlock ? (
                <p className="mt-1 text-[11px] font-medium text-red-600">Bloqueado</p>
              ) : hasPartialBlock ? (
                <p className="mt-1 text-[11px] font-medium text-red-500">Parcialmente bloqueado</p>
              ) : (
                <p className="mt-1 text-[11px] text-[#3d6b1f]">
                  {availabilityCount > 0 ? `${availabilityCount} bloco(s)` : 'Sem disponibilidade'}
                </p>
              )}
              <p className="text-[11px] text-amber-700">{bookedCount > 0 ? `${bookedCount} ocupado(s)` : 'Livre'}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
