import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

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
  getConversations: vi.fn(),
  getOrCreateConversation: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getConversations, getOrCreateConversation } from '@/lib/chat/chat-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedGetConversations = vi.mocked(getConversations)
const mockedGetOrCreateConversation = vi.mocked(getOrCreateConversation)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(method: 'GET' | 'POST', url: string, body?: unknown) {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new Request(url, init) as any
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

describe('GET /api/v1/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns conversations for authenticated user', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetConversations.mockResolvedValue({
      success: true,
      data: {
        conversations: [
          {
            id: 'conv-1',
            bookingId: 'book-1',
            otherParticipantName: 'Dr. Silva',
            otherParticipantId: 'user-2',
            otherParticipantRole: 'professional',
            lastMessageContent: 'Olá',
            lastMessageSentAt: '2024-01-01T00:00:00Z',
            lastMessageSenderId: 'user-2',
            unreadCount: 1,
          },
        ],
      },
    })

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.conversations).toHaveLength(1)
    expect(body.data.conversations[0].otherParticipantName).toBe('Dr. Silva')
    expect(mockedGetConversations).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })
})

describe('POST /api/v1/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a conversation for authenticated user', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetOrCreateConversation.mockResolvedValue({
      success: true,
      data: { conversationId: 'conv-1' },
    })

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations', {
      bookingId: 'book-1',
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.conversationId).toBe('conv-1')
    expect(mockedGetOrCreateConversation).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'book-1',
    )
  })

  it('returns 400 when bookingId is missing', async () => {
    mockAuth('user-1')
    mockRateLimit(true)

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations', {})
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('bookingId is required')
  })
})
