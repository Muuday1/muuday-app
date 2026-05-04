'use client'

import { useMemo, useState, useCallback } from 'react'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { buildScheduledAt } from '../../booking-form-helpers'

interface BatchSlotPreview {
  value: string
  userDateTime: string
  professionalDateTime: string
}

interface UseBatchBookingOptions {
  userTimezone: string
  professionalTimezone: string
}

interface UseBatchBookingReturn {
  batchDateTimes: string[]
  batchSlotsPreview: BatchSlotPreview[]
  addToBatch: (dateStr: string, time: string) => void
  removeFromBatch: (value: string) => void
}

export function useBatchBooking(options: UseBatchBookingOptions): UseBatchBookingReturn {
  const { userTimezone, professionalTimezone } = options

  const [batchDateTimes, setBatchDateTimes] = useState<string[]>([])

  const batchSlotsPreview = useMemo(() => {
    return batchDateTimes.map(value => {
      const startUtc = fromZonedTime(value, userTimezone)
      const userDateTime = formatInTimeZone(startUtc, userTimezone, "EEE, dd/MM 'às' HH:mm")
      const professionalDateTime = formatInTimeZone(
        startUtc,
        professionalTimezone,
        "EEE, dd/MM 'às' HH:mm",
      )
      return {
        value,
        userDateTime,
        professionalDateTime,
      }
    })
  }, [batchDateTimes, professionalTimezone, userTimezone])

  const addToBatch = useCallback((dateStr: string, time: string) => {
    const value = buildScheduledAt(dateStr, time)
    setBatchDateTimes(prev => {
      if (prev.includes(value)) return prev
      return [...prev, value].sort()
    })
  }, [])

  const removeFromBatch = useCallback((value: string) => {
    setBatchDateTimes(prev => prev.filter(item => item !== value))
  }, [])

  return {
    batchDateTimes,
    batchSlotsPreview,
    addToBatch,
    removeFromBatch,
  }
}
