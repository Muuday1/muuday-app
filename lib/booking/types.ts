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

export const BOOKING_TYPES = ['one_off', 'recurring_parent', 'recurring_child'] as const
export type BookingType = (typeof BOOKING_TYPES)[number]

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
}

export type BookingSlotInput = {
  professionalId: string
  userId: string
  startUtcIso: string
  endUtcIso: string
  bookingType?: 'one_off' | 'recurring'
  ttlMinutes?: number
}
