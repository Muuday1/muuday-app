import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/http/client-ip', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { rateLimit } from '@/lib/security/rate-limit'

const mockedCreateClient = vi.mocked(createClient)
const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedGetStripeClient = vi.mocked(getStripeClient)
const mockedRateLimit = vi.mocked(rateLimit)

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/stripe/payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/stripe/payment-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedGetStripeClient.mockReturnValue(null)
    mockedCreateAdminClient.mockReturnValue(null)
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid bookingId', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(401)
  })

  it('returns 404 when booking not found', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(404)
  })

  it('returns 403 when user does not own the booking', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'b1', user_id: 'u2', status: 'pending_payment' },
          error: null,
        }),
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(403)
  })

  it('returns 409 when booking status is not pending_payment', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'b1', user_id: 'u1', status: 'confirmed' },
          error: null,
        }),
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(409)
  })

  it('returns 404 when payment not found', async () => {
    let callCount = 0
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'b1', user_id: 'u1', status: 'pending_payment' },
              error: null,
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(404)
  })

  it('returns 409 when payment status is not requires_payment', async () => {
    let callCount = 0
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'b1', user_id: 'u1', status: 'pending_payment' },
              error: null,
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'p1', status: 'captured', provider_payment_id: null },
            error: null,
          }),
        }
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(409)
  })

  it('returns 503 when Stripe is unavailable', async () => {
    let callCount = 0
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'b1', user_id: 'u1', status: 'pending_payment' },
              error: null,
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'p1', status: 'requires_payment', provider_payment_id: null, amount_total_minor: 10000, currency: 'brl' },
            error: null,
          }),
        }
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)
    mockedGetStripeClient.mockReturnValue(null)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(503)
  })

  it('returns 200 with clientSecret for new PaymentIntent', async () => {
    let callCount = 0
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'user@example.com' } } }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'b1',
                user_id: 'u1',
                professional_id: 'prof-1',
                status: 'pending_payment',
                price_total: 100,
                user_currency: 'brl',
                professionals: { id: 'prof-1', user_id: 'p1', profiles: { first_name: 'Joao', last_name: 'Silva' } },
              },
              error: null,
            }),
          }
        }
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'p1', status: 'requires_payment', provider_payment_id: null, amount_total_minor: 10000, currency: 'brl' },
              error: null,
            }),
          }
        }
        if (table === 'stripe_customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return { select: vi.fn(), eq: vi.fn() }
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const mockStripe = {
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_test_123' }),
      },
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: 'pi_test_123',
          client_secret: 'pi_secret_123',
          status: 'requires_confirmation',
        }),
        retrieve: vi.fn(),
      },
    }
    mockedGetStripeClient.mockReturnValue(mockStripe as any)

    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }
    mockedCreateAdminClient.mockReturnValue(mockAdmin as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.clientSecret).toBe('pi_secret_123')
    expect(json.paymentIntentId).toBe('pi_test_123')
  })

  it('returns 200 with existing PaymentIntent when one already exists and is reusable', async () => {
    let callCount = 0
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'b1', user_id: 'u1', status: 'pending_payment' },
              error: null,
            }),
          }
        }
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'p1', status: 'requires_payment', provider_payment_id: 'pi_existing', amount_total_minor: 10000, currency: 'brl' },
              error: null,
            }),
          }
        }
        return { select: vi.fn(), eq: vi.fn() }
      }),
    }
    mockedCreateClient.mockResolvedValue(mockSupabase as any)

    const mockStripe = {
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'pi_existing',
          client_secret: 'pi_existing_secret',
          status: 'requires_payment_method',
        }),
      },
    }
    mockedGetStripeClient.mockReturnValue(mockStripe as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.clientSecret).toBe('pi_existing_secret')
    expect(json.paymentIntentId).toBe('pi_existing')
  })
})
