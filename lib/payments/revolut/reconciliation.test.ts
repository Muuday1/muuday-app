import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetRevolutTransactions = vi.fn()

vi.mock('./client', () => ({
  getRevolutTransactions: mockGetRevolutTransactions,
}))

const {
  runTreasuryReconciliation,
  manuallyReconcileSettlement,
} = await import('./reconciliation')

function buildAdminClient(overrides?: Record<string, unknown>) {
  const fromMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })

  return {
    from: fromMock,
    ...overrides,
  } as unknown as Parameters<typeof runTreasuryReconciliation>[0]
}

describe('runTreasuryReconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty result when no settlements to reconcile', async () => {
    const admin = buildAdminClient()
    mockGetRevolutTransactions.mockResolvedValue([])

    const result = await runTreasuryReconciliation(admin)

    expect(result.settlementsChecked).toBe(0)
    expect(result.matchesFound).toBe(0)
    expect(result.mismatchesFound).toBe(0)
    expect(result.unmatchedSettlements).toBe(0)
  })

  it('throws when settlement query fails', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB timeout' } }),
      }),
    })

    await expect(runTreasuryReconciliation(admin)).rejects.toThrow('DB timeout')
  })

  it('matches a settlement perfectly and marks reconciled', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'set-1', stripe_payout_id: 'po_1', amount: 10000, net_amount: 9650, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
          ],
          error: null,
        }),
        update: updateMock,
      }),
    })

    mockGetRevolutTransactions.mockResolvedValue([
      { id: 'tx-1', type: 'transfer' as const, amount: BigInt(9650), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
    ])

    const result = await runTreasuryReconciliation(admin)

    expect(result.settlementsChecked).toBe(1)
    expect(result.matchesFound).toBe(1)
    expect(result.mismatchesFound).toBe(0)
    expect(result.unmatchedSettlements).toBe(0)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'reconciled', revolut_transaction_id: 'tx-1' }))
  })

  it('flags a near-match within tolerance as mismatch', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'set-1', stripe_payout_id: 'po_1', amount: 10000, net_amount: 9650, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
          ],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      }),
    })

    // Amount differs by 5 minor units (R$ 0.05) — within tolerance of 10
    mockGetRevolutTransactions.mockResolvedValue([
      { id: 'tx-1', type: 'transfer' as const, amount: BigInt(9655), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
    ])

    const result = await runTreasuryReconciliation(admin)

    expect(result.settlementsChecked).toBe(1)
    expect(result.matchesFound).toBe(0)
    expect(result.mismatchesFound).toBe(1)
    expect(result.unmatchedSettlements).toBe(0)
    expect(result.mismatches[0].difference).toBe(BigInt(5))
    expect(result.mismatches[0].matched).toBe(false)
  })

  it('leaves settlement unmatched when no eligible transaction exists', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'set-1', stripe_payout_id: 'po_1', amount: 10000, net_amount: 9650, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
          ],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      }),
    })

    mockGetRevolutTransactions.mockResolvedValue([])

    const result = await runTreasuryReconciliation(admin)

    expect(result.settlementsChecked).toBe(1)
    expect(result.matchesFound).toBe(0)
    expect(result.mismatchesFound).toBe(0)
    expect(result.unmatchedSettlements).toBe(1)
  })

  it('ignores non-transfer and non-completed transactions', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'set-1', stripe_payout_id: 'po_1', amount: 10000, net_amount: 9650, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
          ],
          error: null,
        }),
        update: updateMock,
      }),
    })

    mockGetRevolutTransactions.mockResolvedValue([
      { id: 'tx-fee', type: 'fee' as const, amount: BigInt(9650), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'tx-pending', type: 'transfer' as const, amount: BigInt(9650), currency: 'BRL', state: 'pending', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'tx-neg', type: 'transfer' as const, amount: BigInt(-9650), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'tx-good', type: 'transfer' as const, amount: BigInt(9650), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
    ])

    const result = await runTreasuryReconciliation(admin)

    expect(result.matchesFound).toBe(1)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ revolut_transaction_id: 'tx-good' }))
  })

  it('does not reuse the same Revolut transaction for multiple settlements', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'set-1', stripe_payout_id: 'po_1', amount: 10000, net_amount: 9650, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
            { id: 'set-2', stripe_payout_id: 'po_2', amount: 20000, net_amount: 19300, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
          ],
          error: null,
        }),
        update: updateMock,
      }),
    })

    mockGetRevolutTransactions.mockResolvedValue([
      { id: 'tx-1', type: 'transfer' as const, amount: BigInt(9650), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
    ])

    const result = await runTreasuryReconciliation(admin)

    expect(result.settlementsChecked).toBe(2)
    expect(result.matchesFound).toBe(1)
    expect(result.unmatchedSettlements).toBe(1)
  })

  it('picks the closest match when multiple transactions are eligible', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'set-1', stripe_payout_id: 'po_1', amount: 10000, net_amount: 9650, currency: 'BRL', status: 'paid', revolut_transaction_id: null },
          ],
          error: null,
        }),
        update: updateMock,
      }),
    })

    mockGetRevolutTransactions.mockResolvedValue([
      { id: 'tx-far', type: 'transfer' as const, amount: BigInt(9600), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'tx-close', type: 'transfer' as const, amount: BigInt(9649), currency: 'BRL', state: 'completed', createdAt: '2024-01-01T00:00:00Z' },
    ])

    const result = await runTreasuryReconciliation(admin)

    expect(result.matchesFound).toBe(0)
    expect(result.mismatchesFound).toBe(1)
    expect(result.mismatches[0].revolutTransactionId).toBe('tx-close')
    expect(result.mismatches[0].difference).toBe(BigInt(1))
  })
})

describe('manuallyReconcileSettlement', () => {
  it('updates settlement with revolut transaction id', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const admin = {
      from: vi.fn().mockReturnValue({
        update: updateMock,
      }),
    } as unknown as Parameters<typeof manuallyReconcileSettlement>[0]

    await manuallyReconcileSettlement(admin, 'set-1', 'tx-abc')

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'reconciled',
        revolut_transaction_id: 'tx-abc',
      }),
    )
  })

  it('throws when update fails', async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Conflict' } }),
        }),
      }),
    } as unknown as Parameters<typeof manuallyReconcileSettlement>[0]

    await expect(manuallyReconcileSettlement(admin, 'set-1', 'tx-abc')).rejects.toThrow('Conflict')
  })
})
