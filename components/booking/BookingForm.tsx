'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useFeatureFlagEnabled } from 'posthog-js/react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { createBooking } from '@/lib/actions/booking'
import { formatCurrency } from '@/lib/utils'
import { captureEvent } from '@/lib/analytics/posthog-client'
import { FEATURE_FLAGS } from '@/lib/analytics/feature-flags'
import {
  isSlotBlockedByException,
  hasUtcBookingConflict,
} from '@/lib/booking/slot-filtering'
import {
  generateRecurrenceSlots,
  detectRecurrenceConflicts,
} from '@/lib/booking/recurrence-engine'

import { BookingFormProps } from './booking-form/types'
import { BookingSuccessRedirect } from './booking-form/components/BookingSuccessRedirect'
import { SelectedServiceCard } from './booking-form/components/SelectedServiceCard'
import { BookingTypeSelector } from './booking-form/components/BookingTypeSelector'
import { RecurringConfigPanel } from './booking-form/components/RecurringConfigPanel'
import { TimezoneToggle } from './booking-form/components/TimezoneToggle'
import { CalendarGrid } from './booking-form/components/CalendarGrid'
import { TimeSlotsGrid } from './booking-form/components/TimeSlotsGrid'
import { SessionPurposeInput } from './booking-form/components/SessionPurposeInput'
import { BatchPanel } from './booking-form/components/BatchPanel'
import { BookingSummarySidebar } from './booking-form/components/BookingSummarySidebar'

import {
  toLocalDateStr,
  fromIsoDateToLocalDate,
  addDaysToIsoDate,
  generateTimeSlots,
  buildScheduledAt,
  deriveRecurringOccurrencesFromEndDate,
} from './booking-form-helpers'

export type { BookingFormProps }

