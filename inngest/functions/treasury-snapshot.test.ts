import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({
  inngest: {
    createFunction: vi.fn((_config, handler) => ({ config: _config, fn: handler })),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/payments/revolut/client', () => ({
  getTreasuryBalance: vi.fn(),
}))

vi.mock('@/lib/config/env', () => ({
  env: {
    MINIMUM_TREASURY_BUFFER_MINOR: 1000000,
  },
}))

const { treasuryBalanceSnapshot } = await import('./treasury-snapshot')
const { createAdminClient } = await import('@/lib/supabase/admin')
const { getTreasuryBalance } = await import('@/lib/payments/revolut/client')

const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedGetTreasuryBalance = vi.mocked(getTreasuryBalance)

describe('treasuryBalanceSnapshot', () => {
  const mockLogger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
  const mockStep = {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
  }

  function makeEvent(overrides?: Record<string, unknown>) {
    return {
      name: 'revolut/webhook.received',
      data: { eventType: 'transaction.created', ...(overrides?.data ?? {}) },
      ...(overrides ?? {}),
    } as any
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.warn.mockClear()
    mockLogger.info.mockClear()
    mockLogger.error.mockClear()
    mockStep.run.mockClear()
    mockedCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: null }),
      }),
    } as any)
  })

  it('returns error when admin client is not configured', async () => {
    mockedCreateAdminClient.mockReturnValue(null)

    const result = await (treasuryBalanceSnapshot as any).fn({
      step: mockStep,
      event: makeEvent(),
      logger: mockLogger,
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Admin client not configured')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Treasury snapshot failed.',
      expect.objectContaining({ error: expect.stringContaining('Admin client not configured') }),
    )
  })

  it('skips when Revolut is not configured', async () => {
    mockedGetTreasuryBalance.mockResolvedValue(null)

    const result = await (treasuryBalanceSnapshot as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('revolut_not_configured')
  })

  it('stores snapshot and returns balance when above buffer', async () => {
    mockedGetTreasuryBalance.mockResolvedValue({
      accountId: 'acc-1',
      balance: BigInt(5000000),
      currency: 'BRL',
    })

    const result = await (treasuryBalanceSnapshot as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.skipped).toBe(false)
    expect(result.accountId).toBe('acc-1')
    expect(result.balance).toBe(BigInt(5000000))
    expect(result.isBelowBuffer).toBe(false)
    expect(result.alertFired).toBe(false)
  })

  it('fires alert when balance is below minimum buffer', async () => {
    mockedGetTreasuryBalance.mockResolvedValue({
      accountId: 'acc-1',
      balance: BigInt(50000),
      currency: 'BRL',
    })

    const result = await (treasuryBalanceSnapshot as any).fn({ step: mockStep, event: makeEvent(), logger: mockLogger })

    expect(result.isBelowBuffer).toBe(true)
    expect(result.alertFired).toBe(true)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Treasury balance below minimum buffer!',
      expect.objectContaining({ balance: BigInt(50000) }),
    )
  })

  it('stores snapshot with webhook source when triggered by webhook', async () => {
    mockedGetTreasuryBalance.mockResolvedValue({
      accountId: 'acc-1',
      balance: BigInt(1000000),
      currency: 'BRL',
    })

    const admin = mockedCreateAdminClient.mock.results[0]?.value as any
    const insertMock = vi.fn().mockReturnValue({ error: null })
    mockedCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    } as any)

    await (treasuryBalanceSnapshot as any).fn({
      step: mockStep,
      event: makeEvent({ name: 'revolut/webhook.received', data: { eventType: 'transaction.created' } }),
      logger: mockLogger,
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'webhook',
        metadata: expect.objectContaining({ raw_event_type: 'transaction.created' }),
      }),
    )
  })

  it('returns error when snapshot insert fails', async () => {
    mockedGetTreasuryBalance.mockResolvedValue({
      accountId: 'acc-1',
      balance: BigInt(1000000),
      currency: 'BRL',
    })

    mockedCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: { message: 'DB write failed' } }),
      }),
    } as any)

    const result = await (treasuryBalanceSnapshot as any).fn({
      step: mockStep,
      event: makeEvent(),
      logger: mockLogger,
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('DB write failed')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Treasury snapshot failed.',
      expect.objectContaining({ error: expect.stringContaining('DB write failed') }),
    )
  })
})
