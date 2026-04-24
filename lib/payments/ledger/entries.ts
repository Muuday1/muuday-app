/**
 * Double-Entry Ledger Entry Helpers
 *
 * Every financial movement creates AT LEAST 2 ledger entries:
 * - One debit
 * - One credit
 * - Both with the same transaction_id
 * - Both summing to zero (invariant)
 *
 * CRITICAL RULES:
 * 1. Never create a single ledger entry alone.
 * 2. Always use createLedgerTransaction() which validates balance.
 * 3. Never modify or delete ledger entries after creation.
 * 4. All amounts are BIGINT minor units.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import type { LedgerAccount } from './accounts'

export type LedgerEntryType = 'debit' | 'credit'

export interface LedgerEntryInput {
  account: LedgerAccount
  entryType: LedgerEntryType
  amount: bigint
  description?: string
  metadata?: Record<string, unknown>
}

export interface LedgerTransactionInput {
  bookingId?: string
  paymentId?: string
  payoutBatchId?: string
  currency?: string
  description?: string
  entries: LedgerEntryInput[]
}

export interface LedgerTransactionResult {
  transactionId: string
  entryIds: string[]
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateTransactionEntries(entries: LedgerEntryInput[]): void {
  if (entries.length < 2) {
    throw new Error(
      `Ledger transaction must have at least 2 entries (debit + credit). Got ${entries.length}.`,
    )
  }

  let totalDebits = BigInt(0)
  let totalCredits = BigInt(0)

  for (const entry of entries) {
    if (entry.amount < BigInt(0)) {
      throw new Error(
        `Ledger entry amount cannot be negative. Account: ${entry.account.code}, amount: ${entry.amount}`,
      )
    }

    if (entry.entryType === 'debit') {
      totalDebits = totalDebits + entry.amount
    } else {
      totalCredits = totalCredits + entry.amount
    }
  }

  if (totalDebits !== totalCredits) {
    throw new Error(
      `Ledger transaction is unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}. ` +
        `Difference: ${totalDebits > totalCredits ? totalDebits - totalCredits : totalCredits - totalDebits}`,
    )
  }
}

// ---------------------------------------------------------------------------
// Transaction Creation
// ---------------------------------------------------------------------------

/**
 * Create a balanced double-entry ledger transaction.
 *
 * This is the ONLY way to write ledger entries. It validates that
 * debits === credits before writing to the database.
 *
 * Usage:
 * ```ts
 * await createLedgerTransaction(admin, {
 *   bookingId: booking.id,
 *   paymentId: payment.id,
 *   currency: 'BRL',
 *   description: 'Customer payment captured via Stripe',
 *   entries: [
 *     { account: CUSTOMER_DEPOSITS_HELD, entryType: 'debit', amount: BigInt(15000) },
 *     { account: STRIPE_RECEIVABLE, entryType: 'credit', amount: BigInt(15000) },
 *   ],
 * })
 * ```
 */
