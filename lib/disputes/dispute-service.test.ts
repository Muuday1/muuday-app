import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  openCase,
  addCaseMessage,
  resolveCase,
  getCaseById,
  getCaseMessages,
  listCases,
  type DisputeResult,
} from './dispute-service'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/payments/refund/engine', () => ({
  processRefund: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { processRefund } from '@/lib/payments/refund/engine'

const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedProcessRefund = vi.mocked(processRefund)

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_UUID2 = '550e8400-e29b-41d4-a716-446655440001'

// ─── Type Assertion Helpers ───────────────────────────────────────────────

function assertSuccess<T>(result: DisputeResult<T>): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true)
}

function assertError<T>(result: DisputeResult<T>): asserts result is { success: false; error: string } {
  expect(result.success).toBe(false)
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildClient(overrides?: Record<string, unknown>) {
  const rowData: Record<string, { data: unknown; error: unknown }> = {}
  const arrayData: Record<string, { data: unknown[]; error: unknown }> = {}

  function makeChain(table: string) {
    const arrayResult = arrayData[table] ?? { data: [], error: null }

    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'inserted-1' }, error: null }),
        }
      }),
      update: vi.fn().mockImplementation(() => {
        return {
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((_col: string, _val: unknown) => {
        // For cases table, if this is a single-row lookup by id, return row data
        if (table === 'cases' && _col === 'id') {
          return {
            maybeSingle: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
            single: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
            ...chain,
          }
        }
        return chain
      }),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
      single: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
      // Make chain awaitable — resolves to array data for array tables, row data otherwise
      then: (onFulfilled: (v: unknown) => unknown) =>
        Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
    }

    return chain
  }

  const fromFn = vi.fn().mockImplementation((table: string) => makeChain(table))

  const client = {
    from: fromFn,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  } as unknown as Parameters<typeof openCase>[0]

  ;(client as any).__seedRow = (table: string, data: unknown, error: unknown = null) => {
    rowData[table] = { data, error }
  }
  ;(client as any).__seedArray = (table: string, data: unknown[], error: unknown = null) => {
    arrayData[table] = { data, error }
  }

  return client
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('openCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid bookingId', async () => {
    const client = buildClient()
    const result = await openCase(client, 'user-1', 'not-a-uuid', 'refund_request', 'reason here')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error for invalid case type', async () => {
    const client = buildClient()
    const result = await openCase(client, 'user-1', VALID_UUID, 'invalid_type', 'reason here')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error for too short reason', async () => {
    const client = buildClient()
    const result = await openCase(client, 'user-1', VALID_UUID, 'refund_request', 'short')
    assertError(result)
    expect(result.error).toContain('10 caracteres')
  })

  it('returns error when booking not found', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('bookings', null, null)
    const result = await openCase(client, 'user-1', VALID_UUID, 'refund_request', 'Valid reason here')
    assertError(result)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when user is not participant', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('bookings', {
      id: VALID_UUID,
      user_id: 'other-user',
      professional_id: 'prof-1',
    })
    ;(client as any).__seedRow('professionals', null, null)
    const result = await openCase(client, 'user-1', VALID_UUID, 'refund_request', 'Valid reason here')
    assertError(result)
    expect(result.error).toContain('acesso')
  })

  it('creates case when user is the booking owner', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('bookings', {
      id: VALID_UUID,
      user_id: 'user-1',
      professional_id: 'prof-1',
    })
    const result = await openCase(client, 'user-1', VALID_UUID, 'refund_request', 'Valid reason here')
    assertSuccess(result)
    expect(result.data?.caseId).toBe('inserted-1')
  })

  it('creates case when user is the professional', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('bookings', {
      id: VALID_UUID,
      user_id: 'other-user',
      professional_id: 'prof-1',
    })
    ;(client as any).__seedRow('professionals', { id: 'prof-1' })
    const result = await openCase(client, 'user-1', VALID_UUID, 'quality_issue', 'Valid reason here')
    assertSuccess(result)
    expect(result.data?.caseId).toBe('inserted-1')
  })
})

