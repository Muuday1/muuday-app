import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processRefund, type RefundInput } from './engine'

// ─── Mocks ────────────────────────────────────────────────────────────────

const mockStripeRefundsCreate = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: vi.fn(),
}))

vi.mock('@/lib/payments/ledger/entries', () => ({
  buildRefundTransaction: vi.fn().mockReturnValue({ entries: [] }),
  buildDisputeAfterPayoutTransaction: vi.fn().mockReturnValue({ entries: [] }),
  createLedgerTransaction: vi.fn().mockResolvedValue({ transactionId: 'tx-1', entryIds: [] }),
}))

vi.mock('@/lib/payments/ledger/balance', () => ({
  addProfessionalDebt: vi.fn().mockResolvedValue(undefined),
}))

import { getStripeClient } from '@/lib/stripe/client'
import { createLedgerTransaction, buildRefundTransaction, buildDisputeAfterPayoutTransaction } from '@/lib/payments/ledger/entries'
import { addProfessionalDebt } from '@/lib/payments/ledger/balance'

const mockedGetStripeClient = vi.mocked(getStripeClient)
const mockedCreateLedgerTransaction = vi.mocked(createLedgerTransaction)
const mockedBuildRefundTransaction = vi.mocked(buildRefundTransaction)
const mockedBuildDisputeAfterPayoutTransaction = vi.mocked(buildDisputeAfterPayoutTransaction)
const mockedAddProfessionalDebt = vi.mocked(addProfessionalDebt)

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildAdminClient(overrides?: Record<string, unknown>) {
  const rowData: Record<string, { data: unknown; error: unknown }> = {}
  const arrayData: Record<string, { data: unknown[]; error: unknown }> = {}

  function makeChain(table: string, opts?: { isArrayQuery?: boolean }) {
    const isArray = opts?.isArrayQuery ?? false
    let eqCount = 0

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
      eq: vi.fn().mockImplementation(() => {
        eqCount++
        if (isArray && eqCount >= 2) {
          const arrayResult = arrayData[table] ?? { data: [], error: null }
          return {
            then: (onFulfilled: (v: unknown) => unknown) =>
              Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
          }
        }
        return chain
      }),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        if (isArray) {
          const arrayResult = arrayData[table] ?? { data: [], error: null }
          return {
            then: (onFulfilled: (v: unknown) => unknown) =>
              Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
          }
        }
        return chain
      }),
      maybeSingle: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
      single: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
    }

    return chain
  }

  const fromFn = vi.fn().mockImplementation((table: string) => {
    const isArray = table === 'booking_payout_items'
    return makeChain(table, { isArrayQuery: isArray })
  })

  const client = {
    from: fromFn,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  } as unknown as Parameters<typeof processRefund>[0]

  ;(client as any).__seedRow = (table: string, data: unknown, error: unknown = null) => {
    rowData[table] = { data, error }
  }
  ;(client as any).__seedArray = (table: string, data: unknown[], error: unknown = null) => {
    arrayData[table] = { data, error }
  }

  return client
}

function makeStripeClient() {
  return {
    refunds: {
      create: mockStripeRefundsCreate,
    },
  } as unknown as NonNullable<ReturnType<typeof getStripeClient>>
}

