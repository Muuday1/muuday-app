import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/http/client-ip', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeRequest(body: unknown) {
    return new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as any
  }

  it('returns 401 when not authenticated', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)

    const res = await POST(makeRequest({ endpoint: 'https://example.com', keys: { p256dh: 'x', auth: 'y' } }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid payload', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)

    const res = await POST(makeRequest({ endpoint: 'not-a-url', keys: {} }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 30 } as any)

    const res = await POST(makeRequest({ endpoint: 'https://example.com', keys: { p256dh: 'x', auth: 'y' } }))
    expect(res.status).toBe(429)
  })

  it('returns 200 and upserts subscription for valid request', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)

    const res = await POST(makeRequest({ endpoint: 'https://example.com/push', keys: { p256dh: 'abc', auth: 'def' } }))
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        endpoint: 'https://example.com/push',
        p256dh: 'abc',
        auth: 'def',
      }),
      { onConflict: 'user_id,endpoint' },
    )
  })
})
