'use client'

import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

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
}

type CalendarView = 'day' | 'week' | 'month'

type ProfessionalAvailabilityCalendarProps = {
  timezone: string
  availabilityRules: AvailabilityRule[]
  bookings: BookingSlot[]
  className?: string
}

const HOURS_START = 6
const HOURS_END = 22
const SLOT_STEP_MINUTES = 30
const SLOT_ROW_HEIGHT = 24
const MINUTES_VISIBLE = (HOURS_END - HOURS_START) * 60

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

function buildLocalBookingIntervals(bookings: BookingSlot[], timezone: string) {
  const map = new Map<string, Array<{ start: number; end: number; status: string; id: string }>>()

  for (const booking of bookings) {
    const startUtc = new Date(booking.start_utc)
    const endUtc = new Date(booking.end_utc)
    if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()) || endUtc <= startUtc) continue

    const key = getDateKey(startUtc, timezone)
    const startMinutes = parseMinutes(formatInTimeZone(startUtc, timezone, 'HH:mm'))
    const endMinutes = parseMinutes(formatInTimeZone(endUtc, timezone, 'HH:mm'))
    const current = map.get(key) || []
    current.push({ start: startMinutes, end: endMinutes, status: booking.status, id: booking.id })
    map.set(key, current)
  }

  return map
}

export function ProfessionalAvailabilityCalendar({
  timezone,
  availabilityRules,
  bookings,
  className = '',
}: ProfessionalAvailabilityCalendarProps) {
  const [view, setView] = useState<CalendarView>('week')
  const [cursorDate, setCursorDate] = useState(() => toZonedTime(new Date(), timezone))

  const activeRules = useMemo(
    () => availabilityRules.filter(rule => rule.is_active !== false),
    [availabilityRules],
  )

  const bookingsByDate = useMemo(
    () => buildLocalBookingIntervals(bookings, timezone),
    [bookings, timezone],
  )

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

  const dayList = view === 'day' ? [cursorDate] : view === 'week' ? weekDays : monthDays
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = HOURS_START; hour <= HOURS_END; hour += 1) {
      slots.push(`${String(hour).padStart(2, '0')}:00`)
    }
    return slots
  }, [])

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
      const top = ((start - HOURS_START * 60) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
      const height = ((end - start) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
      if (height <= 0 || end <= HOURS_START * 60 || start >= HOURS_END * 60) return null
      return (
        <div
          key={`${getDateKey(date, timezone)}-avail-${index}`}
          className="absolute left-1 right-1 rounded-md bg-brand-100/80 border border-brand-200"
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
      const top = ((booking.start - HOURS_START * 60) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
      const height = ((booking.end - booking.start) / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT
      if (height <= 0 || booking.end <= HOURS_START * 60 || booking.start >= HOURS_END * 60) return null
      return (
        <div
          key={`booking-${booking.id}`}
          className="absolute left-2 right-2 rounded-md bg-amber-200/85 border border-amber-300"
          style={{ top: `${Math.max(0, top)}px`, height: `${Math.max(18, height)}px` }}
          title={`Ocupado (${booking.status})`}
        />
      )
    })
  }

  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 p-3">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          <p className="text-sm font-semibold text-neutral-900">Calendário</p>
          <p className="text-xs text-neutral-500">{timezone}</p>
        </div>

        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={goPrev} className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={goToday} className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            Hoje
          </button>
          <button type="button" onClick={goNext} className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 text-xs">
          {(['day', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`rounded px-2 py-1 font-semibold ${view === mode ? 'bg-brand-500 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
            >
              {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-neutral-500">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(label => (
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
                  className={`min-h-[78px] rounded-lg border p-2 text-left ${
                    isToday ? 'border-brand-300 bg-brand-50' : 'border-neutral-100 bg-neutral-50/40 hover:bg-neutral-100'
                  }`}
                >
                  <p className="text-xs font-semibold text-neutral-800">{formatInTimeZone(day, timezone, 'd')}</p>
                  <p className="mt-1 text-[11px] text-brand-700">{availabilityCount > 0 ? `${availabilityCount} bloco(s)` : 'Sem disponibilidade'}</p>
                  <p className="text-[11px] text-amber-700">{bookedCount > 0 ? `${bookedCount} ocupado(s)` : 'Livre'}</p>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-auto p-3">
          <div className="grid min-w-[760px] grid-cols-[64px_repeat(7,minmax(0,1fr))] border border-neutral-100">
            <div className="border-r border-neutral-100 bg-neutral-50" />
            {(view === 'day' ? [cursorDate] : weekDays).map(day => (
              <div key={getDateKey(day, timezone)} className="border-r border-neutral-100 bg-neutral-50 p-2 text-center text-xs font-semibold text-neutral-700 last:border-r-0">
                {formatInTimeZone(day, timezone, 'EEE d')}
              </div>
            ))}

            <div className="border-r border-neutral-100 bg-white">
              {timeSlots.map(slot => (
                <div key={slot} className="h-6 border-t border-neutral-100 px-1 text-[10px] text-neutral-500">
                  {slot}
                </div>
              ))}
            </div>

            {(view === 'day' ? [cursorDate] : weekDays).map(day => (
              <div
                key={`${getDateKey(day, timezone)}-column`}
                className="relative border-r border-neutral-100 bg-white last:border-r-0"
                style={{ height: `${(MINUTES_VISIBLE / SLOT_STEP_MINUTES) * SLOT_ROW_HEIGHT}px` }}
              >
                {Array.from({ length: MINUTES_VISIBLE / SLOT_STEP_MINUTES }).map((_, index) => (
                  <div key={index} className="h-6 border-t border-neutral-100" />
                ))}
                {renderDayAvailabilityBlocks(day)}
                {renderDayBookedBlocks(day)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
