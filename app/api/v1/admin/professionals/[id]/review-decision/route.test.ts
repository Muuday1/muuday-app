import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
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

vi.mock('@/lib/admin/admin-service', () => ({
  reviewProfessionalDecisionService: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { reviewProfessionalDecisionService } from '@/lib/admin/admin-service'

const mockedCreateApiClient = vi.mocked(createApiClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedRequireAdmin = vi.mocked(requireAdmin)
const mockedReviewService = vi.mocked(reviewProfessionalDecisionService)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(professionalId: string, body: unknown) {
  return new Request(`http://localhost/api/v1/admin/professionals/${professionalId}/review-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makeParams(professionalId: string) {
  return Promise.resolve({ id: professionalId })
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('POST /api/v1/admin/professionals/[id]/review-decision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, limit: 100, retryAfterSeconds: 0, source: 'memory' } as any)
    mockedRequireAdmin.mockResolvedValue({ userId: 'admin-1' })
    mockedReviewService.mockResolvedValue({ success: true })
    mockedCreateApiClient.mockResolvedValue({} as any)
  })

  it('returns 403 when user is not admin', async () => {
    mockedRequireAdmin.mockRejectedValue(new (await import('@/lib/admin/auth-helper')).AdminAuthError('Acesso negado.'))
    const res = await POST(makeRequest('pro-1', { decision: 'approved' }), { params: makeParams('pro-1') })
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await POST(makeRequest('pro-1', { decision: 'approved' }), { params: makeParams('pro-1') })
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/v1/admin/professionals/pro-1/review-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as any
    const res = await POST(req, { params: makeParams('pro-1') })
    expect(res.status).toBe(400)
  })

  it('returns 400 when service returns error', async () => {
    mockedReviewService.mockResolvedValue({ success: false, error: 'Professional not found' })
    const res = await POST(makeRequest('pro-1', { decision: 'approved' }), { params: makeParams('pro-1') })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Professional not found')
  })

  it('returns 200 on successful approval', async () => {
    const res = await POST(
      makeRequest('550e8400-e29b-41d4-a716-446655440001', { decision: 'approved' }),
      { params: makeParams('550e8400-e29b-41d4-a716-446655440001') },
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('passes adjustments to service for needs_changes', async () => {
    const adjustments = [{ stageId: 'c2_professional_identity', fieldKey: 'photo', message: 'fix', severity: 'high' }]
    await POST(
      makeRequest('550e8400-e29b-41d4-a716-446655440001', { decision: 'needs_changes', note: 'fix photo', adjustments }),
      { params: makeParams('550e8400-e29b-41d4-a716-446655440001') },
    )
    expect(mockedReviewService).toHaveBeenCalledWith(
      expect.anything(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'needs_changes',
      'fix photo',
      adjustments,
    )
  })
})
