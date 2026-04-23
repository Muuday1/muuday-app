import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
}))

vi.mock('@/lib/http/client-ip', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/push/sender', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(1),
}))

import { createClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push/sender'

function createMockSupabase(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }
}

function createRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/push/test', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/push/test', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(createMockSupabase(null) as any)

    const response = await POST(createRequest())
    expect(response.status).toBe(401)

    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('sends test push notification', async () => {
    vi.mocked(createClient).mockResolvedValue(createMockSupabase('user-1') as any)

    const response = await POST(createRequest())
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.deliveredTo).toBe(1)

    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: 'Muuday',
        body: 'Notificações push estão funcionando!',
      }),
      expect.objectContaining({ notifType: 'platform_update' }),
    )
  })

  it('returns helpful message when no subscription exists', async () => {
    vi.mocked(createClient).mockResolvedValue(createMockSupabase('user-1') as any)
    vi.mocked(sendPushToUser).mockResolvedValue(0)

    const response = await POST(createRequest())
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.message).toContain('Nenhuma notificação enviada')
  })
})
