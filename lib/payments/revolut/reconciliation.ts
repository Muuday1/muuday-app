/**
 * Treasury Reconciliation Engine — Muuday Payments Engine
 *
 * Matches Stripe settlements (payouts) with Revolut incoming transfers.
 * Flags mismatches for manual review.
 * Auto-marks reconciled when amounts match within tolerance.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getRevolutTransactions } from './client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReconciliationMatch {
  settlementId: string
  stripePayoutId: string
  revolutTransactionId: string
  stripeAmount: bigint
  revolutAmount: bigint
  difference: bigint
  matched: boolean
}

export interface ReconciliationResult {
  settlementsChecked: number
  matchesFound: number
  mismatchesFound: number
  unmatchedSettlements: number
  matches: ReconciliationMatch[]
  mismatches: ReconciliationMatch[]
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Tolerance for matching: R$ 0.10 (10 minor units) */
const RECONCILIATION_TOLERANCE_MINOR = BigInt(10)

// ---------------------------------------------------------------------------
// Reconciliation Logic
// ---------------------------------------------------------------------------

/**
 * Reconcile Stripe settlements with Revolut transactions.
 *
 * For each settlement with status 'paid':
 * 1. Look for a Revolut transaction with matching amount (within tolerance)
 * 2. If found and amounts match → mark as 'reconciled'
 * 3. If found but amounts differ → flag as mismatch
 * 4. If not found → leave as unmatched
 */
export async function runTreasuryReconciliation(
  admin: SupabaseClient,
  options?: {
    fromDate?: string // ISO date
    toDate?: string // ISO date
  },
): Promise<ReconciliationResult> {
  // 1. Load unpaid Stripe settlements
  const { data: settlements, error } = await admin
    .from('stripe_settlements')
    .select('id, stripe_payout_id, amount, net_amount, currency, status, revolut_transaction_id')
    .eq('status', 'paid')
    .is('revolut_transaction_id', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to load settlements: ${error.message}`)
  }

  if (!settlements || settlements.length === 0) {
    return {
      settlementsChecked: 0,
      matchesFound: 0,
      mismatchesFound: 0,
      unmatchedSettlements: 0,
      matches: [],
      mismatches: [],
    }
  }

  // 2. Load Revolut transactions for the period
  const revolutTxs = await getRevolutTransactions({
    from: options?.fromDate,
    to: options?.toDate,
    limit: 500,
  })

  // Only consider completed inbound transfers
  const eligibleTxs = revolutTxs.filter(
    (tx) => tx.state === 'completed' && tx.type === 'transfer' && tx.amount > BigInt(0),
  )

  const matches: ReconciliationMatch[] = []
  const mismatches: ReconciliationMatch[] = []
  const usedTxIds = new Set<string>()

  // 3. Match each settlement to a Revolut transaction
  for (const settlement of settlements) {
    const settlementAmount = BigInt(settlement.net_amount || settlement.amount || 0)

    // Find best match: closest amount within tolerance, excluding already-used transactions
    let bestMatch: (typeof eligibleTxs)[number] | null = null
    let bestDiff = RECONCILIATION_TOLERANCE_MINOR + BigInt(1)

    for (const tx of eligibleTxs) {
      if (usedTxIds.has(tx.id)) continue

      const diff = tx.amount > settlementAmount
        ? tx.amount - settlementAmount
        : settlementAmount - tx.amount

      if (diff <= RECONCILIATION_TOLERANCE_MINOR && diff < bestDiff) {
        bestMatch = tx
        bestDiff = diff
      }
    }

    if (bestMatch) {
      usedTxIds.add(bestMatch.id)

      const match: ReconciliationMatch = {
        settlementId: settlement.id,
        stripePayoutId: settlement.stripe_payout_id,
        revolutTransactionId: bestMatch.id,
        stripeAmount: settlementAmount,
        revolutAmount: bestMatch.amount,
        difference: bestDiff,
        matched: bestDiff === BigInt(0),
      }

      if (match.matched) {
        matches.push(match)
        // Mark settlement as reconciled
        await admin
          .from('stripe_settlements')
          .update({
            status: 'reconciled',
            revolut_transaction_id: bestMatch.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settlement.id)
      } else {
        mismatches.push(match)
      }
    }
  }

  return {
    settlementsChecked: settlements.length,
    matchesFound: matches.length,
    mismatchesFound: mismatches.length,
    unmatchedSettlements: settlements.length - matches.length - mismatches.length,
    matches,
    mismatches,
  }
}

// ---------------------------------------------------------------------------
// Manual Reconciliation (Admin Action)
// ---------------------------------------------------------------------------

/**
 * Manually link a Stripe settlement to a Revolut transaction.
 *
 * Use this when automatic reconciliation fails but the admin
 * has verified the match manually.
 */
export async function manuallyReconcileSettlement(
  admin: SupabaseClient,
  settlementId: string,
  revolutTransactionId: string,
): Promise<void> {
  const { error } = await admin
    .from('stripe_settlements')
    .update({
      status: 'reconciled',
      revolut_transaction_id: revolutTransactionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settlementId)

  if (error) {
    throw new Error(`Failed to reconcile settlement: ${error.message}`)
  }
}
