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
 *
 * ACCOUNTING CONVENTION (standard double-entry):
 * - ASSET:   debit = increase,  credit = decrease
 * - LIABILITY: debit = decrease, credit = increase
 * - EQUITY:  debit = decrease, credit = increase
 * - REVENUE: debit = decrease, credit = increase
 * - EXPENSE: debit = increase,  credit = decrease
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

export function validateTransactionEntries(entries: LedgerEntryInput[]): void {
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
 * Uses PostgreSQL RPC for atomicity — all entries succeed or none do.
 */
export async function createLedgerTransaction(
  admin: SupabaseClient,
  input: LedgerTransactionInput,
): Promise<LedgerTransactionResult> {
  validateTransactionEntries(input.entries)

  const transactionId = randomUUID()

  const { data, error } = await admin.rpc('create_ledger_transaction_atomic', {
    p_transaction_id: transactionId,
    p_booking_id: input.bookingId ?? null,
    p_payment_id: input.paymentId ?? null,
    p_payout_batch_id: input.payoutBatchId ?? null,
    p_currency: input.currency ?? 'BRL',
    p_description: input.description ?? null,
    p_entries: input.entries.map((e) => ({
      account_id: e.account.code,
      entry_type: e.entryType,
      amount: Number(e.amount),
      description: e.description ?? null,
      metadata: e.metadata ?? {},
    })),
  })

  if (error) {
    throw new Error(`Failed to create ledger transaction: ${error.message}`)
  }

  const rows = (data || []) as Array<{ entry_id: string; account_id: string; entry_type: string; amount: number }>
  const entryIds = rows.map((r) => r.entry_id)

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
  TROLLEY_FEE_EXPENSE,
} from './accounts'

/**
 * Record a customer payment capture.
 *
 * Flow: Customer paid via Stripe → Stripe holds funds → we record receivable.
 *
 * Accounting:
 * - STRIPE_RECEIVABLE (asset)     ↑  debit  = amount - stripeFee
 * - STRIPE_FEE_EXPENSE (expense)  ↑  debit  = stripeFee
 * - PLATFORM_FEE_REVENUE (rev)    ↑  credit = platformFee
 * - PROFESSIONAL_BALANCE (equity) ↑  credit = amount - platformFee
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
      { account: STRIPE_RECEIVABLE, entryType: 'debit', amount: amount - stripeFeeAmount },
      { account: STRIPE_FEE_EXPENSE, entryType: 'debit', amount: stripeFeeAmount },
      { account: PLATFORM_FEE_REVENUE, entryType: 'credit', amount: platformFeeAmount },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit', amount: netToProfessional },
    ],
  }
}

/**
 * Record a Stripe settlement (Stripe payout to Revolut).
 *
 * Flow: Stripe transfers net funds to Revolut treasury.
 *
 * Accounting:
 * - CASH_REVOLUT_TREASURY (asset) ↑  debit  = netAmount
 * - STRIPE_RECEIVABLE (asset)     ↓  credit = netAmount
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
 * Record a payout to a professional via Trolley (NO debt deduction).
 *
 * Flow: Muuday pays professional from treasury. Professional receives 100%.
 *
 * Accounting:
 * - PROFESSIONAL_BALANCE (equity)      ↓  debit  = amount
 * - CASH_REVOLUT_TREASURY (asset)      ↓  credit = amount
 */
export function buildPayoutTransaction(params: {
  amount: bigint
  professionalId: string
  payoutBatchId: string
}): LedgerTransactionInput {
  const { amount, professionalId, payoutBatchId } = params

  return {
    payoutBatchId,
    currency: 'BRL',
    description: `Payout to professional ${professionalId}: ${amount} BRL`,
    entries: [
      { account: PROFESSIONAL_BALANCE, entryType: 'debit', amount },
      { account: CASH_REVOLUT_TREASURY, entryType: 'credit', amount },
    ],
  }
}

/**
 * Record a payout to a professional WITH debt deduction.
 *
 * Flow: Muuday pays professional net amount, deducting existing debt.
 *
 * Accounting:
 * - PROFESSIONAL_BALANCE (equity)      ↓  debit  = eligibleAmount
 * - CASH_REVOLUT_TREASURY (asset)      ↓  credit = netAmount
 * - PROFESSIONAL_DEBT (contra-equity)  ↓  credit = debtDeducted
 *
 * Invariant: eligibleAmount === netAmount + debtDeducted
 */
export function buildPayoutWithDebtTransaction(params: {
  eligibleAmount: bigint
  netAmount: bigint
  debtDeducted: bigint
  professionalId: string
  payoutBatchId: string
}): LedgerTransactionInput {
  const { eligibleAmount, netAmount, debtDeducted, professionalId, payoutBatchId } = params

  // Validate invariant
  if (eligibleAmount !== netAmount + debtDeducted) {
    throw new Error(
      `Payout transaction unbalanced: eligibleAmount (${eligibleAmount}) !== netAmount (${netAmount}) + debtDeducted (${debtDeducted})`,
    )
  }

  return {
    payoutBatchId,
    currency: 'BRL',
    description: `Payout to professional ${professionalId}: ${eligibleAmount} BRL (net: ${netAmount}, debt deducted: ${debtDeducted})`,
    entries: [
      { account: PROFESSIONAL_BALANCE, entryType: 'debit', amount: eligibleAmount },
      { account: CASH_REVOLUT_TREASURY, entryType: 'credit', amount: netAmount },
      { account: PROFESSIONAL_DEBT, entryType: 'credit', amount: debtDeducted },
    ],
  }
}

/**
 * Record Trolley fee absorbed by Muuday.
 *
 * Flow: Trolley charges a fee for processing the payout. Muuday absorbs it.
 *
 * Accounting:
 * - TROLLEY_FEE_EXPENSE (expense)      ↑  debit  = trolleyFee
 * - CASH_REVOLUT_TREASURY (asset)      ↓  credit = trolleyFee
 */
export function buildTrolleyFeeTransaction(params: {
  trolleyFee: bigint
  payoutBatchId: string
}): LedgerTransactionInput {
  const { trolleyFee, payoutBatchId } = params

  return {
    payoutBatchId,
    currency: 'BRL',
    description: `Trolley fee absorbed: ${trolleyFee} BRL`,
    entries: [
      { account: TROLLEY_FEE_EXPENSE, entryType: 'debit', amount: trolleyFee },
      { account: CASH_REVOLUT_TREASURY, entryType: 'credit', amount: trolleyFee },
    ],
  }
}

/**
 * Record a dispute after payout (professional goes into debt).
 *
 * Flow: Customer disputes → Muuday refunds → professional owes money.
 *
 * Accounting:
 * - PROFESSIONAL_DEBT (contra-equity)  ↑  debit  = disputeAmount
 * - CASH_REVOLUT_TREASURY (asset)      ↓  credit = disputeAmount
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
 * Flow: Customer cancels → Stripe refunds → we reverse the receivable.
 *
 * Accounting:
 * - STRIPE_RECEIVABLE (asset)          ↓  credit = refundAmount
 * - CUSTOMER_DEPOSITS_HELD (liability) ↓  debit  = refundAmount
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
      { account: CUSTOMER_DEPOSITS_HELD, entryType: 'debit', amount: refundAmount },
      { account: STRIPE_RECEIVABLE, entryType: 'credit', amount: refundAmount },
    ],
  }
}
