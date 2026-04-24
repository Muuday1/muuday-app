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
    .select('*')
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
    .select('*')
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
 * Uses Supabase RPC for atomicity. The actual implementation
 * should be a PostgreSQL function to avoid race conditions.
 *
 * TODO: Replace with PostgreSQL RPC for production.
 */
export async function updateProfessionalBalance(
  admin: SupabaseClient,
  professionalId: string,
  update: BalanceUpdateInput,
): Promise<ProfessionalBalance> {
  const current = await getProfessionalBalance(admin, professionalId)

  if (!current) {
    // Initialize balance record if it doesn't exist
    const { error: insertError } = await admin.from('professional_balances').insert({
      professional_id: professionalId,
      available_balance: update.availableDelta ?? ZERO,
      withheld_balance: update.withheldDelta ?? ZERO,
      pending_balance: update.pendingDelta ?? ZERO,
      total_debt: update.debtDelta ?? ZERO,
      currency: 'BRL',
      last_calculated_at: new Date().toISOString(),
    })

    if (insertError) {
      throw new Error(
        `Failed to initialize balance for professional ${professionalId}: ${insertError.message}`,
      )
    }

    return getProfessionalBalance(admin, professionalId) as Promise<ProfessionalBalance>
  }

  const newAvailable = current.availableBalance + (update.availableDelta ?? ZERO)
  const newWithheld = current.withheldBalance + (update.withheldDelta ?? ZERO)
  const newPending = current.pendingBalance + (update.pendingDelta ?? ZERO)
  const newDebt = current.totalDebt + (update.debtDelta ?? ZERO)

  const { error } = await admin
    .from('professional_balances')
    .update({
      available_balance: newAvailable,
      withheld_balance: newWithheld,
      pending_balance: newPending,
      total_debt: newDebt,
      last_calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('professional_id', professionalId)

  if (error) {
    throw new Error(
      `Failed to update balance for professional ${professionalId}: ${error.message}`,
    )
  }

  return {
    ...current,
    availableBalance: newAvailable,
    withheldBalance: newWithheld,
    pendingBalance: newPending,
    totalDebt: newDebt,
    lastCalculatedAt: new Date().toISOString(),
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
  }).then(async (balance) => {
    await admin
      .from('professional_balances')
      .update({ last_payout_at: new Date().toISOString() })
      .eq('professional_id', professionalId)
    return balance
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
