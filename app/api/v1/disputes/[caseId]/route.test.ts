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

vi.mock('@/lib/admin/auth-helper', () => ({
  requireAdmin: vi.fn(),
  AdminAuthError: class AdminAuthError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AdminAuthError'
    }
  },
}))

vi.mock('@/lib/disputes/dispute-service', () => ({
  getCaseById: vi.fn(),
  resolveCase: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { getCaseById, resolveCase } from '@/lib/disputes/dispute-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedRequireAdmin = vi.mocked(requireAdmin)
const mockedGetCaseById = vi.mocked(getCaseById)
const mockedResolveCase = vi.mocked(resolveCase)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeGetRequest(caseId: string) {
  return new Request(`http://localhost/api/v1/disputes/${caseId}`, { method: 'GET' }) as any
}

function makePatchRequest(caseId: string, body: unknown) {
  return new Request(`http://localhost/api/v1/disputes/${caseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makeSupabaseClient(userId: string | null = 'user-1') {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }) },
  }
}

function makeParams(caseId: string) {
  return Promise.resolve({ caseId })
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('GET /api/v1/disputes/:caseId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedGetCaseById.mockResolvedValue({ success: true, data: { id: 'case-1' } as any })
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(429)
  })

  it('returns 401 when not authenticated', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient(null) as any)
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(401)
  })

  it('returns case for user', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('case-1')
    expect(mockedGetCaseById).toHaveBeenCalledWith(expect.anything(), 'user-1', 'case-1', false)
  })

  it('returns case for admin', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(200)
    expect(mockedGetCaseById).toHaveBeenCalledWith(expect.anything(), 'user-1', 'case-1', true)
  })

  it('returns 400 when getCaseById fails', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    mockedGetCaseById.mockResolvedValue({ success: false, error: 'Not found' })
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Not found')
  })
})

describe('PATCH /api/v1/disputes/:caseId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedResolveCase.mockResolvedValue({ success: true, data: { resolvedAt: '2026-01-01T00:00:00Z' } })
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await PATCH(makePatchRequest('case-1', { resolution: 'Resolved' }), { params: makeParams('case-1') })
    expect(res.status).toBe(429)
  })

  it('returns 403 when not admin', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    const { AdminAuthError } = await import('@/lib/admin/auth-helper')
    mockedRequireAdmin.mockRejectedValue(new AdminAuthError('Forbidden'))
    const res = await PATCH(makePatchRequest('case-1', { resolution: 'Resolved' }), { params: makeParams('case-1') })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const req = new Request('http://localhost/api/v1/disputes/case-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as any
    const res = await PATCH(req, { params: makeParams('case-1') })
    expect(res.status).toBe(400)
  })

  it('returns 400 when resolveCase fails', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    mockedResolveCase.mockResolvedValue({ success: false, error: 'Invalid resolution' })
    const res = await PATCH(makePatchRequest('case-1', { resolution: 'x' }), { params: makeParams('case-1') })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid resolution')
  })

  it('resolves case with refund amount', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const res = await PATCH(makePatchRequest('case-1', { resolution: 'Valid resolution', refundAmount: 50 }), { params: makeParams('case-1') })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.resolvedAt).toBe('2026-01-01T00:00:00Z')
    expect(mockedResolveCase).toHaveBeenCalledWith(
      expect.anything(),
      'admin-1',
      'case-1',
      'Valid resolution',
      50,
    )
  })

  it('resolves case without refund amount', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const res = await PATCH(makePatchRequest('case-1', { resolution: 'Valid resolution' }), { params: makeParams('case-1') })
    expect(res.status).toBe(200)
    expect(mockedResolveCase).toHaveBeenCalledWith(
      expect.anything(),
      'admin-1',
      'case-1',
      'Valid resolution',
      undefined,
    )
  })
})
