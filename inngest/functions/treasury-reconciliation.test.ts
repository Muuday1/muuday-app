import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({
  inngest: {
    createFunction: vi.fn((_config, handler) => ({ config: _config, fn: handler })),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

const mockRunReconciliation = vi.fn()
vi.mock('@/lib/payments/revolut/reconciliation', () => ({
  runTreasuryReconciliation: mockRunReconciliation,
}))

const { treasuryReconciliation } = await import('./treasury-reconciliation')
const { createAdminClient } = await import('@/lib/supabase/admin')

const mockedCreateAdminClient = vi.mocked(createAdminClient)

describe('treasuryReconciliation', () => {
  const mockLogger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
  const mockStep = {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
  }

  function makeEvent(overrides?: Record<string, unknown>) {
    return {
      name: 'payments/treasury.reconcile.requested',
      data: {},
      ...overrides,
    } as any
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.warn.mockClear()
    mockLogger.info.mockClear()
    mockLogger.error.mockClear()
    mockStep.run.mockClear()
    mockedCreateAdminClient.mockReturnValue({} as any)
    mockRunReconciliation.mockResolvedValue({
      settlementsChecked: 0,
      matchesFound: 0,
      mismatchesFound: 0,
      unmatchedSettlements: 0,
    })
  })

  it('returns error when admin client is not configured', async () => {
    mockedCreateAdminClient.mockReturnValue(null)

    const result = await (treasuryReconciliation as any).fn({
      step: mockStep,
      event: makeEvent(),
      logger: mockLogger,
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Admin client not configured')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Treasury reconciliation failed.',
      expect.objectContaining({ error: expect.stringContaining('Admin client not configured') }),
    )
  })

  it('calls runTreasuryReconciliation and returns result', async () => {
    mockRunReconciliation.mockResolvedValue({
      settlementsChecked: 5,
      matchesFound: 4,
      mismatchesFound: 0,
      unmatchedSettlements: 1,
      matches: [],
      mismatches: [],
    })

    const result = await (treasuryReconciliation as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(mockRunReconciliation).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
    expect(result.settlementsChecked).toBe(5)
    expect(result.matchesFound).toBe(4)
    expect(result.unmatchedSettlements).toBe(1)
  })

  it('logs warning when mismatches are found', async () => {
    mockRunReconciliation.mockResolvedValue({
      settlementsChecked: 3,
      matchesFound: 1,
      mismatchesFound: 2,
      unmatchedSettlements: 0,
      matches: [],
      mismatches: [
        { settlementId: 'set-1', difference: BigInt(5) },
        { settlementId: 'set-2', difference: BigInt(3) },
      ],
    })

    await (treasuryReconciliation as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Treasury reconciliation found mismatches.',
      expect.objectContaining({ mismatches: 2 }),
    )
  })

  it('does not log warning when no mismatches', async () => {
    mockRunReconciliation.mockResolvedValue({
      settlementsChecked: 3,
      matchesFound: 3,
      mismatchesFound: 0,
      unmatchedSettlements: 0,
    })

    await (treasuryReconciliation as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('logs info with summary on completion', async () => {
    mockRunReconciliation.mockResolvedValue({
      settlementsChecked: 10,
      matchesFound: 8,
      mismatchesFound: 1,
      unmatchedSettlements: 1,
    })

    await (treasuryReconciliation as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Treasury reconciliation complete.',
      expect.objectContaining({ settlementsChecked: 10, matchesFound: 8 }),
    )
  })
})
