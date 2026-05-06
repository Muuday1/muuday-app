import { describe, it, expect, vi, beforeEach } from 'vitest'
import { persistBatchBooking } from './persist-batch'

vi.mock('@/lib/booking/transaction-operations', () => ({
  createBatchBookingsWithPaymentAtomic: vi.fn(),
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

import { createBatchBookingsWithPaymentAtomic } from '@/lib/booking/transaction-operations'
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

describe('persistBatchBooking', () => {
  const batchPayload = [{ user_id: 'u1' }, { user_id: 'u1' }]
  const paymentData = { amount: 200 }
  const professionalId = 'p1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns atomic result on success', async () => {
    vi.mocked(createBatchBookingsWithPaymentAtomic).mockResolvedValue({
      ok: true,
      bookingIds: ['batch-1', 'batch-2'],
    })

    const result = await persistBatchBooking(mockSupabase(), batchPayload, paymentData, professionalId)

    expect('bookingId' in result).toBe(true)
    if ('bookingId' in result) {
      expect(result.bookingId).toBe('batch-1')
      expect(result.usedAtomicPath).toBe(true)
      expect(result.createdBookingIds).toEqual(['batch-1', 'batch-2'])
    }
  })

  it('falls back to insert when RPC does not exist', async () => {
    vi.mocked(createBatchBookingsWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })

    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'fb-1' }, { id: 'fb-2' }],
            error: null,
          }),
        }),
      }),
    } as any

    const result = await persistBatchBooking(supabase, batchPayload, paymentData, professionalId)

    expect('bookingId' in result).toBe(true)
    if ('bookingId' in result) {
      expect(result.usedAtomicPath).toBe(false)
      expect(result.createdBookingIds).toEqual(['fb-1', 'fb-2'])
    }
  })

  it('returns slot collision error on fallback insert conflict', async () => {
    vi.mocked(createBatchBookingsWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(true)

    const supabase = mockSupabase({ data: null, error: { code: '23505', message: 'duplicate' } })
    const result = await persistBatchBooking(supabase, batchPayload, paymentData, professionalId)

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('horários já foram reservados')
    }
  })

  it('returns slot collision error on atomic path conflict', async () => {
    vi.mocked(createBatchBookingsWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: false,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "bookings_unique_active_professional_start_idx"' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(true)

    const result = await persistBatchBooking(mockSupabase(), batchPayload, paymentData, professionalId)

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('horários já foram reservados')
    }
  })

  it('returns generic error on fallback insert failure', async () => {
    vi.mocked(createBatchBookingsWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(false)

    const supabase = mockSupabase({ data: null, error: { message: 'db error' } })
    const result = await persistBatchBooking(supabase, batchPayload, paymentData, professionalId)

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('Tente novamente')
    }
  })
})