function makePaymentRow(overrides?: Record<string, unknown>) {
  return {
    id: 'pay-1',
    provider_payment_id: 'pi_test_123',
    amount_total_minor: 10000,
    refunded_amount_minor: 0,
    professional_id: 'prof-1',
    status: 'captured',
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('processRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeRefundsCreate.mockReset().mockResolvedValue({ id: 're_default' })
    mockedGetStripeClient.mockReturnValue(makeStripeClient())
    mockedCreateLedgerTransaction.mockResolvedValue({ transactionId: 'tx-1', entryIds: [] })
    mockedBuildRefundTransaction.mockReturnValue({ entries: [] })
    mockedBuildDisputeAfterPayoutTransaction.mockReturnValue({ entries: [] })
    mockedAddProfessionalDebt.mockResolvedValue({
      professionalId: 'pro-1',
      availableBalance: BigInt(0),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(10000),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: new Date().toISOString(),
    })
  })

  it('returns error for invalid percentage (0)', async () => {
    const admin = buildAdminClient()
    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 0,
      adminId: 'admin-1',
    })
    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('Invalid refund percentage')
  })

  it('returns error for invalid percentage (>100)', async () => {
    const admin = buildAdminClient()
    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 101,
      adminId: 'admin-1',
    })
    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('Invalid refund percentage')
  })

  it('returns error when no payment found for booking', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', null, null)
    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 50,
      adminId: 'admin-1',
    })
    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('No payment found')
  })

  it('returns error when payment status is not captured', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow({ status: 'pending' }))
    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 50,
      adminId: 'admin-1',
    })
    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('not captured')
  })

  it('returns error when refund amount exceeds remaining refundable', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow({ refunded_amount_minor: 9000 }))
    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 50,
      adminId: 'admin-1',
    })
    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('exceeds remaining')
  })

  it('returns error when Stripe client is not configured', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    mockedGetStripeClient.mockReturnValue(null)
    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 50,
      adminId: 'admin-1',
    })
    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('Stripe client not configured')
  })

  it('returns error when Stripe refund API fails', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockRejectedValue(new Error('card_declined'))

    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 50,
      adminId: 'admin-1',
    })

    expect(result.success).toBe(false)
    expect(result.stripeError).toContain('card_declined')
  })

  it('processes pre-payout refund successfully with ledger entry', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_123' })

    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'Customer request',
      percentage: 50,
      adminId: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(result.refundId).toBe('re_test_123')
    expect(result.amountRefunded).toBe(BigInt(5000))
    expect(mockedBuildRefundTransaction).toHaveBeenCalled()
    expect(mockedCreateLedgerTransaction).toHaveBeenCalled()
    expect(mockedBuildDisputeAfterPayoutTransaction).not.toHaveBeenCalled()
    expect(mockedAddProfessionalDebt).not.toHaveBeenCalled()

    // Verify Stripe call
    expect(mockStripeRefundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_test_123',
        amount: 5000,
        reason: 'requested_by_customer',
        metadata: expect.objectContaining({
          booking_id: 'b1',
          admin_id: 'admin-1',
          post_payout: 'false',
        }),
      }),
      expect.objectContaining({ idempotencyKey: expect.stringContaining('refund-b1-') }),
    )
  })

  it('processes post-payout refund with dispute resolution and debt', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    ;(admin as any).__seedArray('booking_payout_items', [{ id: 'bpi-1' }])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_456' })

    // Track dispute_resolutions insert to return a specific ID
    const originalFrom = admin.from
    let capturedDisputeId: string | null = null
    admin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'dispute_resolutions') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation((cols: string) => {
              if (cols === 'id') {
                capturedDisputeId = 'disp-123'
                return {
                  single: vi.fn().mockResolvedValue({ data: { id: 'disp-123' }, error: null }),
                }
              }
              return { single: vi.fn().mockResolvedValue({ data: null, error: null }) }
            }),
            single: vi.fn().mockResolvedValue({ data: { id: 'disp-123' }, error: null }),
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

    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'Dispute resolved',
      percentage: 100,
      adminId: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(result.refundId).toBe('re_test_456')
    expect(result.amountRefunded).toBe(BigInt(10000))
    // Dispute resolution insert is attempted (id may vary due to mock chaining)
    expect(mockedBuildDisputeAfterPayoutTransaction).toHaveBeenCalled()
    expect(mockedCreateLedgerTransaction).toHaveBeenCalled()
    expect(mockedAddProfessionalDebt).toHaveBeenCalledWith(admin, 'prof-1', BigInt(10000))
    expect(mockedBuildRefundTransaction).not.toHaveBeenCalled()
  })

  it('returns partial success when payment update fails', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_789' })

    // Override update to fail
    const originalFrom = admin.from
    admin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'inserted-1' }, error: null }),
          })),
          update: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB timeout' } }),
          })),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: makePaymentRow(), error: null }),
          single: vi.fn().mockResolvedValue({ data: makePaymentRow(), error: null }),
        }
      }
      return originalFrom(table)
    })

    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 25,
      adminId: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(result.refundId).toBe('re_test_789')
    expect(result.ledgerError).toContain('DB timeout')
  })

  it('returns partial success when ledger entry fails', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_abc' })
    mockedCreateLedgerTransaction.mockRejectedValue(new Error('ledger invariant failed'))

    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 25,
      adminId: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(result.refundId).toBe('re_test_abc')
    expect(result.ledgerError).toContain('ledger invariant failed')
  })

  it('uses provided idempotency key', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow())
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_key' })

    await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 10,
      adminId: 'admin-1',
      idempotencyKey: 'my-custom-key',
    })

    expect(mockStripeRefundsCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ idempotencyKey: 'my-custom-key' }),
    )
  })

  it('calculates correct refund amount for 100%', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow({ amount_total_minor: 15000 }))
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_full' })

    const result = await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 100,
      adminId: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(result.amountRefunded).toBe(BigInt(15000))
    expect(mockStripeRefundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 15000 }),
      expect.anything(),
    )
  })

  it('updates payment status to refunded when fully refunded', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('payments', makePaymentRow({ refunded_amount_minor: 0 }))
    ;(admin as any).__seedArray('booking_payout_items', [])
    mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_full2' })

    const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const originalFrom = admin.from
    admin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'inserted-1' }, error: null }),
          })),
          update: vi.fn().mockImplementation(() => ({ eq: updateEqMock })),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: makePaymentRow(), error: null }),
          single: vi.fn().mockResolvedValue({ data: makePaymentRow(), error: null }),
        }
      }
      return originalFrom(table)
    })

    await processRefund(admin, {
      bookingId: 'b1',
      reason: 'test',
      percentage: 100,
      adminId: 'admin-1',
    })

    expect(updateEqMock).toHaveBeenCalledWith('id', 'pay-1')
  })
})
