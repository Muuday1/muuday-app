import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push/sender'

export type PendingPaymentTimeoutResult = {
  checked: number
  cancelled: number
  at: string
}

const TIMEOUT_MINUTES = 30

/**
 * Cancel bookings stuck in `pending_payment` without an associated payment
 * after a timeout. This handles the edge case where booking creation succeeds
 * but payment insertion fails (e.g., crash, network partition, unhandled error),
 * leaving an orphaned booking that blocks the slot.
 */
export async function runPendingPaymentTimeout(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<PendingPaymentTimeoutResult> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()
  const cutoff = new Date(now.getTime() - TIMEOUT_MINUTES * 60 * 1000).toISOString()

  // Load pending_payment bookings older than cutoff
  const { data: bookings, error: bookingsError } = await admin
    .from('bookings')
    .select('id, user_id, professional_id, created_at, metadata')
    .eq('status', 'pending_payment')
    .lte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(200)

  if (bookingsError) {
    throw new Error(`Failed to load pending_payment bookings: ${bookingsError.message}`)
  }

  const candidates = bookings || []
  if (candidates.length === 0) {
    return { checked: 0, cancelled: 0, at: nowIso }
  }

  let cancelled = 0

  for (const booking of candidates) {
    // Verify no payment exists for this booking
    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .select('id')
      .eq('booking_id', booking.id)
      .limit(1)
      .maybeSingle()

    if (paymentError) {
      continue
    }

    if (payment?.id) {
      // Payment exists — booking is not orphaned, skip
      continue
    }

    const metadata = (booking.metadata as Record<string, unknown> | null) || {}

    const { data: updatedBooking, error: updateError } = await admin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: `Agendamento cancelado automaticamente após ${TIMEOUT_MINUTES} minutos sem pagamento.`,
        metadata: {
          ...metadata,
          auto_cancelled_at: nowIso,
          auto_cancel_reason: 'pending_payment_timeout_no_payment',
          auto_cancel_timeout_minutes: TIMEOUT_MINUTES,
        },
        updated_at: nowIso,
      })
      .eq('id', booking.id)
      .eq('status', 'pending_payment')
      .select('id')
      .maybeSingle()

    if (updateError || !updatedBooking) {
      console.error('[pending-payment-timeout] cancel failed or race condition:', booking.id, updateError?.message)
      continue
    }

    // Notify user (in-app + push)
    if (booking.user_id) {
      await admin.from('notifications').insert({
        user_id: booking.user_id,
        booking_id: booking.id,
        type: 'booking_auto_cancelled',
        title: 'Agendamento cancelado',
        body: 'Seu agendamento foi cancelado automaticamente porque o pagamento não foi concluído a tempo.',
        payload: {
          reason: 'pending_payment_timeout',
          timeout_minutes: TIMEOUT_MINUTES,
          cancelled_at: nowIso,
        },
      })

      void sendPushToUser(
        booking.user_id as string,
        {
          title: 'Agendamento cancelado',
          body: 'O pagamento não foi concluído a tempo e seu agendamento foi cancelado.',
          url: '/buscar',
          tag: 'booking_auto_cancelled',
        },
        { notifType: 'booking_auto_cancelled', admin },
      ).catch(err => {
        console.warn('[pending-payment-timeout] push failed:', err)
      })
    }

    cancelled++
  }

  return { checked: candidates.length, cancelled, at: nowIso }
}
