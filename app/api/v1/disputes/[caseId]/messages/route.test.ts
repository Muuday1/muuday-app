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
  addCaseMessage: vi.fn(),
  getCaseMessages: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { addCaseMessage, getCaseMessages } from '@/lib/disputes/dispute-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedRequireAdmin = vi.mocked(requireAdmin)
const mockedAddCaseMessage = vi.mocked(addCaseMessage)
const mockedGetCaseMessages = vi.mocked(getCaseMessages)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makePostRequest(caseId: string, body: unknown) {
  return new Request(`http://localhost/api/v1/disputes/${caseId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makeGetRequest(caseId: string) {
  return new Request(`http://localhost/api/v1/disputes/${caseId}/messages`, { method: 'GET' }) as any
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

describe('POST /api/v1/disputes/:caseId/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedAddCaseMessage.mockResolvedValue({ success: true, data: { messageId: 'msg-1' } })
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await POST(makePostRequest('case-1', { content: 'Hello' }), { params: makeParams('case-1') })
    expect(res.status).toBe(429)
  })

  it('returns 401 when not authenticated', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient(null) as any)
    const res = await POST(makePostRequest('case-1', { content: 'Hello' }), { params: makeParams('case-1') })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    const req = new Request('http://localhost/api/v1/disputes/case-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as any
    const res = await POST(req, { params: makeParams('case-1') })
    expect(res.status).toBe(400)
  })

  it('returns 400 when addCaseMessage fails', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    mockedAddCaseMessage.mockResolvedValue({ success: false, error: 'Cannot participate' })
    const res = await POST(makePostRequest('case-1', { content: 'Hello' }), { params: makeParams('case-1') })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Cannot participate')
  })

  it('creates message for regular user', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    const res = await POST(makePostRequest('case-1', { content: 'Hello' }), { params: makeParams('case-1') })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.messageId).toBe('msg-1')
    expect(mockedAddCaseMessage).toHaveBeenCalledWith(expect.anything(), 'user-1', 'case-1', 'Hello', false)
  })

  it('creates message for admin', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const res = await POST(makePostRequest('case-1', { content: 'Admin reply' }), { params: makeParams('case-1') })
    expect(res.status).toBe(201)
    expect(mockedAddCaseMessage).toHaveBeenCalledWith(expect.anything(), 'user-1', 'case-1', 'Admin reply', true)
  })
})

describe('GET /api/v1/disputes/:caseId/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 } as any)
    mockedGetCaseMessages.mockResolvedValue({ success: true, data: { messages: [{ id: 'msg-1', content: 'Hello' }] } })
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

  it('returns messages for user', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(mockedGetCaseMessages).toHaveBeenCalledWith(expect.anything(), 'user-1', 'case-1', false)
  })

  it('returns messages for admin', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' } as any)
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(200)
    expect(mockedGetCaseMessages).toHaveBeenCalledWith(expect.anything(), 'user-1', 'case-1', true)
  })

  it('returns 400 when getCaseMessages fails', async () => {
    mockedCreateApiClient.mockResolvedValue(makeSupabaseClient() as any)
    mockedRequireAdmin.mockRejectedValue(new Error('Not admin'))
    mockedGetCaseMessages.mockResolvedValue({ success: false, error: 'Not found' })
    const res = await GET(makeGetRequest('case-1'), { params: makeParams('case-1') })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Not found')
  })
})
