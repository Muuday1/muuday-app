import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { roundCurrency } from '@/lib/booking/cancellation-policy'
import { getStripeClient } from '@/lib/stripe/client'
import { buildRefundTransaction, createLedgerTransaction } from '@/lib/payments/ledger/entries'

export async function applyPaymentRefund(
  supabase: SupabaseClient,
  bookingId: string,
  refundPercentage: number,
) {
  const query = supabase
    .from('payments')
    .select('id, amount_total, amount_total_minor, status, stripe_payment_intent_id, booking_id, professional_id')
    .eq('booking_id', bookingId)
    .in('status', ['captured', 'partial_refunded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let paymentData: {
    id: string
    amount_total: number
    amount_total_minor: number
    status: string
    stripe_payment_intent_id: string | null
    booking_id: string
    professional_id: string | null
  } | null = null
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

  // If payment is captured and we have a Stripe PaymentIntent, call Stripe refund API
  const needsStripeRefund = paymentData.status === 'captured' && paymentData.stripe_payment_intent_id

  if (needsStripeRefund) {
    const stripe = getStripeClient()

    // Guard: if Stripe is not configured but we have a Stripe PaymentIntent,
    // abort the refund. Do NOT update DB status.
    if (!stripe) {
      Sentry.captureMessage('applyPaymentRefund: Stripe not configured, aborting refund', {
        level: 'warning',
        tags: { area: 'booking_refund', flow: 'stripe_not_configured' },
        extra: { paymentId: paymentData.id, bookingId },
      })
      return
    }

    try {
      const amountMinor = Math.round(refundAmount * 100)
      await stripe.refunds.create(
        {
          payment_intent: paymentData.stripe_payment_intent_id!,
          amount: amountMinor,
          reason: 'requested_by_customer',
          metadata: {
            booking_id: bookingId,
            payment_id: paymentData.id,
            source: 'booking_cancellation',
            refund_percentage: String(refundPercentage),
          },
        },
        {
          idempotencyKey: `cancel-refund-${paymentData.id}-${Math.round(refundPercentage)}`,
        },
      )

      // Create ledger entry for the refund
      const ledgerAmount = BigInt(amountMinor)
      if (ledgerAmount > BigInt(0)) {
        const ledgerInput = buildRefundTransaction({
          refundAmount: ledgerAmount,
          bookingId: paymentData.booking_id,
          paymentId: paymentData.id,
        })
        await createLedgerTransaction(supabase, ledgerInput)
      }
    } catch (stripeError) {
      const msg = stripeError instanceof Error ? stripeError.message : String(stripeError)
      Sentry.captureException(stripeError instanceof Error ? stripeError : new Error(msg), {
        tags: { area: 'booking_refund', flow: 'stripe_refund', bookingId },
        extra: { paymentId: paymentData.id, refundPercentage, refundAmount },
      })
      // Do not update DB status if Stripe refund failed — leave payment as captured
      // so it can be retried or handled manually.
      return
    }
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
