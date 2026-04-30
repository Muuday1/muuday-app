import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Mocks — must be at top level, no variables from outer scope
// ---------------------------------------------------------------------------

const mockStripeInstance = {
  prices: {
    list: vi.fn(),
    create: vi.fn(),
  },
  products: {
    create: vi.fn(),
  },
  customers: {
    list: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  subscriptions: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
}

const mockGetStripeClient = vi.fn(() => mockStripeInstance)

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: () => mockGetStripeClient(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

vi.mock('@/lib/config/env', () => ({
  env: {
    MONTHLY_SUBSCRIPTION_TRIAL_DAYS: 14,
    MONTHLY_SUBSCRIPTION_FEE_MINOR: 500,
    STRIPE_SUBSCRIPTION_PRODUCT_NAME: 'Muuday Pro Monthly',
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAdmin(tables: Record<string, any[]> = {}) {
  const inserted: any[] = []
  const updated: { table: string; data: any; match?: any }[] = []

  return {
    from: (table: string) => {
      const data = tables[table] || []
      let result = data

      const chain: any = {
        select: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: () => Promise.resolve({ data: result[0] || null, error: null }),
        single: () => Promise.resolve({ data: result[0] || null, error: null }),
        eq: (col: string, val: any) => {
          result = result.filter((r) => r[col] === val)
          return chain
        },
        in: (col: string, vals: any[]) => {
          result = result.filter((r) => vals.includes(r[col]))
          return chain
        },
        gte: () => chain,
        lte: () => chain,
        gt: () => chain,
        insert: (vals: any) => {
          inserted.push(vals)
          return {
            select: () => ({
              single: () => Promise.resolve({ data: vals, error: null }),
            }),
          }
        },
        update: (vals: any) => {
          updated.push({ table, data: vals })
          return {
            eq: (col: string, val: any) => {
              updated[updated.length - 1].match = { [col]: val }
              return Promise.resolve({ error: null })
            },
          }
        },
        upsert: () => Promise.resolve({ error: null }),
        then: (cb: (r: any) => any) => Promise.resolve(cb({ data: result, error: null })),
      }
      return chain
    },
    _inserted: inserted,
    _updated: updated,
  } as unknown as SupabaseClient & { _inserted: any[]; _updated: any[] }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createProfessionalSubscription', () => {
  beforeEach(() => {
    mockGetStripeClient.mockReturnValue(mockStripeInstance)
    vi.resetAllMocks()
    Object.values(mockStripeInstance).forEach((group: any) => {
      if (typeof group === 'object' && group !== null) {
        Object.values(group).forEach((fn: any) => {
          if (typeof fn === 'function' && 'mockReset' in fn) fn.mockReset()
        })
      }
    })
  })

  it('returns error when Stripe is not configured', async () => {
    mockGetStripeClient.mockReturnValueOnce(null as any)
    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin()
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Stripe not configured')
  })

  it('returns error when professional not found', async () => {
    mockStripeInstance.prices.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.products.create.mockResolvedValueOnce({ id: 'prod_1' })
    mockStripeInstance.prices.create.mockResolvedValueOnce({ id: 'price_1' })

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin()
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Professional not found')
  })

  it('returns error when profile email not found', async () => {
    mockStripeInstance.prices.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.products.create.mockResolvedValueOnce({ id: 'prod_1' })
    mockStripeInstance.prices.create.mockResolvedValueOnce({ id: 'price_1' })

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', email: null, first_name: 'Alice' }],
    })
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Profile email not found')
  })

  it('returns existing subscription when already active', async () => {
    mockStripeInstance.prices.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.products.create.mockResolvedValueOnce({ id: 'prod_1' })
    mockStripeInstance.prices.create.mockResolvedValueOnce({ id: 'price_1' })

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', email: 'alice@test.com', first_name: 'Alice' }],
      professional_subscriptions: [{ id: 'sub-1', professional_id: 'pro-1', stripe_subscription_id: 'stripe_sub_1', status: 'active' }],
    })
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(true)
    expect(result.subscriptionId).toBe('stripe_sub_1')
    expect(result.status).toBe('active')
  })

  it('creates new subscription with trial', async () => {
    mockStripeInstance.prices.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.products.create.mockResolvedValueOnce({ id: 'prod_1' })
    mockStripeInstance.prices.create.mockResolvedValueOnce({ id: 'price_1' })
    mockStripeInstance.customers.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.customers.create.mockResolvedValueOnce({ id: 'cus_1' })
    mockStripeInstance.subscriptions.create.mockResolvedValueOnce({
      id: 'sub_new_1',
      status: 'trialing',
      current_period_start: 1714000000,
      current_period_end: 1716600000,
      trial_start: 1714000000,
      trial_end: 1716600000,
      cancel_at_period_end: false,
    })

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', email: 'alice@test.com', first_name: 'Alice', last_name: 'Silva' }],
      professional_subscriptions: [],
    })
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(true)
    expect(result.subscriptionId).toBe('sub_new_1')
    expect(result.status).toBe('trialing')
    expect(admin._inserted).toHaveLength(1)
    expect(admin._inserted[0].stripe_subscription_id).toBe('sub_new_1')
  })

  it('reuses existing Stripe customer', async () => {
    mockStripeInstance.prices.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.products.create.mockResolvedValueOnce({ id: 'prod_1' })
    mockStripeInstance.prices.create.mockResolvedValueOnce({ id: 'price_1' })
    mockStripeInstance.customers.list.mockResolvedValueOnce({
      data: [{ id: 'cus_existing', metadata: { professional_id: 'pro-1', user_id: 'user-1' } }],
    })
    mockStripeInstance.subscriptions.create.mockResolvedValueOnce({
      id: 'sub_new_2',
      status: 'trialing',
      current_period_start: 1714000000,
      current_period_end: 1716600000,
      cancel_at_period_end: false,
    })

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', email: 'alice@test.com', first_name: 'Alice' }],
      professional_subscriptions: [],
    })
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(true)
    expect(mockStripeInstance.customers.create).not.toHaveBeenCalled()
  })

  it('updates customer metadata when mismatched', async () => {
    mockStripeInstance.prices.list.mockResolvedValueOnce({ data: [] })
    mockStripeInstance.products.create.mockResolvedValueOnce({ id: 'prod_1' })
    mockStripeInstance.prices.create.mockResolvedValueOnce({ id: 'price_1' })
    mockStripeInstance.customers.list.mockResolvedValueOnce({
      data: [{ id: 'cus_existing', metadata: { professional_id: 'old', user_id: 'old' } }],
    })
    mockStripeInstance.subscriptions.create.mockResolvedValueOnce({
      id: 'sub_new_3',
      status: 'trialing',
      current_period_start: 1714000000,
      current_period_end: 1716600000,
      cancel_at_period_end: false,
    })

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', email: 'alice@test.com', first_name: 'Alice' }],
      professional_subscriptions: [],
    })
    await createProfessionalSubscription(admin, 'pro-1')

    expect(mockStripeInstance.customers.update).toHaveBeenCalledWith('cus_existing', {
      metadata: { professional_id: 'pro-1', user_id: 'user-1' },
    })
  })

  it('catches and returns Stripe errors gracefully', async () => {
    mockStripeInstance.prices.list.mockRejectedValueOnce(new Error('Stripe API error'))

    const { createProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professionals: [{ id: 'pro-1', user_id: 'user-1' }],
      profiles: [{ id: 'user-1', email: 'alice@test.com', first_name: 'Alice' }],
    })
    const result = await createProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Stripe API error')
  })
})

