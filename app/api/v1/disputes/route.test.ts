import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from './route'

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

vi.mock('@/lib/admin/auth-helper', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/disputes/dispute-service', () => ({
  openCase: vi.fn(),
  listCases: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { openCase, listCases } from '@/lib/disputes/dispute-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedRequireAdmin = vi.mocked(requireAdmin)
const mockedOpenCase = vi.mocked(openCase)
const mockedListCases = vi.mocked(listCases)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/v1/disputes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makeGetRequest(searchParams?: string) {
  return new Request(`http://localhost/api/v1/disputes${searchParams || ''}`, {
    method: 'GET',
  }) as any
}

function makeSupabaseClient(userId: string | null = 'user-1') {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }) },
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('POST /api/v1/disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedOpenCase.mockResolvedValue({ success: true, data: { caseId: 'case-1' } })
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await POST(makePostRequest({ bookingId: 'b1', type: 'refund_request', reason: 'test' }))
    expect(res.status).toBe(429)
  })

  it('returns 401 when not authenticated', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient(null) as any)
    const res = await POST(makePostRequest({ bookingId: 'b1', type: 'refund_request', reason: 'test' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    const req = new Request('http://localhost/api/v1/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when openCase fails', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedOpenCase.mockResolvedValue({ success: false, error: 'Invalid booking' })
    const res = await POST(makePostRequest({ bookingId: 'b1', type: 'refund_request', reason: 'test' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid booking')
  })

  it('returns 201 with caseId on success', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    const res = await POST(makePostRequest({ bookingId: 'b1', type: 'refund_request', reason: 'test' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.caseId).toBe('case-1')
    expect(mockedOpenCase).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'b1',
      'refund_request',
      'test',
    )
  })
})

describe('GET /api/v1/disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedListCases.mockResolvedValue({ success: true, data: { cases: [{ id: 'case-1' }], nextCursor: null } })
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(429)
  })

  it('returns 401 when not authenticated', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient(null) as any)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('returns cases for regular user', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(mockedListCases).toHaveBeenCalledWith(expect.anything(), 'user-1', false, { status: undefined, limit: 50, cursor: undefined })
  })

  it('returns cases for admin with filters', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const res = await GET(makeGetRequest('?status=open&limit=10&cursor=abc'))
    expect(res.status).toBe(200)
    expect(mockedListCases).toHaveBeenCalledWith(expect.anything(), 'user-1', true, { status: 'open', limit: 10, cursor: 'abc' })
  })

  it('returns 400 when listCases fails', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    mockedListCases.mockResolvedValue({ success: false, error: 'DB error' })
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })
})
