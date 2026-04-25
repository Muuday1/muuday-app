import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBatchBookingsWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { isActiveSlotCollision } from '@/lib/booking/request-validation'
import { withTimeout } from '@/lib/booking/with-timeout'
import type { PersistResult } from './types'
import { reportBookingError, logBookingEvent } from './logging'

const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'

export async function persistBatchBooking(
  supabase: SupabaseClient,
  batchPayload: Record<string, unknown>[],
  paymentData: Record<string, unknown>,
  professionalId: string,
): Promise<PersistResult | { success: false; error: string }> {
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking calling atomic batch', level: 'info' })

  const atomic = await withTimeout(
    createBatchBookingsWithPaymentAtomic(supabase, batchPayload as Parameters<typeof createBatchBookingsWithPaymentAtomic>[1], paymentData as Parameters<typeof createBatchBookingsWithPaymentAtomic>[2]),
    10000,
    'createBatchBookingsWithPaymentAtomic',
  )

  if (atomic.ok) {
    const bookingId = atomic.bookingIds[0]
    logBookingEvent('booking_create_atomic_success', { bookingId, bookingType: 'batch', count: atomic.bookingIds.length })
    return {
      bookingId,
      paymentAnchorBookingId: bookingId,
      createdBookingIds: atomic.bookingIds,
      usedAtomicPath: true,
    }
  }

  if (atomic.fallback) {
    logBookingEvent('booking_create_atomic_fallback', { bookingType: 'batch', reason: atomic.error?.message })
    const { data: batchRows, error: batchInsertError } = await supabase
      .from('bookings')
      .insert(batchPayload)
      .select('id')

    if (batchInsertError || !batchRows || batchRows.length === 0) {
      if (isActiveSlotCollision(batchInsertError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
        return {
          success: false,
          error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
        }
      }
      reportBookingError(batchInsertError, { professionalId, bookingType: 'batch' }, 'booking_batch_insert_failed')
      return { success: false, error: 'Erro ao criar agendamentos em lote. Tente novamente.' }
    }

    return {
      bookingId: String(batchRows[0].id),
      paymentAnchorBookingId: String(batchRows[0].id),
      createdBookingIds: (batchRows || [])
        .map(row => String((row as Record<string, unknown>).id))
        .filter(Boolean),
      usedAtomicPath: false,
    }
  }

  reportBookingError(atomic.error, { professionalId, bookingType: 'batch' }, 'booking_batch_atomic_insert_failed')
  return { success: false, error: 'Erro ao criar agendamentos em lote. Tente novamente.' }
}
