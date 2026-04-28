import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/professional/public-visibility', () => ({
  recomputeProfessionalVisibility: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/email/resend', () => ({
  sendProfileApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendProfileNeedsChangesEmail: vi.fn().mockResolvedValue(undefined),
  sendProfileRejectedEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/email/resend-events', () => ({
  emitProfessionalProfileApproved: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/payments/subscription/manager', () => ({
  createProfessionalSubscription: vi.fn().mockResolvedValue({ success: true }),
}))

import {
  reviewProfessionalDecisionService,
  restoreLatestReviewAdjustmentsService,
} from './admin-service'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import {
  sendProfileApprovedEmail,
  sendProfileNeedsChangesEmail,
  sendProfileRejectedEmail,
} from '@/lib/email/resend'
import { emitProfessionalProfileApproved } from '@/lib/email/resend-events'
import { createProfessionalSubscription } from '@/lib/payments/subscription/manager'

const mockedRecomputeVisibility = vi.mocked(recomputeProfessionalVisibility)
const mockedSendApproved = vi.mocked(sendProfileApprovedEmail)
const mockedSendNeedsChanges = vi.mocked(sendProfileNeedsChangesEmail)
const mockedSendRejected = vi.mocked(sendProfileRejectedEmail)
const mockedEmitApproved = vi.mocked(emitProfessionalProfileApproved)
const mockedCreateSubscription = vi.mocked(createProfessionalSubscription)

// ─── Helpers ──────────────────────────────────────────────────────────────

function assertError(result: { success: boolean; error?: string }): asserts result is { success: false; error: string } {
  expect(result.success).toBe(false)
}

function orDefault<T>(value: T | undefined, defaultValue: T): T {
  return value === undefined ? defaultValue : value
}

function makeSupabaseClient(scenario: {
  professional?: Record<string, unknown> | null
  professionalError?: Error | null
  updateError?: Error | null
  closeAdjustmentsError?: Error | null
  insertAdjustmentsError?: Error | null
  owner?: Record<string, unknown> | null
  ownerError?: Error | null
  auditError?: Error | null
} = {}) {
  const defaultProfessional = {
    id: 'pro-1',
    user_id: 'user-1',
    status: 'pending_review',
    admin_review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    first_booking_enabled: false,
    first_booking_gate_note: null,
    first_booking_gate_updated_at: null,
    updated_at: '2024-01-01T00:00:00Z',
  }

  const chains = new Map<string, Record<string, any>>()

  function getChain(table: string) {
    if (!chains.has(table)) {
      chains.set(table, {})
    }
    return chains.get(table)!
  }

  function makeBuilder(table: string, overrides: Record<string, any> = {}) {
    const chain = getChain(table)
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      ...overrides,
    }
    Object.assign(chain, builder)
    return builder
  }

  // Professionals chain
  const proBuilder = makeBuilder('professionals')
  proBuilder.maybeSingle.mockResolvedValue({
    data: orDefault(scenario.professional, defaultProfessional),
    error: orDefault(scenario.professionalError, null),
  })
  proBuilder.update.mockImplementation(() => ({
    eq: vi.fn().mockResolvedValue({ error: orDefault(scenario.updateError, null) }),
  }))

  // Adjustments chain
  const adjBuilder = makeBuilder('professional_review_adjustments')
  adjBuilder.update.mockImplementation(() => ({
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ error: orDefault(scenario.closeAdjustmentsError, null) }),
  }))
  adjBuilder.insert.mockResolvedValue({ error: orDefault(scenario.insertAdjustmentsError, null) })

  // Profiles chain
  const profileBuilder = makeBuilder('profiles')
  profileBuilder.maybeSingle.mockResolvedValue({
    data: orDefault(scenario.owner, { email: 'pro@example.com', full_name: 'Dr. Silva' }),
    error: orDefault(scenario.ownerError, null),
  })

  // Audit log chain
  const auditBuilder = makeBuilder('admin_audit_log')
  auditBuilder.insert.mockResolvedValue({ error: orDefault(scenario.auditError, null) })

  return {
    from: vi.fn().mockImplementation((table: string) => {
      const chain = getChain(table)
      return { ...chain }
    }),
  } as unknown as Parameters<typeof reviewProfessionalDecisionService>[0]
}

