import { describe, it, expect, vi, beforeEach } from 'vitest'
import { persistOneOffBooking } from './persist-one-off'

vi.mock('@/lib/booking/transaction-operations', () => ({
  createBookingWithPaymentAtomic: vi.fn(),
}))

vi.mock('@/lib/booking/request-validation', () => ({
  isActiveSlotCollision: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

vi.mock('./logging', () => ({
  reportBookingError: vi.fn(),
  logBookingEvent: vi.fn(),
}))

import { createBookingWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { isActiveSlotCollision } from '@/lib/booking/request-validation'

function mockSupabase(insertResult?: { data: any; error: any }) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(insertResult || { data: { id: 'booking-1' }, error: null }),
        }),
      }),
    }),
  } as any
}

describe('persistOneOffBooking', () => {
  const payload = { user_id: 'u1', professional_id: 'p1' }
  const paymentData = { amount: 100 }
  const professionalId = 'p1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns atomic result on success', async () => {
    vi.mocked(createBookingWithPaymentAtomic).mockResolvedValue({
      ok: true,
      bookingId: 'atomic-1',
      paymentId: 'pay-1',
    })

    const result = await persistOneOffBooking(mockSupabase(), payload, paymentData, professionalId)

    expect('bookingId' in result).toBe(true)
    if ('bookingId' in result) {
      expect(result.bookingId).toBe('atomic-1')
      expect(result.usedAtomicPath).toBe(true)
      expect(result.createdBookingIds).toEqual(['atomic-1'])
    }
  })

  it('falls back to insert when RPC does not exist', async () => {
    vi.mocked(createBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })

    const result = await persistOneOffBooking(mockSupabase(), payload, paymentData, professionalId)

    expect('bookingId' in result).toBe(true)
    if ('bookingId' in result) {
      expect(result.usedAtomicPath).toBe(false)
    }
  })

  it('returns slot collision error on fallback insert conflict', async () => {
    vi.mocked(createBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(true)

    const supabase = mockSupabase({ data: null, error: { code: '23505', message: 'duplicate' } })
    const result = await persistOneOffBooking(supabase, payload, paymentData, professionalId)

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('horários já foram reservados')
    }
  })

  it('returns generic error on fallback insert failure', async () => {
    vi.mocked(createBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(false)

    const supabase = mockSupabase({ data: null, error: { message: 'db error' } })
    const result = await persistOneOffBooking(supabase, payload, paymentData, professionalId)

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('Tente novamente')
    }
  })

  it('returns error on non-fallback atomic failure', async () => {
    vi.mocked(createBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: false,
      error: { message: 'unknown error' } as any,
    })

    const result = await persistOneOffBooking(mockSupabase(), payload, paymentData, professionalId)

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('Tente novamente')
    }
  })
})
