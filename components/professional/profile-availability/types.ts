import type { ReactNode } from 'react'
import type { ProfessionalService } from '../ProfileServicesList'

export interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface ExistingBooking {
  scheduled_at: string
  duration_minutes: number
}

export interface AvailabilityException {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

export interface ExternalCalendarBusySlot {
  start_utc: string
  end_utc: string
}

export interface ProfileAvailabilityBookingSectionProps {
  availability: AvailabilitySlot[]
  existingBookings: ExistingBooking[]
  availabilityExceptions?: AvailabilityException[]
  externalCalendarBusySlots?: ExternalCalendarBusySlot[]
  isLoggedIn: boolean
  isOwnProfessional: boolean
  firstBookingBlocked: boolean
  errorCode?: string
  bookHref: string
  messageHref: string
  userTimezone: string
  professionalTimezone: string
  minimumNoticeHours: number
  maxBookingWindowDays: number
  enableRecurring: boolean
  basePriceBrl: number
  baseDurationMinutes: number
  viewerCurrency: string
  services?: ProfessionalService[]
  priceRangeLabel?: string
  topSections?: ReactNode
  children?: ReactNode
}
