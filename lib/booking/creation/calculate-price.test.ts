import { describe, it, expect, vi } from 'vitest'
import { calculateBookingPrice } from './calculate-price'

vi.mock('@/lib/exchange-rates', () => ({
  getExchangeRates: vi.fn(),
}))

vi.mock('@/lib/booking/cancellation-policy', () => ({
  roundCurrency: vi.fn((value: number) => Math.round(value * 100) / 100),
}))

import { getExchangeRates } from '@/lib/exchange-rates'

function mockSupabase() {
  return {} as any
}

describe('calculateBookingPrice', () => {
  it('calculates price in BRL with no exchange rate', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1 })

    const result = await calculateBookingPrice(mockSupabase(), 150, 3, 'BRL')

    expect(result.perSessionPriceUserCurrency).toBe(150)
    expect(result.totalPriceUserCurrency).toBe(450)
  })

  it('applies exchange rate for USD', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1, USD: 0.18 })

    const result = await calculateBookingPrice(mockSupabase(), 150, 2, 'USD')

    expect(result.perSessionPriceUserCurrency).toBe(27)
    expect(result.totalPriceUserCurrency).toBe(54)
  })

  it('defaults to BRL when currency is null', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1 })

    const result = await calculateBookingPrice(mockSupabase(), 200, 1, null)

    expect(result.perSessionPriceUserCurrency).toBe(200)
    expect(result.totalPriceUserCurrency).toBe(200)
  })

  it('defaults to 0 when priceBrlRaw is null', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1 })

    const result = await calculateBookingPrice(mockSupabase(), null, 1, 'BRL')

    expect(result.perSessionPriceUserCurrency).toBe(0)
    expect(result.totalPriceUserCurrency).toBe(0)
  })

  it('defaults to 0 when priceBrlRaw is string that parses to NaN', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1 })

    const result = await calculateBookingPrice(mockSupabase(), 'invalid', 1, 'BRL')

    expect(result.perSessionPriceUserCurrency).toBe(0)
    expect(result.totalPriceUserCurrency).toBe(0)
  })

  it('handles string numeric priceBrlRaw', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1 })

    const result = await calculateBookingPrice(mockSupabase(), '150.50', 1, 'BRL')

    expect(result.perSessionPriceUserCurrency).toBe(150.5)
    expect(result.totalPriceUserCurrency).toBe(150.5)
  })

  it('falls back to rate 1 when currency not in rates', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1 })

    const result = await calculateBookingPrice(mockSupabase(), 100, 1, 'XYZ')

    expect(result.perSessionPriceUserCurrency).toBe(100)
    expect(result.totalPriceUserCurrency).toBe(100)
  })

  it('rounds currency correctly', async () => {
    vi.mocked(getExchangeRates).mockResolvedValue({ BRL: 1, USD: 0.18333 })

    const result = await calculateBookingPrice(mockSupabase(), 100, 1, 'USD')

    expect(result.perSessionPriceUserCurrency).toBe(18.33)
  })
})
