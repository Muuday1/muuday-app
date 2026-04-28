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

vi.mock('@/lib/notifications/notification-service', () => ({
  markNotificationAsRead: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { markNotificationAsRead } from '@/lib/notifications/notification-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedMarkNotificationAsRead = vi.mocked(markNotificationAsRead)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makePatchRequest(notificationId: string) {
  return new Request(`http://localhost/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
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

describe('PATCH /api/v1/notifications/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks a single notification as read', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedMarkNotificationAsRead.mockResolvedValue({
      success: true,
      data: { readAt: '2026-04-28T10:00:00Z' },
    })

    const request = makePatchRequest('notif-123')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'notif-123' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.readAt).toBe('2026-04-28T10:00:00Z')
    expect(mockedMarkNotificationAsRead).toHaveBeenCalledWith(expect.anything(), 'user-1', 'notif-123')
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)

    const request = makePatchRequest('notif-123')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'notif-123' }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockAuth('user-1')
    mockRateLimit(false)

    const request = makePatchRequest('notif-123')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'notif-123' }) })
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('returns 400 on service error', async () => {
    mockAuth('user-1')
    mockRateLimit(true)
    mockedMarkNotificationAsRead.mockResolvedValue({
      success: false,
      error: 'Notification not found',
    })

    const request = makePatchRequest('notif-123')
    const response = await PATCH(request, { params: Promise.resolve({ id: 'notif-123' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Notification not found')
  })
})
