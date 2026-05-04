'use client'

import { useMemo, useState, useEffect } from 'react'
import { fromZonedTime } from 'date-fns-tz'
import { generateRecurrenceSlots, detectRecurrenceConflicts } from '@/lib/booking/recurrence-engine'
import { deriveRecurringOccurrencesFromEndDate } from '../../booking-form-helpers'
import { toLocalDateStr } from '../../booking-form-helpers'
import type { ExistingBooking } from '../types'

interface UseRecurringBookingOptions {
  selectedDate: Date | null
  selectedTime: string | null
  sessionDurationMinutes: number
  maxBookingWindowDays: number
  existingBookings: ExistingBooking[]
  userTimezone: string
  canUseRecurring: boolean
  initialRecurringSessionsCount: number
}

interface UseRecurringBookingReturn {
  recurringSessionsCount: number
  setRecurringSessionsCount: (value: number) => void
  recurringPeriodicity: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  setRecurringPeriodicity: (value: 'weekly' | 'biweekly' | 'monthly' | 'custom_days') => void
  recurringIntervalDays: number
  setRecurringIntervalDays: (value: number) => void
  recurringDurationMode: 'occurrences' | 'end_date'
  setRecurringDurationMode: (value: 'occurrences' | 'end_date') => void
  recurringEndDate: string
  setRecurringEndDate: (value: string) => void
  recurringAutoRenew: boolean
  setRecurringAutoRenew: (value: boolean) => void
  resolvedRecurringSessionsCount: number
  hasValidRecurringDuration: boolean
  recurringConflicts: { startUtc: string; reason: 'existing_booking' | 'blocked_slot' }[]
}

export function useRecurringBooking(options: UseRecurringBookingOptions): UseRecurringBookingReturn {
  const {
    selectedDate,
    selectedTime,
    sessionDurationMinutes,
    maxBookingWindowDays,
    existingBookings,
    userTimezone,
    canUseRecurring,
    initialRecurringSessionsCount,
  } = options

  const [recurringSessionsCount, setRecurringSessionsCount] = useState(
    [4, 8, 12].includes(initialRecurringSessionsCount)
      ? initialRecurringSessionsCount
      : 4,
  )
  const [recurringPeriodicity, setRecurringPeriodicity] = useState<'weekly' | 'biweekly' | 'monthly' | 'custom_days'>('weekly')
  const [recurringIntervalDays, setRecurringIntervalDays] = useState(7)
  const [recurringDurationMode, setRecurringDurationMode] = useState<'occurrences' | 'end_date'>('occurrences')
  const [recurringEndDate, setRecurringEndDate] = useState('')
  const [recurringAutoRenew, setRecurringAutoRenew] = useState(false)

  const resolvedRecurringSessionsCount = useMemo(() => {
    if (!selectedDate) return 0
    return deriveRecurringOccurrencesFromEndDate({
      startDate: selectedDate,
      endDate: recurringEndDate,
      periodicity: recurringPeriodicity,
      intervalDays: recurringIntervalDays,
      maxBookingWindowDays,
    })
  }, [
    selectedDate,
    recurringEndDate,
    recurringPeriodicity,
    recurringIntervalDays,
    maxBookingWindowDays,
  ])

  const hasValidRecurringDuration =
    recurringDurationMode === 'occurrences'
      ? recurringSessionsCount >= 2
      : resolvedRecurringSessionsCount >= 2

  const recurringConflicts = useMemo(() => {
    if (!selectedDate || !selectedTime || !hasValidRecurringDuration) return []

    const selectedDateStr = toLocalDateStr(selectedDate)
    const startUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const endUtc = new Date(startUtc.getTime() + sessionDurationMinutes * 60 * 1000)

    const { slots } = generateRecurrenceSlots({
      startDateUtc: startUtc,
      endDateUtc: endUtc,
      periodicity: recurringPeriodicity,
      intervalDays: recurringIntervalDays,
      occurrences: recurringDurationMode === 'occurrences' ? recurringSessionsCount : resolvedRecurringSessionsCount,
      bookingWindowDays: maxBookingWindowDays,
    })

    const existing = existingBookings.map(b => {
      const s = new Date(b.scheduled_at)
      return { startUtc: s, endUtc: new Date(s.getTime() + b.duration_minutes * 60 * 1000) }
    })

    return detectRecurrenceConflicts(slots, existing, [])
  }, [
    selectedDate,
    selectedTime,
    hasValidRecurringDuration,
    userTimezone,
    sessionDurationMinutes,
    recurringPeriodicity,
    recurringIntervalDays,
    recurringDurationMode,
    recurringSessionsCount,
    resolvedRecurringSessionsCount,
    maxBookingWindowDays,
    existingBookings,
  ])

  return {
    recurringSessionsCount,
    setRecurringSessionsCount,
    recurringPeriodicity,
    setRecurringPeriodicity,
    recurringIntervalDays,
    setRecurringIntervalDays,
    recurringDurationMode,
    setRecurringDurationMode,
    recurringEndDate,
    setRecurringEndDate,
    recurringAutoRenew,
    setRecurringAutoRenew,
    resolvedRecurringSessionsCount,
    hasValidRecurringDuration,
    recurringConflicts,
  }
}
