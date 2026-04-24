/**
 * Fee Calculator — Muuday Payments Engine
 *
 * All fees are calculated in BIGINT minor units.
 *
 * PAYOUT FEE POLICY (updated 2026-04-24):
 * - NO fee is deducted from individual payouts.
 * - Professionals receive 100% of their eligible amount (minus debt).
 * - Muuday absorbs Trolley/FX fees for MVP.
 *
 * MONTHLY SUBSCRIPTION FEE (separate billing, not handled here):
 * - All professionals pay a flat monthly fee via Stripe subscription.
 * - This is charged separately, NOT deducted from payouts.
 * - See Phase 6: Admin Finance Dashboard for subscription management.
 */

import { THRESHOLDS } from '../bigint-constants'

/**
 * Payout periodicity determines how often a professional receives payouts,
 * NOT how much fee they pay. All professionals pay the same monthly
 * subscription fee regardless of payout frequency.
 */
export type PayoutPeriodicity = 'weekly' | 'biweekly' | 'monthly'

export interface PayoutCalculation {
  eligibleAmount: bigint
  professionalDebt: bigint
  /** Always zero — monthly fee is billed separately, not deducted from payouts */
  feeAmount: bigint
  netAmount: bigint
  trolleyFee: bigint // Absorbed by Muuday, not deducted from pro
  professionalReceives: bigint
}

/**
 * Calculate the complete payout breakdown for a professional.
 *
 * NO PAYOUT FEE is deducted — professionals receive 100% of eligible amount
 * minus debt. Monthly subscription fee is billed separately.
 *
 * @param eligibleAmount Total amount from completed bookings
 * @param professionalDebt Current debt from disputes
 * @returns Complete payout calculation
 */
export function calculatePayout(params: {
  eligibleAmount: bigint
  professionalDebt: bigint
}): PayoutCalculation {
  const { eligibleAmount, professionalDebt } = params

  const ZERO = BigInt(0)

  // Step 1: Deduct professional debt first
  const netAmount = eligibleAmount - professionalDebt

  // Step 2: If debt consumed everything, no payout
  if (netAmount <= ZERO) {
    return {
      eligibleAmount,
      professionalDebt,
      feeAmount: ZERO,
      netAmount: ZERO,
      trolleyFee: ZERO,
      professionalReceives: ZERO,
    }
  }

  // Step 3: Trolley fee (absorbed by Muuday — NOT deducted from pro)
  // Estimate: max of minimum fee or 0.5% of net amount
  const basisPoints = BigInt(5)
  const thousand = BigInt(1000)
  const calculatedTrolleyFee = (netAmount * basisPoints) / thousand
  const estimatedTrolleyFee = calculatedTrolleyFee > THRESHOLDS.TROLLEY_FEE_MIN
    ? calculatedTrolleyFee
    : THRESHOLDS.TROLLEY_FEE_MIN

  return {
    eligibleAmount,
    professionalDebt,
    feeAmount: ZERO, // No per-payout fee
    netAmount,
    trolleyFee: estimatedTrolleyFee,
    professionalReceives: netAmount, // Pro receives 100% of net
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Convert a minor unit amount to a human-readable string.
 *
 * Example: BigInt(15000) → "R$ 150.00"
 */
export function formatMinorUnits(amount: bigint, currency: string = 'BRL'): string {
  const isNegative = amount < BigInt(0)
  const absAmount = isNegative ? -amount : amount
  const major = absAmount / BigInt(100)
  const minor = absAmount % BigInt(100)
  const minorStr = minor.toString().padStart(2, '0')
  const sign = isNegative ? '-' : ''

  if (currency === 'BRL') {
    return `${sign}R$ ${major}.${minorStr}`
  }

  return `${sign}${major}.${minorStr} ${currency}`
}

/**
 * Parse a human-readable amount to minor units.
 *
 * Example: "150.00" → BigInt(15000)
 */
export function parseToMinorUnits(amountStr: string): bigint {
  const cleaned = amountStr.replace(/[^0-9.-]/g, '')
  const [major, minor = '00'] = cleaned.split('.')
  const minorPadded = minor.padEnd(2, '0').slice(0, 2)
  const isNegative = major.startsWith('-')
  const absValue = BigInt(major.replace('-', '')) * BigInt(100) + BigInt(minorPadded)
  return isNegative ? -absValue : absValue
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FeeValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePayoutCalculation(calc: PayoutCalculation): FeeValidationResult {
  const errors: string[] = []
  const ZERO = BigInt(0)

  // Invariant 1: professionalReceives === netAmount
  if (calc.professionalReceives !== calc.netAmount) {
    errors.push(
      `professionalReceives (${calc.professionalReceives}) must equal netAmount (${calc.netAmount})`,
    )
  }

  // Invariant 2: netAmount + professionalDebt <= eligibleAmount
  // (feeAmount is always zero — monthly fee is billed separately)
  const sum = calc.netAmount + calc.professionalDebt
  if (sum > calc.eligibleAmount) {
    errors.push(
      `netAmount + professionalDebt (${sum}) exceeds eligibleAmount (${calc.eligibleAmount})`,
    )
  }

  // Invariant 3: All amounts non-negative
  if (calc.eligibleAmount < ZERO) errors.push('eligibleAmount cannot be negative')
  if (calc.professionalDebt < ZERO) errors.push('professionalDebt cannot be negative')
  if (calc.feeAmount < ZERO) errors.push('feeAmount cannot be negative')
  if (calc.netAmount < ZERO) errors.push('netAmount cannot be negative')

  return { valid: errors.length === 0, errors }
}
