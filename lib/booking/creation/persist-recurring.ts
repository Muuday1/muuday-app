import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRecurringBookingWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { isActiveSlotCollision } from '@/lib/booking/request-validation'
import { withTimeout } from '@/lib/booking/with-timeout'
import type { PersistResult } from './types'
import { reportBookingError, logBookingEvent } from './logging'

const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'

export async function persistRecurringBooking(
  supabase: SupabaseClient,
  parentPayload: Record<string, unknown>,
  childBookingsPayload: Record<string, unknown>[],
  sessionsPayload: Record<string, unknown>[],
  paymentData: Record<string, unknown>,
  professionalId: string,
): Promise<PersistResult | { success: false; error: string }> {
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking calling atomic recurring', level: 'info' })

  const atomicChildren = childBookingsPayload.slice(1).map(child => ({
    ...child,
    parent_booking_id: undefined,
  }))

  const atomicSessions = sessionsPayload.map(s => ({
    ...s,
    parent_booking_id: undefined,
  }))

  const atomic = await withTimeout(
    createRecurringBookingWithPaymentAtomic(
      supabase,
      parentPayload as Parameters<typeof createRecurringBookingWithPaymentAtomic>[1],
      atomicChildren as Parameters<typeof createRecurringBookingWithPaymentAtomic>[2],
      atomicSessions as Parameters<typeof createRecurringBookingWithPaymentAtomic>[3],
      paymentData as Parameters<typeof createRecurringBookingWithPaymentAtomic>[4],
    ),
    10000,
    'createRecurringBookingWithPaymentAtomic',
  )

  if (atomic.ok) {
    const bookingId = atomic.parentBookingId!
    logBookingEvent('booking_create_atomic_success', { bookingId, bookingType: 'recurring' })
    return {
      bookingId,
      paymentAnchorBookingId: bookingId,
      createdBookingIds: [
        atomic.parentBookingId!,
        ...(atomic.childBookingIds || []),
      ],
      usedAtomicPath: true,
    }
  }

  if (atomic.fallback) {
    logBookingEvent('booking_create_atomic_fallback', { bookingType: 'recurring', reason: atomic.error?.message })

    const { data: parentBooking, error: parentError } = await supabase
      .from('bookings')
      .insert(parentPayload)
      .select('id')
      .single()

    if (parentError || !parentBooking) {
      if (isActiveSlotCollision(parentError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
        return {
          success: false,
          error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
        }
      }
      reportBookingError(parentError, { professionalId, bookingType: 'recurring' }, 'booking_parent_insert_failed')
      return { success: false, error: 'Erro ao criar pacote recorrente. Tente novamente.' }
    }

    const childrenWithParentId = childBookingsPayload.slice(1).map(child => ({
      ...child,
      parent_booking_id: parentBooking.id,
    }))

    const { error: cleanupError } = await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
    if (cleanupError) {
      console.error('[booking] cleanup child bookings error:', cleanupError.message)
    }

    const { data: childRows, error: childError } = await supabase
      .from('bookings')
      .insert(childrenWithParentId)
      .select('id')

    if (childError) {
      if (isActiveSlotCollision(childError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
        const { error: rollbackError } = await supabase.from('bookings').delete().eq('id', parentBooking.id)
        if (rollbackError) {
          console.error('[booking] rollback parent booking error:', rollbackError.message)
        }
        return {
          success: false,
          error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
        }
      }
      reportBookingError(childError, { parentBookingId: parentBooking.id, bookingType: 'recurring' }, 'booking_children_insert_failed')
      const { error: rollbackError } = await supabase.from('bookings').delete().eq('id', parentBooking.id)
      if (rollbackError) {
        console.error('[booking] rollback parent booking error:', rollbackError.message)
      }
      return { success: false, error: 'Erro ao criar sessões recorrentes. Tente novamente.' }
    }

    const sessionsWithParentId = sessionsPayload.map(s => ({
      ...s,
      parent_booking_id: parentBooking.id,
    }))

    const { error: sessionsError } = await supabase.from('booking_sessions').insert(sessionsWithParentId)
    if (sessionsError) {
      reportBookingError(sessionsError, { parentBookingId: parentBooking.id, bookingType: 'recurring' }, 'booking_sessions_insert_failed')
      const { error: rollbackChildrenError } = await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
      if (rollbackChildrenError) {
        console.error('[booking] rollback child bookings error:', rollbackChildrenError.message)
      }
      const { error: rollbackParentError } = await supabase.from('bookings').delete().eq('id', parentBooking.id)
      if (rollbackParentError) {
        console.error('[booking] rollback parent booking error:', rollbackParentError.message)
      }
      return { success: false, error: 'Erro ao criar estrutura de pacote recorrente.' }
    }

    return {
      bookingId: parentBooking.id,
      paymentAnchorBookingId: parentBooking.id,
      createdBookingIds: [
        parentBooking.id,
        ...((childRows || [])
          .map(row => String((row as Record<string, unknown>).id))
          .filter(Boolean)),
      ],
      usedAtomicPath: false,
    }
  }

  reportBookingError(atomic.error, { professionalId, bookingType: 'recurring' }, 'booking_recurring_atomic_insert_failed')
  return { success: false, error: 'Erro ao criar pacote recorrente. Tente novamente.' }
}