// ─── Tests: reviewProfessionalDecisionService ─────────────────────────────

describe('reviewProfessionalDecisionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validation error for invalid professionalId', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      'not-a-uuid',
      'approved',
    )
    assertError(result)
    expect(result.error).toContain('Identificador de profissional')
  })

  it('returns validation error for invalid decision', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'invalid' as any,
    )
    assertError(result)
  })

  it('returns error when professional is not found', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient({ professional: null }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    assertError(result)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when needs_changes without adjustments', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'needs_changes',
      'needs work',
      [],
    )
    assertError(result)
    expect(result.error).toContain('pelo menos um ajuste')
  })

  it('returns error when rejected without adjustments', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'rejected',
      'rejected',
      [],
    )
    assertError(result)
    expect(result.error).toContain('pelo menos um ajuste')
  })

  it('returns error for unsupported adjustment key', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'needs_changes',
      'fix this',
      [{ stageId: 'c2_professional_identity', fieldKey: 'nonexistent_field', message: 'fix', severity: 'medium' }],
    )
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('approves professional successfully', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    expect(result.success).toBe(true)
    expect(mockedSendApproved).toHaveBeenCalledWith('pro@example.com', 'Dr. Silva')
    expect(mockedEmitApproved).toHaveBeenCalled()
    expect(mockedCreateSubscription).toHaveBeenCalled()
    expect(mockedRecomputeVisibility).toHaveBeenCalled()
  })

  it('sends needs_changes email with structured message', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'needs_changes',
      'Please update your photo.',
      [{ stageId: 'c2_professional_identity', fieldKey: 'photo', message: 'Photo too blurry', severity: 'high' }],
    )
    expect(result.success).toBe(true)
    expect(mockedSendNeedsChanges).toHaveBeenCalled()
    const callArgs = mockedSendNeedsChanges.mock.calls[0]
    expect(callArgs[0]).toBe('pro@example.com')
    expect(callArgs[2]).toContain('Photo too blurry')
    expect(mockedRecomputeVisibility).toHaveBeenCalled()
  })

  it('sends rejected email with structured message', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'rejected',
      'Does not meet requirements.',
      [{ stageId: 'c4_services', fieldKey: 'service_price', message: 'Price too high', severity: 'medium' }],
    )
    expect(result.success).toBe(true)
    expect(mockedSendRejected).toHaveBeenCalled()
    expect(mockedRecomputeVisibility).toHaveBeenCalled()
  })

  it('rolls back professional update when closing adjustments fails on approval', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient({ closeAdjustmentsError: new Error('db lock') }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    assertError(result)
    expect(result.error).toContain('concluir os ajustes')
  })

  it('rolls back professional update when insert adjustments fails on needs_changes', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient({ insertAdjustmentsError: new Error('constraint violation') }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'needs_changes',
      'fix this',
      [{ stageId: 'c2_professional_identity', fieldKey: 'photo', message: 'fix', severity: 'medium' }],
    )
    assertError(result)
    expect(result.error).toContain('registrar os ajustes')
  })

  it('succeeds when audit log fails (fail-open by default)', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient({ auditError: new Error('audit write failed') }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    expect(result.success).toBe(true)
  })

  it('still succeeds when email provider is unavailable', async () => {
    mockedSendApproved.mockRejectedValueOnce(new Error('SMTP down'))
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    expect(result.success).toBe(true)
  })

  it('still succeeds when owner profile has no email', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient({ owner: { email: null, full_name: 'Dr. Silva' } }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    expect(result.success).toBe(true)
    expect(mockedSendApproved).not.toHaveBeenCalled()
  })

  it('still succeeds when subscription creation fails', async () => {
    mockedCreateSubscription.mockResolvedValueOnce({ success: false, error: 'card declined' })
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'approved',
    )
    expect(result.success).toBe(true)
  })

  it('deduplicates adjustments by stageId::fieldKey', async () => {
    const result = await reviewProfessionalDecisionService(
      makeSupabaseClient(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
      'needs_changes',
      'fix',
      [
        { stageId: 'c2_professional_identity', fieldKey: 'photo', message: 'first', severity: 'medium' },
        { stageId: 'c2_professional_identity', fieldKey: 'photo', message: 'second', severity: 'high' },
      ],
    )
    expect(result.success).toBe(true)
  })
})

