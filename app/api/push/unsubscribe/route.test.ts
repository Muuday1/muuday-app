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

describe('POST /api/push/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeRequest(body: unknown) {
    return new Request('http://localhost/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as any
  }

  it('returns 401 when not authenticated', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)

    const res = await POST(makeRequest({ endpoint: 'https://example.com' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid payload', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)

    const res = await POST(makeRequest({ endpoint: 'not-a-url' }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 30 } as any)

    const res = await POST(makeRequest({ endpoint: 'https://example.com' }))
    expect(res.status).toBe(429)
  })

  it('returns 200 and deletes subscription for valid request', async () => {
    const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnValue({ delete: mockDelete }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)

    const res = await POST(makeRequest({ endpoint: 'https://example.com/push' }))
    expect(res.status).toBe(200)
  })
})
