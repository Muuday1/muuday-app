import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Stripe before importing the route
const mockConstructEvent = vi.fn()
vi.mock('stripe', () => ({
  default: function MockStripe() {
    return {
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    }
  },
}))

import { POST, OPTIONS } from './route'

vi.mock('@/lib/http/cors', () => ({
  WEBHOOK_API_CORS_POLICY: {},
  evaluateCorsRequest: vi.fn(),
  applyCorsHeaders: vi.fn((response: any) => response),
  createCorsErrorResponse: vi.fn((_req, _policy) => new Response('CORS error', { status: 400 }) as any),
  createCorsPreflightResponse: vi.fn(() => new Response(null, { status: 204 })),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/http/client-ip', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/ops/stripe-resilience', () => ({
  recordStripeWebhookEvent: vi.fn(),
}))

vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: [] }),
  },
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}))

import { evaluateCorsRequest, applyCorsHeaders } from '@/lib/http/cors'
import { rateLimit } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordStripeWebhookEvent } from '@/lib/ops/stripe-resilience'
import { inngest } from '@/inngest/client'

const mockedEvaluateCorsRequest = vi.mocked(evaluateCorsRequest)
const mockedApplyCorsHeaders = vi.mocked(applyCorsHeaders)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedRecordStripeWebhookEvent = vi.mocked(recordStripeWebhookEvent)
const mockedInngestSend = vi.mocked(inngest.send)

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedEvaluateCorsRequest.mockReturnValue({ allowed: true, headers: {} } as any)
    mockedApplyCorsHeaders.mockImplementation((response: any) => response as any)
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, limit: 100, remaining: 99, source: 'memory' } as any)
    mockedCreateAdminClient.mockReturnValue({} as any)
    mockedRecordStripeWebhookEvent.mockResolvedValue({ id: 'evt-row-1', status: 'pending', inserted: true })
    mockedInngestSend.mockResolvedValue({ ids: [] } as any)
    mockConstructEvent.mockReturnValue({ id: 'evt_123', type: 'payment_intent.succeeded' })
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
  })

  function makeRequest(body: string, signature?: string) {
    return new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'stripe-signature': signature } : {}),
      },
      body,
    }) as any
  }

  it('returns 400 when CORS is not allowed', async () => {
    mockedEvaluateCorsRequest.mockReturnValue({ allowed: false, headers: {} } as any)

    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60, limit: 100, remaining: 0, source: 'memory' } as any)

    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(429)
  })

  it('returns 503 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(503)
  })

  it('returns 503 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(503)
  })

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const res = await POST(makeRequest('invalid-body', 'bad-signature'))
    expect(res.status).toBe(400)
  })

  it('returns 500 when admin client is not configured', async () => {
    mockedCreateAdminClient.mockReturnValue(null)

    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(500)
  })

  it('returns 500 when webhook persistence fails', async () => {
    mockedRecordStripeWebhookEvent.mockRejectedValue(new Error('DB write failed'))

    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(500)
  })

  it('returns 500 when Inngest enqueue fails', async () => {
    mockedInngestSend.mockRejectedValue(new Error('Inngest down'))

    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.enqueued).toBe(false)
  })

  it('returns 202 when webhook is persisted and enqueued successfully', async () => {
    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(202)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.enqueued).toBe(true)
    expect(json.webhookEventId).toBe('evt-row-1')
  })
})

describe('OPTIONS /api/webhooks/stripe', () => {
  it('returns 204 for CORS preflight', async () => {
    const res = await OPTIONS(new Request('http://localhost/api/webhooks/stripe', { method: 'OPTIONS' }) as any)
    expect(res.status).toBe(204)
  })
})
