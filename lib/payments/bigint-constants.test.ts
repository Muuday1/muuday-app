import { describe, it, expect } from 'vitest'
import { B, FEES, THRESHOLDS, PERCENT } from './bigint-constants'

// ---------------------------------------------------------------------------
// B (Zero / One)
// ---------------------------------------------------------------------------

describe('B constants', () => {
  it('ZERO equals 0n', () => {
    expect(B.ZERO).toBe(BigInt(0))
  })

  it('ONE equals 1n', () => {
    expect(B.ONE).toBe(BigInt(1))
  })

  it('NEG_ONE equals -1n', () => {
    expect(B.NEG_ONE).toBe(BigInt(-1))
  })

  it('ONE_HUNDRED equals 100n', () => {
    expect(B.ONE_HUNDRED).toBe(BigInt(100))
  })

  it('all B values are bigint type', () => {
    expect(typeof B.ZERO).toBe('bigint')
    expect(typeof B.ONE).toBe('bigint')
    expect(typeof B.NEG_ONE).toBe('bigint')
    expect(typeof B.ONE_HUNDRED).toBe('bigint')
  })
})

// ---------------------------------------------------------------------------
// FEES
// ---------------------------------------------------------------------------

describe('FEES constants', () => {
  it('WEEKLY equals 1500n (R$ 15.00)', () => {
    expect(FEES.WEEKLY).toBe(BigInt(1500))
  })

  it('BIWEEKLY equals 1000n (R$ 10.00)', () => {
    expect(FEES.BIWEEKLY).toBe(BigInt(1000))
  })

  it('MONTHLY_SUBSCRIPTION equals 500n (R$ 5.00)', () => {
    expect(FEES.MONTHLY_SUBSCRIPTION).toBe(BigInt(500))
  })

  it('all FEES values are bigint type', () => {
    expect(typeof FEES.WEEKLY).toBe('bigint')
    expect(typeof FEES.BIWEEKLY).toBe('bigint')
    expect(typeof FEES.MONTHLY_SUBSCRIPTION).toBe('bigint')
  })
})

// ---------------------------------------------------------------------------
// THRESHOLDS
// ---------------------------------------------------------------------------

describe('THRESHOLDS constants', () => {
  it('MIN_TREASURY_BUFFER equals 1_000_000n (R$ 10,000)', () => {
    expect(THRESHOLDS.MIN_TREASURY_BUFFER).toBe(BigInt(1_000_000))
  })

  it('MAX_PRO_DEBT equals 50_000n (R$ 500)', () => {
    expect(THRESHOLDS.MAX_PRO_DEBT).toBe(BigInt(50_000))
  })

  it('TROLLEY_FEE_MIN equals 250n (R$ 2.50)', () => {
    expect(THRESHOLDS.TROLLEY_FEE_MIN).toBe(BigInt(250))
  })

  it('AUTO_APPROVE_BATCH equals 5_000_000n (R$ 50,000)', () => {
    expect(THRESHOLDS.AUTO_APPROVE_BATCH).toBe(BigInt(5_000_000))
  })

  it('all THRESHOLDS values are bigint type', () => {
    expect(typeof THRESHOLDS.MIN_TREASURY_BUFFER).toBe('bigint')
    expect(typeof THRESHOLDS.MAX_PRO_DEBT).toBe('bigint')
    expect(typeof THRESHOLDS.TROLLEY_FEE_MIN).toBe('bigint')
    expect(typeof THRESHOLDS.AUTO_APPROVE_BATCH).toBe('bigint')
  })
})

// ---------------------------------------------------------------------------
// PERCENT
// ---------------------------------------------------------------------------

describe('PERCENT constants', () => {
  it('FX_BUFFER_BPS equals 50n (0.5%)', () => {
    expect(PERCENT.FX_BUFFER_BPS).toBe(BigInt(50))
  })

  it('TROLLEY_FEE_BPS equals 50n (0.5%)', () => {
    expect(PERCENT.TROLLEY_FEE_BPS).toBe(BigInt(50))
  })

  it('BASIS_POINTS equals 10_000n (100%)', () => {
    expect(PERCENT.BASIS_POINTS).toBe(BigInt(10_000))
  })

  it('all PERCENT values are bigint type', () => {
    expect(typeof PERCENT.FX_BUFFER_BPS).toBe('bigint')
    expect(typeof PERCENT.TROLLEY_FEE_BPS).toBe('bigint')
    expect(typeof PERCENT.BASIS_POINTS).toBe('bigint')
  })
})