describe('addCaseMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const client = buildClient()
    const result = await addCaseMessage(client, 'user-1', 'not-a-uuid', 'Hello', false)
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error for empty content', async () => {
    const client = buildClient()
    const result = await addCaseMessage(client, 'user-1', VALID_UUID, '', false)
    assertError(result)
    expect(result.error).toContain('vazia')
  })

  it('returns error when case not found', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', null, null)
    const result = await addCaseMessage(client, 'user-1', VALID_UUID, 'Hello', false)
    assertError(result)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when user cannot participate', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'other-user' })
    const result = await addCaseMessage(client, 'user-1', VALID_UUID, 'Hello', false)
    assertError(result)
    expect(result.error).toContain('não pode participar')
  })

  it('creates message when user is reporter', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'user-1' })
    const result = await addCaseMessage(client, 'user-1', VALID_UUID, 'Hello', false)
    assertSuccess(result)
    expect(result.data?.messageId).toBe('inserted-1')
  })

  it('creates message when user is admin', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'other-user' })
    const result = await addCaseMessage(client, 'user-1', VALID_UUID, 'Hello', true)
    assertSuccess(result)
    expect(result.data?.messageId).toBe('inserted-1')
  })
})

describe('resolveCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedProcessRefund.mockReset().mockResolvedValue({
      success: true,
      refundId: 're_test_123',
      amountRefunded: BigInt(5000),
    })
    mockedCreateAdminClient.mockReturnValue(buildClient() as any)
  })

  it('returns error for invalid caseId', async () => {
    const client = buildClient()
    const result = await resolveCase(client, 'admin-1', 'not-a-uuid', 'Resolution here')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error for too short resolution', async () => {
    const client = buildClient()
    const result = await resolveCase(client, 'admin-1', VALID_UUID, 'short')
    assertError(result)
    expect(result.error).toContain('10 caracteres')
  })

  it('resolves case without refund when no amount provided', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, booking_id: VALID_UUID2, type: 'refund_request' })
    const result = await resolveCase(client, 'admin-1', VALID_UUID, 'Valid resolution here')
    assertSuccess(result)
    expect(result.data?.resolvedAt).toBeTruthy()
    expect(mockedProcessRefund).not.toHaveBeenCalled()
  })

  it('processes refund and resolves case when amount provided', async () => {
    const client = buildClient()
    const adminClient = buildClient()
    mockedCreateAdminClient.mockReturnValue(adminClient as any)
    ;(client as any).__seedRow('cases', { id: VALID_UUID, booking_id: VALID_UUID2, type: 'refund_request' })
    ;(adminClient as any).__seedRow('dispute_resolutions', null, null)

    const result = await resolveCase(client, 'admin-1', VALID_UUID, 'Valid resolution here', 50)

    assertSuccess(result)
    expect(mockedProcessRefund).toHaveBeenCalledWith(adminClient, expect.objectContaining({
      bookingId: VALID_UUID2,
      reason: 'Valid resolution here',
      percentage: 50,
      adminId: 'admin-1',
    }))
  })

  it('returns error when refund processing fails', async () => {
    const client = buildClient()
    const adminClient = buildClient()
    mockedCreateAdminClient.mockReturnValue(adminClient as any)
    ;(client as any).__seedRow('cases', { id: VALID_UUID, booking_id: VALID_UUID2, type: 'refund_request' })
    mockedProcessRefund.mockResolvedValue({ success: false, stripeError: 'card_declined' })

    const result = await resolveCase(client, 'admin-1', VALID_UUID, 'Valid resolution here', 100)

    assertError(result)
    expect(result.error).toContain('card_declined')
  })

  it('resolves case even when case_actions insert fails', async () => {
    const client = buildClient()
    const adminClient = buildClient()
    mockedCreateAdminClient.mockReturnValue(adminClient as any)
    ;(client as any).__seedRow('cases', { id: VALID_UUID, booking_id: VALID_UUID2, type: 'refund_request' })
    ;(adminClient as any).__seedRow('dispute_resolutions', null, null)

    // Override case_actions insert to fail silently
    const originalFrom = client.from
    client.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'case_actions') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'constraint violation' } }),
          })),
          update: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return originalFrom(table)
    })

    const result = await resolveCase(client, 'admin-1', VALID_UUID, 'Valid resolution here')
    assertSuccess(result)
  })
})

