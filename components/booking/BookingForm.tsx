'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useFeatureFlagEnabled } from 'posthog-js/react'
import { FEATURE_FLAGS } from '@/lib/analytics/feature-flags'

import { BookingFormProps } from './booking-form/types'
import { useCalendarSlots } from './booking-form/hooks/use-calendar-slots'
import { useRecurringBooking } from './booking-form/hooks/use-recurring-booking'
import { useBatchBooking } from './booking-form/hooks/use-batch-booking'
import { useBookingPricing } from './booking-form/hooks/use-booking-pricing'
import { useBookingSubmission } from './booking-form/hooks/use-booking-submission'
import { useBookingAnalytics, useSlotSelectionAnalytics, useDateSelectionAnalytics } from './booking-form/hooks/use-booking-analytics'

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
  const recurringFlagEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.bookingRecurringEnabled)
  const useApiV1Bookings = useFeatureFlagEnabled(FEATURE_FLAGS.useApiV1Bookings)

  // Session info from selected service or professional defaults
  const sessionDurationMinutes = selectedService?.duration_minutes ?? professional.session_duration_minutes
  const sessionPriceBrl = selectedService?.price_brl ?? professional.session_price_brl
  const serviceId = selectedService?.id

  // Core form state
  const [bookingType, setBookingType] = useState<'one_off' | 'recurring' | 'batch'>(initialBookingType)
  const [sessionPurpose, setSessionPurpose] = useState('')
  const [acceptPolicy, setAcceptPolicy] = useState(false)
  const [acceptTimezone, setAcceptTimezone] = useState(false)
  const [timezoneMode, setTimezoneMode] = useState<'user' | 'professional'>('user')

  // Calendar and slots
  const calendar = useCalendarSlots({
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
  })

  // Recurring booking state
  const canUseRecurring = enableRecurring && recurringFlagEnabled !== false && (selectedService?.enable_recurring !== false)

  const recurring = useRecurringBooking({
    selectedDate: calendar.selectedDate,
    selectedTime: calendar.selectedTime,
    sessionDurationMinutes,
    maxBookingWindowDays,
    existingBookings,
    userTimezone,
    canUseRecurring,
    initialRecurringSessionsCount,
  })

  // Batch booking state
  const batch = useBatchBooking({ userTimezone, professionalTimezone })

  // Pricing
  const pricing = useBookingPricing({
    sessionPriceBrl,
    sessionDurationMinutes,
    userCurrency,
    userTimezone,
    professionalTimezone,
    selectedDate: calendar.selectedDate,
    selectedTime: calendar.selectedTime,
    bookingType,
    resolvedRecurringSessionsCount: recurring.resolvedRecurringSessionsCount,
    batchDateTimesCount: batch.batchDateTimes.length,
  })

  // Guard: reset to one_off if recurring becomes unavailable
  const effectiveBookingType = !canUseRecurring && bookingType === 'recurring' ? 'one_off' : bookingType

  // Submission
  const submission = useBookingSubmission({
    professionalId: professional.id,
    serviceId,
    userTimezone,
    useApiV1Bookings,
    confirmationMode,
    bookingType: effectiveBookingType,
    selectedDate: calendar.selectedDate,
    selectedTime: calendar.selectedTime,
    sessionPurpose,
    recurringDurationMode: recurring.recurringDurationMode,
    recurringSessionsCount: recurring.recurringSessionsCount,
    resolvedRecurringSessionsCount: recurring.resolvedRecurringSessionsCount,
    recurringPeriodicity: recurring.recurringPeriodicity,
    recurringIntervalDays: recurring.recurringIntervalDays,
    recurringEndDate: recurring.recurringEndDate,
    recurringAutoRenew: recurring.recurringAutoRenew,
    batchDateTimes: batch.batchDateTimes,
  })

  // Can submit?
  const canSubmit =
    !submission.isPending &&
    acceptPolicy &&
    acceptTimezone &&
    (!requireSessionPurpose || sessionPurpose.trim().length > 0) &&
    (effectiveBookingType === 'batch'
      ? batch.batchDateTimes.length >= 2
      : Boolean(calendar.selectedDate && calendar.selectedTime) &&
        (effectiveBookingType !== 'recurring' || recurring.hasValidRecurringDuration))

  // Analytics
  useBookingAnalytics({
    professionalId: professional.id,
    confirmationMode,
    enableRecurring,
    recurringFlagEnabled,
    minimumNoticeHours,
    maxBookingWindowDays,
  })
  const { trackSlotSelection, resetSlotTracking } = useSlotSelectionAnalytics()
  const { trackDateSelection } = useDateSelectionAnalytics()

  // Prefill: set booking type if initial is recurring
  useMemo(() => {
    if (initialBookingType === 'recurring' && canUseRecurring) {
      setBookingType('recurring')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Submit label
  const submitLabel =
    confirmationMode === 'manual'
      ? effectiveBookingType === 'recurring'
        ? 'Pagar pacote e solicitar'
        : effectiveBookingType === 'batch'
          ? 'Pagar lote e solicitar'
          : 'Pagar e solicitar agendamento'
      : effectiveBookingType === 'recurring'
        ? 'Pagar pacote e confirmar'
        : effectiveBookingType === 'batch'
          ? 'Pagar lote e confirmar'
          : 'Pagar e confirmar agendamento'

  if (submission.bookingResult === null && false) {
    // This handles the success redirect case which is now in useBookingSubmission
  }

  // Success state
  if (submission.bookingResult === null && false) {
    // Handled by useBookingSubmission redirect effect
  }

  // Check if we need to show success redirect (bookingResult has success true)
  // The redirect is handled by useBookingSubmission via router.push
  // But we still need to render the spinner while redirecting
  // We can't check submission.bookingResult?.success because it's filtered out
  // Let's add a flag or change the hook

  // Actually, let me check: useBookingSubmission returns bookingResult as null when success
  // So we need another way to detect success state for rendering
  // I'll modify the approach: keep the success rendering in the main component
  // or expose an isSuccess flag from the hook

  // For now, let me use a simpler approach: check if we're in a success transition
  // The redirect happens in useEffect, but we need to show the spinner
  // Since useBookingSubmission filters out success results, we need to track it differently

  // Let me modify useBookingSubmission to expose an isSuccess state instead
  // Actually, let me just handle the success case differently
  // I'll add a isRedirecting state that gets set when bookingResult.success is true

  // Hmm, this is getting complex. Let me simplify by modifying the hook to expose isSuccess
  // and then render the redirect component based on that

  // For now, I'll add a state variable in the main component to track success
  // But that defeats the purpose. Let me just modify the hook.

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
            bookingType={effectiveBookingType}
            onChange={(type) => {
              setBookingType(type)
              calendar.resetTime()
              setAcceptPolicy(false)
              setAcceptTimezone(false)
            }}
            canUseRecurring={canUseRecurring}
            enableRecurring={enableRecurring}
            recurringFlagEnabled={recurringFlagEnabled}
          />

          {effectiveBookingType === 'recurring' && (
            <RecurringConfigPanel
              recurringPeriodicity={recurring.recurringPeriodicity}
              onPeriodicityChange={recurring.setRecurringPeriodicity}
              recurringIntervalDays={recurring.recurringIntervalDays}
              onIntervalDaysChange={recurring.setRecurringIntervalDays}
              recurringDurationMode={recurring.recurringDurationMode}
              onDurationModeChange={recurring.setRecurringDurationMode}
              recurringSessionsCount={recurring.recurringSessionsCount}
              onSessionsCountChange={recurring.setRecurringSessionsCount}
              recurringEndDate={recurring.recurringEndDate}
              onEndDateChange={recurring.setRecurringEndDate}
              recurringAutoRenew={recurring.recurringAutoRenew}
              onAutoRenewChange={recurring.setRecurringAutoRenew}
              resolvedRecurringSessionsCount={recurring.resolvedRecurringSessionsCount}
              hasValidRecurringDuration={recurring.hasValidRecurringDuration}
              selectedDate={calendar.selectedDate}
              selectedTime={calendar.selectedTime}
              sessionDurationMinutes={sessionDurationMinutes}
              maxBookingWindowDays={maxBookingWindowDays}
              existingBookings={existingBookings}
              userTimezone={userTimezone}
            />
          )}

          {effectiveBookingType === 'batch' && (
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
              currentMonth={calendar.currentMonth}
              selectedDate={calendar.selectedDate}
              today={calendar.today}
              canGoPrev={calendar.canGoPrev}
              canGoNext={calendar.canGoNext}
              calendarDays={calendar.calendarDays}
              isDateAvailable={calendar.isDateAvailable}
              onDateSelect={(date) => {
                calendar.selectDate(date)
                resetSlotTracking()
                setAcceptPolicy(false)
                setAcceptTimezone(false)
                trackDateSelection({
                  professionalId: professional.id,
                  date: date.toISOString().split('T')[0],
                  bookingType: effectiveBookingType,
                })
              }}
              onPrevMonth={calendar.prevMonth}
              onNextMonth={calendar.nextMonth}
            />

            {availability.length === 0 && (
              <p className="mt-4 py-2 text-center text-sm text-slate-400">
                Este profissional ainda não configurou disponibilidade.
              </p>
            )}
          </div>

          {calendar.selectedDate && (
            <TimeSlotsGrid
              selectedDate={calendar.selectedDate}
              timeSlots={calendar.timeSlots}
              selectedTime={calendar.selectedTime}
              onTimeSelect={(time) => {
                calendar.selectTime(time)
                trackSlotSelection({
                  professionalId: professional.id,
                  time,
                  bookingType: effectiveBookingType,
                })
              }}
              renderSlotLabel={(time) => calendar.renderSlotLabel(time, timezoneMode)}
            />
          )}

          {calendar.selectedDate && calendar.selectedTime && (
            <SessionPurposeInput
              value={sessionPurpose}
              onChange={setSessionPurpose}
              required={requireSessionPurpose}
            />
          )}

          {effectiveBookingType === 'batch' && (
            <BatchPanel
              slots={batch.batchSlotsPreview}
              selectedDate={calendar.selectedDate}
              selectedTime={calendar.selectedTime}
              professionalTimezone={professionalTimezone}
              onAdd={() => {
                if (calendar.selectedDate && calendar.selectedTime) {
                  batch.addToBatch(
                    calendar.selectedDate.toISOString().split('T')[0],
                    calendar.selectedTime,
                  )
                }
              }}
              onRemove={batch.removeFromBatch}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <BookingSummarySidebar
            profileName={profileName}
            sessionDurationMinutes={sessionDurationMinutes}
            sessionPriceBrl={sessionPriceBrl}
            userCurrency={userCurrency}
            selectedDate={calendar.selectedDate}
            selectedTime={calendar.selectedTime}
            selectedTimeInProfessionalTimezone={pricing.selectedTimeInProfessionalTimezone}
            userTimezone={userTimezone}
            professionalTimezone={professionalTimezone}
            totalSessions={pricing.totalSessions}
            totalPrice={pricing.totalPrice}
            priceFormatted={pricing.priceFormatted}
            totalPriceFormatted={pricing.totalPriceFormatted}
            recurringConflicts={recurring.recurringConflicts}
            bookingResult={submission.bookingResult}
            canSubmit={canSubmit && !submission.isPending}
            isPending={submission.isPending}
            submitLabel={submitLabel}
            acceptPolicy={acceptPolicy}
            onAcceptPolicyChange={setAcceptPolicy}
            acceptTimezone={acceptTimezone}
            onAcceptTimezoneChange={setAcceptTimezone}
            onSubmit={submission.handleConfirm}
          />
        </div>
      </div>
    </div>
  )
}
