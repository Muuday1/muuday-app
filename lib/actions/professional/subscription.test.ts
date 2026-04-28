import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfessionalSubscription, createCustomerPortalSession } from './subscription'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'

const mockedCreateClient = vi.mocked(createClient)
const mockedGetStripeClient = vi.mocked(getStripeClient)

function buildAuthClient(userId: string | null, seed: Record<string, unknown[]> = {}) {
  const dataMap: Record<string, unknown[]> = {
    professionals: seed.professionals ?? [],
    professional_subscriptions: seed.subscriptions ?? [],
    ...seed,
  }

  const fromFn = vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: dataMap[table]?.[0] ?? null,
      error: null,
    }),
  }))

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null }, error: null }),
    },
    from: fromFn,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProfessionalSubscription', () => {
  it('returns subscription for authenticated professional', async () => {
    mockedCreateClient.mockResolvedValue(
      buildAuthClient('user-1', {
        professionals: [{ id: 'pro-1' }],
        subscriptions: [{
          status: 'active',
          current_period_start: '2026-01-01',
          current_period_end: '2026-02-01',
          trial_end: null,
          cancel_at_period_end: false,
          amount_minor: 29900,
          currency: 'brl',
          failure_count: 0,
          last_payment_at: '2026-01-01',
          last_failure_at: null,
          created_at: '2026-01-01',
        }],
      }) as unknown as ReturnType<typeof mockedCreateClient> extends Promise<infer T> ? T : never,
    )

    const result = await getProfessionalSubscription()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.subscription).not.toBeNull()
      expect(result.subscription?.status).toBe('active')
      expect(result.subscription?.amountMinor).toBe(29900)
    }
  })

  it('returns null when no professional found', async () => {
    mockedCreateClient.mockResolvedValue(
      buildAuthClient('user-1', { professionals: [] }) as unknown as ReturnType<typeof mockedCreateClient> extends Promise<infer T> ? T : never,
    )

    const result = await getProfessionalSubscription()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.subscription).toBeNull()
    }
  })

  it('returns error when not authenticated', async () => {
    mockedCreateClient.mockResolvedValue(
      buildAuthClient(null) as unknown as ReturnType<typeof mockedCreateClient> extends Promise<infer T> ? T : never,
    )

    const result = await getProfessionalSubscription()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Não autenticado.')
    }
  })
})

describe('createCustomerPortalSession', () => {
  it('creates portal session for subscribed professional', async () => {
    mockedCreateClient.mockResolvedValue(
      buildAuthClient('user-1', {
        professionals: [{ id: 'pro-1' }],
        subscriptions: [{ stripe_customer_id: 'cus_123' }],
      }) as unknown as ReturnType<typeof mockedCreateClient> extends Promise<infer T> ? T : never,
    )

    mockedGetStripeClient.mockReturnValue({
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session/abc' }),
        },
      },
    } as unknown as NonNullable<ReturnType<typeof mockedGetStripeClient>>)

    const result = await createCustomerPortalSession()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.url).toBe('https://billing.stripe.com/session/abc')
    }
  })

  it('returns error when Stripe is not configured', async () => {
    mockedCreateClient.mockResolvedValue(
      buildAuthClient('user-1', {
        professionals: [{ id: 'pro-1' }],
        subscriptions: [{ stripe_customer_id: 'cus_123' }],
      }) as unknown as ReturnType<typeof mockedCreateClient> extends Promise<infer T> ? T : never,
    )

    mockedGetStripeClient.mockReturnValue(null)

    const result = await createCustomerPortalSession()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Stripe não configurado.')
    }
  })

  it('returns error when no subscription found', async () => {
    mockedCreateClient.mockResolvedValue(
      buildAuthClient('user-1', {
        professionals: [{ id: 'pro-1' }],
        subscriptions: [],
      }) as unknown as ReturnType<typeof mockedCreateClient> extends Promise<infer T> ? T : never,
    )

    mockedGetStripeClient.mockReturnValue({
      billingPortal: { sessions: { create: vi.fn() } },
    } as unknown as NonNullable<ReturnType<typeof mockedGetStripeClient>>)

    const result = await createCustomerPortalSession()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Assinatura não encontrada.')
    }
  })
})