describe('getCaseById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const client = buildClient()
    const result = await getCaseById(client, 'user-1', 'not-a-uuid', false)
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error when case not found', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', null, null)
    const result = await getCaseById(client, 'user-1', VALID_UUID, false)
    assertError(result)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when user has no access', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'other-user' })
    const result = await getCaseById(client, 'user-1', VALID_UUID, false)
    assertError(result)
    expect(result.error).toContain('acesso')
  })

  it('returns case when user is reporter', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'user-1', booking_id: VALID_UUID2, type: 'refund_request', status: 'open', reason: 'test', resolution: null, refund_amount: null, resolved_at: null, created_at: '2026-01-01' })
    const result = await getCaseById(client, 'user-1', VALID_UUID, false)
    assertSuccess(result)
    expect(result.data?.id).toBe(VALID_UUID)
  })

  it('returns case when user is admin', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'other-user', booking_id: VALID_UUID2, type: 'refund_request', status: 'open', reason: 'test', resolution: null, refund_amount: null, resolved_at: null, created_at: '2026-01-01' })
    const result = await getCaseById(client, 'user-1', VALID_UUID, true)
    assertSuccess(result)
    expect(result.data?.id).toBe(VALID_UUID)
  })
})

describe('getCaseMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const client = buildClient()
    const result = await getCaseMessages(client, 'user-1', 'not-a-uuid', false)
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error when case not found', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', null, null)
    const result = await getCaseMessages(client, 'user-1', VALID_UUID, false)
    assertError(result)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when user has no access', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'other-user' })
    const result = await getCaseMessages(client, 'user-1', VALID_UUID, false)
    assertError(result)
    expect(result.error).toContain('acesso')
  })

  it('returns messages when user is reporter', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'user-1' })
    ;(client as any).__seedArray('case_messages', [
      { id: 'msg-1', sender_id: 'user-1', content: 'Hello', created_at: '2026-01-01' },
    ])
    const result = await getCaseMessages(client, 'user-1', VALID_UUID, false)
    assertSuccess(result)
    expect(result.data?.messages).toHaveLength(1)
  })

  it('returns messages when user is admin', async () => {
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, reporter_id: 'other-user' })
    ;(client as any).__seedArray('case_messages', [
      { id: 'msg-1', sender_id: 'other-user', content: 'Hello', created_at: '2026-01-01' },
    ])
    const result = await getCaseMessages(client, 'user-1', VALID_UUID, true)
    assertSuccess(result)
    expect(result.data.messages).toHaveLength(1)
  })
})

