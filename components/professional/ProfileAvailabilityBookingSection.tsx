'use client'

import { useMemo, useState } from 'react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { Calendar } from 'lucide-react'
import { ProfileServicesList } from './ProfileServicesList'
import { useAvailabilitySlots } from './profile-availability/hooks/use-availability-slots'
import { BookingControls } from './profile-availability/components/BookingControls'
import { CalendarGrid } from './profile-availability/components/CalendarGrid'
import { TimeSlotPicker } from './profile-availability/components/TimeSlotPicker'
import { BookingSummaryCard } from './profile-availability/components/BookingSummaryCard'
import { toLocalDateStr, DEFAULT_DURATION_OPTIONS } from './profile-availability/helpers'
import type { ProfileAvailabilityBookingSectionProps } from './profile-availability/types'

export function ProfileAvailabilityBookingSection({
  availability,
  existingBookings,
  availabilityExceptions = [],
  externalCalendarBusySlots = [],
  isLoggedIn,
  isOwnProfessional,
  firstBookingBlocked,
  errorCode,
  bookHref,
  messageHref,
  userTimezone,
  professionalTimezone,
  minimumNoticeHours,
  maxBookingWindowDays,
  enableRecurring,
  basePriceBrl,
  baseDurationMinutes,
  viewerCurrency,
  services,
  priceRangeLabel,
  topSections,
  children,
}: ProfileAvailabilityBookingSectionProps) {
  const hasServices = (services?.length || 0) > 0
  const hasSingleService = (services?.length || 0) === 1

  const durationOptions = useMemo(() => {
    const unique = new Set(DEFAULT_DURATION_OPTIONS)
    if (baseDurationMinutes > 0) unique.add(baseDurationMinutes)
    return Array.from(unique).sort((a, b) => a - b)
  }, [baseDurationMinutes])

  const [selectedDuration, setSelectedDuration] = useState(
    durationOptions.includes(60) ? 60 : Math.max(1, baseDurationMinutes),
  )
  const [timezoneMode, setTimezoneMode] = useState<'user' | 'professional'>('user')
  const [bookingType, setBookingType] = useState<'one_off' | 'recurring'>('one_off')
  const [recurringSessionsCount, setRecurringSessionsCount] = useState(4)

  const slots = useAvailabilitySlots({
    availability,
    availabilityExceptions,
    existingBookings,
    externalCalendarBusySlots,
    userTimezone,
    professionalTimezone,
    maxBookingWindowDays,
    minimumNoticeHours,
    selectedDuration,
  })

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration)
    slots.resetTime()
  }

  const perMinute = basePriceBrl / Math.max(1, baseDurationMinutes)
  const selectedPriceBrl = Math.ceil(perMinute * selectedDuration)

  const selectedTimeInProfessionalTimezone = useMemo(() => {
    if (!slots.selectedDate || !slots.selectedTime) return null
    const selectedDateStr = toLocalDateStr(slots.selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${slots.selectedTime}:00`, userTimezone)
    const professionalDate = formatInTimeZone(selectedUtc, professionalTimezone, 'yyyy-MM-dd')
    const professionalTime = formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
    return `${professionalDate} ${professionalTime}`
  }, [professionalTimezone, slots.selectedDate, slots.selectedTime, userTimezone])

  const bookHrefWithSelection = useMemo(() => {
    const params = new URLSearchParams()
    if (slots.selectedDate) params.set('data', toLocalDateStr(slots.selectedDate))
    if (slots.selectedTime) params.set('hora', slots.selectedTime)
    params.set('duracao', String(selectedDuration))
    params.set('tipo', bookingType)
    if (bookingType === 'recurring') params.set('sessoes', String(recurringSessionsCount))
    const query = params.toString()
    return query ? `${bookHref}?${query}` : bookHref
  }, [bookHref, bookingType, recurringSessionsCount, slots.selectedDate, selectedDuration, slots.selectedTime])

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {topSections}

        {hasServices ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
              <Calendar className="h-5 w-5 text-[#9FE870]" />
              Serviços oferecidos
            </h2>
            <ProfileServicesList
              services={services || []}
              professionalId=""
              viewerCurrency={viewerCurrency}
              bookHrefBase={bookHref.split('?')[0]}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <BookingControls
              selectedDuration={selectedDuration}
              durationOptions={durationOptions}
              timezoneMode={timezoneMode}
              bookingType={bookingType}
              recurringSessionsCount={recurringSessionsCount}
              enableRecurring={enableRecurring}
              onDurationChange={handleDurationChange}
              onTimezoneModeChange={setTimezoneMode}
              onBookingTypeChange={setBookingType}
              onRecurringSessionsChange={setRecurringSessionsCount}
            />

            <CalendarGrid
              currentMonth={slots.currentMonth}
              selectedDate={slots.selectedDate}
              today={slots.today}
              canGoPrev={slots.canGoPrev}
              canGoNext={slots.canGoNext}
              calendarDays={slots.calendarDays}
              isDateAvailable={slots.isDateAvailable}
              onDateSelect={slots.selectDate}
              onPrevMonth={slots.prevMonth}
              onNextMonth={slots.nextMonth}
            />

            {slots.selectedDate ? (
              <TimeSlotPicker
                selectedDate={slots.selectedDate}
                timeSlots={slots.timeSlots}
                selectedTime={slots.selectedTime}
                onTimeSelect={slots.selectTime}
              />
            ) : null}
          </div>
        )}

        {children}
      </div>

      <div className="min-w-0">
        <BookingSummaryCard
          hasServices={hasServices}
          hasSingleService={hasSingleService}
          priceRangeLabel={priceRangeLabel}
          selectedPriceBrl={selectedPriceBrl}
          selectedDuration={selectedDuration}
          bookingType={bookingType}
          recurringSessionsCount={recurringSessionsCount}
          viewerCurrency={viewerCurrency}
          selectedDate={slots.selectedDate}
          selectedTime={slots.selectedTime}
          selectedTimeInProfessionalTimezone={selectedTimeInProfessionalTimezone}
          userTimezone={userTimezone}
          professionalTimezone={professionalTimezone}
          isOwnProfessional={isOwnProfessional}
          firstBookingBlocked={firstBookingBlocked}
          isLoggedIn={isLoggedIn}
          bookHref={bookHref}
          bookHrefWithSelection={bookHrefWithSelection}
          messageHref={messageHref}
          errorCode={errorCode}
        />
      </div>
    </div>
  )
}
