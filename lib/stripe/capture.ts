import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripeClient } from './client'

export interface CaptureResult {
  success: boolean
  captured: boolean
  error?: string
}

/**
 * Capture a Stripe PaymentIntent for a completed booking.
 *
 * PaymentIntents are created with capture_method: 'manual'.
 * This function captures the authorized funds after the professional
 * marks the session as completed.
 *
 * Idempotent: safe to call multiple times. If already captured, returns success.
 */
export async function captureBookingPayment(
  admin: SupabaseClient,
  bookingId: string,
): Promise<CaptureResult> {
  const stripe = getStripeClient()
  if (!stripe) {
    return { success: false, captured: false, error: 'Stripe client not configured' }
  }

  // Load the payment record for this booking
  const { data: payment, error: loadError } = await admin
    .from('payments')
    .select('id, stripe_payment_intent_id, status, amount_total_minor')
    .eq('booking_id', bookingId)
    .eq('provider', 'stripe')
    .maybeSingle()

  if (loadError) {
    Sentry.captureException(loadError, {
      tags: { area: 'stripe_capture', subArea: 'load_payment' },
      extra: { bookingId },
    })
    return { success: false, captured: false, error: 'Failed to load payment record' }
  }

  if (!payment) {
    return { success: false, captured: false, error: 'No payment found for booking' }
  }

  // Already captured or refunded — idempotent
  if (payment.status === 'captured') {
    return { success: true, captured: true }
  }

  if (payment.status === 'refunded') {
    return { success: false, captured: false, error: 'Payment was already refunded' }
  }

  if (payment.status === 'failed') {
    return { success: false, captured: false, error: 'Payment failed' }
  }

  const providerPaymentId = payment.stripe_payment_intent_id
  if (!providerPaymentId) {
    return { success: false, captured: false, error: 'No stripe_payment_intent_id on payment record' }
  }

  try {
    // Capture the authorized amount
    const capturedIntent = await stripe.paymentIntents.capture(providerPaymentId)

    Sentry.addBreadcrumb({
      category: 'payments',
      message: 'Stripe PaymentIntent captured',
      level: 'info',
      data: {
        bookingId,
        paymentId: payment.id,
        providerPaymentId,
        captureStatus: capturedIntent.status,
        amountCaptured: capturedIntent.amount_received,
      },
    })

    // The webhook handler (payment_intent.succeeded) will update the DB status,
    // create ledger entries, and update professional balances.
    // We do NOT duplicate that work here to avoid race conditions.

    return { success: true, captured: true }
  } catch (captureError) {
    const message = captureError instanceof Error ? captureError.message : String(captureError)

    Sentry.captureException(captureError instanceof Error ? captureError : new Error(message), {
      tags: { area: 'stripe_capture', subArea: 'stripe_api' },
      extra: { bookingId, paymentId: payment.id, providerPaymentId },
    })

    return { success: false, captured: false, error: message }
  }
}