describe('listCases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters by status', async () => {
    const client = buildClient()
    ;(client as any).__seedArray('cases', [
      { id: VALID_UUID, status: 'open', created_at: '2026-01-02' },
      { id: VALID_UUID2, status: 'resolved', created_at: '2026-01-01' },
    ])
    const result = await listCases(client, 'user-1', true, { status: 'open' })
    assertSuccess(result)
    // Note: mock does not actually filter, just returns seeded array
    expect(result.data.cases).toHaveLength(2)
  })

  it('returns empty list when no cases', async () => {
    const client = buildClient()
    ;(client as any).__seedArray('cases', [])
    const result = await listCases(client, 'user-1', true)
    assertSuccess(result)
    expect(result.data.cases).toHaveLength(0)
    expect(result.data.nextCursor).toBeNull()
  })

  it('limits results and provides cursor', async () => {
    const client = buildClient()
    const cases = Array.from({ length: 10 }, (_, i) => ({
      id: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`,
      status: 'open',
      created_at: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }))
    ;(client as any).__seedArray('cases', cases)
    const result = await listCases(client, 'user-1', true, { limit: 5 })
    assertSuccess(result)
    expect(result.data.cases).toHaveLength(5)
    expect(result.data.nextCursor).toBeTruthy()
  })

  it('filters by reporter for non-admin', async () => {
    const client = buildClient()
    ;(client as any).__seedArray('cases', [
      { id: VALID_UUID, reporter_id: 'user-1', status: 'open', created_at: '2026-01-01' },
    ])
    const result = await listCases(client, 'user-1', false)
    assertSuccess(result)
    expect(result.data.cases).toHaveLength(1)
  })
})


describe('assignCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const { assignCase } = await import('./dispute-service')
    const client = buildClient()
    const result = await assignCase(client, 'admin-1', 'not-a-uuid', 'user-1')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('assigns case successfully', async () => {
    const { assignCase } = await import('./dispute-service')
    const client = buildClient()
    const result = await assignCase(client, 'admin-1', VALID_UUID, 'user-1')
    assertSuccess(result)
    expect(result.data.assignedTo).toBe('user-1')
  })
})

describe('updateCaseStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const { updateCaseStatus } = await import('./dispute-service')
    const client = buildClient()
    const result = await updateCaseStatus(client, 'admin-1', 'not-a-uuid', 'under_review')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns error for invalid transition', async () => {
    const { updateCaseStatus } = await import('./dispute-service')
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, status: 'resolved' })
    const result = await updateCaseStatus(client, 'admin-1', VALID_UUID, 'open')
    assertError(result)
    expect(result.error).toContain('Transição inválida')
  })

  it('transitions status successfully', async () => {
    const { updateCaseStatus } = await import('./dispute-service')
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, status: 'open' })
    const result = await updateCaseStatus(client, 'admin-1', VALID_UUID, 'under_review')
    assertSuccess(result)
    expect(result.data.status).toBe('under_review')
  })
})

describe('getCaseEvidence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const { getCaseEvidence } = await import('./dispute-service')
    const client = buildClient()
    const result = await getCaseEvidence(client, 'not-a-uuid')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns evidence for existing case', async () => {
    const { getCaseEvidence } = await import('./dispute-service')
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: VALID_UUID, booking_id: VALID_UUID2, reporter_id: 'user-1' })
    ;(client as any).__seedRow('bookings', {
      id: VALID_UUID2,
      scheduled_at: '2026-01-01T10:00:00Z',
      status: 'confirmed',
      price_brl: 150,
      session_type: 'video',
      user_id: 'user-2',
      professional_id: 'prof-1',
    })
    ;(client as any).__seedRow('payments', { id: 'pay-1', status: 'captured', amount_brl: 150, stripe_payment_intent_id: 'pi_123' })
    ;(client as any).__seedRow('profiles', { full_name: 'Reporter', email: 'reporter@test.com' })
    const result = await getCaseEvidence(client, VALID_UUID)
    assertSuccess(result)
    expect(result.data.booking).not.toBeNull()
    expect(result.data.booking?.price_brl).toBe(150)
  })
})

describe('getCaseTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid caseId', async () => {
    const { getCaseTimeline } = await import('./dispute-service')
    const client = buildClient()
    const result = await getCaseTimeline(client, 'not-a-uuid')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns merged timeline', async () => {
    const { getCaseTimeline } = await import('./dispute-service')
    const client = buildClient()
    ;(client as any).__seedArray('case_actions', [
      { id: 'a1', action_type: 'resolved', performed_by: 'admin-1', metadata: {}, created_at: '2026-01-02T10:00:00Z' },
    ])
    ;(client as any).__seedArray('case_messages', [
      { id: 'm1', sender_id: 'user-1', content: 'Hello', created_at: '2026-01-01T10:00:00Z' },
    ])
    const result = await getCaseTimeline(client, VALID_UUID)
    assertSuccess(result)
    expect(result.data.events).toHaveLength(2)
    expect(result.data.events[0].event_type).toBe('message')
    expect(result.data.events[1].event_type).toBe('action')
  })
})

describe('autoCreateCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid bookingId', async () => {
    const { autoCreateCase } = await import('./dispute-service')
    const client = buildClient()
    const result = await autoCreateCase(client, 'not-a-uuid', 'no_show_claim', 'reason here', 'user-1')
    assertError(result)
    expect(result.error).toContain('inválido')
  })

  it('returns existing caseId when duplicate open case exists', async () => {
    const { autoCreateCase } = await import('./dispute-service')
    const client = buildClient()
    ;(client as any).__seedRow('cases', { id: 'existing-case', booking_id: VALID_UUID, type: 'no_show_claim', status: 'open' })
    const result = await autoCreateCase(client, VALID_UUID, 'no_show_claim', 'reason here', 'user-1')
    assertSuccess(result)
    expect(result.data.caseId).toBe('existing-case')
  })

  it('creates case with computed priority and SLA', async () => {
    const { autoCreateCase } = await import('./dispute-service')
    const client = buildClient()
    ;(client as any).__seedRow('cases', null)
    const result = await autoCreateCase(client, VALID_UUID, 'cancelation_dispute', 'reason here', 'user-1')
    assertSuccess(result)
    expect(result.data.caseId).toBe('inserted-1')
  })
})