// ─── Tests: restoreLatestReviewAdjustmentsService ─────────────────────────

describe('restoreLatestReviewAdjustmentsService', () => {
  function makeRestoreSupabase(scenario: {
    professional?: Record<string, unknown> | null
    openRows?: Array<Record<string, unknown>>
    historicalRows?: Array<Record<string, unknown>>
    reopenError?: Error | null
    auditError?: Error | null
  } = {}) {
    const defaultProfessional = { id: 'pro-1', status: 'needs_changes', updated_at: '2024-01-01T00:00:00Z' }

    const chains = new Map<string, any>()

    function getChain(table: string) {
      if (!chains.has(table)) chains.set(table, {})
      return chains.get(table)
    }

    // professionals chain
    const proChain = getChain('professionals')
    Object.assign(proChain, {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: orDefault(scenario.professional, defaultProfessional),
        error: null,
      }),
    })

    // adjustments chain
    const adjChain = getChain('professional_review_adjustments')
    let queryCallCount = 0
    Object.assign(adjChain, {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => {
        queryCallCount++
        if (queryCallCount === 1) {
          // First query ends at .limit(1) — return chain so limit() can be called
          return adjChain
        }
        // Second query ends at .order() — resolve with historical rows
        return Promise.resolve({
          data: orDefault(scenario.historicalRows, [
            { id: 'adj-1', stage_id: 'c2_professional_identity', field_key: 'photo', status: 'resolved_by_admin', created_at: '2024-01-01T00:00:00Z' },
          ]),
          error: null,
        })
      }),
      limit: vi.fn().mockImplementation(() => {
        queryCallCount++
        return Promise.resolve({ data: orDefault(scenario.openRows, []), error: null })
      }),
      update: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: orDefault(scenario.reopenError, null) }),
      })),
    })

    // audit chain
    const auditChain = getChain('admin_audit_log')
    Object.assign(auditChain, {
      insert: vi.fn().mockResolvedValue({ error: orDefault(scenario.auditError, null) }),
    })

    return {
      from: vi.fn().mockImplementation((table: string) => ({ ...getChain(table) })),
    } as unknown as Parameters<typeof restoreLatestReviewAdjustmentsService>[0]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when professional is not found', async () => {
    const result = await restoreLatestReviewAdjustmentsService(
      makeRestoreSupabase({ professional: null }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
    )
    assertError(result)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when professional status is not needs_changes or rejected', async () => {
    const result = await restoreLatestReviewAdjustmentsService(
      makeRestoreSupabase({ professional: { id: 'pro-1', status: 'approved', updated_at: '2024-01-01T00:00:00Z' } }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
    )
    assertError(result)
    expect(result.error).toContain('só está disponível')
  })

  it('returns error when open adjustments already exist', async () => {
    const result = await restoreLatestReviewAdjustmentsService(
      makeRestoreSupabase({ openRows: [{ id: 'adj-open' }] }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
    )
    assertError(result)
    expect(result.error).toContain('já possui ajustes')
  })

  it('returns error when no historical adjustments exist', async () => {
    const result = await restoreLatestReviewAdjustmentsService(
      makeRestoreSupabase({ historicalRows: [] }),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
    )
    assertError(result)
    expect(result.error).toContain('Não há uma rodada anterior')
  })

  it('successfully restores latest adjustments', async () => {
    const result = await restoreLatestReviewAdjustmentsService(
      makeRestoreSupabase(),
      'admin-1',
      '550e8400-e29b-41d4-a716-446655440001',
    )
    expect(result.success).toBe(true)
  })
})
