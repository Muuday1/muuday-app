import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from './route'

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
  getNotifications: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getNotifications, markAllNotificationsAsRead } from '@/lib/notifications/notification-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedGetNotifications = vi.mocked(getNotifications)
const mockedMarkAllNotificationsAsRead = vi.mocked(markAllNotificationsAsRead)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(method: 'GET' | 'PATCH', url: string) {
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

describe('GET /api/v1/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns notifications for authenticated user', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetNotifications.mockResolvedValue({
      success: true,
      data: {
        notifications: [{ id: 'n1', title: 'Test', read: false }],
        nextCursor: null,
      },
    })

    const request = makeRequest('GET', 'http://localhost/api/v1/notifications?limit=10')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.nextCursor).toBeNull()
    expect(mockedGetNotifications).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      { limit: 10, cursor: undefined, unreadOnly: false },
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeRequest('GET', 'http://localhost/api/v1/notifications')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeRequest('GET', 'http://localhost/api/v1/notifications')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('passes unreadOnly query param', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedGetNotifications.mockResolvedValue({
      success: true,
      data: { notifications: [], nextCursor: null },
    })

    const request = makeRequest('GET', 'http://localhost/api/v1/notifications?unreadOnly=true')
    await GET(request)

    expect(mockedGetNotifications).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ unreadOnly: true }),
    )
  })
})

describe('PATCH /api/v1/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks all notifications as read', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedMarkAllNotificationsAsRead.mockResolvedValue({
      success: true,
      data: { updatedCount: 5 },
    })

    const request = makeRequest('PATCH', 'http://localhost/api/v1/notifications')
    const response = await PATCH(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.updatedCount).toBe(5)
    expect(mockedMarkAllNotificationsAsRead).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makeRequest('PATCH', 'http://localhost/api/v1/notifications')
    const response = await PATCH(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makeRequest('PATCH', 'http://localhost/api/v1/notifications')
    const response = await PATCH(request)
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('returns 400 on service error', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedMarkAllNotificationsAsRead.mockResolvedValue({
      success: false,
      error: 'Database error',
    })

    const request = makeRequest('PATCH', 'http://localhost/api/v1/notifications')
    const response = await PATCH(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Database error')
  })
})