// ---------------------------------------------------------------------------
// syncSubscriptionFromStripe
// ---------------------------------------------------------------------------

describe('syncSubscriptionFromStripe', () => {
  beforeEach(() => {
    mockGetStripeClient.mockReturnValue(mockStripeInstance)
    vi.resetAllMocks()
    Object.values(mockStripeInstance).forEach((group: any) => {
      if (typeof group === 'object' && group !== null) {
        Object.values(group).forEach((fn: any) => {
          if (typeof fn === 'function' && 'mockReset' in fn) fn.mockReset()
        })
      }
    })
  })

  it('returns error when Stripe not configured', async () => {
    mockGetStripeClient.mockReturnValueOnce(null as any)
    const { syncSubscriptionFromStripe } = await import('./manager')
    const admin = createMockAdmin()
    const result = await syncSubscriptionFromStripe(admin, 'stripe_sub_1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Stripe not configured')
  })

  it('updates existing subscription in DB', async () => {
    mockStripeInstance.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'stripe_sub_1',
      status: 'active',
      current_period_start: 1714000000,
      current_period_end: 1716600000,
      cancel_at_period_end: false,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
      metadata: { professional_id: 'pro-1' },
      customer: 'cus_1',
    })

    const { syncSubscriptionFromStripe } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [{ id: 'sub-1', stripe_subscription_id: 'stripe_sub_1', status: 'trialing', professional_id: 'pro-1' }],
    })
    const result = await syncSubscriptionFromStripe(admin, 'stripe_sub_1')

    expect(result.success).toBe(true)
    expect(result.status).toBe('active')
    expect(result.updated).toBe(true)
    expect(admin._updated.length).toBeGreaterThanOrEqual(1)
  })

  it('backfills subscription when not in DB', async () => {
    mockStripeInstance.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'stripe_sub_2',
      status: 'active',
      current_period_start: 1714000000,
      current_period_end: 1716600000,
      cancel_at_period_end: false,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
      metadata: { professional_id: 'pro-2' },
      customer: 'cus_2',
    })

    const { syncSubscriptionFromStripe } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [],
    })
    const result = await syncSubscriptionFromStripe(admin, 'stripe_sub_2')

    expect(result.success).toBe(true)
    expect(result.updated).toBe(true)
    expect(admin._inserted.length).toBeGreaterThanOrEqual(1)
  })

  it('returns error when DB find fails', async () => {
    mockStripeInstance.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'stripe_sub_1',
      status: 'active',
    })

    const { syncSubscriptionFromStripe } = await import('./manager')
    const mockAdmin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('db fail') }),
          }),
        }),
      }),
    } as unknown as SupabaseClient

    const result = await syncSubscriptionFromStripe(mockAdmin, 'stripe_sub_1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('db fail')
  })
})