export default function BookingForm({
  professional,
  profileName,
  profileHref,
  availability,
  existingBookings,
  availabilityExceptions = [],
  userTimezone,
  userCurrency,
  professionalTimezone,
  minimumNoticeHours,
  maxBookingWindowDays,
  confirmationMode,
  requireSessionPurpose,
  enableRecurring,
  initialBookingType = 'one_off',
  initialRecurringSessionsCount = 4,
  initialDate,
  initialTime,
  selectedService,
}: BookingFormProps) {
  const bookingViewTracked = useRef(false)
  const slotSelectionTracked = useRef(false)
  const prefillApplied = useRef(false)
  const recurringFlagEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.bookingRecurringEnabled)
  const useApiV1Bookings = useFeatureFlagEnabled(FEATURE_FLAGS.useApiV1Bookings)

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
  const [sessionPurpose, setSessionPurpose] = useState('')
  const [acceptPolicy, setAcceptPolicy] = useState(false)
  const [acceptTimezone, setAcceptTimezone] = useState(false)
  const [timezoneMode, setTimezoneMode] = useState<'user' | 'professional'>('user')
  const [bookingType, setBookingType] = useState<'one_off' | 'recurring' | 'batch'>(initialBookingType)
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
  const [batchDateTimes, setBatchDateTimes] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [bookingResult, setBookingResult] = useState<
    { success: true; bookingId: string } | { success: false; error: string } | null
  >(null)
  const router = useRouter()

  // Redirect to payment page on successful booking creation
  useEffect(() => {
    if (bookingResult?.success) {
      router.push(`/pagamento/${bookingResult.bookingId}`)
    }
  }, [bookingResult, router])

  // Derive session duration and price from selected service (or legacy professional defaults)
  const sessionDurationMinutes = selectedService?.duration_minutes ?? professional.session_duration_minutes
  const sessionPriceBrl = selectedService?.price_brl ?? professional.session_price_brl
  const serviceId = selectedService?.id

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

  const isDateAvailable = (date: Date) => {
    if (date < today || date > maxDate) return false
    return slotsByUserDate.has(toLocalDateStr(date))
  }

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

  const resolvedRecurringSessionsCount = useMemo(() => {
    if (bookingType !== 'recurring') return 1
    if (recurringDurationMode === 'occurrences') return recurringSessionsCount
    if (!selectedDate) return 0
    return deriveRecurringOccurrencesFromEndDate({
      startDate: selectedDate,
      endDate: recurringEndDate,
      periodicity: recurringPeriodicity,
      intervalDays: recurringIntervalDays,
      maxBookingWindowDays,
    })
  }, [
    bookingType,
    maxBookingWindowDays,
    recurringDurationMode,
    recurringEndDate,
    recurringIntervalDays,
    recurringPeriodicity,
    recurringSessionsCount,
    selectedDate,
  ])

  const totalSessions =
    bookingType === 'recurring'
      ? Math.max(1, resolvedRecurringSessionsCount)
      : bookingType === 'batch'
        ? batchDateTimes.length
        : 1
  const totalPrice = sessionPriceBrl * totalSessions
  const priceFormatted = formatCurrency(sessionPriceBrl, userCurrency)
  const totalPriceFormatted = formatCurrency(totalPrice, userCurrency)
  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  const canGoNext = currentMonth < maxMonth

  const selectedTimeInProfessionalTimezone = useMemo(() => {
    if (!selectedDate || !selectedTime) return null
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const professionalDate = formatInTimeZone(selectedUtc, professionalTimezone, 'yyyy-MM-dd')
    const professionalTime = formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
    return `${professionalDate} ${professionalTime}`
  }, [professionalTimezone, selectedDate, selectedTime, userTimezone])

  const hasValidRecurringDuration =
    bookingType !== 'recurring'
      ? true
      : recurringDurationMode === 'occurrences'
        ? recurringSessionsCount >= 2
        : resolvedRecurringSessionsCount >= 2

  const canSubmit =
    !isPending &&
    acceptPolicy &&
    acceptTimezone &&
    (!requireSessionPurpose || sessionPurpose.trim().length > 0) &&
    (bookingType === 'batch'
      ? batchDateTimes.length >= 2
      : Boolean(selectedDate && selectedTime) && hasValidRecurringDuration)

  const canUseRecurring = enableRecurring && recurringFlagEnabled !== false && (selectedService?.enable_recurring !== false)

  const recurringConflicts = useMemo(() => {
    if (bookingType !== 'recurring' || !selectedDate || !selectedTime || !hasValidRecurringDuration) return []

    const selectedDateStr = toLocalDateStr(selectedDate)
    const startUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const endUtc = new Date(startUtc.getTime() + sessionDurationMinutes * 60 * 1000)

    const { slots } = generateRecurrenceSlots({
      startDateUtc: startUtc,
      endDateUtc: endUtc,
      periodicity: recurringPeriodicity,
      intervalDays: recurringIntervalDays,
      occurrences: resolvedRecurringSessionsCount,
      bookingWindowDays: maxBookingWindowDays,
    })

    const existing = existingBookings.map(b => {
      const s = new Date(b.scheduled_at)
      return { startUtc: s, endUtc: new Date(s.getTime() + b.duration_minutes * 60 * 1000) }
    })

    return detectRecurrenceConflicts(slots, existing, [])
  }, [bookingType, selectedDate, selectedTime, hasValidRecurringDuration, userTimezone, sessionDurationMinutes, recurringPeriodicity, recurringIntervalDays, resolvedRecurringSessionsCount, maxBookingWindowDays, existingBookings])

  const submitLabel =
    confirmationMode === 'manual'
      ? bookingType === 'recurring'
        ? 'Pagar pacote e solicitar'
        : bookingType === 'batch'
          ? 'Pagar lote e solicitar'
          : 'Pagar e solicitar agendamento'
      : bookingType === 'recurring'
        ? 'Pagar pacote e confirmar'
        : bookingType === 'batch'
          ? 'Pagar lote e confirmar'
          : 'Pagar e confirmar agendamento'

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

  useEffect(() => {
    if (bookingViewTracked.current) return
    bookingViewTracked.current = true

    captureEvent('booking_form_viewed', {
      professional_id: professional.id,
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
    professional.id,
    recurringFlagEnabled,
  ])

  useEffect(() => {
    if (!canUseRecurring && bookingType === 'recurring') {
      setBookingType('one_off')
    }
  }, [bookingType, canUseRecurring])

  useEffect(() => {
    if (prefillApplied.current) return
    prefillApplied.current = true

    if (initialBookingType === 'recurring' && canUseRecurring) {
      setBookingType('recurring')
      if ([4, 8, 12].includes(initialRecurringSessionsCount)) {
        setRecurringSessionsCount(initialRecurringSessionsCount)
      }
    }

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
  }, [
    canUseRecurring,
    initialBookingType,
    initialDate,
    initialRecurringSessionsCount,
    initialTime,
    maxDate,
    slotsByUserDate,
    today,
  ])

  function prevMonth() {
    if (!canGoPrev) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    if (!canGoNext) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  function handleDateSelect(date: Date) {
    if (!isDateAvailable(date)) return
    setSelectedDate(date)
    setSelectedTime(null)
    setAcceptPolicy(false)
    setAcceptTimezone(false)
    slotSelectionTracked.current = false
    captureEvent('booking_date_selected', {
      professional_id: professional.id,
      selected_date: toLocalDateStr(date),
      booking_type: bookingType,
    })
  }

  function renderSlotLabel(time: string) {
    if (!selectedDate || timezoneMode === 'user') return time
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${time}:00`, userTimezone)
    return formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
  }

  function addCurrentSelectionToBatch() {
    if (!selectedDate || !selectedTime) return
    const value = buildScheduledAt(toLocalDateStr(selectedDate), selectedTime)
    setBatchDateTimes(prev => {
      if (prev.includes(value)) return prev
      return [...prev, value].sort()
    })
  }

  function removeBatchDate(dateTime: string) {
    setBatchDateTimes(prev => prev.filter(item => item !== dateTime))
  }

  const bookingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearBookingTimeout() {
    if (bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current)
      bookingTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => clearBookingTimeout()
  }, [])

  function handleConfirm() {
    if (!canSubmit) return
    if (bookingType !== 'batch' && (!selectedDate || !selectedTime)) return

    captureEvent('booking_submit_clicked', {
      professional_id: professional.id,
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
        if (useApiV1Bookings) {
          const res = await fetch('/api/v1/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              professionalId: professional.id,
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
              serviceId,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            result = { success: false, error: data.error || 'Erro ao criar agendamento.' }
          } else {
            result = { success: true, bookingId: data.bookingId }
          }
        } else {
          result = await createBooking({
            professionalId: professional.id,
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
          })
        }
        clearBookingTimeout()
        setBookingResult(result)
        if (result.success) {
          captureEvent('booking_created', {
            professional_id: professional.id,
            booking_type: bookingType,
            confirmation_mode: confirmationMode,
            recurring_sessions_count:
              bookingType === 'recurring' ? resolvedRecurringSessionsCount : undefined,
            batch_sessions_count: bookingType === 'batch' ? batchDateTimes.length : undefined,
          })
        } else {
          captureEvent('booking_create_failed', {
            professional_id: professional.id,
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
          professional_id: professional.id,
          booking_type: bookingType,
          reason: error instanceof Error ? error.message : 'unknown_exception',
        })
      }
    })
  }

  if (bookingResult?.success) {
    return <BookingSuccessRedirect />
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <Link
        href={profileHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {selectedService && (
            <SelectedServiceCard
              service={selectedService}
              profileHref={profileHref}
              userCurrency={userCurrency}
            />
          )}

          <BookingTypeSelector
            bookingType={bookingType}
            onChange={setBookingType}
            canUseRecurring={canUseRecurring}
            enableRecurring={enableRecurring}
            recurringFlagEnabled={recurringFlagEnabled}
          />

          {bookingType === 'recurring' && (
            <RecurringConfigPanel
              recurringPeriodicity={recurringPeriodicity}
              onPeriodicityChange={setRecurringPeriodicity}
              recurringIntervalDays={recurringIntervalDays}
              onIntervalDaysChange={setRecurringIntervalDays}
              recurringDurationMode={recurringDurationMode}
              onDurationModeChange={setRecurringDurationMode}
              recurringSessionsCount={recurringSessionsCount}
              onSessionsCountChange={setRecurringSessionsCount}
              recurringEndDate={recurringEndDate}
              onEndDateChange={setRecurringEndDate}
              recurringAutoRenew={recurringAutoRenew}
              onAutoRenewChange={setRecurringAutoRenew}
              resolvedRecurringSessionsCount={resolvedRecurringSessionsCount}
              hasValidRecurringDuration={hasValidRecurringDuration}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              sessionDurationMinutes={sessionDurationMinutes}
              maxBookingWindowDays={maxBookingWindowDays}
              existingBookings={existingBookings}
              userTimezone={userTimezone}
            />
          )}

          {bookingType === 'batch' && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
              Selecione data e horário e clique em <strong>Adicionar ao lote</strong>. Para concluir, escolha ao menos 2 sessões.
            </div>
          )}

          <div className="rounded-lg border border-slate-200/80 bg-white p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 font-display">
                Escolha a data
              </h2>
              <TimezoneToggle
                mode={timezoneMode}
                onChange={setTimezoneMode}
                userTimezone={userTimezone}
                professionalTimezone={professionalTimezone}
              />
            </div>

            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              today={today}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              calendarDays={calendarDays}
              isDateAvailable={isDateAvailable}
              onDateSelect={handleDateSelect}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />

            {availability.length === 0 && (
              <p className="mt-4 py-2 text-center text-sm text-slate-400">
                Este profissional ainda não configurou disponibilidade.
              </p>
            )}
          </div>

          {selectedDate && (
            <TimeSlotsGrid
              selectedDate={selectedDate}
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              onTimeSelect={(time) => {
                setSelectedTime(time)
                if (!slotSelectionTracked.current) {
                  slotSelectionTracked.current = true
                  captureEvent('booking_time_selected', {
                    professional_id: professional.id,
                    selected_time: time,
                    booking_type: bookingType,
                  })
                }
              }}
              renderSlotLabel={renderSlotLabel}
            />
          )}

          {selectedDate && selectedTime && (
            <SessionPurposeInput
              value={sessionPurpose}
              onChange={setSessionPurpose}
              required={requireSessionPurpose}
            />
          )}

          {bookingType === 'batch' && (
            <BatchPanel
              slots={batchSlotsPreview}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              professionalTimezone={professionalTimezone}
              onAdd={addCurrentSelectionToBatch}
              onRemove={removeBatchDate}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <BookingSummarySidebar
            profileName={profileName}
            sessionDurationMinutes={sessionDurationMinutes}
            sessionPriceBrl={sessionPriceBrl}
            userCurrency={userCurrency}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedTimeInProfessionalTimezone={selectedTimeInProfessionalTimezone}
            userTimezone={userTimezone}
            professionalTimezone={professionalTimezone}
            totalSessions={totalSessions}
            totalPrice={totalPrice}
            priceFormatted={priceFormatted}
            totalPriceFormatted={totalPriceFormatted}
            recurringConflicts={recurringConflicts}
            bookingResult={bookingResult && !bookingResult.success ? bookingResult : null}
            canSubmit={canSubmit}
            isPending={isPending}
            submitLabel={submitLabel}
            acceptPolicy={acceptPolicy}
            onAcceptPolicyChange={setAcceptPolicy}
            acceptTimezone={acceptTimezone}
            onAcceptTimezoneChange={setAcceptTimezone}
            onSubmit={handleConfirm}
          />
        </div>
      </div>
    </div>
  )
}
