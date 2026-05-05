'use client'

import { useAvailabilityCalendar } from './availability-calendar/use-availability-calendar'
import { CalendarHeader } from './availability-calendar/CalendarHeader'
import { CalendarLegend } from './availability-calendar/CalendarLegend'
import { MonthView } from './availability-calendar/MonthView'
import { DayWeekView } from './availability-calendar/DayWeekView'
import { BookingPopover } from './availability-calendar/BookingPopover'
import type { ProfessionalAvailabilityCalendarProps } from './availability-calendar/types'

export { type ProfessionalAvailabilityCalendarProps }

export function ProfessionalAvailabilityCalendar({
  timezone,
  availabilityRules,
  bookings,
  exceptions = [],
  className = '',
  onBookingClick,
  onSlotClick,
  readOnly = false,
}: ProfessionalAvailabilityCalendarProps) {
  const {
    view,
    setView,
    cursorDate,
    setCursorDate,
    selectedBooking,
    setSelectedBooking,
    activeRules,
    bookingsByDate,
    exceptionsByDate,
    visibleRange,
    weekDays,
    monthDays,
    visibleDayColumns,
    dayList,
    timeSlots,
    periodLabel,
    goPrev,
    goNext,
    goToday,
  } = useAvailabilityCalendar(timezone, availabilityRules, bookings, exceptions)

  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <CalendarHeader
        timezone={timezone}
        periodLabel={periodLabel}
        view={view}
        onViewChange={setView}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      <CalendarLegend />

      {view === 'month' ? (
        <MonthView
          days={dayList}
          timezone={timezone}
          activeRules={activeRules}
          bookingsByDate={bookingsByDate}
          exceptionsByDate={exceptionsByDate}
          onDayClick={day => {
            setCursorDate(day)
            setView('day')
          }}
        />
      ) : (
        <DayWeekView
          days={visibleDayColumns}
          timezone={timezone}
          visibleRange={visibleRange}
          timeSlots={timeSlots}
          activeRules={activeRules}
          bookings={bookings}
          bookingsByDate={bookingsByDate}
          exceptionsByDate={exceptionsByDate}
          onSlotClick={onSlotClick}
          onBookingClick={onBookingClick}
          onBookingSelect={setSelectedBooking}
          readOnly={readOnly}
        />
      )}

      <BookingPopover
        booking={selectedBooking}
        timezone={timezone}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  )
}
