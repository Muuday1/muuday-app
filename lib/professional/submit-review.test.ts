import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitProfessionalForReview } from './submit-review'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('./onboarding-state', () => ({
  loadProfessionalOnboardingState: vi.fn(),
}))

vi.mock('./public-visibility', () => ({
  recomputeProfessionalVisibility: vi.fn().mockResolvedValue({ ok: true, professionalId: 'pro-1', isPubliclyVisible: false, visibilityCheckedAt: '2024-01-01T00:00:00Z' }),
}))

import { loadProfessionalOnboardingState } from './onboarding-state'
import { recomputeProfessionalVisibility } from './public-visibility'

const mockedLoadState = vi.mocked(loadProfessionalOnboardingState)
const mockedRecomputeVisibility = vi.mocked(recomputeProfessionalVisibility)

// ─── Helpers ──────────────────────────────────────────────────────────────

function assertError(result: { ok: boolean; error?: string }): asserts result is { ok: false; error: string } {
  expect(result.ok).toBe(false)
}

function makeOnboardingState(overrides: {
  status?: string
  canSubmitForReview?: boolean
} = {}) {
  return {
    snapshot: {
      professional: { status: overrides.status ?? 'draft' },
    },
    evaluation: {
      summary: {
        canSubmitForReview: overrides.canSubmitForReview ?? true,
      },
      gates: {
        first_booking_acceptance: { blockers: [] },
      },
    },
  }
}

function makeSupabaseClient(updateResult: { error: Error | null } = { error: null }) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'professionals') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: updateResult.error }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  } as unknown as Parameters<typeof submitProfessionalForReview>[0]
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('submitProfessionalForReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRecomputeVisibility.mockResolvedValue({ ok: true, professionalId: 'pro-1', isPubliclyVisible: false, visibilityCheckedAt: '2024-01-01T00:00:00Z' })
  })

  it('returns missing_state when onboarding state cannot be loaded', async () => {
    mockedLoadState.mockResolvedValue(null)
    const result = await submitProfessionalForReview(makeSupabaseClient(), 'pro-1')
    assertError(result)
    expect(result.code).toBe('missing_state')
    expect(result.error).toContain('Não foi possível')
  })

  it('returns blocked when professional is already approved', async () => {
    mockedLoadState.mockResolvedValue(makeOnboardingState({ status: 'approved' }) as any)
    const result = await submitProfessionalForReview(makeSupabaseClient(), 'pro-1')
    assertError(result)
    expect(result.code).toBe('blocked')
    expect(result.error).toContain('já aprovado')
  })

  it('returns blocked when mandatory items are pending', async () => {
    mockedLoadState.mockResolvedValue(
      makeOnboardingState({ status: 'draft', canSubmitForReview: false }) as any,
    )
    const result = await submitProfessionalForReview(makeSupabaseClient(), 'pro-1')
    assertError(result)
    expect(result.code).toBe('blocked')
    expect(result.error).toContain('pendências obrigatórias')
  })

  it('returns update_failed when database update fails', async () => {
    mockedLoadState.mockResolvedValue(makeOnboardingState({ status: 'draft' }) as any)
    const dbError = new Error('connection timeout')
    const result = await submitProfessionalForReview(
      makeSupabaseClient({ error: dbError }),
      'pro-1',
    )
    assertError(result)
    expect(result.code).toBe('update_failed')
    expect(result.error).toContain('Não foi possível enviar')
  })

  it('successfully submits for review and refreshes state', async () => {
    const initialState = makeOnboardingState({ status: 'draft' })
    const refreshedState = makeOnboardingState({ status: 'pending_review' })
    mockedLoadState
      .mockResolvedValueOnce(initialState as any)
      .mockResolvedValueOnce(refreshedState as any)

    const supabase = makeSupabaseClient()
    const result = await submitProfessionalForReview(supabase, 'pro-1')

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected ok')
    expect(result.onboardingState).toBe(refreshedState)
    expect(mockedRecomputeVisibility).toHaveBeenCalledWith(supabase, 'pro-1')
  })

  it('returns missing_state when refreshed state cannot be loaded after update', async () => {
    mockedLoadState.mockResolvedValueOnce(makeOnboardingState({ status: 'draft' }) as any)
    mockedLoadState.mockResolvedValueOnce(null)

    const result = await submitProfessionalForReview(makeSupabaseClient(), 'pro-1')
    assertError(result)
    expect(result.code).toBe('missing_state')
    expect(result.error).toContain('não foi possível atualizar o tracker')
  })

  it('is case-insensitive for approved status', async () => {
    mockedLoadState.mockResolvedValue(makeOnboardingState({ status: 'APPROVED' }) as any)
    const result = await submitProfessionalForReview(makeSupabaseClient(), 'pro-1')
    assertError(result)
    expect(result.code).toBe('blocked')
  })
})
