/**
 * Refund Engine — Phase 5.1
 *
 * Handles admin-initiated refunds with Stripe API integration,
 * ledger entries, and debt tracking for post-payout disputes.
 *
 * Rules:
 * - Before payout: reverse STRIPE_RECEIVABLE, refund via Stripe
 * - After payout: create dispute_resolution + professional debt
 * - All amounts are BIGINT minor units
 */

import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripeClient } from '@/lib/stripe/client'
import {
  createLedgerTransaction,
  buildRefundTransaction,
  buildDisputeAfterPayoutTransaction,
} from '@/lib/payments/ledger/entries'
import { addProfessionalDebt } from '@/lib/payments/ledger/balance'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RefundResult {
  success: boolean
  refundId?: string
  amountRefunded?: bigint
  stripeError?: string
  ledgerError?: string
  disputeResolutionId?: string
}

export interface RefundInput {
  bookingId: string
  reason: string
  percentage: number // 0-100
  adminId: string
  idempotencyKey?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateIdempotencyKey(bookingId: string, timestamp: string): string {
  return `refund-${bookingId}-${timestamp}`
}

/**
 * Check if a professional has already received payout for a booking.
 */
async function hasProfessionalReceivedPayout(
  admin: SupabaseClient,
  bookingId: string,
  _professionalId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from('booking_payout_items')
    .select('id')
    .eq('booking_id', bookingId)
    .limit(1)

  if (error) {
    Sentry.captureException(error, { tags: { area: 'refund_engine' } })
    return false
  }

  return (data?.length ?? 0) > 0
}

/**
 * Get payment details for a booking.
 */
async function getPaymentForBooking(
  admin: SupabaseClient,
  bookingId: string,
): Promise<{
  id: string
  providerPaymentId: string
  amountTotalMinor: bigint
  refundedAmountMinor: bigint
  professionalId: string
  status: string
} | null> {
  const { data, error } = await admin
    .from('payments')
    .select('id, provider_payment_id, amount_total_minor, refunded_amount_minor, professional_id, status')
    .eq('booking_id', bookingId)
    .eq('provider', 'stripe')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    Sentry.captureException(error || new Error('Failed to load payment for booking'), { tags: { area: 'refund_engine' } })
    return null
  }

  return {
    id: data.id,
    providerPaymentId: data.provider_payment_id,
    amountTotalMinor: BigInt(data.amount_total_minor || 0),
    refundedAmountMinor: BigInt(data.refunded_amount_minor || 0),
    professionalId: data.professional_id,
    status: data.status,
  }
}

// ---------------------------------------------------------------------------
// Refund Engine
// ---------------------------------------------------------------------------

/**
 * Process a refund for a booking.
 *
 * Flow:
 * 1. Load payment for booking
 * 2. Calculate refund amount (percentage of total)
 * 3. Call Stripe refund API with idempotency key
 * 4. Update payment record
 * 5. Create ledger entry
 * 6. If post-payout: create dispute_resolution + add debt
 */
