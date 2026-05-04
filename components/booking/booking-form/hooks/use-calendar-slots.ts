'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { isSlotBlockedByException, hasUtcBookingConflict } from '@/lib/booking/slot-filtering'
import {
  toLocalDateStr,
  fromIsoDateToLocalDate,
  addDaysToIsoDate,
  generateTimeSlots,
} from '../../booking-form-helpers'
import type { AvailabilitySlot, ExistingBooking, AvailabilityException } from '../types'

interface UseCalendarSlotsOptions {
  availability: AvailabilitySlot[]
  availabilityExceptions: AvailabilityException[]
  existingBookings: ExistingBooking[]
  userTimezone: string
  professionalTimezone: string
  maxBookingWindowDays: number
  minimumNoticeHours: number
  sessionDurationMinutes: number
  initialDate?: string
  initialTime?: string
}

interface UseCalendarSlotsReturn {
  currentMonth: Date
  selectedDate: Date | null
  selectedTime: string | null
  today: Date
  maxDate: Date
  calendarDays: (Date | null)[]
  timeSlots: string[]
  canGoPrev: boolean
  canGoNext: boolean
  isDateAvailable: (date: Date) => boolean
  prevMonth: () => void
  nextMonth: () => void
  selectDate: (date: Date) => void
  selectTime: (time: string) => void
  resetTime: () => void
  renderSlotLabel: (time: string, mode: 'user' | 'professional') => string
}

export function useCalendarSlots(options: UseCalendarSlotsOptions): UseCalendarSlotsReturn {
  const {
    availability,
    availabilityExceptions,
    existingBookings,
    userTimezone,
    professionalTimezone,
    maxBookingWindowDays,
    minimumNoticeHours,
    sessionDurationMinutes,
    initialDate,
    initialTime,
  } = options

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const maxDate = useMemo(() => {
    const result = new Date(today)
    result.setDate(result.getDate() + maxBookingWindowDays)
    return result
  }, [maxBookingWindowDays, today])

  const minNoticeTimestamp = Date.now() + minimumNoticeHours * 60 * 60 * 1000

  const slotsByUserDate = useMemo(() => {
    const map = new Map<string, string[]>()
    const now = new Date()
    const professionalToday = formatInTimeZone(now, professionalTimezone, 'yyyy-MM-dd')

    for (let dayOffset = -1; dayOffset <= maxBookingWindowDays + 8; dayOffset++) {
      const professionalDate = addDaysToIsoDate(professionalToday, dayOffset)
      const professionalNoonUtc = fromZonedTime(`${professionalDate}T12:00:00`, professionalTimezone)
      const weekdayIso = Number(formatInTimeZone(professionalNoonUtc, professionalTimezone, 'i'))
      const professionalWeekday = weekdayIso % 7

      const dayRules = availability.filter(rule => rule.day_of_week === professionalWeekday)
      if (dayRules.length === 0) continue

      for (const rule of dayRules) {
        const rawSlots = generateTimeSlots(
          rule.start_time,
          rule.end_time,
          sessionDurationMinutes,
        )

        for (const rawSlot of rawSlots) {
          const slotUtc = fromZonedTime(`${professionalDate}T${rawSlot}:00`, professionalTimezone)
          if (slotUtc.getTime() <= minNoticeTimestamp) continue

          const slotUserDate = formatInTimeZone(slotUtc, userTimezone, 'yyyy-MM-dd')
          const slotUserDateObj = fromIsoDateToLocalDate(slotUserDate)
          if (slotUserDateObj < today || slotUserDateObj > maxDate) continue

          if (isSlotBlockedByException(rawSlot, sessionDurationMinutes, professionalDate, availabilityExceptions)) {
            continue
          }

          const slotUserTime = formatInTimeZone(slotUtc, userTimezone, 'HH:mm')
          const existingSlots = map.get(slotUserDate) || []
          existingSlots.push(slotUserTime)
          map.set(slotUserDate, existingSlots)
        }
      }
    }

    const entries = Array.from(map.entries())
    for (const [dateKey, values] of entries) {
      const uniqueSorted = Array.from(new Set(values)).sort()
      map.set(dateKey, uniqueSorted)
    }

    return map
  }, [
    availability,
    availabilityExceptions,
    maxBookingWindowDays,
    maxDate,
    minNoticeTimestamp,
    sessionDurationMinutes,
    professionalTimezone,
    today,
    userTimezone,
  ])

  const isDateAvailable = useCallback((date: Date) => {
    if (date < today || date > maxDate) return false
    return slotsByUserDate.has(toLocalDateStr(date))
  }, [today, maxDate, slotsByUserDate])

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))

    return days
  }, [currentMonth])

  const timeSlots = useMemo(() => {
    if (!selectedDate) return []
    const selectedDateStr = toLocalDateStr(selectedDate)
    const candidateSlots = slotsByUserDate.get(selectedDateStr) || []
    if (candidateSlots.length === 0) return []

    return candidateSlots.filter(time => {
      const slotUtc = fromZonedTime(`${selectedDateStr}T${time}:00`, userTimezone)
      if (Number.isNaN(slotUtc.getTime())) return false
      const slotEndUtc = new Date(slotUtc.getTime() + sessionDurationMinutes * 60 * 1000)
      return !hasUtcBookingConflict(slotUtc, slotEndUtc, existingBookings)
    })
  }, [
    existingBookings,
    sessionDurationMinutes,
    selectedDate,
    slotsByUserDate,
    userTimezone,
  ])

  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  const canGoNext = currentMonth < maxMonth

  const prevMonth = useCallback(() => {
    if (!canGoPrev) return
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [canGoPrev])

  const nextMonth = useCallback(() => {
    if (!canGoNext) return
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [canGoNext])

  const selectDate = useCallback((date: Date) => {
    if (!isDateAvailable(date)) return
    setSelectedDate(date)
    setSelectedTime(null)
  }, [isDateAvailable])

  const selectTime = useCallback((time: string) => {
    setSelectedTime(time)
  }, [])

  const resetTime = useCallback(() => {
    setSelectedTime(null)
  }, [])

  const renderSlotLabel = useCallback((time: string, mode: 'user' | 'professional') => {
    if (!selectedDate || mode === 'user') return time
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${time}:00`, userTimezone)
    return formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
  }, [selectedDate, userTimezone, professionalTimezone])

  // Prefill initial date/time
  useEffect(() => {
    if (!initialDate) return
    const parsedDate = fromIsoDateToLocalDate(initialDate)
    if (Number.isNaN(parsedDate.getTime())) return
    if (parsedDate < today || parsedDate > maxDate) return
    if (!slotsByUserDate.has(initialDate)) return

    setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1))
    setSelectedDate(parsedDate)

    if (!initialTime) return
    const availableSlots = slotsByUserDate.get(initialDate) || []
    if (availableSlots.includes(initialTime)) {
      setSelectedTime(initialTime)
    }
  }, [initialDate, initialTime, maxDate, slotsByUserDate, today])

  return {
    currentMonth,
    selectedDate,
    selectedTime,
    today,
    maxDate,
    calendarDays,
    timeSlots,
    canGoPrev,
    canGoNext,
    isDateAvailable,
    prevMonth,
    nextMonth,
    selectDate,
    selectTime,
    resetTime,
    renderSlotLabel,
  }
}
