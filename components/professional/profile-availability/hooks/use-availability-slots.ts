'use client'

import { useMemo, useState, useCallback } from 'react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { generateTimeSlots } from '@/components/booking/booking-form-helpers'
import { isSlotBlockedByException, hasUtcBookingConflict, hasUtcExternalConflict } from '@/lib/booking/slot-filtering'
import {
  toLocalDateStr,
  fromIsoDateToLocalDate,
  addDaysToIsoDate,
} from '../helpers'
import type { AvailabilitySlot, ExistingBooking, AvailabilityException, ExternalCalendarBusySlot } from '../types'

interface UseAvailabilitySlotsOptions {
  availability: AvailabilitySlot[]
  availabilityExceptions: AvailabilityException[]
  existingBookings: ExistingBooking[]
  externalCalendarBusySlots: ExternalCalendarBusySlot[]
  userTimezone: string
  professionalTimezone: string
  maxBookingWindowDays: number
  minimumNoticeHours: number
  selectedDuration: number
}

interface UseAvailabilitySlotsReturn {
  today: Date
  maxDate: Date
  currentMonth: Date
  selectedDate: Date | null
  selectedTime: string | null
  calendarDays: (Date | null)[]
  timeSlots: string[]
  canGoPrev: boolean
  canGoNext: boolean
  isDateAvailable: (date: Date) => boolean
  setCurrentMonth: (date: Date) => void
  selectDate: (date: Date) => void
  selectTime: (time: string) => void
  resetTime: () => void
  prevMonth: () => void
  nextMonth: () => void
}

export function useAvailabilitySlots(options: UseAvailabilitySlotsOptions): UseAvailabilitySlotsReturn {
  const {
    availability,
    availabilityExceptions,
    existingBookings,
    externalCalendarBusySlots,
    userTimezone,
    professionalTimezone,
    maxBookingWindowDays,
    minimumNoticeHours,
    selectedDuration,
  } = options

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
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
        const rawSlots = generateTimeSlots(rule.start_time, rule.end_time, selectedDuration)
        for (const rawSlot of rawSlots) {
          const slotUtc = fromZonedTime(`${professionalDate}T${rawSlot}:00`, professionalTimezone)
          if (slotUtc.getTime() <= minNoticeTimestamp) continue
          const slotUserDate = formatInTimeZone(slotUtc, userTimezone, 'yyyy-MM-dd')
          const slotUserDateObj = fromIsoDateToLocalDate(slotUserDate)
          if (slotUserDateObj < today || slotUserDateObj > maxDate) continue

          if (isSlotBlockedByException(rawSlot, selectedDuration, professionalDate, availabilityExceptions)) {
            continue
          }

          const slotUserTime = formatInTimeZone(slotUtc, userTimezone, 'HH:mm')
          const existingSlots = map.get(slotUserDate) || []
          existingSlots.push(slotUserTime)
          map.set(slotUserDate, existingSlots)
        }
      }
    }

    map.forEach((values, dateKey) => {
      const uniqueSorted = Array.from(new Set<string>(values)).sort()
      map.set(dateKey, uniqueSorted)
    })
    return map
  }, [
    availability,
    availabilityExceptions,
    maxBookingWindowDays,
    maxDate,
    minNoticeTimestamp,
    professionalTimezone,
    selectedDuration,
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
      const slotEndUtc = new Date(slotUtc.getTime() + selectedDuration * 60 * 1000)

      if (hasUtcBookingConflict(slotUtc, slotEndUtc, existingBookings)) return false
      if (hasUtcExternalConflict(slotUtc, slotEndUtc, externalCalendarBusySlots)) return false
      return true
    })
  }, [existingBookings, externalCalendarBusySlots, selectedDate, selectedDuration, slotsByUserDate, userTimezone])

  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  const canGoNext = currentMonth < maxMonth

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }, [])

  const selectTime = useCallback((time: string) => {
    setSelectedTime(time)
  }, [])

  const resetTime = useCallback(() => {
    setSelectedTime(null)
  }, [])

  const prevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const nextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  return {
    today,
    maxDate,
    currentMonth,
    selectedDate,
    selectedTime,
    calendarDays,
    timeSlots,
    canGoPrev,
    canGoNext,
    isDateAvailable,
    setCurrentMonth,
    selectDate,
    selectTime,
    resetTime,
    prevMonth,
    nextMonth,
  }
}
