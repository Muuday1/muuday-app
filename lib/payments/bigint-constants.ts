/**
 * BigInt Constants — Muuday Payments Engine
 *
 * TypeScript target is ES2017, which does not support BigInt literals (0n).
 * We use BigInt() constructor instead.
 *
 * All monetary values in the payments engine use these constants
 * or BigInt() constructor. Never use bigint literals.
 */

// ---------------------------------------------------------------------------
// Zero / One
// ---------------------------------------------------------------------------
export const B = {
  ZERO: BigInt(0),
  ONE: BigInt(1),
  NEG_ONE: BigInt(-1),
  ONE_HUNDRED: BigInt(100),
}

// ---------------------------------------------------------------------------
// Fee amounts (minor units)
// ---------------------------------------------------------------------------
// NOTE (2026-04-24): No per-payout fees. Professionals receive 100% of
// eligible payouts. Monthly subscription fee is billed separately via Stripe.
// The constants below are reserved for future subscription pricing.
export const FEES = {
  /** @deprecated No per-payout fee. Use monthly subscription instead. */
  WEEKLY: BigInt(1500),    // R$ 15.00 — was per-payout fee, now unused
  /** @deprecated No per-payout fee. Use monthly subscription instead. */
  BIWEEKLY: BigInt(1000),  // R$ 10.00 — was per-payout fee, now unused
  /** Placeholder for monthly subscription fee (Phase 6). */
  MONTHLY_SUBSCRIPTION: BigInt(500), // R$ 5.00 — flat monthly fee for all pros
}

// ---------------------------------------------------------------------------
// Thresholds (minor units)
// ---------------------------------------------------------------------------
export const THRESHOLDS = {
  MIN_TREASURY_BUFFER: BigInt(1_000_000), // R$ 10,000
  MAX_PRO_DEBT: BigInt(50_000),           // R$ 500
  TROLLEY_FEE_MIN: BigInt(250),           // R$ 2.50
  AUTO_APPROVE_BATCH: BigInt(5_000_000),  // R$ 50,000
}

// ---------------------------------------------------------------------------
// Percentages (as bigint multipliers for math)
// ---------------------------------------------------------------------------
export const PERCENT = {
  FX_BUFFER_BPS: BigInt(50),    // 0.5% = 50 basis points
  TROLLEY_FEE_BPS: BigInt(50),  // 0.5% estimated Trolley fee
  BASIS_POINTS: BigInt(10_000), // 100% = 10,000 bps
}
