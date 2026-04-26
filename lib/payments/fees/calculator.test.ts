import { describe, it, expect } from 'vitest'
import {
  calculatePayout,
  formatMinorUnits,
  parseToMinorUnits,
  validatePayoutCalculation,
  type PayoutCalculation,
} from './calculator'

describe('calculatePayout', () => {
  it('returns zero when debt equals eligible amount', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(10000), professionalDebt: BigInt(10000) })
    expect(result.netAmount).toBe(BigInt(0))
    expect(result.professionalReceives).toBe(BigInt(0))
    expect(result.trolleyFee).toBe(BigInt(0))
  })

  it('returns zero when debt exceeds eligible amount', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(5000), professionalDebt: BigInt(10000) })
    expect(result.netAmount).toBe(BigInt(0))
    expect(result.professionalReceives).toBe(BigInt(0))
  })

  it('calculates payout with no debt', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(20000), professionalDebt: BigInt(0) })
    expect(result.eligibleAmount).toBe(BigInt(20000))
    expect(result.professionalDebt).toBe(BigInt(0))
    expect(result.netAmount).toBe(BigInt(20000))
    expect(result.feeAmount).toBe(BigInt(0))
    expect(result.professionalReceives).toBe(BigInt(20000))
    expect(result.trolleyFee).toBeGreaterThan(BigInt(0))
  })

  it('calculates payout with partial debt', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(30000), professionalDebt: BigInt(5000) })
    expect(result.netAmount).toBe(BigInt(25000))
    expect(result.professionalReceives).toBe(BigInt(25000))
  })

  it('calculates trolley fee as 0.5% for large amounts', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(100000), professionalDebt: BigInt(0) })
    // 0.5% of 100000 = 500
    expect(result.trolleyFee).toBe(BigInt(500))
  })

  it('uses minimum trolley fee for small amounts', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(1000), professionalDebt: BigInt(0) })
    // 0.5% of 1000 = 5, which is below minimum
    expect(result.trolleyFee).toBeGreaterThan(BigInt(0))
  })

  it('has zero feeAmount (no per-payout fee)', () => {
    const result = calculatePayout({ eligibleAmount: BigInt(50000), professionalDebt: BigInt(0) })
    expect(result.feeAmount).toBe(BigInt(0))
  })
})

describe('formatMinorUnits', () => {
  it('formats BRL correctly', () => {
    expect(formatMinorUnits(BigInt(15000), 'BRL')).toBe('R$ 150.00')
  })

  it('formats zero correctly', () => {
    expect(formatMinorUnits(BigInt(0), 'BRL')).toBe('R$ 0.00')
  })

  it('formats negative amounts', () => {
    expect(formatMinorUnits(BigInt(-5000), 'BRL')).toBe('-R$ 50.00')
  })

  it('formats cents correctly', () => {
    expect(formatMinorUnits(BigInt(99), 'BRL')).toBe('R$ 0.99')
  })

  it('formats other currencies', () => {
    expect(formatMinorUnits(BigInt(10000), 'USD')).toBe('100.00 USD')
  })

  it('defaults to BRL when currency omitted', () => {
    expect(formatMinorUnits(BigInt(25000))).toBe('R$ 250.00')
  })
})

describe('parseToMinorUnits', () => {
  it('parses whole number', () => {
    expect(parseToMinorUnits('150')).toBe(BigInt(15000))
  })

  it('parses decimal', () => {
    expect(parseToMinorUnits('150.50')).toBe(BigInt(15050))
  })

  it('parses with currency prefix', () => {
    expect(parseToMinorUnits('R$ 150.50')).toBe(BigInt(15050))
  })

  it('parses negative', () => {
    expect(parseToMinorUnits('-50.25')).toBe(BigInt(-5025))
  })

  it('pads single digit cents', () => {
    expect(parseToMinorUnits('10.5')).toBe(BigInt(1050))
  })
})

describe('validatePayoutCalculation', () => {
  it('passes for valid calculation', () => {
    const calc: PayoutCalculation = {
      eligibleAmount: BigInt(10000),
      professionalDebt: BigInt(0),
      feeAmount: BigInt(0),
      netAmount: BigInt(10000),
      trolleyFee: BigInt(50),
      professionalReceives: BigInt(10000),
    }
    const result = validatePayoutCalculation(calc)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when professionalReceives !== netAmount', () => {
    const calc: PayoutCalculation = {
      eligibleAmount: BigInt(10000),
      professionalDebt: BigInt(0),
      feeAmount: BigInt(0),
      netAmount: BigInt(10000),
      trolleyFee: BigInt(50),
      professionalReceives: BigInt(9000),
    }
    const result = validatePayoutCalculation(calc)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('professionalReceives')
  })

  it('fails when netAmount + debt > eligibleAmount', () => {
    const calc: PayoutCalculation = {
      eligibleAmount: BigInt(10000),
      professionalDebt: BigInt(1000),
      feeAmount: BigInt(0),
      netAmount: BigInt(10000),
      trolleyFee: BigInt(50),
      professionalReceives: BigInt(10000),
    }
    const result = validatePayoutCalculation(calc)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('exceeds eligibleAmount')
  })

  it('fails when eligibleAmount is negative', () => {
    const calc: PayoutCalculation = {
      eligibleAmount: BigInt(-100),
      professionalDebt: BigInt(0),
      feeAmount: BigInt(0),
      netAmount: BigInt(0),
      trolleyFee: BigInt(0),
      professionalReceives: BigInt(0),
    }
    const result = validatePayoutCalculation(calc)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('eligibleAmount cannot be negative')
  })

  it('fails when professionalDebt is negative', () => {
    const calc: PayoutCalculation = {
      eligibleAmount: BigInt(10000),
      professionalDebt: BigInt(-100),
      feeAmount: BigInt(0),
      netAmount: BigInt(10100),
      trolleyFee: BigInt(0),
      professionalReceives: BigInt(10100),
    }
    const result = validatePayoutCalculation(calc)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('professionalDebt cannot be negative')
  })
})
