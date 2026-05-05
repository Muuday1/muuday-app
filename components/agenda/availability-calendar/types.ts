export type AvailabilityRule = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

export type BookingSlot = {
  id: string
  start_utc: string
  end_utc: string
  status: string
  client_name?: string
  session_link?: string
}

export type CalendarView = 'day' | 'week' | 'month'

export type AvailabilityException = {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

export type LocalBookingInterval = {
  start: number
  end: number
  status: string
  id: string
  client_name?: string
}

export const HOURS_START = 6
export const HOURS_END = 24
export const SLOT_STEP_MINUTES = 30
export const SLOT_ROW_HEIGHT = 24
export const MIN_VISIBLE_WINDOW_MINUTES = 8 * 60

export interface ProfessionalAvailabilityCalendarProps {
  timezone: string
  availabilityRules: AvailabilityRule[]
  bookings: BookingSlot[]
  exceptions?: AvailabilityException[]
  className?: string
  onBookingClick?: (booking: BookingSlot) => void
  onSlotClick?: (date: Date, startMinutes: number) => void
  readOnly?: boolean
}
