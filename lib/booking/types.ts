export const BOOKING_STATUSES = [
  'draft',
  'pending_payment',
  'pending_confirmation',
  'pending', // legacy compatibility
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
  'rescheduled',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_CONFIRMATION_MODES = ['auto_accept', 'manual'] as const
export type BookingConfirmationMode = (typeof BOOKING_CONFIRMATION_MODES)[number]

export const BOOKING_TYPES = ['one_off', 'recurring_parent', 'recurring_child', 'batch'] as const
export type BookingType = (typeof BOOKING_TYPES)[number]

export type RecurrencePeriodicity = 'weekly' | 'biweekly' | 'monthly' | 'custom_days'

export type ProfessionalBookingSettings = {
  timezone: string
  sessionDurationMinutes: number
  bufferMinutes: number
  minimumNoticeHours: number
  maxBookingWindowDays: number
  enableRecurring: boolean
  confirmationMode: BookingConfirmationMode
  cancellationPolicyCode: string
  requireSessionPurpose: boolean
  cancellationPolicyAccepted?: boolean
  termsAcceptedAt?: string | null
  termsVersion?: string | null
  calendarSyncProvider?: string | null
  notificationEmail?: boolean
  notificationPush?: boolean
  notificationWhatsapp?: boolean
}

export type BookingSlotInput = {
  professionalId: string
  userId: string
  startUtcIso: string
  endUtcIso: string
  bookingType?: 'one_off' | 'recurring' | 'batch'
  ttlMinutes?: number
  recurrencePeriodicity?: RecurrencePeriodicity
  recurrenceIntervalDays?: number | null
  recurrenceEndDate?: string | null
  recurrenceOccurrenceIndex?: number | null
  recurrenceAutoRenew?: boolean
  batchBookingGroupId?: string | null
}

export type RecurrenceRequest = {
  enabled: boolean
  periodicity: RecurrencePeriodicity
  intervalDays?: number
  occurrences?: number
  endDate?: string
  autoRenew?: boolean
}

export type BatchBookingRequest = {
  enabled: boolean
  dates: string[]
}

export type ManageBookingResult =
  | { success: true }
  | {
      success: false
      error: string
      reasonCode?: string
      deadlineAtUtc?: string | null
    }
