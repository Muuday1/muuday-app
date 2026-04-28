import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from './route'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/http/client-ip', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

vi.mock('@/lib/chat/chat-service', () => ({
  markConversationAsRead: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { markConversationAsRead } from '@/lib/chat/chat-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedMarkConversationAsRead = vi.mocked(markConversationAsRead)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(method: 'PATCH', url: string) {
  return new Request(url, { method }) as any
}

function mockAuth(userId: string | null) {
  mockedCreateApiClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: userId ? null : new Error('Unauthorized'),
      }),
    },
  } as any)
}

function mockRateLimit(allowed: boolean) {
  mockedRateLimit.mockResolvedValue({
    allowed,
    limit: 100,
    remaining: 99,
    retryAfterSeconds: null,
    source: 'memory',
  } as any)
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('PATCH /api/v1/conversations/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks conversation as read for authenticated participant', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedMarkConversationAsRead.mockResolvedValue({
      success: true,
      data: { updated: true },
    })

    const request = makeRequest('PATCH', 'http://localhost/api/v1/conversations/conv-1/read')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.updated).toBe(true)
    expect(mockedMarkConversationAsRead).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'conv-1',
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeRequest('PATCH', 'http://localhost/api/v1/conversations/conv-1/read')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeRequest('PATCH', 'http://localhost/api/v1/conversations/conv-1/read')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('returns 400 on service error', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedMarkConversationAsRead.mockResolvedValue({
      success: false,
      error: 'Você não participa desta conversa.',
    })

    const request = makeRequest('PATCH', 'http://localhost/api/v1/conversations/conv-1/read')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Você não participa desta conversa.')
  })
})
