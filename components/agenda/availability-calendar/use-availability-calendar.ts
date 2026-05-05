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
import { ptBR } from 'date-fns/locale'
import type { AvailabilityRule, BookingSlot, CalendarView, AvailabilityException } from './types'
import { HOURS_START, HOURS_END, SLOT_STEP_MINUTES, MIN_VISIBLE_WINDOW_MINUTES } from './types'
import { parseMinutes, weekdayFromDate, getDateKey, buildLocalBookingIntervals, roundDownToStep, roundUpToStep } from './helpers'

export function useAvailabilityCalendar(
  timezone: string,
  availabilityRules: AvailabilityRule[],
  bookings: BookingSlot[],
  exceptions: AvailabilityException[]
) {
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

  const exceptionsByDate = useMemo(() => {
    const map = new Map<string, Array<{ startMinutes: number; endMinutes: number }>>()
    for (const exc of exceptions) {
      if (exc.is_available !== false) continue
      const key = exc.date_local
      const list = map.get(key) || []
      if (exc.start_time_local === null || exc.end_time_local === null) {
        list.push({ startMinutes: 0, endMinutes: 24 * 60 })
      } else {
        list.push({
          startMinutes: parseMinutes(exc.start_time_local),
          endMinutes: parseMinutes(exc.end_time_local),
        })
      }
      map.set(key, list)
    }
    return map
  }, [exceptions])

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

  return {
    view,
    setView,
    cursorDate,
    setCursorDate,
    selectedBooking,
    setSelectedBooking,
    activeRules,
    bookingsByDate,
    exceptionsByDate,
    visibleRange,
    weekDays,
    monthDays,
    visibleDayColumns,
    dayList,
    timeSlots,
    periodLabel,
    goPrev,
    goNext,
    goToday,
  }
}
