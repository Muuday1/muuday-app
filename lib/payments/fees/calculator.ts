/**
 * Fee Calculator — Muuday Payments Engine
 *
 * All fees are calculated in BIGINT minor units.
 * Professional pays transfer fees based on chosen periodicity.
 * Muuday absorbs Trolley/FX fees for MVP.
 *
 * Fee Structure:
 * - Weekly:    R$ 15.00 (BigInt(1500))
 * - Bi-weekly: R$ 10.00 (BigInt(1000))
 * - Monthly:   R$  5.00 (BigInt(500))
 */

import { FEES, THRESHOLDS } from '../bigint-constants'

export type PayoutPeriodicity = 'weekly' | 'biweekly' | 'monthly'

export interface FeeConfig {
  weeklyFee: bigint
  biweeklyFee: bigint
  monthlyFee: bigint
}

// ---------------------------------------------------------------------------
// Default Configuration
// ---------------------------------------------------------------------------

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  weeklyFee: FEES.WEEKLY,
  biweeklyFee: FEES.BIWEEKLY,
  monthlyFee: FEES.MONTHLY,
}

// ---------------------------------------------------------------------------
// Fee Calculation
// ---------------------------------------------------------------------------

export function getFeeForPeriodicity(
  periodicity: PayoutPeriodicity,
  config: FeeConfig = DEFAULT_FEE_CONFIG,
): bigint {
  switch (periodicity) {
    case 'weekly':
      return config.weeklyFee
    case 'biweekly':
      return config.biweeklyFee
    case 'monthly':
      return config.monthlyFee
    default:
      throw new Error(`Unknown payout periodicity: ${periodicity}`)
  }
}

export interface PayoutCalculation {
  eligibleAmount: bigint
  professionalDebt: bigint
  feeAmount: bigint
  netAmount: bigint
  trolleyFee: bigint // Absorbed by Muuday, not deducted from pro
  professionalReceives: bigint
}

/**
 * Calculate the complete payout breakdown for a professional.
 *
 * @param eligibleAmount Total amount from completed bookings
 * @param professionalDebt Current debt from disputes
 * @param periodicity Professional's chosen payout frequency
 * @param config Fee configuration (optional)
 * @returns Complete payout calculation
 */
export function calculatePayout(params: {
  eligibleAmount: bigint
  professionalDebt: bigint
  periodicity: PayoutPeriodicity
  config?: FeeConfig
}): PayoutCalculation {
  const { eligibleAmount, professionalDebt, periodicity, config = DEFAULT_FEE_CONFIG } = params

  const ZERO = BigInt(0)

  // Step 1: Deduct professional debt first
  const afterDebt = eligibleAmount - professionalDebt

  // Step 2: If debt consumed everything, no payout
  if (afterDebt <= ZERO) {
    return {
      eligibleAmount,
      professionalDebt,
      feeAmount: ZERO,
      netAmount: ZERO,
      trolleyFee: ZERO,
      professionalReceives: ZERO,
    }
  }

  // Step 3: Apply periodicity fee
  const feeAmount = getFeeForPeriodicity(periodicity, config)

  // Step 4: Calculate net amount (what goes to Trolley)
  const netAmount = afterDebt - feeAmount

  if (netAmount <= ZERO) {
    return {
      eligibleAmount,
      professionalDebt,
      feeAmount,
      netAmount: ZERO,
      trolleyFee: ZERO,
      professionalReceives: ZERO,
    }
  }

  // Step 5: Trolley fee (absorbed by Muuday)
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
    feeAmount,
    netAmount,
    trolleyFee: estimatedTrolleyFee,
    professionalReceives: netAmount, // Pro receives net; Muuday pays Trolley fee separately
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

  // Invariant 2: netAmount + feeAmount + professionalDebt <= eligibleAmount
  const sum = calc.netAmount + calc.feeAmount + calc.professionalDebt
  if (sum > calc.eligibleAmount) {
    errors.push(
      `netAmount + feeAmount + professionalDebt (${sum}) exceeds eligibleAmount (${calc.eligibleAmount})`,
    )
  }

  // Invariant 3: All amounts non-negative
  if (calc.eligibleAmount < ZERO) errors.push('eligibleAmount cannot be negative')
  if (calc.professionalDebt < ZERO) errors.push('professionalDebt cannot be negative')
  if (calc.feeAmount < ZERO) errors.push('feeAmount cannot be negative')
  if (calc.netAmount < ZERO) errors.push('netAmount cannot be negative')

  return { valid: errors.length === 0, errors }
}
