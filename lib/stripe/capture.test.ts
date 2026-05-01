import { describe, it, expect, vi, beforeEach } from 'vitest'
import { captureBookingPayment } from './capture'

// Mock Stripe client
const mockStripeCapture = vi.fn()

vi.mock('./client', () => ({
  getStripeClient: vi.fn(() => ({
    paymentIntents: {
      capture: mockStripeCapture,
    },
  })),
}))

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}))

function buildAdminClient(overrides?: Record<string, unknown>) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    ...overrides,
  } as unknown as Parameters<typeof captureBookingPayment>[0]
}

describe('captureBookingPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success when payment is already captured', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'pay-1',
            provider_payment_id: 'pi_test_123',
            status: 'captured',
            amount_total_minor: 10000,
          },
          error: null,
        }),
      }),
    })

    const result = await captureBookingPayment(admin, 'booking-1')
    expect(result.success).toBe(true)
    expect(result.captured).toBe(true)
    expect(mockStripeCapture).not.toHaveBeenCalled()
  })

  it('returns error when no payment found', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    const result = await captureBookingPayment(admin, 'booking-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('No payment found')
  })

  it('captures PaymentIntent when payment requires capture', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'pay-1',
            provider_payment_id: 'pi_test_123',
            status: 'requires_payment',
            amount_total_minor: 10000,
          },
          error: null,
        }),
      }),
    })

    mockStripeCapture.mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded',
      amount_received: 10000,
    })

    const result = await captureBookingPayment(admin, 'booking-1')
    expect(result.success).toBe(true)
    expect(result.captured).toBe(true)
    expect(mockStripeCapture).toHaveBeenCalledWith('pi_test_123')
  })

  it('returns error when Stripe capture fails', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'pay-1',
            provider_payment_id: 'pi_test_123',
            status: 'requires_payment',
            amount_total_minor: 10000,
          },
          error: null,
        }),
      }),
    })

    mockStripeCapture.mockRejectedValue(new Error('Card expired'))

    const result = await captureBookingPayment(admin, 'booking-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Card expired')
  })

  it('returns error when payment was refunded', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'pay-1',
            provider_payment_id: 'pi_test_123',
            status: 'refunded',
            amount_total_minor: 10000,
          },
          error: null,
        }),
      }),
    })

    const result = await captureBookingPayment(admin, 'booking-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('refunded')
    expect(mockStripeCapture).not.toHaveBeenCalled()
  })

  it('returns error when no provider_payment_id exists', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'pay-1',
            provider_payment_id: null,
            status: 'requires_payment',
            amount_total_minor: 10000,
          },
          error: null,
        }),
      }),
    })

    const result = await captureBookingPayment(admin, 'booking-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('No provider_payment_id')
    expect(mockStripeCapture).not.toHaveBeenCalled()
  })
})
