import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  loadProfessionalSubscriptions,
  adminCancelSubscription,
  adminCreateSubscriptionForProfessional,
} from './subscriptions'

vi.mock('../admin/shared', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/payments/subscription/manager', () => ({
  cancelProfessionalSubscription: vi.fn(),
  createProfessionalSubscription: vi.fn(),
}))

import { requireAdmin } from '../admin/shared'
import { rateLimit } from '@/lib/security/rate-limit'
import { cancelProfessionalSubscription } from '@/lib/payments/subscription/manager'

const mockedRequireAdmin = vi.mocked(requireAdmin)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedCancelSub = vi.mocked(cancelProfessionalSubscription)

function buildSupabaseClient(seed: {
  subscriptions?: unknown[]
  subscriptionCount?: number
  professionals?: unknown[]
  profiles?: unknown[]
} = {}) {
  const dataMap: Record<string, unknown[]> = {
    professional_subscriptions: seed.subscriptions ?? [],
    professionals: seed.professionals ?? [],
    profiles: seed.profiles ?? [],
  }

  const countMap: Record<string, number> = {
    professional_subscriptions: seed.subscriptionCount ?? (seed.subscriptions?.length || 0),
  }

  const fromFn = vi.fn().mockImplementation((table: string) => {
    const arrayData = dataMap[table] ?? []
    const singleData = arrayData[0] ?? null

    return {
      select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
        const baseChain = {
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockImplementation(() => {
            // Return a thenable that resolves to array data when awaited
            return {
              then: (onFulfilled: (v: unknown) => unknown) =>
                Promise.resolve(onFulfilled?.({ data: arrayData, error: null }) ?? { data: arrayData, error: null }),
            }
          }),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: arrayData,
            error: null,
            count: countMap[table] ?? arrayData.length,
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: singleData, error: null }),
          single: vi.fn().mockResolvedValue({ data: singleData, error: null }),
        }
        if (opts?.count) {
          return baseChain
        }
        return baseChain
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
    }
  })

  return {
    from: fromFn,
    auth: { getUser: vi.fn() },
  } as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase']
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedRateLimit.mockResolvedValue({ allowed: true, limit: 60, remaining: 59, retryAfterSeconds: 0, source: 'memory' as const })
})

describe('loadProfessionalSubscriptions', () => {
  it('returns subscriptions with professional names', async () => {
    const supabase = buildSupabaseClient({
      subscriptions: [
        {
          id: 'sub-1',
          professional_id: 'pro-1',
          stripe_subscription_id: 'stripe-sub-1',
          stripe_customer_id: 'cus-1',
          status: 'active',
          current_period_start: '2026-01-01',
          current_period_end: '2026-02-01',
          cancel_at_period_end: false,
          trial_end: null,
          amount_minor: 29900,
          currency: 'brl',
          failure_count: 0,
          last_payment_at: '2026-01-01',
          last_failure_at: null,
          created_at: '2026-01-01',
        },
      ],
      subscriptionCount: 1,
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', first_name: 'João', last_name: 'Silva', email: 'joao@example.com' }],
    })

    mockedRequireAdmin.mockResolvedValue({ supabase: supabase as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase'], userId: 'admin-1' })

    const result = await loadProfessionalSubscriptions()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.items).toHaveLength(1)
      expect(result.items[0].professionalName).toBe('João Silva')
      expect(result.items[0].professionalEmail).toBe('joao@example.com')
      expect(result.items[0].status).toBe('active')
      expect(result.total).toBe(1)
    }
  })

  it('filters by status', async () => {
    const supabase = buildSupabaseClient({
      subscriptions: [],
      subscriptionCount: 0,
    })

    mockedRequireAdmin.mockResolvedValue({ supabase: supabase as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase'], userId: 'admin-1' })

    const result = await loadProfessionalSubscriptions({ status: 'trial' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.items).toHaveLength(0)
    }
  })

  it('returns error on DB failure', async () => {
    const fromFn = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: 0 }),
    }))

    mockedRequireAdmin.mockResolvedValue({
      supabase: { from: fromFn, auth: { getUser: vi.fn() } } as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase'],
      userId: 'admin-1',
    })

    const result = await loadProfessionalSubscriptions()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('DB error')
    }
  })
})

describe('adminCancelSubscription', () => {
  it('cancels subscription at period end', async () => {
    const supabase = buildSupabaseClient({
      subscriptions: [{ stripe_subscription_id: 'sub-123' }],
    })

    mockedRequireAdmin.mockResolvedValue({ supabase: supabase as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase'], userId: 'admin-1' })
    mockedCancelSub.mockResolvedValue({ success: true })

    const result = await adminCancelSubscription('11111111-1111-1111-1111-111111111111')

    expect(mockedCancelSub).toHaveBeenCalledWith(
      expect.anything(),
      '11111111-1111-1111-1111-111111111111',
      {},
    )
    expect(result.success).toBe(true)
  })

  it('rejects invalid professional ID', async () => {
    const supabase = buildSupabaseClient()
    mockedRequireAdmin.mockResolvedValue({ supabase: supabase as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase'], userId: 'admin-1' })

    const result = await adminCancelSubscription('not-a-uuid')

    expect(result.success).toBe(false)
    expect(mockedCancelSub).not.toHaveBeenCalled()
  })

  it('returns error when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, limit: 60, remaining: 0, retryAfterSeconds: 60, source: 'memory' as const })
    const supabase = buildSupabaseClient()
    mockedRequireAdmin.mockResolvedValue({ supabase: supabase as unknown as Awaited<ReturnType<typeof mockedRequireAdmin>>['supabase'], userId: 'admin-1' })

    const result = await adminCancelSubscription('11111111-1111-1111-1111-111111111111')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Muitas tentativas')
  })
})
