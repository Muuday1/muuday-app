import type { SupabaseClient } from '@supabase/supabase-js'
import { evaluateRecurringReleaseDeadline } from '@/lib/booking/recurring-deadlines'

type BookingSessionRow = {
  id: string
  parent_booking_id: string
  start_time_utc: string
  status: string
}

type ChildBookingRow = {
  id: string
  metadata: Record<string, unknown> | null
}

const PENDING_SESSION_STATUSES = ['pending_payment', 'pending_confirmation']
const PENDING_CHILD_BOOKING_STATUSES = ['pending', 'pending_confirmation']

export type RecurringSlotReleaseResult = {
  checked: number
  eligible: number
  releasedSessions: number
  releasedBookings: number
  at: string
}

export async function runRecurringReservedSlotRelease(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<RecurringSlotReleaseResult> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()

  const { data: bookingSessions, error: sessionsError } = await admin
    .from('booking_sessions')
    .select('id, parent_booking_id, start_time_utc, status')
    .in('status', PENDING_SESSION_STATUSES)
    .limit(1000)

  if (sessionsError) {
    throw new Error(
      `Failed to load recurring sessions for deadline release: ${sessionsError.message || 'unknown'}`,
    )
  }

  let eligible = 0
  let releasedSessions = 0
  let releasedBookings = 0

  for (const session of (bookingSessions || []) as BookingSessionRow[]) {
    const releaseDecision = evaluateRecurringReleaseDeadline(session.start_time_utc, now)
    if (releaseDecision.allowed) continue

    eligible += 1

    const { data: updatedSession, error: sessionUpdateError } = await admin
      .from('booking_sessions')
      .update({
        status: 'cancelled',
        updated_at: nowIso,
      })
      .eq('id', session.id)
      .in('status', PENDING_SESSION_STATUSES)
      .select('id')
      .maybeSingle()

    if (sessionUpdateError || !updatedSession) {
      continue
    }

    releasedSessions += 1

    const { data: childBookings, error: childBookingsError } = await admin
      .from('bookings')
      .select('id, metadata')
      .eq('parent_booking_id', session.parent_booking_id)
      .eq('booking_type', 'recurring_child')
      .eq('start_time_utc', session.start_time_utc)
      .in('status', PENDING_CHILD_BOOKING_STATUSES)

    if (childBookingsError || !childBookings?.length) {
      continue
    }

    for (const childBooking of childBookings as ChildBookingRow[]) {
      const metadata = childBooking.metadata || {}
      const { data: updatedChild, error: childUpdateError } = await admin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Slot recorrente liberado automaticamente (deadline 7 dias).',
          metadata: {
            ...metadata,
            recurring_slot_released_at: nowIso,
            recurring_slot_release_reason_code: releaseDecision.reason_code,
            recurring_slot_release_deadline_utc: releaseDecision.deadline_at_utc,
          },
        })
        .eq('id', childBooking.id)
        .in('status', PENDING_CHILD_BOOKING_STATUSES)
        .select('id')
        .maybeSingle()

      if (!childUpdateError && updatedChild) {
        releasedBookings += 1
      }
    }
  }

  return {
    checked: (bookingSessions || []).length,
    eligible,
    releasedSessions,
    releasedBookings,
    at: nowIso,
  }
}
