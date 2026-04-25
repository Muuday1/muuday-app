import type { BookingSettings, SessionSlot } from '@/lib/booking/payload-builders'

export type { BookingSettings, SessionSlot }

export type BookingCreateResult =
  | { success: true; bookingId: string; createdBookingIds: string[]; usedAtomicPath: boolean; professionalEmail: string | null; professionalName: string | null }
  | { success: false; error: string; reasonCode?: string }

export type PersistResult = {
  bookingId: string
  paymentAnchorBookingId: string
  createdBookingIds: string[]
  usedAtomicPath: boolean
}

export type BookingContext = {
  profile: { currency: string | null; timezone: string | null } | null
  professional: ProfessionalRow
  settings: BookingSettings
  eligibility: { ok: boolean; message?: string; reasonCode?: string }
}

// Minimal shape extracted from the professionals query in create-booking.ts
export type ProfessionalRow = {
  id: string
  user_id: string
  tier: string | null
  session_price_brl: number | string | null
  session_duration_minutes: number | null
  status: string
  first_booking_enabled: boolean | null
  profiles:
    | { timezone?: string | null; email?: string | null; full_name?: string | null }
    | { timezone?: string | null; email?: string | null; full_name?: string | null }[]
    | null
}
