'use client'

import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { CalendarDays, ChevronLeft, ChevronRight, Video, User, X } from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

type AvailabilityRule = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

type BookingSlot = {
  id: string
  start_utc: string
  end_utc: string
  status: string
  client_name?: string
  session_link?: string
}

type CalendarView = 'day' | 'week' | 'month'

type ProfessionalAvailabilityCalendarProps = {
  timezone: string
  availabilityRules: AvailabilityRule[]
  bookings: BookingSlot[]
  className?: string
  onBookingClick?: (booking: BookingSlot) => void
  onSlotClick?: (date: Date, startMinutes: number) => void
  readOnly?: boolean
}

const HOURS_START = 6
const HOURS_END = 24
const SLOT_STEP_MINUTES = 30
const SLOT_ROW_HEIGHT = 24
const MIN_VISIBLE_WINDOW_MINUTES = 8 * 60

function parseMinutes(value: string) {
  const [h, m] = value.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function weekdayFromDate(date: Date, timezone: string) {
  const isoWeekday = Number(formatInTimeZone(date, timezone, 'i')) // 1..7
  return isoWeekday % 7 // 0..6 (dom..sab)
}

function getDateKey(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd')
}

type LocalBookingInterval = {
  start: number
  end: number
  status: string
  id: string
  client_name?: string
}

function buildLocalBookingIntervals(bookings: BookingSlot[], timezone: string) {
  const map = new Map<string, LocalBookingInterval[]>()

  for (const booking of bookings) {
    const startUtc = new Date(booking.start_utc)
    const endUtc = new Date(booking.end_utc)
    if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()) || endUtc <= startUtc) continue

    const key = getDateKey(startUtc, timezone)
    const startMinutes = parseMinutes(formatInTimeZone(startUtc, timezone, 'HH:mm'))
    const endMinutes = parseMinutes(formatInTimeZone(endUtc, timezone, 'HH:mm'))
    const current = map.get(key) || []
    current.push({ start: startMinutes, end: endMinutes, status: booking.status, id: booking.id, client_name: booking.client_name })
    map.set(key, current)
  }

  return map
}

function roundDownToStep(minutes: number, step: number) {
  return Math.floor(minutes / step) * step
}

function roundUpToStep(minutes: number, step: number) {
  return Math.ceil(minutes / step) * step
}

