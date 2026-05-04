import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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

vi.mock('@/lib/config/app-url', () => ({
  getAppBaseUrl: vi.fn(() => 'https://app.muuday.com'),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { rateLimit } from '@/lib/security/rate-limit'

const mockedCreateClient = vi.mocked(createClient)
const mockedGetStripeClient = vi.mocked(getStripeClient)
const mockedRateLimit = vi.mocked(rateLimit)

function makeRequest(body: unknown) {
  const req = new Request('http://localhost/api/stripe/checkout-session/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
  req.nextUrl = new URL('http://localhost/api/stripe/checkout-session/booking')
  return req
}

describe('POST /api/stripe/checkout-session/booking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedGetStripeClient.mockReturnValue(null)
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/stripe/checkout-session/booking', {
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
            data: { id: 'p1', status: 'requires_payment', stripe_payment_intent_id: null, amount_total_minor: 10000, currency: 'brl' },
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

  it('returns 200 with sessionUrl for valid request', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'user@example.com' } } }) },
      rpc: vi.fn().mockResolvedValue({ error: null }),
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
              data: { id: 'p1', status: 'requires_payment', stripe_payment_intent_id: null, amount_total_minor: 10000, currency: 'brl' },
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
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/pay/cs_test_123',
            payment_intent: 'pi_test_123',
            customer: 'cus_test_123',
          }),
        },
      },
    }
    mockedGetStripeClient.mockReturnValue(mockStripe as any)

    const res = await POST(makeRequest({ bookingId: '550e8400-e29b-41d4-a716-446655440000' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.sessionUrl).toBe('https://checkout.stripe.com/pay/cs_test_123')
    expect(json.sessionId).toBe('cs_test_123')
  })
})
