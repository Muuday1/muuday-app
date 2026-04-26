import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/payments/trolley/client', () => ({
  verifyTWebhookSignature: vi.fn(),
}))

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

vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: [] }),
  },
}))

import { POST, OPTIONS } from './route'
import { evaluateCorsRequest, applyCorsHeaders } from '@/lib/http/cors'
import { rateLimit } from '@/lib/security/rate-limit'
import { inngest } from '@/inngest/client'
import { verifyTWebhookSignature } from '@/lib/payments/trolley/client'

const mockedEvaluateCorsRequest = vi.mocked(evaluateCorsRequest)
const mockedApplyCorsHeaders = vi.mocked(applyCorsHeaders)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedInngestSend = vi.mocked(inngest.send)
const mockedVerifySignature = vi.mocked(verifyTWebhookSignature)

describe('POST /api/webhooks/trolley', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedEvaluateCorsRequest.mockReturnValue({ allowed: true, headers: {} } as any)
    mockedApplyCorsHeaders.mockImplementation((response: any) => response as any)
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, limit: 100, remaining: 99, source: 'memory' } as any)
    mockedInngestSend.mockResolvedValue({ ids: [] } as any)
    mockedVerifySignature.mockReturnValue(true)
  })

  function makeRequest(body: string, headers?: Record<string, string>) {
    return new Request('http://localhost/api/webhooks/trolley', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
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

    const res = await POST(makeRequest('{}', { 'x-trolley-signature': 't=1,v1=abc' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 when signature verification fails', async () => {
    mockedVerifySignature.mockReturnValue(false)

    const res = await POST(makeRequest('{}', { 'x-trolley-signature': 't=1,v1=bad' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Assinatura')
  })

  it('returns 400 when payload is not valid JSON', async () => {
    const res = await POST(makeRequest('not-json', { 'x-trolley-signature': 't=1,v1=abc' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('JSON')
  })

  it('returns 500 when Inngest enqueue fails', async () => {
    mockedInngestSend.mockRejectedValue(new Error('Inngest down'))

    const res = await POST(makeRequest('{"type":"payment.updated"}', { 'x-trolley-signature': 't=1,v1=abc' }))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('enfileirar')
  })

  it('returns 202 and enqueues event on success', async () => {
    const res = await POST(makeRequest('{"type":"payment.updated","id":"pay-1"}', { 'x-trolley-signature': 't=1,v1=abc' }))
    expect(res.status).toBe(202)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(mockedInngestSend).toHaveBeenCalledWith(expect.objectContaining({
      name: 'trolley/webhook.received',
      data: expect.objectContaining({ eventType: 'payment.updated' }),
    }))
  })

  it('passes correct payload to signature verification', async () => {
    const payload = '{"type":"payment.updated"}'
    await POST(makeRequest(payload, { 'x-trolley-signature': 't=1,v1=abc' }))

    expect(mockedVerifySignature).toHaveBeenCalledWith(payload, 't=1,v1=abc')
  })

  it('skips signature verification when no signature header is present', async () => {
    const res = await POST(makeRequest('{"type":"payment.updated"}'))
    expect(res.status).toBe(202)
    expect(mockedVerifySignature).not.toHaveBeenCalled()
  })
})

describe('OPTIONS /api/webhooks/trolley', () => {
  it('returns 204 for CORS preflight', async () => {
    const res = await OPTIONS(new Request('http://localhost/api/webhooks/trolley', { method: 'OPTIONS' }) as any)
    expect(res.status).toBe(204)
  })
})