export async function createLedgerTransaction(
  admin: SupabaseClient,
  input: LedgerTransactionInput,
): Promise<LedgerTransactionResult> {
  validateTransactionEntries(input.entries)

  const transactionId = randomUUID()
  const entryIds: string[] = []

  for (const entry of input.entries) {
    const { data, error } = await admin
      .from('ledger_entries')
      .insert({
        transaction_id: transactionId,
        booking_id: input.bookingId ?? null,
        payment_id: input.paymentId ?? null,
        payout_batch_id: input.payoutBatchId ?? null,
        account_id: entry.account.code,
        entry_type: entry.entryType,
        amount: entry.amount,
        currency: input.currency ?? 'BRL',
        description: entry.description ?? input.description ?? null,
        metadata: entry.metadata ?? {},
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(
        `Failed to create ledger entry for account ${entry.account.code}: ${error.message}`,
      )
    }

    if (data?.id) {
      entryIds.push(data.id)
    }
  }

  return { transactionId, entryIds }
}

// ---------------------------------------------------------------------------
// Pre-Built Transaction Templates
// ---------------------------------------------------------------------------

import {
  CASH_REVOLUT_TREASURY,
  CUSTOMER_DEPOSITS_HELD,
  PLATFORM_FEE_REVENUE,
  PROFESSIONAL_BALANCE,
  PROFESSIONAL_DEBT,
  PROFESSIONAL_PAYABLE,
  STRIPE_FEE_EXPENSE,
  STRIPE_RECEIVABLE,
} from './accounts'

/**
 * Record a customer payment capture.
 *
 * Flow: Customer paid via Stripe → money held as Stripe receivable.
 */
export function buildPaymentCaptureTransaction(params: {
  amount: bigint
  stripeFeeAmount: bigint
  platformFeeAmount: bigint
  bookingId: string
  paymentId: string
}): LedgerTransactionInput {
  const { amount, stripeFeeAmount, platformFeeAmount, bookingId, paymentId } = params
  const netToProfessional = amount - platformFeeAmount

  return {
    bookingId,
    paymentId,
    currency: 'BRL',
    description: `Payment capture: ${amount} BRL (Stripe fee: ${stripeFeeAmount}, Platform fee: ${platformFeeAmount})`,
    entries: [
      { account: CUSTOMER_DEPOSITS_HELD, entryType: 'debit', amount },
      { account: STRIPE_RECEIVABLE, entryType: 'credit', amount: amount - stripeFeeAmount },
      { account: STRIPE_FEE_EXPENSE, entryType: 'credit', amount: stripeFeeAmount },
      { account: PLATFORM_FEE_REVENUE, entryType: 'debit', amount: platformFeeAmount },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit', amount: netToProfessional },
    ],
  }
}

/**
 * Record a Stripe settlement (Stripe payout to Revolut).
 *
 * Flow: Stripe transfers funds to Revolut treasury.
 */
export function buildStripeSettlementTransaction(params: {
  amount: bigint
  stripeFeeAmount: bigint
}): LedgerTransactionInput {
  const { amount, stripeFeeAmount } = params
  const netAmount = amount - stripeFeeAmount

  return {
    currency: 'BRL',
    description: `Stripe settlement: ${amount} BRL (fee: ${stripeFeeAmount})`,
    entries: [
      { account: CASH_REVOLUT_TREASURY, entryType: 'debit', amount: netAmount },
      { account: STRIPE_RECEIVABLE, entryType: 'credit', amount: netAmount },
    ],
  }
}

/**
 * Record a payout to a professional via Trolley.
 *
 * Flow: Muuday pays professional from treasury.
 */
export function buildPayoutTransaction(params: {
  amount: bigint
  feeAmount: bigint
  netAmount: bigint
  professionalId: string
  payoutBatchId: string
}): LedgerTransactionInput {
  const { amount, netAmount, professionalId, payoutBatchId } = params

  return {
    payoutBatchId,
    currency: 'BRL',
    description: `Payout to professional ${professionalId}: ${amount} BRL (net: ${netAmount})`,
    entries: [
      { account: PROFESSIONAL_PAYABLE, entryType: 'debit', amount },
      { account: PROFESSIONAL_BALANCE, entryType: 'debit', amount },
      { account: CASH_REVOLUT_TREASURY, entryType: 'credit', amount: netAmount },
    ],
  }
}

/**
 * Record a dispute after payout (professional goes into debt).
 *
 * Flow: Customer disputes → Muuday refunds → professional owes money.
 */
export function buildDisputeAfterPayoutTransaction(params: {
  disputeAmount: bigint
  bookingId: string
  payoutBatchId: string
}): LedgerTransactionInput {
  const { disputeAmount, bookingId, payoutBatchId } = params

  return {
    bookingId,
    payoutBatchId,
    currency: 'BRL',
    description: `Dispute after payout: ${disputeAmount} BRL`,
    entries: [
      { account: PROFESSIONAL_DEBT, entryType: 'debit', amount: disputeAmount },
      { account: CASH_REVOLUT_TREASURY, entryType: 'credit', amount: disputeAmount },
    ],
  }
}

/**
 * Record a refund (before payout).
 *
 * Flow: Customer cancels → full or partial refund.
 */
export function buildRefundTransaction(params: {
  refundAmount: bigint
  bookingId: string
  paymentId: string
}): LedgerTransactionInput {
  const { refundAmount, bookingId, paymentId } = params

  return {
    bookingId,
    paymentId,
    currency: 'BRL',
    description: `Refund: ${refundAmount} BRL`,
    entries: [
      { account: STRIPE_RECEIVABLE, entryType: 'debit', amount: refundAmount },
      { account: CUSTOMER_DEPOSITS_HELD, entryType: 'credit', amount: refundAmount },
    ],
  }
}
