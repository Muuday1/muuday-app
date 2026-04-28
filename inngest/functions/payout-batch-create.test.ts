import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({
  inngest: {
    createFunction: vi.fn((_config, handler) => ({ config: _config, fn: handler })),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

const mockScanEligibility = vi.fn()
const mockCalculatePayout = vi.fn()
const mockGetTreasuryBalance = vi.fn()
const mockCreateTrolleyPayment = vi.fn()
const mockCreateTrolleyBatch = vi.fn()
const mockProcessTrolleyBatch = vi.fn()
const mockCreateLedgerTransaction = vi.fn()
const mockBuildPayoutTransaction = vi.fn()
const mockBuildPayoutWithDebtTransaction = vi.fn()
const mockBuildTrolleyFeeTransaction = vi.fn()
const mockGetProfessionalBalance = vi.fn()
const mockUpdateProfessionalBalance = vi.fn()
const mockNotifyProfessionals = vi.fn()
const mockTrackPayoutSent = vi.fn()

vi.mock('@/lib/payments/eligibility/engine', () => ({
  scanPayoutEligibility: mockScanEligibility,
}))

vi.mock('@/lib/payments/fees/calculator', () => ({
  calculatePayout: mockCalculatePayout,
}))

vi.mock('@/lib/payments/revolut/client', () => ({
  getTreasuryBalance: mockGetTreasuryBalance,
}))

vi.mock('@/lib/payments/trolley/client', () => ({
  createTrolleyPayment: mockCreateTrolleyPayment,
  createTrolleyBatch: mockCreateTrolleyBatch,
  processTrolleyBatch: mockProcessTrolleyBatch,
}))

vi.mock('@/lib/payments/ledger/entries', () => ({
  createLedgerTransaction: mockCreateLedgerTransaction,
  buildPayoutTransaction: mockBuildPayoutTransaction,
  buildPayoutWithDebtTransaction: mockBuildPayoutWithDebtTransaction,
  buildTrolleyFeeTransaction: mockBuildTrolleyFeeTransaction,
}))

vi.mock('@/lib/payments/ledger/balance', () => ({
  getProfessionalBalance: mockGetProfessionalBalance,
  updateProfessionalBalance: mockUpdateProfessionalBalance,
}))

vi.mock('@/lib/notifications/payout-notifications', () => ({
  notifyProfessionalsOnBatchSubmitted: mockNotifyProfessionals,
}))

vi.mock('@/lib/analytics/server-events', () => ({
  trackPayoutSent: mockTrackPayoutSent,
}))

vi.mock('@/lib/config/env', () => ({
  env: {
    PAYOUT_BATCH_SCHEDULE_CRON: '0 8 * * 1',
    MINIMUM_TREASURY_BUFFER_MINOR: 1000000,
  },
}))

const { payoutBatchCreate } = await import('./payout-batch-create')
const { createAdminClient } = await import('@/lib/supabase/admin')

const mockedCreateAdminClient = vi.mocked(createAdminClient)

describe('payoutBatchCreate', () => {
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const mockStep = {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
  }

  function buildAdminClient(options?: { batchItems?: Array<Record<string, unknown>> }) {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'batch-1' }, error: null })
    const insertMock = vi.fn().mockReturnValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const defaultBatchItems = options?.batchItems ?? [{ id: 'item-1', professional_id: 'prof-1', amount: '10000', net_amount: '9500', debt_deducted: '2000', trolley_fee_absorbed: '500', trolley_payment_id: null }]

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'trolley_recipients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { trolley_recipient_id: 'trolley-rec-1' }, error: null }),
        }
      }

      if (table === 'payout_batches') {
        const batchObj = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), single: singleMock }),
          update: updateMock,
          eq: vi.fn().mockReturnThis(),
          single: singleMock,
        }
        return batchObj
      }

      if (table === 'payout_batch_items') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: insertMock,
          update: updateMock,
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'item-1' }, error: null }),
          then: vi.fn().mockImplementation((cb: (value: { data: unknown[]; error: null }) => void) => {
            cb({ data: defaultBatchItems, error: null })
            return Promise.resolve({ data: defaultBatchItems, error: null })
          }),
        }
      }

      if (table === 'booking_payout_items') {
        return {
          insert: insertMock,
        }
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: insertMock,
        update: updateMock,
      }
    })

    return { from: fromMock, insert: insertMock, update: updateMock, single: singleMock }
  }

  function makeEvent() {
    return { name: 'payments/payout.batch.requested', data: {} } as any
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.info.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.error.mockClear()
    mockStep.run.mockClear()

    mockScanEligibility.mockResolvedValue({
      eligibleProfessionals: [
        { professionalId: 'prof-1', totalEligibleAmount: BigInt(10000), bookingIds: ['booking-1'] },
      ],
      ineligibleProfessionals: [],
    })

    mockCalculatePayout.mockReturnValue({ netAmount: BigInt(9500), professionalDebt: BigInt(0), trolleyFee: BigInt(0) })
    mockGetTreasuryBalance.mockResolvedValue({ accountId: 'acc-1', balance: BigInt(10000000), currency: 'BRL' })
    mockCreateTrolleyPayment.mockResolvedValue({ id: 'pay-1' })
    mockCreateTrolleyBatch.mockResolvedValue({ id: 'trolley-batch-1' })
    mockProcessTrolleyBatch.mockResolvedValue({ id: 'trolley-batch-1' })
    mockGetProfessionalBalance.mockResolvedValue({
      professionalId: 'prof-1',
      availableBalance: BigInt(10000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    })
    mockBuildPayoutTransaction.mockReturnValue({ entries: [] })
    mockBuildPayoutWithDebtTransaction.mockReturnValue({ entries: [] })
    mockBuildTrolleyFeeTransaction.mockReturnValue({ entries: [] })
    mockCreateLedgerTransaction.mockResolvedValue({ transactionId: 'tx-1', entryIds: [] })
    mockUpdateProfessionalBalance.mockResolvedValue({} as any)
    mockNotifyProfessionals.mockResolvedValue(undefined)

    mockedCreateAdminClient.mockReturnValue(buildAdminClient() as any)
  })

  it('returns early when no eligible professionals', async () => {
    mockScanEligibility.mockResolvedValue({ eligibleProfessionals: [], ineligibleProfessionals: [] })

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(false)
    expect(result.reason).toBe('no_eligible_professionals')
  })

  it('returns early when no professionals have trolley recipients', async () => {
    const admin = buildAdminClient()
    admin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'trolley_recipients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: admin.insert,
        update: admin.update,
      }
    })
    mockedCreateAdminClient.mockReturnValue(admin as any)

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(false)
    expect(result.reason).toBe('no_professionals_with_trolley_recipients')
  })

  it('blocks batch when treasury has insufficient funds', async () => {
    mockGetTreasuryBalance.mockResolvedValue({ accountId: 'acc-1', balance: BigInt(1000), currency: 'BRL' })

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(true)
    expect(result.submitted).toBe(false)
    expect(result.reason).toBe('insufficient_funds')
  })

  it('fails batch when all trolley payments fail', async () => {
    mockCreateTrolleyPayment.mockRejectedValue(new Error('Trolley API error'))

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(true)
    expect(result.submitted).toBe(false)
    expect(result.reason).toBe('all_trolley_payments_failed')
  })

  it('fails batch when trolley batch creation fails', async () => {
    mockCreateTrolleyBatch.mockRejectedValue(new Error('Batch creation failed'))

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(true)
    expect(result.submitted).toBe(false)
    expect(result.reason).toBe('trolley_batch_creation_failed')
  })

  it('completes full success path with debt deduction', async () => {
    mockCalculatePayout.mockReturnValue({ netAmount: BigInt(8000), professionalDebt: BigInt(2000), trolleyFee: BigInt(500) })
    mockBuildPayoutWithDebtTransaction.mockReturnValue({ entries: [{ account: { code: '3100' }, entryType: 'debit', amount: BigInt(8000) }] })

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(true)
    expect(result.submitted).toBe(true)
    expect(result.ledgerEntriesCreated).toBeGreaterThan(0)
    expect(result.balancesUpdated).toBeGreaterThan(0)
    expect(mockCreateLedgerTransaction).toHaveBeenCalled()
    expect(mockUpdateProfessionalBalance).toHaveBeenCalled()
    expect(mockNotifyProfessionals).toHaveBeenCalled()
  })

  it('skips revolut when not configured and blocks batch', async () => {
    mockGetTreasuryBalance.mockResolvedValue(null)

    const result = await (payoutBatchCreate as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.batchCreated).toBe(true)
    expect(result.submitted).toBe(false)
    expect(result.reason).toBe('revolut_not_configured')
  })
})
