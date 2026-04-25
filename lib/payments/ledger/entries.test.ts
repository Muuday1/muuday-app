import { describe, it, expect, vi } from 'vitest'
import {
  validateTransactionEntries,
  createLedgerTransaction,
  buildPaymentCaptureTransaction,
  buildStripeSettlementTransaction,
  buildRefundTransaction,
  buildPayoutTransaction,
  buildPayoutWithDebtTransaction,
  buildTrolleyFeeTransaction,
  buildDisputeAfterPayoutTransaction,
} from './entries'
import {
  CASH_REVOLUT_TREASURY,
  CUSTOMER_DEPOSITS_HELD,
  PLATFORM_FEE_REVENUE,
  PROFESSIONAL_BALANCE,
  PROFESSIONAL_DEBT,
  STRIPE_FEE_EXPENSE,
  STRIPE_RECEIVABLE,
  TROLLEY_FEE_EXPENSE,
} from './accounts'

describe('validateTransactionEntries', () => {
  it('passes for a balanced 2-entry transaction', () => {
    const entries = [
      { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(100) },
    ]
    expect(() => validateTransactionEntries(entries)).not.toThrow()
  })

  it('passes for a balanced 4-entry transaction', () => {
    const entries = [
      { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
      { account: STRIPE_FEE_EXPENSE, entryType: 'debit' as const, amount: BigInt(20) },
      { account: PLATFORM_FEE_REVENUE, entryType: 'credit' as const, amount: BigInt(30) },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(90) },
    ]
    expect(() => validateTransactionEntries(entries)).not.toThrow()
  })

  it('throws for less than 2 entries', () => {
    const entries = [
      { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
    ]
    expect(() => validateTransactionEntries(entries)).toThrow('must have at least 2 entries')
  })

  it('throws for empty entries', () => {
    expect(() => validateTransactionEntries([])).toThrow('must have at least 2 entries')
  })

  it('throws for negative amount', () => {
    const entries = [
      { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(-10) },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(-10) },
    ]
    expect(() => validateTransactionEntries(entries)).toThrow('cannot be negative')
  })

  it('throws for unbalanced transaction (debits > credits)', () => {
    const entries = [
      { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(90) },
    ]
    expect(() => validateTransactionEntries(entries)).toThrow('unbalanced')
  })

  it('throws for unbalanced transaction (credits > debits)', () => {
    const entries = [
      { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
      { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(110) },
    ]
    expect(() => validateTransactionEntries(entries)).toThrow('unbalanced')
  })
})

describe('createLedgerTransaction', () => {
  function buildAdminClient(overrides?: Record<string, unknown>) {
    return {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      ...overrides,
    } as unknown as Parameters<typeof createLedgerTransaction>[0]
  }

  it('calls the atomic RPC with correct parameters', async () => {
    const admin = buildAdminClient()
    const input = {
      bookingId: 'booking-1',
      paymentId: 'payment-1',
      currency: 'BRL',
      description: 'Test transaction',
      entries: [
        { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
        { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(100) },
      ],
    }

    const result = await createLedgerTransaction(admin, input)

    expect(admin.rpc).toHaveBeenCalledTimes(1)
    expect(admin.rpc).toHaveBeenCalledWith('create_ledger_transaction_atomic', expect.objectContaining({
      p_booking_id: 'booking-1',
      p_payment_id: 'payment-1',
      p_currency: 'BRL',
      p_description: 'Test transaction',
      p_entries: expect.arrayContaining([
        expect.objectContaining({ account_id: STRIPE_RECEIVABLE.code, entry_type: 'debit', amount: 100 }),
        expect.objectContaining({ account_id: PROFESSIONAL_BALANCE.code, entry_type: 'credit', amount: 100 }),
      ]),
    }))
    expect(result.transactionId).toBeTypeOf('string')
    expect(result.entryIds).toEqual([])
  })

  it('returns entry ids when RPC returns data', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({
        data: [
          { entry_id: 'entry-1', account_id: '1100', entry_type: 'debit', amount: 100 },
          { entry_id: 'entry-2', account_id: '3100', entry_type: 'credit', amount: 100 },
        ],
        error: null,
      }),
    })

    const input = {
      entries: [
        { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
        { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(100) },
      ],
    }

    const result = await createLedgerTransaction(admin, input)
    expect(result.entryIds).toEqual(['entry-1', 'entry-2'])
  })

  it('throws when RPC returns an error', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    })

    const input = {
      entries: [
        { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
        { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(100) },
      ],
    }

    await expect(createLedgerTransaction(admin, input)).rejects.toThrow('DB error')
  })

  it('throws when entries are unbalanced', async () => {
    const admin = buildAdminClient()
    const input = {
      entries: [
        { account: STRIPE_RECEIVABLE, entryType: 'debit' as const, amount: BigInt(100) },
        { account: PROFESSIONAL_BALANCE, entryType: 'credit' as const, amount: BigInt(90) },
      ],
    }

    await expect(createLedgerTransaction(admin, input)).rejects.toThrow('unbalanced')
    expect(admin.rpc).not.toHaveBeenCalled()
  })
})

