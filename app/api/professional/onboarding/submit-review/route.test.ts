import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/http/client-ip', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

vi.mock('@/lib/professional/current-professional', () => ({
  getPrimaryProfessionalForUser: vi.fn(),
}))

vi.mock('@/lib/professional/submit-review', () => ({
  submitProfessionalForReview: vi.fn(),
}))

vi.mock('@/lib/legal/professional-terms', () => ({
  PROFESSIONAL_REQUIRED_TERMS: ['terms_of_service', 'privacy_policy'],
  PROFESSIONAL_TERMS_VERSION: 'v2024.1',
}))

vi.mock('@/lib/email/resend-events', () => ({
  emitProfessionalProfileSubmitted: vi.fn().mockResolvedValue(undefined),
}))

import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { submitProfessionalForReview } from '@/lib/professional/submit-review'
import { emitProfessionalProfileSubmitted } from '@/lib/email/resend-events'

const mockedCreateClient = vi.mocked(createClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedGetPrimaryProfessional = vi.mocked(getPrimaryProfessionalForUser)
const mockedSubmitReview = vi.mocked(submitProfessionalForReview)
const mockedEmitSubmitted = vi.mocked(emitProfessionalProfileSubmitted)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/professional/onboarding/submit-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makeSupabaseClient(scenario: {
  user?: { id: string; email?: string } | null
  profile?: { role: string } | null
  termRows?: Array<{ term_key: string }>
  termError?: Error | null
  settingsError?: Error | null
} = {}) {
  const defaultUser = { id: 'user-1', email: 'pro@example.com' }
  const user = scenario.user === undefined ? defaultUser : scenario.user

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: scenario.profile === undefined ? { role: 'profissional' } : scenario.profile,
            error: null,
          }),
        }
      }
      if (table === 'professional_term_acceptances') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: scenario.termRows === undefined
              ? [{ term_key: 'terms_of_service' }, { term_key: 'privacy_policy' }]
              : scenario.termRows,
            error: scenario.termError === undefined ? null : scenario.termError,
          }),
        }
      }
      if (table === 'professional_settings') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: scenario.settingsError === undefined ? null : scenario.settingsError }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  } as any
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('POST /api/professional/onboarding/submit-review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, limit: 100, retryAfterSeconds: 0, source: 'memory' } as any)
    mockedGetPrimaryProfessional.mockResolvedValue({ data: { id: 'pro-1' }, error: null } as any)
    mockedSubmitReview.mockResolvedValue({
      ok: true,
      onboardingState: { snapshot: { professional: { status: 'pending_review' } }, evaluation: {} },
    } as any)
    mockedCreateClient.mockReturnValue(makeSupabaseClient())
  })

  it('returns 429 when rate limited', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 } as any)
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(429)
  })

  it('returns 401 when user is not authenticated', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseClient({ user: null }))
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not a professional', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseClient({ profile: { role: 'client' } }))
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(403)
  })

  it('returns 404 when professional profile not found', async () => {
    mockedGetPrimaryProfessional.mockResolvedValue({ data: null, error: null } as any)
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/professional/onboarding/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when terms not accepted', async () => {
    const res = await POST(makeRequest({ acceptedTerms: false }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when required terms are missing', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseClient({ termRows: [{ term_key: 'terms_of_service' }] }))
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('todos os termos obrigatórios')
  })

  it('returns 500 when term acceptance query fails', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseClient({ termError: new Error('db error') }))
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(500)
  })

  it('returns 500 when settings upsert fails', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseClient({ settingsError: new Error('constraint') }))
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(500)
  })

  it('returns 409 when submit is blocked', async () => {
    mockedSubmitReview.mockResolvedValue({ ok: false, code: 'blocked', error: 'already approved' })
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(409)
  })

  it('returns 400 when submit fails with generic error', async () => {
    mockedSubmitReview.mockResolvedValue({ ok: false, code: 'update_failed', error: 'db timeout' })
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(400)
  })

  it('successfully submits for review and emits event', async () => {
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(mockedEmitSubmitted).toHaveBeenCalledWith('pro@example.com', { professional_id: 'pro-1' })
  })

  it('does not emit event when user has no email', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseClient({ user: { id: 'user-1' } }))
    const res = await POST(makeRequest({ acceptedTerms: true }))
    expect(res.status).toBe(200)
    expect(mockedEmitSubmitted).not.toHaveBeenCalled()
  })
})
