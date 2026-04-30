import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateBookingId,
  recurringDeadlineBlockedResult,
  confirmBookingService,
  getBookingDetailService,
} from './manage-booking-service'
import { applyPaymentRefund } from '@/lib/booking/cancellation/apply-refund'

vi.mock('@/lib/booking/state-machine', () => ({
  assertBookingTransition: vi.fn(),
}))

vi.mock('@/lib/calendar/sync/events', () => ({
  enqueueBookingCalendarSync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/booking/cancellation-policy', () => ({
  roundCurrency: vi.fn((value: number) => Math.round(value * 100) / 100),
}))

import { assertBookingTransition } from '@/lib/booking/state-machine'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'

function mockSupabase(tableResults: Record<string, { data?: any; error?: any }> = {}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const result = tableResults[table] || { data: null, error: null }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(result),
            maybeSingle: vi.fn().mockResolvedValue(result),
          }),
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(result),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(result),
              }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue(result),
      }
    }),
  } as any
}

describe('validateBookingId', () => {
  it('returns ok for valid UUID', () => {
    const result = validateBookingId('550e8400-e29b-41d4-a716-446655440000')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    }
  })

  it('returns error for invalid UUID', () => {
    const result = validateBookingId('not-a-uuid')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.result.success).toBe(false)
      expect((result.result as any).error).toContain('inválido')
    }
  })

  it('returns error for empty string', () => {
    const result = validateBookingId('')
    expect(result.ok).toBe(false)
  })
})

describe('recurringDeadlineBlockedResult', () => {
  it('formats blocked result with all fields', () => {
    const decision = {
      reason_code: 'deadline_passed',
      deadline_at_utc: '2024-06-15T10:00:00Z',
    } as any

    const result = recurringDeadlineBlockedResult('Prazo expirado.', decision)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Prazo expirado.')
      expect(result.reasonCode).toBe('deadline_passed')
      expect(result.deadlineAtUtc).toBe('2024-06-15T10:00:00Z')
    }
  })
})

describe('applyPaymentRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when no payment found', async () => {
    const supabase = mockSupabase({ payments: { data: null, error: null } })
    const updateMock = vi.fn().mockResolvedValue({ error: null })
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
      update: updateMock,
    })

    await applyPaymentRefund(supabase, 'booking-1', 50)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('sets zero refund when percentage is 0', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'pay-1', amount_total: 200, status: 'captured' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        update: updateMock,
      }),
    } as any

    await applyPaymentRefund(supabase, 'booking-1', 0)

    expect(updateMock).toHaveBeenCalledWith({
      refund_percentage: 0,
      refunded_amount: 0,
    })
  })

  it('sets full refund when percentage is 100', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'pay-1', amount_total: 200, status: 'captured' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        update: updateMock,
      }),
    } as any

    await applyPaymentRefund(supabase, 'booking-1', 100)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'refunded',
        refund_percentage: 100,
        refunded_amount: 200,
      }),
    )
  })

  it('sets partial refund when percentage is between 0 and 100', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'pay-1', amount_total: 200, status: 'captured' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        update: updateMock,
      }),
    } as any

    await applyPaymentRefund(supabase, 'booking-1', 50)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'partial_refunded',
        refund_percentage: 50,
        refunded_amount: 100,
      }),
    )
  })
})

describe('confirmBookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assertBookingTransition).mockReturnValue({ ok: true } as any)
  })

  it('returns error for invalid bookingId', async () => {
    const result = await confirmBookingService(mockSupabase(), 'user-1', 'prof-1', 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('inválido')
    }
  })

  it('returns error when professionalId is null', async () => {
    const result = await confirmBookingService(mockSupabase(), 'user-1', null, '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('profissional')
    }
  })

  it('returns error when booking not found', async () => {
    const supabase = mockSupabase({ bookings: { data: null, error: { message: 'not found' } } })
    const result = await confirmBookingService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('não encontrado')
    }
  })

  it('returns error when professional does not own booking', async () => {
    const supabase = mockSupabase({
      bookings: { data: { id: 'b1', status: 'pending', professional_id: 'other-prof' }, error: null },
    })
    const result = await confirmBookingService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('profissional')
    }
  })

  it('returns error when transition is invalid', async () => {
    vi.mocked(assertBookingTransition).mockReturnValue({ ok: false, error: 'invalid transition' } as any)
    const supabase = mockSupabase({
      bookings: { data: { id: 'b1', status: 'cancelled', professional_id: 'prof-1' }, error: null },
    })
    const result = await confirmBookingService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('não pode ser confirmado')
    }
  })

  it('returns success when update succeeds', async () => {
    const finalResult = { data: { id: 'b1' }, error: null }
    const inMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(finalResult),
      }),
    })
    const secondEqMock = vi.fn().mockReturnValue({
      in: inMock,
    })
    const firstEqMock = vi.fn().mockReturnValue({
      eq: secondEqMock,
    })

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'b1', status: 'pending', professional_id: 'prof-1' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: firstEqMock,
            }),
          }
        }
        return {}
      }),
    } as any

    const result = await confirmBookingService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
    expect(enqueueBookingCalendarSync).toHaveBeenCalledWith({
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'upsert_booking',
      source: 'booking.confirm',
    })
  })
})

describe('getBookingDetailService', () => {
  it('returns error for invalid bookingId', async () => {
    const result = await getBookingDetailService(mockSupabase(), 'user-1', 'prof-1', 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('inválido')
    }
  })

  it('returns error when booking not found', async () => {
    const supabase = mockSupabase({ bookings: { data: null, error: null } })
    const result = await getBookingDetailService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('não encontrado')
    }
  })

  it('returns error when user is not client or professional', async () => {
    const supabase = mockSupabase({
      bookings: {
        data: { user_id: 'other-user', professional_id: 'other-prof' },
        error: null,
      },
    })
    const result = await getBookingDetailService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('acesso')
    }
  })

  it('returns success for client owner', async () => {
    const supabase = mockSupabase({
      bookings: {
        data: { user_id: 'user-1', professional_id: 'prof-1', status: 'confirmed' },
        error: null,
      },
    })
    const result = await getBookingDetailService(supabase, 'user-1', null, '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeDefined()
    }
  })

  it('returns success for professional owner', async () => {
    const supabase = mockSupabase({
      bookings: {
        data: { user_id: 'client-1', professional_id: 'prof-1', status: 'confirmed' },
        error: null,
      },
    })
    const result = await getBookingDetailService(supabase, 'user-1', 'prof-1', '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
  })
})
