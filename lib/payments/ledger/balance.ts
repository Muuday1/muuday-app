/**
 * Professional Balance Calculations
 *
 * The professional_balances table is a MATERIALIZED VIEW of the ledger.
 * It can be reconstructed at any time by summing ledger entries.
 *
 * INVARIANT: available_balance + withheld_balance + pending_balance - total_debt
 *            = SUM(all ledger entries affecting this professional)
 *
 * All amounts are BIGINT minor units.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface ProfessionalBalance {
  professionalId: string
  availableBalance: bigint
  withheldBalance: bigint
  pendingBalance: bigint
  totalDebt: bigint
  currency: string
  lastPayoutAt: string | null
  lastCalculatedAt: string
}

export interface BalanceUpdateInput {
  availableDelta?: bigint
  withheldDelta?: bigint
  pendingDelta?: bigint
  debtDelta?: bigint
  lastPayoutAt?: string | null
}

// ---------------------------------------------------------------------------
// Balance Queries
// ---------------------------------------------------------------------------

export async function getProfessionalBalance(
  admin: SupabaseClient,
  professionalId: string,
): Promise<ProfessionalBalance | null> {
  const { data, error } = await admin
    .from('professional_balances')
    .select('professional_id, available_balance, withheld_balance, pending_balance, total_debt, currency, last_payout_at, last_calculated_at')
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to get balance for professional ${professionalId}: ${error.message}`)
  }

  if (!data) return null

  return {
    professionalId: data.professional_id,
    availableBalance: BigInt(data.available_balance),
    withheldBalance: BigInt(data.withheld_balance),
    pendingBalance: BigInt(data.pending_balance),
    totalDebt: BigInt(data.total_debt),
    currency: data.currency,
    lastPayoutAt: data.last_payout_at,
    lastCalculatedAt: data.last_calculated_at,
  }
}

export async function getAllProfessionalBalances(
  admin: SupabaseClient,
  options?: { minAvailable?: bigint; limit?: number; offset?: number },
): Promise<ProfessionalBalance[]> {
  let query = admin
    .from('professional_balances')
    .select('professional_id, available_balance, withheld_balance, pending_balance, total_debt, currency, last_payout_at, last_calculated_at')
    .order('updated_at', { ascending: false })

  if (options?.minAvailable !== undefined) {
    query = query.gte('available_balance', Number(options.minAvailable))
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 100) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get professional balances: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    professionalId: row.professional_id,
    availableBalance: BigInt(row.available_balance),
    withheldBalance: BigInt(row.withheld_balance),
    pendingBalance: BigInt(row.pending_balance),
    totalDebt: BigInt(row.total_debt),
    currency: row.currency,
    lastPayoutAt: row.last_payout_at,
    lastCalculatedAt: row.last_calculated_at,
  }))
}

// ---------------------------------------------------------------------------
// Balance Updates
// ---------------------------------------------------------------------------

const ZERO = BigInt(0)

/**
 * Atomically update a professional's balance.
 *
 * Uses the PostgreSQL RPC `update_professional_balance_atomic`
 * for true atomicity — no read-modify-write race conditions.
 */
export async function updateProfessionalBalance(
  admin: SupabaseClient,
  professionalId: string,
  update: BalanceUpdateInput,
): Promise<ProfessionalBalance> {
  const { data, error } = await admin.rpc('update_professional_balance_atomic', {
    p_professional_id: professionalId,
    p_available_delta: Number(update.availableDelta ?? ZERO),
    p_withheld_delta: Number(update.withheldDelta ?? ZERO),
    p_pending_delta: Number(update.pendingDelta ?? ZERO),
    p_debt_delta: Number(update.debtDelta ?? ZERO),
    p_last_payout_at: update.lastPayoutAt ?? null,
  })

  if (error) {
    throw new Error(
      `Failed to update balance for professional ${professionalId}: ${error.message}`,
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error(
      `Balance update returned no data for professional ${professionalId}`,
    )
  }

  const row = Array.isArray(data) ? data[0] : data

  return {
    professionalId: row.professional_id,
    availableBalance: BigInt(row.available_balance),
    withheldBalance: BigInt(row.withheld_balance),
    pendingBalance: BigInt(row.pending_balance),
    totalDebt: BigInt(row.total_debt),
    currency: row.currency || 'BRL',
    lastPayoutAt: row.last_payout_at,
    lastCalculatedAt: row.last_calculated_at,
  }
}

/**
 * Mark a professional's balance as having received a payout.
 */
export async function recordPayoutToProfessional(
  admin: SupabaseClient,
  professionalId: string,
  payoutAmount: bigint,
): Promise<ProfessionalBalance> {
  return updateProfessionalBalance(admin, professionalId, {
    availableDelta: -payoutAmount,
    withheldDelta: ZERO,
    pendingDelta: ZERO,
    debtDelta: ZERO,
    lastPayoutAt: new Date().toISOString(),
  })
}

/**
 * Move amount from available to withheld (e.g., dispute hold).
 */
export async function holdBalanceForDispute(
  admin: SupabaseClient,
  professionalId: string,
  amount: bigint,
): Promise<ProfessionalBalance> {
  return updateProfessionalBalance(admin, professionalId, {
    availableDelta: -amount,
    withheldDelta: amount,
    pendingDelta: ZERO,
    debtDelta: ZERO,
  })
}

/**
 * Release withheld balance back to available (e.g., dispute won).
 */
export async function releaseHeldBalance(
  admin: SupabaseClient,
  professionalId: string,
  amount: bigint,
): Promise<ProfessionalBalance> {
  return updateProfessionalBalance(admin, professionalId, {
    availableDelta: amount,
    withheldDelta: -amount,
    pendingDelta: ZERO,
    debtDelta: ZERO,
  })
}

/**
 * Add debt to professional (dispute after payout).
 */
export async function addProfessionalDebt(
  admin: SupabaseClient,
  professionalId: string,
  amount: bigint,
): Promise<ProfessionalBalance> {
  return updateProfessionalBalance(admin, professionalId, {
    availableDelta: -amount,
    withheldDelta: ZERO,
    pendingDelta: ZERO,
    debtDelta: amount,
  })
}

// ---------------------------------------------------------------------------
// Balance Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a balance satisfies all invariants.
 *
 * Returns an array of error messages (empty if valid).
 */
export function validateBalance(balance: ProfessionalBalance): string[] {
  const errors: string[] = []

  if (balance.availableBalance < ZERO && balance.totalDebt === ZERO) {
    errors.push(
      `Available balance is negative (${balance.availableBalance}) but total_debt is zero. ` +
        `This is inconsistent: negative available should be tracked as debt.`,
    )
  }

  return errors
}

/**
 * Check if a professional can receive payouts.
 */
export function canReceivePayouts(
  balance: ProfessionalBalance,
  maxDebtThreshold: bigint,
): { eligible: boolean; reason?: string } {
  if (balance.totalDebt > maxDebtThreshold) {
    return {
      eligible: false,
      reason: `Professional debt (${balance.totalDebt}) exceeds threshold (${maxDebtThreshold})`,
    }
  }

  if (balance.availableBalance <= ZERO) {
    return { eligible: false, reason: 'No available balance to payout' }
  }

  return { eligible: true }
}
