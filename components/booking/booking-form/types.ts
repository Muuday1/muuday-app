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

export interface SelectedService {
  id: string
  name: string
  description?: string | null
  duration_minutes: number
  price_brl: number
  enable_recurring?: boolean
  enable_batch?: boolean
}

export interface BookingFormProps {
  professional: {
    id: string
    session_price_brl: number
    session_duration_minutes: number
    category: string
  }
  profileName: string
  profileHref: string
  availability: AvailabilitySlot[]
  existingBookings: ExistingBooking[]
  availabilityExceptions?: AvailabilityException[]
  userTimezone: string
  userCurrency: string
  professionalTimezone: string
  minimumNoticeHours: number
  maxBookingWindowDays: number
  confirmationMode: 'auto_accept' | 'manual'
  requireSessionPurpose: boolean
  enableRecurring: boolean
  initialBookingType?: 'one_off' | 'recurring' | 'batch'
  initialRecurringSessionsCount?: number
  initialDate?: string
  initialTime?: string
  selectedService?: SelectedService
}
