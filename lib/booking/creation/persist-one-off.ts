import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBookingWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { isActiveSlotCollision } from '@/lib/booking/request-validation'
import { withTimeout } from '@/lib/booking/with-timeout'
import type { PersistResult } from './types'
import { reportBookingError, logBookingEvent } from './logging'

const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'

export async function persistOneOffBooking(
  supabase: SupabaseClient,
  bookingPayload: Record<string, unknown>,
  paymentData: Record<string, unknown>,
  professionalId: string,
): Promise<PersistResult | { success: false; error: string }> {
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking calling atomic one_off', level: 'info' })

  const atomic = await withTimeout(
    createBookingWithPaymentAtomic(supabase, bookingPayload as Parameters<typeof createBookingWithPaymentAtomic>[1], paymentData as Parameters<typeof createBookingWithPaymentAtomic>[2]),
    8000,
    'createBookingWithPaymentAtomic one_off',
  )

  if (atomic.ok) {
    const bookingId = atomic.bookingId!
    logBookingEvent('booking_create_atomic_success', { bookingId, bookingType: 'one_off' })
    return {
      bookingId,
      paymentAnchorBookingId: bookingId,
      createdBookingIds: [bookingId],
      usedAtomicPath: true,
    }
  }

  if (atomic.fallback) {
    logBookingEvent('booking_create_atomic_fallback', { bookingType: 'one_off', reason: atomic.error?.message })
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingPayload)
      .select('id')
      .single()

    if (error || !booking) {
      if (isActiveSlotCollision(error, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
        return {
          success: false,
          error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
        }
      }
      reportBookingError(error, { professionalId, bookingType: 'one_off' }, 'booking_insert_failed')
      return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
    }

    return {
      bookingId: booking.id,
      paymentAnchorBookingId: booking.id,
      createdBookingIds: [booking.id],
      usedAtomicPath: false,
    }
  }

  if (isActiveSlotCollision(atomic.error, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
    return {
      success: false,
      error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
    }
  }

  reportBookingError(atomic.error, { professionalId, bookingType: 'one_off' }, 'booking_atomic_insert_failed')
  return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
}