describe('buildPaymentCaptureTransaction', () => {
  it('produces a balanced transaction with correct accounts', () => {
    const tx = buildPaymentCaptureTransaction({
      amount: BigInt(10000),
      stripeFeeAmount: BigInt(350),
      platformFeeAmount: BigInt(1500),
      bookingId: 'booking-1',
      paymentId: 'payment-1',
    })

    expect(tx.bookingId).toBe('booking-1')
    expect(tx.paymentId).toBe('payment-1')
    expect(tx.currency).toBe('BRL')
    expect(tx.entries).toHaveLength(4)

    const debits = tx.entries.filter((e) => e.entryType === 'debit')
    const credits = tx.entries.filter((e) => e.entryType === 'credit')

    const totalDebits = debits.reduce((sum, e) => sum + e.amount, BigInt(0))
    const totalCredits = credits.reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(totalDebits).toBe(totalCredits)
    expect(totalDebits).toBe(BigInt(10000))

    // Net to professional = amount - platformFee
    const professionalEntry = tx.entries.find((e) => e.account.code === PROFESSIONAL_BALANCE.code)
    expect(professionalEntry?.amount).toBe(BigInt(8500))
  })
})

describe('buildStripeSettlementTransaction', () => {
  it('produces a balanced 2-entry transaction', () => {
    const tx = buildStripeSettlementTransaction({
      amount: BigInt(10000),
      stripeFeeAmount: BigInt(350),
    })

    expect(tx.entries).toHaveLength(2)

    const debitTotal = tx.entries
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))
    const creditTotal = tx.entries
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(debitTotal).toBe(creditTotal)
    expect(debitTotal).toBe(BigInt(9650))

    const cashEntry = tx.entries.find((e) => e.account.code === CASH_REVOLUT_TREASURY.code)
    expect(cashEntry?.entryType).toBe('debit')
    expect(cashEntry?.amount).toBe(BigInt(9650))
  })
})

describe('buildRefundTransaction', () => {
  it('produces a balanced 2-entry transaction', () => {
    const tx = buildRefundTransaction({
      refundAmount: BigInt(5000),
      bookingId: 'booking-2',
      paymentId: 'payment-2',
    })

    expect(tx.bookingId).toBe('booking-2')
    expect(tx.paymentId).toBe('payment-2')
    expect(tx.entries).toHaveLength(2)

    const debitTotal = tx.entries
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))
    const creditTotal = tx.entries
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(debitTotal).toBe(creditTotal)
    expect(debitTotal).toBe(BigInt(5000))

    const heldEntry = tx.entries.find((e) => e.account.code === CUSTOMER_DEPOSITS_HELD.code)
    expect(heldEntry?.entryType).toBe('debit')

    const receivableEntry = tx.entries.find((e) => e.account.code === STRIPE_RECEIVABLE.code)
    expect(receivableEntry?.entryType).toBe('credit')
  })
})

describe('buildPayoutTransaction', () => {
  it('produces a balanced 2-entry transaction', () => {
    const tx = buildPayoutTransaction({
      amount: BigInt(8000),
      professionalId: 'prof-1',
      payoutBatchId: 'batch-1',
    })

    expect(tx.payoutBatchId).toBe('batch-1')
    expect(tx.entries).toHaveLength(2)

    const debitTotal = tx.entries
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))
    const creditTotal = tx.entries
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(debitTotal).toBe(creditTotal)
    expect(debitTotal).toBe(BigInt(8000))

    const balanceEntry = tx.entries.find((e) => e.account.code === PROFESSIONAL_BALANCE.code)
    expect(balanceEntry?.entryType).toBe('debit')
  })
})

describe('buildPayoutWithDebtTransaction', () => {
  it('produces a balanced 3-entry transaction when invariant holds', () => {
    const tx = buildPayoutWithDebtTransaction({
      eligibleAmount: BigInt(10000),
      netAmount: BigInt(8000),
      debtDeducted: BigInt(2000),
      professionalId: 'prof-1',
      payoutBatchId: 'batch-1',
    })

    expect(tx.entries).toHaveLength(3)

    const debitTotal = tx.entries
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))
    const creditTotal = tx.entries
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(debitTotal).toBe(creditTotal)
    expect(debitTotal).toBe(BigInt(10000))

    const debtEntry = tx.entries.find((e) => e.account.code === PROFESSIONAL_DEBT.code)
    expect(debtEntry?.amount).toBe(BigInt(2000))
  })

  it('throws when invariant is violated', () => {
    expect(() =>
      buildPayoutWithDebtTransaction({
        eligibleAmount: BigInt(10000),
        netAmount: BigInt(8000),
        debtDeducted: BigInt(2500),
        professionalId: 'prof-1',
        payoutBatchId: 'batch-1',
      }),
    ).toThrow('unbalanced')
  })
})

describe('buildTrolleyFeeTransaction', () => {
  it('produces a balanced 2-entry transaction', () => {
    const tx = buildTrolleyFeeTransaction({
      trolleyFee: BigInt(500),
      payoutBatchId: 'batch-1',
    })

    expect(tx.entries).toHaveLength(2)

    const debitTotal = tx.entries
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))
    const creditTotal = tx.entries
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(debitTotal).toBe(creditTotal)
    expect(debitTotal).toBe(BigInt(500))

    const feeEntry = tx.entries.find((e) => e.account.code === TROLLEY_FEE_EXPENSE.code)
    expect(feeEntry?.entryType).toBe('debit')
  })
})

describe('buildDisputeAfterPayoutTransaction', () => {
  it('produces a balanced 2-entry transaction', () => {
    const tx = buildDisputeAfterPayoutTransaction({
      disputeAmount: BigInt(3000),
      bookingId: 'booking-3',
      payoutBatchId: 'batch-2',
    })

    expect(tx.entries).toHaveLength(2)

    const debitTotal = tx.entries
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))
    const creditTotal = tx.entries
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, BigInt(0))

    expect(debitTotal).toBe(creditTotal)
    expect(debitTotal).toBe(BigInt(3000))

    const debtEntry = tx.entries.find((e) => e.account.code === PROFESSIONAL_DEBT.code)
    expect(debtEntry?.entryType).toBe('debit')
  })
})
