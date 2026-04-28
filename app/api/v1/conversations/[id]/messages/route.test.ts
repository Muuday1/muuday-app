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
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getMessages, sendMessage } from '@/lib/chat/chat-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedGetMessages = vi.mocked(getMessages)
const mockedSendMessage = vi.mocked(sendMessage)

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

describe('GET /api/v1/conversations/:id/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns messages for authenticated participant', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetMessages.mockResolvedValue({
      success: true,
      data: {
        messages: [{ id: 'm1', content: 'hello' }],
        nextCursor: null,
      },
    })

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations/conv-1/messages?limit=10')
    const response = await GET(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.messages).toHaveLength(1)
    expect(body.data.nextCursor).toBeNull()
    expect(mockedGetMessages).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'conv-1',
      { limit: 10, cursor: undefined },
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations/conv-1/messages')
    const response = await GET(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations/conv-1/messages')
    const response = await GET(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('returns 400 on service error', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetMessages.mockResolvedValue({
      success: false,
      error: 'Você não participa desta conversa.',
    })

    const request = makeRequest('GET', 'http://localhost/api/v1/conversations/conv-1/messages')
    const response = await GET(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Você não participa desta conversa.')
  })
})

describe('POST /api/v1/conversations/:id/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends a message for authenticated participant', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedSendMessage.mockResolvedValue({
      success: true,
      data: { messageId: 'm1', sentAt: '2024-01-01T00:00:00Z' },
    })

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations/conv-1/messages', {
      content: 'Hello!',
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.messageId).toBe('m1')
    expect(mockedSendMessage).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'conv-1',
      'Hello!',
    )
  })

  it('returns 400 when content is missing', async () => {
    mockAuth('user-1')
    mockRateLimit(true)

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations/conv-1/messages', {})
    const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('content is required')
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations/conv-1/messages', {
      content: 'Hello',
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations/conv-1/messages', {
      content: 'Hello',
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('returns 400 on service error', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedSendMessage.mockResolvedValue({
      success: false,
      error: 'Mensagem não pode estar vazia.',
    })

    const request = makeRequest('POST', 'http://localhost/api/v1/conversations/conv-1/messages', {
      content: '   ',
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Mensagem não pode estar vazia.')
  })
})