export function ProfessionalAvailabilityCalendar({
  timezone,
  availabilityRules,
  bookings,
  className = '',
  onBookingClick,
  onSlotClick,
  readOnly = false,
}: ProfessionalAvailabilityCalendarProps) {
  const [view, setView] = useState<CalendarView>('week')
  const [cursorDate, setCursorDate] = useState(() => toZonedTime(new Date(), timezone))
  const [selectedBooking, setSelectedBooking] = useState<BookingSlot | null>(null)

  const activeRules = useMemo(
    () => availabilityRules.filter(rule => rule.is_active !== false),
    [availabilityRules],
  )

  const bookingsByDate = useMemo(
    () => buildLocalBookingIntervals(bookings, timezone),
    [bookings, timezone],
  )

  const visibleRange = useMemo(() => {
    const fallbackStart = HOURS_START * 60
    const fallbackEnd = HOURS_END * 60
    let minMinutes = Number.POSITIVE_INFINITY
    let maxMinutes = Number.NEGATIVE_INFINITY

    for (const rule of activeRules) {
      const start = parseMinutes(rule.start_time)
      const end = parseMinutes(rule.end_time)
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        minMinutes = Math.min(minMinutes, start)
        maxMinutes = Math.max(maxMinutes, end)
      }
    }

    for (const dayBookings of Array.from(bookingsByDate.values())) {
      for (const booking of dayBookings) {
        if (booking.end > booking.start) {
          minMinutes = Math.min(minMinutes, booking.start)
          maxMinutes = Math.max(maxMinutes, booking.end)
        }
      }
    }

    if (!Number.isFinite(minMinutes) || !Number.isFinite(maxMinutes)) {
      return {
        startMinutes: fallbackStart,
        endMinutes: fallbackEnd,
        totalMinutes: fallbackEnd - fallbackStart,
      }
    }

    const paddedStart = Math.max(fallbackStart, roundDownToStep(minMinutes - SLOT_STEP_MINUTES, SLOT_STEP_MINUTES))
    let paddedEnd = Math.min(fallbackEnd, roundUpToStep(maxMinutes + SLOT_STEP_MINUTES, SLOT_STEP_MINUTES))
    if (paddedEnd - paddedStart < MIN_VISIBLE_WINDOW_MINUTES) {
      paddedEnd = Math.min(fallbackEnd, paddedStart + MIN_VISIBLE_WINDOW_MINUTES)
    }

    return {
      startMinutes: paddedStart,
      endMinutes: paddedEnd,
      totalMinutes: paddedEnd - paddedStart,
    }
  }, [activeRules, bookingsByDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [cursorDate])

  const monthDays = useMemo(() => {
    const first = startOfMonth(cursorDate)
    const last = endOfMonth(cursorDate)
    const start = startOfWeek(first, { weekStartsOn: 1 })
    const end = endOfWeek(last, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursorDate])

  const visibleDayColumns = view === 'day' ? [cursorDate] : weekDays
  const dayList = view === 'month' ? monthDays : visibleDayColumns

  const timeSlots = useMemo(() => {
    const slots: Array<{ label: string; minutes: number }> = []
    for (
      let minutes = visibleRange.startMinutes;
      minutes < visibleRange.endMinutes;
      minutes += SLOT_STEP_MINUTES
    ) {
      slots.push({
        label: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
        minutes,
      })
    }
    return slots
  }, [visibleRange.endMinutes, visibleRange.startMinutes])

  const periodLabel = useMemo(() => {
    const zonedCursor = toZonedTime(cursorDate, timezone)
    if (view === 'month') {
      const label = format(zonedCursor, 'MMMM yyyy', { locale: ptBR })
      return label.charAt(0).toUpperCase() + label.slice(1)
    }
    if (view === 'week') {
      const start = startOfWeek(zonedCursor, { weekStartsOn: 1 })
      const end = addDays(start, 6)
      return `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`
    }
    return format(zonedCursor, "EEEE, dd 'de' MMMM", { locale: ptBR })
  }, [cursorDate, timezone, view])

  function goPrev() {
    if (view === 'month') {
      setCursorDate(prev => subMonths(prev, 1))
      return
    }
    if (view === 'week') {
      setCursorDate(prev => addDays(prev, -7))
      return
    }
    setCursorDate(prev => addDays(prev, -1))
  }

  function goNext() {
    if (view === 'month') {
      setCursorDate(prev => addMonths(prev, 1))
      return
    }
    if (view === 'week') {
      setCursorDate(prev => addDays(prev, 7))
      return
    }
    setCursorDate(prev => addDays(prev, 1))
  }

  function goToday() {
    setCursorDate(toZonedTime(new Date(), timezone))
  }

  function renderDayAvailabilityBlocks(date: Date) {
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

  function renderDayBookedBlocks(date: Date) {
    const key = getDateKey(date, timezone)
    const dayBookings = bookingsByDate.get(key) || []
    return dayBookings.map(booking => {
      const clippedStart = Math.max(booking.start, visibleRange.startMinutes)
      const clippedEnd = Math.min(booking.end, visibleRange.endMinutes)
      const top = ((clippedStart - visibleRange.startMinutes) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
      const height = ((clippedEnd - clippedStart) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
      if (height <= 0 || clippedEnd <= visibleRange.startMinutes || clippedStart >= visibleRange.endMinutes) return null
      const isClickable = !readOnly && (onBookingClick || booking.id)
      return (
        <button
          key={`booking-${booking.id}`}
          type="button"
          onClick={() => {
            if (onBookingClick) {
              const fullBooking = bookings.find(b => b.id === booking.id)
              if (fullBooking) onBookingClick(fullBooking)
            }
            setSelectedBooking(bookings.find(b => b.id === booking.id) || null)
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

  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5 md:px-4 md:py-3">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#3d6b1f]" />
          <p className="text-sm font-semibold text-slate-900">Calendário</p>
          <p className="text-xs text-slate-500">{timezone}</p>
        </div>

        <p className="text-xs font-semibold text-slate-700 md:text-sm">{periodLabel}</p>

        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={goPrev} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50/70">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={goToday} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50/70">
            Hoje
          </button>
          <button type="button" onClick={goNext} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50/70">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs">
          {(['day', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`rounded px-2 py-1 font-semibold ${view === mode ? 'bg-[#9FE870] text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-3 py-2 text-[11px] text-slate-600 md:px-4">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#9FE870]" /> Disponível
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Ocupado
        </span>
      </div>

      {view === 'month' ? (
        <div className="p-3 md:p-4">
          <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-slate-500">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(label => (
              <div key={label} className="px-2 py-1">{label}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {dayList.map(day => {
              const key = getDateKey(day, timezone)
              const isToday = isSameDay(day, toZonedTime(new Date(), timezone))
              const weekday = weekdayFromDate(day, timezone)
              const availabilityCount = activeRules.filter(rule => rule.day_of_week === weekday).length
              const bookedCount = (bookingsByDate.get(key) || []).length
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCursorDate(day)
                    setView('day')
                  }}
                  className={`min-h-[74px] rounded-lg border p-2 text-left ${
                    isToday ? 'border-[#9FE870]/40 bg-[#9FE870]/8' : 'border-slate-200/80 bg-slate-50/70/40 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-800">{formatInTimeZone(day, timezone, 'd')}</p>
                  <p className="mt-1 text-[11px] text-[#3d6b1f]">
                    {availabilityCount > 0 ? `${availabilityCount} bloco(s)` : 'Sem disponibilidade'}
                  </p>
                  <p className="text-[11px] text-amber-700">{bookedCount > 0 ? `${bookedCount} ocupado(s)` : 'Livre'}</p>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-auto p-3 md:p-4">
          <div
            className="grid min-w-[760px] border border-slate-200/80"
            style={{ gridTemplateColumns: `64px repeat(${visibleDayColumns.length}, minmax(0, 1fr))` }}
          >
            <div className="border-r border-slate-200/80 bg-slate-50/70" />
            {visibleDayColumns.map(day => (
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

            {visibleDayColumns.map(day => (
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
                {renderDayAvailabilityBlocks(day)}
                {renderDayBookedBlocks(day)}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Booking detail popover */}
      {selectedBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {selectedBooking.client_name || 'Sessão agendada'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatInTimeZone(new Date(selectedBooking.start_utc), timezone, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-400">
                  Status: {selectedBooking.status === 'confirmed' ? 'Confirmada' : selectedBooking.status === 'pending_confirmation' ? 'Pendente de confirmação' : selectedBooking.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending_confirmation') ? (
                <Link
                  href={`/sessao/${selectedBooking.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
                >
                  <Video className="h-4 w-4" />
                  Entrar na sessão
                </Link>
              ) : null}
              <Link
                href={`/agenda?view=inbox`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
              >
                <User className="h-4 w-4" />
                Ver na inbox
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
