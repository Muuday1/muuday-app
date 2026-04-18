import { describe, it, expect } from 'vitest'
import {
  getHoursUntilSession,
  getUserCancellationRefundDecision,
  getProfessionalCancellationRefundDecision,
  roundCurrency,
} from './cancellation-policy'

describe('getHoursUntilSession', () => {
  it('returns positive hours for future session', () => {
    const now = new Date('2024-01-01T12:00:00Z').getTime()
    const result = getHoursUntilSession('2024-01-02T12:00:00Z', now)
    expect(result).toBe(24)
  })

  it('returns negative hours for past session', () => {
    const now = new Date('2024-01-02T12:00:00Z').getTime()
    const result = getHoursUntilSession('2024-01-01T12:00:00Z', now)
    expect(result).toBe(-24)
  })

  it('returns -1 for invalid ISO string', () => {
    const result = getHoursUntilSession('invalid')
    expect(result).toBe(-1)
  })

  it('handles fractional hours correctly', () => {
    const now = new Date('2024-01-01T12:00:00Z').getTime()
    const result = getHoursUntilSession('2024-01-01T18:30:00Z', now)
    expect(result).toBeCloseTo(6.5, 1)
  })
})

describe('getUserCancellationRefundDecision', () => {
  it('returns full refund for >= 48 hours', () => {
    expect(getUserCancellationRefundDecision(48)).toEqual({ refundPercentage: 100, rule: 'full' })
    expect(getUserCancellationRefundDecision(72)).toEqual({ refundPercentage: 100, rule: 'full' })
  })

  it('returns partial refund for 24-48 hours', () => {
    expect(getUserCancellationRefundDecision(24)).toEqual({ refundPercentage: 50, rule: 'partial' })
    expect(getUserCancellationRefundDecision(36)).toEqual({ refundPercentage: 50, rule: 'partial' })
  })

  it('returns no refund for < 24 hours', () => {
    expect(getUserCancellationRefundDecision(23.9)).toEqual({ refundPercentage: 0, rule: 'none' })
    expect(getUserCancellationRefundDecision(0)).toEqual({ refundPercentage: 0, rule: 'none' })
    expect(getUserCancellationRefundDecision(-5)).toEqual({ refundPercentage: 0, rule: 'none' })
  })
})

describe('getProfessionalCancellationRefundDecision', () => {
  it('always returns full refund', () => {
    expect(getProfessionalCancellationRefundDecision()).toEqual({ refundPercentage: 100, rule: 'full' })
  })
})

describe('roundCurrency', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundCurrency(10.555)).toBe(10.56)
    expect(roundCurrency(10.554)).toBe(10.55)
    expect(roundCurrency(10)).toBe(10)
    expect(roundCurrency(0.005)).toBe(0.01)
  })
})
