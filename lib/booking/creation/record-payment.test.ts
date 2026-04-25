import { describe, it, expect, vi } from 'vitest'
import { recordBookingPayment } from './record-payment'

vi.mock('./logging', () => ({
  reportBookingError: vi.fn(),
  logBookingEvent: vi.fn(),
}))

function mockSupabase(paymentResult: { error: any } = { error: null }) {
  const updateMock = vi.fn().mockReturnValue({
    in: vi.fn().mockResolvedValue({ error: null }),
    eq: vi.fn().mockResolvedValue({ error: null }),
  })

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'payments') {
        return {
          insert: vi.fn().mockResolvedValue(paymentResult),
        }
      }
      if (table === 'bookings') {
        return { update: updateMock }
      }
      return {}
    }),
  } as any
}

describe('recordBookingPayment', () => {
  const paymentData = {
    user_id: 'u1',
    professional_id: 'p1',
    provider: 'stripe' as const,
    amount_total: 100,
    currency: 'BRL',
    status: 'requires_payment' as const,
    metadata: { bookingType: 'one_off' },
    captured_at: null,
  }

  it('inserts payment successfully', async () => {
    const supabase = mockSupabase({ error: null })

    await expect(
      recordBookingPayment(supabase, paymentData, ['b1'], 'b1', null),
    ).resolves.toBeUndefined()
  })

  it('throws and cancels bookings on payment error', async () => {
    const supabase = mockSupabase({ error: { message: 'payment failed' } })

    await expect(
      recordBookingPayment(supabase, paymentData, ['b1', 'b2'], 'b1', null),
    ).rejects.toThrow('Falha ao processar pagamento')
  })

  it('cancels by batch group id when provided', async () => {
    const supabase = mockSupabase({ error: { message: 'payment failed' } })

    await expect(
      recordBookingPayment(supabase, paymentData, ['b1'], 'b1', 'batch-1'),
    ).rejects.toThrow('Falha ao processar pagamento')
  })
})
