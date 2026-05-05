import { z } from 'zod'
import { localDateTimeSchema } from '@/lib/booking/request-validation'
import type { BookingSettings, SessionSlot } from '@/lib/booking/payload-builders'

export type { BookingSettings, SessionSlot }

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')

export const createBookingInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inválido.'),
  serviceId: z.string().uuid('Identificador de serviço inválido.').optional(),
  scheduledAt: localDateTimeSchema.optional(),
  notes: z.string().trim().max(500, 'Observações muito longas.').optional(),
  sessionPurpose: z.string().trim().max(1200, 'Objetivo da sessão muito longo.').optional(),
  bookingType: z.enum(['one_off', 'recurring', 'batch']).default('one_off').optional(),
  recurringPeriodicity: z.enum(['weekly', 'biweekly', 'monthly', 'custom_days']).optional(),
  recurringIntervalDays: z.number().int().min(1).max(365).optional(),
  recurringOccurrences: z.number().int().min(2).max(52).optional(),
  recurringSessionsCount: z.number().int().min(2).max(52).optional(),
  recurringEndDate: localDateSchema.optional(),
  recurringAutoRenew: z.boolean().optional(),
  batchDates: z.array(localDateTimeSchema).min(2).max(20).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>

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
  profile: { currency: string | null; timezone: string | null; full_name: string | null; language: string | null } | null
  professional: ProfessionalRow
  settings: BookingSettings
  eligibility: { ok: boolean; message?: string; reasonCode?: string }
  service?: { id: string; price_brl: number; duration_minutes: number; name: string; enable_recurring?: boolean; enable_batch?: boolean } | null
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
