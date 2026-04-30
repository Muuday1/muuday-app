import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { roundCurrency } from '@/lib/booking/cancellation-policy'

export async function applyPaymentRefund(
  supabase: SupabaseClient,
  bookingId: string,
  refundPercentage: number,
) {
  const query = supabase
    .from('payments')
    .select('id, amount_total, status')
    .eq('booking_id', bookingId)
    .in('status', ['captured', 'partial_refunded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let paymentData: { id: string; amount_total: number; status: string } | null = null
  let paymentError: { message?: string } | null = null
  ;({ data: paymentData, error: paymentError } = await query)

  if (!paymentData || paymentError) return

  const nowIso = new Date().toISOString()
  const refundAmount = roundCurrency((Number(paymentData.amount_total) || 0) * (refundPercentage / 100))

  if (refundPercentage <= 0) {
    await supabase
      .from('payments')
      .update({
        refund_percentage: 0,
        refunded_amount: 0,
      })
      .eq('id', paymentData.id)
    return
  }

  const patch =
    refundPercentage >= 100
      ? {
          status: 'refunded',
          refund_percentage: 100,
          refunded_amount: refundAmount,
          refunded_at: nowIso,
        }
      : {
          status: 'partial_refunded',
          refund_percentage: refundPercentage,
          refunded_amount: refundAmount,
          refunded_at: nowIso,
        }

  const { error: refundError } = await supabase.from('payments').update(patch).eq('id', paymentData.id)
  if (refundError) {
    Sentry.captureException(refundError, {
      tags: { area: 'booking_refund', flow: 'payment_update' },
      extra: { paymentId: paymentData.id, refundPercentage },
    })
  }
}
