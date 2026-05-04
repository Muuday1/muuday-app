'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { toLocalDateStr } from '../../booking-form-helpers'

interface UseBookingPricingOptions {
  sessionPriceBrl: number
  sessionDurationMinutes: number
  userCurrency: string
  userTimezone: string
  professionalTimezone: string
  selectedDate: Date | null
  selectedTime: string | null
  bookingType: 'one_off' | 'recurring' | 'batch'
  resolvedRecurringSessionsCount: number
  batchDateTimesCount: number
}

interface UseBookingPricingReturn {
  totalSessions: number
  totalPrice: number
  priceFormatted: string
  totalPriceFormatted: string
  selectedTimeInProfessionalTimezone: string | null
}

export function useBookingPricing(options: UseBookingPricingOptions): UseBookingPricingReturn {
  const {
    sessionPriceBrl,
    sessionDurationMinutes,
    userCurrency,
    userTimezone,
    professionalTimezone,
    selectedDate,
    selectedTime,
    bookingType,
    resolvedRecurringSessionsCount,
    batchDateTimesCount,
  } = options

  const totalSessions =
    bookingType === 'recurring'
      ? Math.max(1, resolvedRecurringSessionsCount)
      : bookingType === 'batch'
        ? batchDateTimesCount
        : 1

  const totalPrice = sessionPriceBrl * totalSessions
  const priceFormatted = formatCurrency(sessionPriceBrl, userCurrency)
  const totalPriceFormatted = formatCurrency(totalPrice, userCurrency)

  const selectedTimeInProfessionalTimezone = useMemo(() => {
    if (!selectedDate || !selectedTime) return null
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const professionalDate = formatInTimeZone(selectedUtc, professionalTimezone, 'yyyy-MM-dd')
    const professionalTime = formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
    return `${professionalDate} ${professionalTime}`
  }, [professionalTimezone, selectedDate, selectedTime, userTimezone])

  return {
    totalSessions,
    totalPrice,
    priceFormatted,
    totalPriceFormatted,
    selectedTimeInProfessionalTimezone,
  }
}
