import type { SupabaseClient } from '@supabase/supabase-js'
import { reportBookingError, logBookingEvent } from './logging'
import type { PaymentData } from './prepare-payment'

export async function recordBookingPayment(
  supabase: SupabaseClient,
  paymentData: PaymentData,
  createdBookingIds: string[],
  paymentAnchorBookingId: string,
  batchBookingGroupId: string | null,
): Promise<void> {
  const { error: paymentError } = await supabase.from('payments').insert({
    booking_id: paymentAnchorBookingId,
    user_id: paymentData.user_id,
    professional_id: paymentData.professional_id,
    provider: paymentData.provider,
    amount_total: paymentData.amount_total,
    currency: paymentData.currency,
    status: paymentData.status,
    metadata: paymentData.metadata,
    captured_at: paymentData.captured_at,
  })

  if (paymentError) {
    reportBookingError(paymentError, { paymentAnchorBookingId, bookingType: paymentData.metadata?.bookingType, usedAtomicPath: false }, 'booking_payment_record_failed')
    logBookingEvent('booking_create_payment_failed', { paymentAnchorBookingId, bookingType: paymentData.metadata?.bookingType, usedAtomicPath: false, error: paymentError.message })

    const cancellationPatch = {
      status: 'cancelled',
      metadata: {
        cancelled_reason: 'payment_capture_failed',
      },
    }

    const bookingIdsToCancel = Array.from(new Set(createdBookingIds.filter(Boolean)))
    if (bookingIdsToCancel.length > 0) {
      await supabase
        .from('bookings')
        .update(cancellationPatch)
        .in('id', bookingIdsToCancel)
    } else {
      await supabase
        .from('bookings')
        .update(cancellationPatch)
        .eq('id', paymentAnchorBookingId)
    }

    if (batchBookingGroupId) {
      await supabase
        .from('bookings')
        .update(cancellationPatch)
        .eq('batch_booking_group_id', batchBookingGroupId)
    }

    throw new Error('Falha ao processar pagamento. Nenhum agendamento foi confirmado.')
  }
}
