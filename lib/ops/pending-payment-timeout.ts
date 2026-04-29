import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push/sender'
import { patchBookingMetadata } from '@/lib/booking/metadata'

export type PendingPaymentTimeoutResult = {
  checked: number
  cancelled: number
  at: string
}

const ORPHANED_TIMEOUT_MINUTES = 30
const UNPAID_TIMEOUT_HOURS = 24

/**
 * Cancel bookings stuck in `pending_payment` after a timeout.
 *
 * Two scenarios:
 * 1. Orphaned bookings: no payment record exists (crash during payment insert).
 *    Timeout: 30 minutes.
 * 2. Unpaid bookings: payment exists but status is still `requires_payment`.
 *    Timeout: 24 hours (gives user time to complete payment).
 */
export async function runPendingPaymentTimeout(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<PendingPaymentTimeoutResult> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()

  // --- Scenario 1: Orphaned bookings (no payment record) ---
  const orphanedCutoff = new Date(now.getTime() - ORPHANED_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const { data: orphanedBookings, error: orphanedError } = await admin
    .from('bookings')
    .select('id, user_id, professional_id, created_at, metadata')
    .eq('status', 'pending_payment')
    .lte('created_at', orphanedCutoff)
    .order('created_at', { ascending: true })
    .limit(100)

  if (orphanedError) {
    throw new Error(`Failed to load orphaned pending_payment bookings: ${orphanedError.message}`)
  }

  let cancelled = 0

  for (const booking of (orphanedBookings || [])) {
    const { data: payment } = await admin
      .from('payments')
      .select('id')
      .eq('booking_id', booking.id)
      .limit(1)
      .maybeSingle()

    if (payment?.id) continue // Payment exists — not orphaned

    const didCancel = await cancelBooking(
      admin,
      booking,
      nowIso,
      'orphaned_no_payment',
      ORPHANED_TIMEOUT_MINUTES,
    )
    if (didCancel) cancelled++
  }

  // --- Scenario 2: Unpaid bookings (payment in requires_payment) ---
  const unpaidCutoff = new Date(now.getTime() - UNPAID_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString()

  const { data: unpaidBookings, error: unpaidError } = await admin
    .from('bookings')
    .select('id, user_id, professional_id, created_at, metadata')
    .eq('status', 'pending_payment')
    .lte('created_at', unpaidCutoff)
    .order('created_at', { ascending: true })
    .limit(100)

  if (unpaidError) {
    throw new Error(`Failed to load unpaid pending_payment bookings: ${unpaidError.message}`)
  }

  for (const booking of (unpaidBookings || [])) {
    const { data: payment } = await admin
      .from('payments')
      .select('id, status')
      .eq('booking_id', booking.id)
      .limit(1)
      .maybeSingle()

    if (!payment?.id) continue // No payment — handled by scenario 1
    if (payment.status !== 'requires_payment') continue // Payment already processed

    const didCancel = await cancelBooking(
      admin,
      booking,
      nowIso,
      'unpaid_requires_payment',
      UNPAID_TIMEOUT_HOURS * 60,
    )
    if (didCancel) cancelled++
  }

  const checked = (orphanedBookings?.length || 0) + (unpaidBookings?.length || 0)
  return { checked, cancelled, at: nowIso }
}

async function cancelBooking(
  admin: SupabaseClient,
  booking: { id: string; user_id: string | null; professional_id: string | null; metadata: unknown },
  nowIso: string,
  reasonCode: string,
  timeoutMinutes: number,
): Promise<boolean> {
  const { data: updatedBooking, error: updateError } = await admin
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: `Agendamento cancelado automaticamente apos ${timeoutMinutes} minutos sem pagamento.`,
      metadata: patchBookingMetadata(booking.metadata, {
        auto_cancelled_at: nowIso,
        auto_cancel_reason: reasonCode,
        auto_cancel_timeout_minutes: timeoutMinutes,
      }),
      updated_at: nowIso,
    })
    .eq('id', booking.id)
    .eq('status', 'pending_payment')
    .select('id')
    .maybeSingle()

  if (updateError || !updatedBooking) {
    console.error('[pending-payment-timeout] cancel failed or race condition:', booking.id, updateError?.message)
    return false
  }

  // Notify user (in-app + push)
  if (booking.user_id) {
    await admin.from('notifications').insert({
      user_id: booking.user_id,
      booking_id: booking.id,
      type: 'booking_auto_cancelled',
      title: 'Agendamento cancelado',
      body: 'Seu agendamento foi cancelado automaticamente porque o pagamento nao foi concluido a tempo.',
      payload: {
        reason: reasonCode,
        timeout_minutes: timeoutMinutes,
        cancelled_at: nowIso,
      },
    })

    void sendPushToUser(
      booking.user_id as string,
      {
        title: 'Agendamento cancelado',
        body: 'O pagamento nao foi concluido a tempo e seu agendamento foi cancelado.',
        url: '/buscar',
        tag: 'booking_auto_cancelled',
      },
      { notifType: 'booking_auto_cancelled', admin },
    ).catch(err => {
      console.warn('[pending-payment-timeout] push failed:', err)
    })
  }

  return true
}