export async function processRefund(
  admin: SupabaseClient,
  input: RefundInput,
): Promise<RefundResult> {
  const { bookingId, reason, percentage, adminId, idempotencyKey } = input

  // Validate percentage
  if (percentage <= 0 || percentage > 100) {
    return { success: false, stripeError: 'Invalid refund percentage. Must be 1-100.' }
  }

  // Load payment
  const payment = await getPaymentForBooking(admin, bookingId)
  if (!payment) {
    return { success: false, stripeError: 'No payment found for this booking.' }
  }

  if (payment.status !== 'captured') {
    return { success: false, stripeError: `Payment status is ${payment.status}, not captured.` }
  }

  // Calculate refund amount
  const refundAmount = (payment.amountTotalMinor * BigInt(Math.round(percentage * 100))) / BigInt(10000)
  if (refundAmount <= BigInt(0)) {
    return { success: false, stripeError: 'Refund amount is zero or negative.' }
  }

  const alreadyRefunded = payment.refundedAmountMinor
  const remainingRefundable = payment.amountTotalMinor - alreadyRefunded
  if (refundAmount > remainingRefundable) {
    return {
      success: false,
      stripeError: `Refund amount exceeds remaining refundable amount.`,
    }
  }

  // Check if professional already received payout
  const postPayout = await hasProfessionalReceivedPayout(admin, bookingId, payment.professionalId)

  // Call Stripe refund API
  const stripe = getStripeClient()
  if (!stripe) {
    return { success: false, stripeError: 'Stripe client not configured.' }
  }

  const key = idempotencyKey || generateIdempotencyKey(bookingId, new Date().toISOString())

  let stripeRefundId: string | null = null
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.providerPaymentId,
        amount: Number(refundAmount),
        reason: 'requested_by_customer',
        metadata: {
          booking_id: bookingId,
          admin_id: adminId,
          reason,
          percentage: String(percentage),
          post_payout: String(postPayout),
        },
      },
      { idempotencyKey: key },
    )
    stripeRefundId = refund.id
  } catch (stripeError) {
    const msg = stripeError instanceof Error ? stripeError.message : String(stripeError)
    Sentry.captureException(stripeError instanceof Error ? stripeError : new Error(msg), { tags: { area: 'refund_engine', subArea: 'stripe_refund' } })
    return { success: false, stripeError: msg }
  }

  // Update payment record
  const newRefundedAmount = alreadyRefunded + refundAmount
  const { error: paymentUpdateError } = await admin
    .from('payments')
    .update({
      refunded_amount_minor: newRefundedAmount,
      status: newRefundedAmount >= payment.amountTotalMinor ? 'refunded' : 'partially_refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  if (paymentUpdateError) {
    Sentry.captureException(paymentUpdateError, { tags: { area: 'refund_engine', subArea: 'payment_update' } })
    // Return partial success: Stripe refund succeeded but local DB is out of sync
    return {
      success: true,
      refundId: stripeRefundId,
      amountRefunded: refundAmount,
      ledgerError: `Payment table update failed: ${paymentUpdateError.message}`,
    }
  }

  // Create ledger entry
  try {
    if (postPayout) {
      // Post-payout: dispute after payout → professional debt
      const ledgerInput = buildDisputeAfterPayoutTransaction({
        disputeAmount: refundAmount,
        bookingId,
        payoutBatchId: 'dispute', // No specific batch for dispute
      })
      await createLedgerTransaction(admin, ledgerInput)

      // Add debt to professional
      await addProfessionalDebt(admin, payment.professionalId, refundAmount)

      // Create dispute_resolution record
      const { data: disputeResolution } = await admin
        .from('dispute_resolutions')
        .insert({
          booking_id: bookingId,
          professional_id: payment.professionalId,
          dispute_amount: refundAmount,
          remaining_debt: refundAmount,
          recovery_method: 'future_withholding',
          status: 'open',
          notes: reason,
          metadata: {
            admin_id: adminId,
            stripe_refund_id: stripeRefundId,
            percentage,
            refund_amount: refundAmount.toString(),
          },
        })
        .select('id')
        .single()

      return {
        success: true,
        refundId: stripeRefundId,
        amountRefunded: refundAmount,
        disputeResolutionId: disputeResolution?.id,
      }
    } else {
      // Pre-payout: standard refund → reverse receivable
      const ledgerInput = buildRefundTransaction({
        refundAmount,
        bookingId,
        paymentId: payment.id,
      })
      await createLedgerTransaction(admin, ledgerInput)

      return {
        success: true,
        refundId: stripeRefundId,
        amountRefunded: refundAmount,
      }
    }
  } catch (ledgerError) {
    const msg = ledgerError instanceof Error ? ledgerError.message : String(ledgerError)
    Sentry.captureException(ledgerError instanceof Error ? ledgerError : new Error(msg), { tags: { area: 'refund_engine', subArea: 'ledger' } })
    return {
      success: true, // Stripe refund succeeded
      refundId: stripeRefundId,
      amountRefunded: refundAmount,
      ledgerError: msg,
    }
  }
}
