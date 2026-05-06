import { describe, it, expect, vi, beforeEach } from 'vitest'
import { persistRecurringBooking } from './persist-recurring'

vi.mock('@/lib/booking/transaction-operations', () => ({
  createRecurringBookingWithPaymentAtomic: vi.fn(),
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

import { createRecurringBookingWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { isActiveSlotCollision } from '@/lib/booking/request-validation'

function buildSupabaseChain(results: Record<string, { data?: any; error?: any }>) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const tableResults = results[table] || { data: null, error: null }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(tableResults),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }),
  } as any
}

describe('persistRecurringBooking', () => {
  const parentPayload = { user_id: 'u1', status: 'pending_payment' }
  const childPayloads = [
    { user_id: 'u1', status: 'pending_payment' },
    { user_id: 'u1', status: 'pending_payment' },
  ]
  const sessionsPayload = [
    { start_time_utc: '2024-06-15T10:00:00Z', status: 'pending_payment' },
  ]
  const paymentData = { amount: 300 }
  const professionalId = 'p1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns atomic result on success', async () => {
    vi.mocked(createRecurringBookingWithPaymentAtomic).mockResolvedValue({
      ok: true,
      parentBookingId: 'parent-1',
      childBookingIds: ['child-1', 'child-2'],
      sessionIds: ['session-1'],
      paymentId: 'pay-1',
    })

    const result = await persistRecurringBooking(
      buildSupabaseChain({}),
      parentPayload,
      childPayloads,
      sessionsPayload,
      paymentData,
      professionalId,
    )

    expect('bookingId' in result).toBe(true)
    if ('bookingId' in result) {
      expect(result.bookingId).toBe('parent-1')
      expect(result.usedAtomicPath).toBe(true)
      expect(result.createdBookingIds).toContain('parent-1')
      expect(result.createdBookingIds).toContain('child-1')
    }
  })

  it('falls back to manual insert when RPC unavailable', async () => {
    vi.mocked(createRecurringBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(false)

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'bookings') {
          let callCount = 0
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() => {
                  callCount += 1
                  if (callCount === 1) {
                    return Promise.resolve({ data: { id: 'parent-fb' }, error: null })
                  }
                  return Promise.resolve({ data: [{ id: 'child-fb' }], error: null })
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'booking_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    } as any

    const result = await persistRecurringBooking(
      supabase,
      parentPayload,
      childPayloads,
      sessionsPayload,
      paymentData,
      professionalId,
    )

    expect('bookingId' in result).toBe(true)
    if ('bookingId' in result) {
      expect(result.usedAtomicPath).toBe(false)
    }
  })

  it('returns collision error on parent insert conflict', async () => {
    vi.mocked(createRecurringBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: true,
      error: { message: 'function does not exist' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(true)

    const supabase = buildSupabaseChain({
      bookings: { data: null, error: { code: '23505', message: 'duplicate' } },
    })

    const result = await persistRecurringBooking(
      supabase,
      parentPayload,
      childPayloads,
      sessionsPayload,
      paymentData,
      professionalId,
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('horários já foram reservados')
    }
  })

  it('returns slot collision error on atomic path conflict', async () => {
    vi.mocked(createRecurringBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: false,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "bookings_unique_active_professional_start_idx"' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(true)

    const result = await persistRecurringBooking(
      buildSupabaseChain({}),
      parentPayload,
      childPayloads,
      sessionsPayload,
      paymentData,
      professionalId,
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('horários já foram reservados')
    }
  })

  it('returns error on non-fallback atomic failure', async () => {
    vi.mocked(createRecurringBookingWithPaymentAtomic).mockResolvedValue({
      ok: false,
      fallback: false,
      error: { message: 'unknown' } as any,
    })
    vi.mocked(isActiveSlotCollision).mockReturnValue(false)

    const result = await persistRecurringBooking(
      buildSupabaseChain({}),
      parentPayload,
      childPayloads,
      sessionsPayload,
      paymentData,
      professionalId,
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('Tente novamente')
    }
  })
})
