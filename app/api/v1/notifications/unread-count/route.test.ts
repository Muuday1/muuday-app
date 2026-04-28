import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

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

vi.mock('@/lib/notifications/notification-service', () => ({
  getUnreadNotificationCount: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getUnreadNotificationCount } from '@/lib/notifications/notification-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedGetUnreadNotificationCount = vi.mocked(getUnreadNotificationCount)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeGetRequest() {
  return new Request('http://localhost/api/v1/notifications/unread-count', {
    method: 'GET',
  }) as any
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

describe('GET /api/v1/notifications/unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unread count for authenticated user', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetUnreadNotificationCount.mockResolvedValue({
      success: true,
      data: { count: 7 },
    })

    const request = makeGetRequest()
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.count).toBe(7)
    expect(mockedGetUnreadNotificationCount).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeGetRequest()
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeGetRequest()
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('returns 400 on service error', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetUnreadNotificationCount.mockResolvedValue({
      success: false,
      error: 'Database error',
    })

    const request = makeGetRequest()
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Database error')
  })
})
