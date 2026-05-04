'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBooking } from '@/lib/actions/booking'
import { captureEvent } from '@/lib/analytics/posthog-client'
import { buildScheduledAt, toLocalDateStr } from '../../booking-form-helpers'

interface BookingPayload {
  professionalId: string
  serviceId?: string
  scheduledAt?: string
  notes?: string
  sessionPurpose?: string
  bookingType: 'one_off' | 'recurring' | 'batch'
  recurringSessionsCount?: number
  recurringOccurrences?: number
  recurringPeriodicity?: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  recurringIntervalDays?: number
  recurringEndDate?: string
  recurringAutoRenew?: boolean
  batchDates?: string[]
}

interface UseBookingSubmissionOptions {
  professionalId: string
  serviceId: string | undefined
  userTimezone: string
  useApiV1Bookings: boolean | undefined
  confirmationMode: 'auto_accept' | 'manual'
  bookingType: 'one_off' | 'recurring' | 'batch'
  selectedDate: Date | null
  selectedTime: string | null
  sessionPurpose: string
  recurringDurationMode: 'occurrences' | 'end_date'
  recurringSessionsCount: number
  resolvedRecurringSessionsCount: number
  recurringPeriodicity: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  recurringIntervalDays: number
  recurringEndDate: string
  recurringAutoRenew: boolean
  batchDateTimes: string[]
}

interface UseBookingSubmissionReturn {
  isPending: boolean
  isSuccess: boolean
  bookingResult: { success: false; error: string } | null
  handleConfirm: () => void
}

export function useBookingSubmission(options: UseBookingSubmissionOptions): UseBookingSubmissionReturn {
  const {
    professionalId,
    serviceId,
    userTimezone,
    useApiV1Bookings,
    confirmationMode,
    bookingType,
    selectedDate,
    selectedTime,
    sessionPurpose,
    recurringDurationMode,
    recurringSessionsCount,
    resolvedRecurringSessionsCount,
    recurringPeriodicity,
    recurringIntervalDays,
    recurringEndDate,
    recurringAutoRenew,
    batchDateTimes,
  } = options

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [bookingResult, setBookingResult] = useState<
    { success: true; bookingId: string } | { success: false; error: string } | null
  >(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const bookingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Redirect on success
  useEffect(() => {
    if (bookingResult?.success) {
      setIsSuccess(true)
      router.push(`/pagamento/${bookingResult.bookingId}`)
    }
  }, [bookingResult, router])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current)
      }
    }
  }, [])

  function clearBookingTimeout() {
    if (bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current)
      bookingTimeoutRef.current = null
    }
  }

  function handleConfirm() {
    if (bookingType !== 'batch' && (!selectedDate || !selectedTime)) return

    captureEvent('booking_submit_clicked', {
      professional_id: professionalId,
      booking_type: bookingType,
      confirmation_mode: confirmationMode,
      recurring_sessions_count: bookingType === 'recurring' ? resolvedRecurringSessionsCount : 1,
      batch_sessions_count: bookingType === 'batch' ? batchDateTimes.length : undefined,
    })

    clearBookingTimeout()
    bookingTimeoutRef.current = setTimeout(() => {
      setBookingResult({
        success: false,
        error: 'A solicitação demorou muito. Verifique sua conexão e tente novamente.',
      })
    }, 15000)

    startTransition(async () => {
      try {
        const scheduledAt =
          selectedDate && selectedTime
            ? buildScheduledAt(toLocalDateStr(selectedDate), selectedTime)
            : undefined

        let result: { success: true; bookingId: string } | { success: false; error: string }

        const payload: BookingPayload = {
          professionalId,
          serviceId,
          scheduledAt,
          notes: sessionPurpose.trim() || undefined,
          sessionPurpose: sessionPurpose.trim() || undefined,
          bookingType,
          recurringSessionsCount:
            bookingType === 'recurring' && recurringDurationMode === 'occurrences'
              ? recurringSessionsCount
              : undefined,
          recurringOccurrences:
            bookingType === 'recurring' && recurringDurationMode === 'end_date'
              ? Math.max(2, resolvedRecurringSessionsCount)
              : undefined,
          recurringPeriodicity: bookingType === 'recurring' ? recurringPeriodicity : undefined,
          recurringIntervalDays:
            bookingType === 'recurring' && recurringPeriodicity === 'custom_days'
              ? recurringIntervalDays
              : undefined,
          recurringEndDate:
            bookingType === 'recurring' && recurringDurationMode === 'end_date'
              ? recurringEndDate
              : undefined,
          recurringAutoRenew: bookingType === 'recurring' ? recurringAutoRenew : undefined,
          batchDates: bookingType === 'batch' ? batchDateTimes : undefined,
        }

        if (useApiV1Bookings) {
          const res = await fetch('/api/v1/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const data = await res.json()
          if (!res.ok) {
            result = { success: false, error: data.error || 'Erro ao criar agendamento.' }
          } else {
            result = { success: true, bookingId: data.bookingId }
          }
        } else {
          result = await createBooking(payload)
        }

        clearBookingTimeout()
        setBookingResult(result)

        if (result.success) {
          captureEvent('booking_created', {
            professional_id: professionalId,
            booking_type: bookingType,
            confirmation_mode: confirmationMode,
            recurring_sessions_count:
              bookingType === 'recurring' ? resolvedRecurringSessionsCount : undefined,
            batch_sessions_count: bookingType === 'batch' ? batchDateTimes.length : undefined,
          })
        } else {
          captureEvent('booking_create_failed', {
            professional_id: professionalId,
            booking_type: bookingType,
            reason: result.error,
          })
        }
      } catch (error) {
        clearBookingTimeout()
        setBookingResult({
          success: false,
          error: 'Erro inesperado ao processar agendamento. Tente novamente.',
        })
        captureEvent('booking_create_failed', {
          professional_id: professionalId,
          booking_type: bookingType,
          reason: error instanceof Error ? error.message : 'unknown_exception',
        })
      }
    })
  }

  return {
    isPending,
    isSuccess,
    bookingResult: bookingResult && !bookingResult.success ? bookingResult : null,
    handleConfirm,
  }
}