// ---------------------------------------------------------------------------
// recordSubscriptionPayment
// ---------------------------------------------------------------------------

describe('recordSubscriptionPayment', () => {
  it('updates subscription on successful payment', async () => {
    const { recordSubscriptionPayment } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [
        { id: 'sub-1', stripe_subscription_id: 'stripe_sub_1', failure_count: 2, professional_id: 'pro-1', status: 'active' },
      ],
    })
    await recordSubscriptionPayment(admin, 'stripe_sub_1', {
      amountMinor: 500,
      currency: 'BRL',
      paidAt: new Date().toISOString(),
      invoiceId: 'inv_1',
    })

    expect(admin._updated.length).toBeGreaterThanOrEqual(1)
    const lastUpdate = admin._updated[admin._updated.length - 1]
    expect(lastUpdate.data.failure_count).toBe(0)
    expect(lastUpdate.data.last_failure_at).toBeNull()
  })

  it('returns early when subscription not found', async () => {
    const { recordSubscriptionPayment } = await import('./manager')
    const admin = createMockAdmin()
    const { captureMessage } = await import('@sentry/nextjs')
    await recordSubscriptionPayment(admin, 'stripe_sub_1', {
      amountMinor: 500,
      currency: 'BRL',
      paidAt: new Date().toISOString(),
      invoiceId: 'inv_1',
    })
    expect(captureMessage).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// recordSubscriptionPaymentFailure
// ---------------------------------------------------------------------------

describe('recordSubscriptionPaymentFailure', () => {
  it('increments failure count on failed payment', async () => {
    const { recordSubscriptionPaymentFailure } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [
        { id: 'sub-1', stripe_subscription_id: 'stripe_sub_1', failure_count: 1, professional_id: 'pro-1', status: 'past_due' },
      ],
    })
    await recordSubscriptionPaymentFailure(admin, 'stripe_sub_1', {
      failedAt: new Date().toISOString(),
      reason: 'card_declined',
    })

    expect(admin._updated.length).toBeGreaterThanOrEqual(1)
    const lastUpdate = admin._updated[admin._updated.length - 1]
    expect(lastUpdate.data.failure_count).toBe(2)
    expect(lastUpdate.data.last_failure_reason).toBe('card_declined')
  })

  it('returns early when subscription not found', async () => {
    const { recordSubscriptionPaymentFailure } = await import('./manager')
    const admin = createMockAdmin()
    const { captureMessage } = await import('@sentry/nextjs')
    await recordSubscriptionPaymentFailure(admin, 'stripe_sub_1', {
      failedAt: new Date().toISOString(),
    })
    expect(captureMessage).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// cancelProfessionalSubscription
// ---------------------------------------------------------------------------

describe('cancelProfessionalSubscription', () => {
  beforeEach(() => {
    mockGetStripeClient.mockReturnValue(mockStripeInstance)
    vi.resetAllMocks()
    Object.values(mockStripeInstance).forEach((group: any) => {
      if (typeof group === 'object' && group !== null) {
        Object.values(group).forEach((fn: any) => {
          if (typeof fn === 'function' && 'mockReset' in fn) fn.mockReset()
        })
      }
    })
  })

  it('returns error when Stripe not configured', async () => {
    mockGetStripeClient.mockReturnValueOnce(null as any)
    const { cancelProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin()
    const result = await cancelProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Stripe not configured')
  })

  it('returns error when no subscription found', async () => {
    const { cancelProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin()
    const result = await cancelProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('No subscription found')
  })

  it('cancels at period end by default', async () => {
    mockStripeInstance.subscriptions.update.mockResolvedValueOnce({})

    const { cancelProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [
        { id: 'sub-1', professional_id: 'pro-1', stripe_subscription_id: 'stripe_sub_1' },
      ],
    })
    const result = await cancelProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(true)
    expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('stripe_sub_1', { cancel_at_period_end: true })
    expect(mockStripeInstance.subscriptions.cancel).not.toHaveBeenCalled()
  })

  it('cancels immediately when atPeriodEnd is false', async () => {
    mockStripeInstance.subscriptions.cancel.mockResolvedValueOnce({})

    const { cancelProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [
        { id: 'sub-1', professional_id: 'pro-1', stripe_subscription_id: 'stripe_sub_1' },
      ],
    })
    const result = await cancelProfessionalSubscription(admin, 'pro-1', { atPeriodEnd: false })

    expect(result.success).toBe(true)
    expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith('stripe_sub_1')
    expect(mockStripeInstance.subscriptions.update).not.toHaveBeenCalled()
  })

  it('catches Stripe errors gracefully', async () => {
    mockStripeInstance.subscriptions.update.mockRejectedValueOnce(new Error('Stripe cancel error'))

    const { cancelProfessionalSubscription } = await import('./manager')
    const admin = createMockAdmin({
      professional_subscriptions: [
        { id: 'sub-1', professional_id: 'pro-1', stripe_subscription_id: 'stripe_sub_1' },
      ],
    })
    const result = await cancelProfessionalSubscription(admin, 'pro-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Stripe cancel error')
  })
})
