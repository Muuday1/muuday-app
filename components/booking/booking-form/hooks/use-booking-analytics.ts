'use client'

import { useEffect, useRef } from 'react'
import { captureEvent } from '@/lib/analytics/posthog-client'

interface UseBookingAnalyticsOptions {
  professionalId: string
  confirmationMode: 'auto_accept' | 'manual'
  enableRecurring: boolean
  recurringFlagEnabled: boolean | undefined
  minimumNoticeHours: number
  maxBookingWindowDays: number
}

export function useBookingAnalytics(options: UseBookingAnalyticsOptions) {
  const {
    professionalId,
    confirmationMode,
    enableRecurring,
    recurringFlagEnabled,
    minimumNoticeHours,
    maxBookingWindowDays,
  } = options

  const bookingViewTracked = useRef(false)

  useEffect(() => {
    if (bookingViewTracked.current) return
    bookingViewTracked.current = true

    captureEvent('booking_form_viewed', {
      professional_id: professionalId,
      confirmation_mode: confirmationMode,
      recurring_enabled: enableRecurring,
      recurring_flag_enabled: recurringFlagEnabled,
      min_notice_hours: minimumNoticeHours,
      max_window_days: maxBookingWindowDays,
    })
  }, [
    confirmationMode,
    enableRecurring,
    maxBookingWindowDays,
    minimumNoticeHours,
    professionalId,
    recurringFlagEnabled,
  ])

  return { bookingViewTracked }
}

export function useSlotSelectionAnalytics() {
  const slotSelectionTracked = useRef(false)

  const trackSlotSelection = (params: {
    professionalId: string
    time: string
    bookingType: 'one_off' | 'recurring' | 'batch'
  }) => {
    if (slotSelectionTracked.current) return
    slotSelectionTracked.current = true
    captureEvent('booking_time_selected', {
      professional_id: params.professionalId,
      selected_time: params.time,
      booking_type: params.bookingType,
    })
  }

  const resetSlotTracking = () => {
    slotSelectionTracked.current = false
  }

  return { trackSlotSelection, resetSlotTracking }
}

export function useDateSelectionAnalytics() {
  const trackDateSelection = (params: {
    professionalId: string
    date: string
    bookingType: 'one_off' | 'recurring' | 'batch'
  }) => {
    captureEvent('booking_date_selected', {
      professional_id: params.professionalId,
      selected_date: params.date,
      booking_type: params.bookingType,
    })
  }

  return { trackDateSelection }
}
