'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { getDateKey, parseMinutes, weekdayFromDate } from './helpers'
import { SLOT_STEP_MINUTES, SLOT_ROW_HEIGHT } from './types'
import type { AvailabilityRule, BookingSlot, AvailabilityException } from './types'

interface DayWeekViewProps {
  days: Date[]
  timezone: string
  visibleRange: { startMinutes: number; endMinutes: number; totalMinutes: number }
  timeSlots: Array<{ label: string; minutes: number }>
  activeRules: AvailabilityRule[]
  bookings: BookingSlot[]
  bookingsByDate: Map<string, { start: number; end: number; status: string; id: string; client_name?: string }[]>
  exceptionsByDate: Map<string, { startMinutes: number; endMinutes: number }[]>
  onSlotClick?: (date: Date, startMinutes: number) => void
  onBookingClick?: (booking: BookingSlot) => void
  onBookingSelect: (booking: BookingSlot | null) => void
  readOnly?: boolean
}

function renderAvailabilityBlocks(date: Date, timezone: string, activeRules: AvailabilityRule[], visibleRange: { startMinutes: number; endMinutes: number }) {
  const weekday = weekdayFromDate(date, timezone)
  const dayRules = activeRules.filter(rule => rule.day_of_week === weekday)
  return dayRules.map((rule, index) => {
    const start = parseMinutes(rule.start_time)
    const end = parseMinutes(rule.end_time)
    const clippedStart = Math.max(start, visibleRange.startMinutes)
    const clippedEnd = Math.min(end, visibleRange.endMinutes)
    const top = ((clippedStart - visibleRange.startMinutes) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
    const height = ((clippedEnd - clippedStart) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
    if (height <= 0 || clippedEnd <= visibleRange.startMinutes || clippedStart >= visibleRange.endMinutes) return null
    return (
      <div
        key={`${getDateKey(date, timezone)}-avail-${index}`}
        className="absolute left-1 right-1 rounded-md border border-[#9FE870]/30 bg-[#9FE870]/10/80"
        style={{ top: `${Math.max(0, top)}px`, height: `${Math.max(18, height)}px` }}
        title={`Disponível ${rule.start_time.slice(0, 5)}-${rule.end_time.slice(0, 5)}`}
      />
    )
  })
}

function renderBookedBlocks(
  date: Date,
  timezone: string,
  visibleRange: { startMinutes: number; endMinutes: number },
  bookingsByDate: Map<string, { start: number; end: number; status: string; id: string; client_name?: string }[]>,
  allBookings: BookingSlot[],
  onBookingClick: ((booking: BookingSlot) => void) | undefined,
  onBookingSelect: (booking: BookingSlot | null) => void,
  readOnly: boolean
) {
  const key = getDateKey(date, timezone)
  const dayBookings = bookingsByDate.get(key) || []
  return dayBookings.map(booking => {
    const clippedStart = Math.max(booking.start, visibleRange.startMinutes)
    const clippedEnd = Math.min(booking.end, visibleRange.endMinutes)
    const top = ((clippedStart - visibleRange.startMinutes) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
    const height = ((clippedEnd - clippedStart) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
    if (height <= 0 || clippedEnd <= visibleRange.startMinutes || clippedStart >= visibleRange.endMinutes) return null
    const isClickable = !readOnly && (onBookingClick || booking.id)
    const fullBooking = allBookings.find(b => b.id === booking.id)
    return (
      <button
        key={`booking-${booking.id}`}
        type="button"
        onClick={() => {
          if (onBookingClick && fullBooking) onBookingClick(fullBooking)
          onBookingSelect(fullBooking || null)
        }}
        className={`absolute left-2 right-2 rounded-md border border-amber-300 bg-amber-200/85 text-left transition ${isClickable ? 'cursor-pointer hover:bg-amber-300/90 hover:shadow-sm' : ''}`}
        style={{ top: `${Math.max(0, top)}px`, height: `${Math.max(18, height)}px` }}
        title={`Ocupado (${booking.status})${booking.client_name ? ` — ${booking.client_name}` : ''}`}
      >
        {height >= 28 && booking.client_name ? (
          <span className="block truncate px-1.5 text-[10px] font-medium text-amber-900">
            {booking.client_name}
          </span>
        ) : null}
        {height >= 28 && !booking.client_name ? (
          <span className="block truncate px-1.5 text-[10px] font-medium text-amber-900">
            {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'pending_confirmation' ? 'Pendente' : 'Ocupado'}
          </span>
        ) : null}
      </button>
    )
  })
}

function renderExceptionBlocks(date: Date, timezone: string, visibleRange: { startMinutes: number; endMinutes: number }, exceptionsByDate: Map<string, { startMinutes: number; endMinutes: number }[]>) {
  const key = getDateKey(date, timezone)
  const dayExceptions = exceptionsByDate.get(key) || []
  return dayExceptions.map((exc, index) => {
    const clippedStart = Math.max(exc.startMinutes, visibleRange.startMinutes)
    const clippedEnd = Math.min(exc.endMinutes, visibleRange.endMinutes)
    const top = ((clippedStart - visibleRange.startMinutes) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
    const height = ((clippedEnd - clippedStart) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
    if (height <= 0 || clippedEnd <= visibleRange.startMinutes || clippedStart >= visibleRange.endMinutes) return null
    return (
      <div
        key={`${key}-exc-${index}`}
        className="absolute left-1 right-1 rounded-md border border-red-200 bg-red-100/70"
        style={{ top: `${Math.max(0, top)}px`, height: `${Math.max(18, height)}px` }}
        title={exc.startMinutes === 0 && exc.endMinutes === 24 * 60 ? 'Dia bloqueado' : 'Horário bloqueado'}
      />
    )
  })
}

export function DayWeekView({
  days,
  timezone,
  visibleRange,
  timeSlots,
  activeRules,
  bookings,
  bookingsByDate,
  exceptionsByDate,
  onSlotClick,
  onBookingClick,
  onBookingSelect,
  readOnly = false,
}: DayWeekViewProps) {
  return (
    <div className="overflow-auto max-w-full p-3 md:p-4">
      <div
        className="grid min-w-[760px] border border-slate-200/80"
        style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div className="border-r border-slate-200/80 bg-slate-50/70" />
        {days.map(day => (
          <div key={getDateKey(day, timezone)} className="border-r border-slate-200/80 bg-slate-50/70 p-2 text-center text-xs font-semibold text-slate-700 last:border-r-0">
            {formatInTimeZone(day, timezone, 'EEE d')}
          </div>
        ))}

        <div className="border-r border-slate-200/80 bg-white">
          {timeSlots.map(slot => (
            <div key={slot.label} className="h-6 border-t border-slate-200/80 px-1 text-[10px] text-slate-500">
              {slot.minutes % 60 === 0 ? slot.label : ''}
            </div>
          ))}
        </div>

        {days.map(day => (
          <div
            key={`${getDateKey(day, timezone)}-column`}
            className="relative border-r border-slate-200/80 bg-white last:border-r-0"
            style={{ height: `${(visibleRange.totalMinutes / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT}px` }}
          >
            {Array.from({ length: visibleRange.totalMinutes / SLOT_STEP_MINUTES }).map((_, index) => {
              const slotMinutes = visibleRange.startMinutes + index * SLOT_STEP_MINUTES
              const slotDate = new Date(day)
              slotDate.setHours(0, slotMinutes, 0, 0)
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (onSlotClick && !readOnly) {
                      onSlotClick(day, slotMinutes)
                    }
                  }}
                  className={`block h-6 w-full border-t border-slate-200/80 ${!readOnly && onSlotClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                />
              )
            })}
            {renderAvailabilityBlocks(day, timezone, activeRules, visibleRange)}
            {renderBookedBlocks(day, timezone, visibleRange, bookingsByDate, bookings, onBookingClick, onBookingSelect, readOnly)}
            {renderExceptionBlocks(day, timezone, visibleRange, exceptionsByDate)}
          </div>
        ))}
      </div>
    </div>
  )
}
