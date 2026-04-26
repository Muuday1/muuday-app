import { describe, it, expect } from 'vitest'
import {
  CASH_REVOLUT_TREASURY,
  STRIPE_RECEIVABLE,
  PROFESSIONAL_PAYABLE,
  CUSTOMER_DEPOSITS_HELD,
  PLATFORM_FEE_REVENUE,
  STRIPE_FEE_EXPENSE,
  TROLLEY_FEE_EXPENSE,
  FX_COST_EXPENSE,
  ADMIN_ADJUSTMENT,
  PROFESSIONAL_BALANCE,
  PROFESSIONAL_DEBT,
  getLedgerAccountByCode,
  getAllLedgerAccounts,
  validateLedgerAccountCode,
} from './accounts'

// ---------------------------------------------------------------------------
// Account constants
// ---------------------------------------------------------------------------

describe('Ledger account constants', () => {
  it('CASH_REVOLUT_TREASURY has correct code and type', () => {
    expect(CASH_REVOLUT_TREASURY.code).toBe('1000')
    expect(CASH_REVOLUT_TREASURY.type).toBe('asset')
    expect(CASH_REVOLUT_TREASURY.name).toBe('Cash — Revolut Treasury')
  })

  it('STRIPE_RECEIVABLE has correct code and type', () => {
    expect(STRIPE_RECEIVABLE.code).toBe('1100')
    expect(STRIPE_RECEIVABLE.type).toBe('asset')
    expect(STRIPE_RECEIVABLE.name).toBe('Stripe Receivable')
  })

  it('PROFESSIONAL_PAYABLE has correct code and type', () => {
    expect(PROFESSIONAL_PAYABLE.code).toBe('2000')
    expect(PROFESSIONAL_PAYABLE.type).toBe('liability')
    expect(PROFESSIONAL_PAYABLE.name).toBe('Professional Payable')
  })

  it('CUSTOMER_DEPOSITS_HELD has correct code and type', () => {
    expect(CUSTOMER_DEPOSITS_HELD.code).toBe('2100')
    expect(CUSTOMER_DEPOSITS_HELD.type).toBe('liability')
    expect(CUSTOMER_DEPOSITS_HELD.name).toBe('Customer Deposits Held')
  })

  it('PLATFORM_FEE_REVENUE has correct code and type', () => {
    expect(PLATFORM_FEE_REVENUE.code).toBe('3000')
    expect(PLATFORM_FEE_REVENUE.type).toBe('revenue')
    expect(PLATFORM_FEE_REVENUE.name).toBe('Platform Fee Revenue')
  })

  it('STRIPE_FEE_EXPENSE has correct code and type', () => {
    expect(STRIPE_FEE_EXPENSE.code).toBe('3100')
    expect(STRIPE_FEE_EXPENSE.type).toBe('expense')
    expect(STRIPE_FEE_EXPENSE.name).toBe('Stripe Fee Expense')
  })

  it('TROLLEY_FEE_EXPENSE has correct code and type', () => {
    expect(TROLLEY_FEE_EXPENSE.code).toBe('3200')
    expect(TROLLEY_FEE_EXPENSE.type).toBe('expense')
    expect(TROLLEY_FEE_EXPENSE.name).toBe('Trolley Fee Expense')
  })

  it('FX_COST_EXPENSE has correct code and type', () => {
    expect(FX_COST_EXPENSE.code).toBe('3300')
    expect(FX_COST_EXPENSE.type).toBe('expense')
    expect(FX_COST_EXPENSE.name).toBe('FX Cost Expense')
  })

  it('ADMIN_ADJUSTMENT has correct code and type', () => {
    expect(ADMIN_ADJUSTMENT.code).toBe('3400')
    expect(ADMIN_ADJUSTMENT.type).toBe('expense')
    expect(ADMIN_ADJUSTMENT.name).toBe('Admin Adjustment')
  })

  it('PROFESSIONAL_BALANCE has correct code and type', () => {
    expect(PROFESSIONAL_BALANCE.code).toBe('4000')
    expect(PROFESSIONAL_BALANCE.type).toBe('equity')
    expect(PROFESSIONAL_BALANCE.name).toBe('Professional Balance')
  })

  it('PROFESSIONAL_DEBT has correct code and type', () => {
    expect(PROFESSIONAL_DEBT.code).toBe('4100')
    expect(PROFESSIONAL_DEBT.type).toBe('equity')
    expect(PROFESSIONAL_DEBT.name).toBe('Professional Debt')
  })
})

// ---------------------------------------------------------------------------
// getLedgerAccountByCode
// ---------------------------------------------------------------------------

describe('getLedgerAccountByCode', () => {
  it('returns correct account for existing code', () => {
    expect(getLedgerAccountByCode('1000')).toEqual(CASH_REVOLUT_TREASURY)
    expect(getLedgerAccountByCode('2000')).toEqual(PROFESSIONAL_PAYABLE)
    expect(getLedgerAccountByCode('3000')).toEqual(PLATFORM_FEE_REVENUE)
  })

  it('returns undefined for unknown code', () => {
    expect(getLedgerAccountByCode('9999')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(getLedgerAccountByCode('')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getAllLedgerAccounts
// ---------------------------------------------------------------------------

describe('getAllLedgerAccounts', () => {
  it('returns all 11 accounts', () => {
    const all = getAllLedgerAccounts()
    expect(all).toHaveLength(11)
  })

  it('includes all expected account codes', () => {
    const all = getAllLedgerAccounts()
    const codes = all.map((a) => a.code)
    expect(codes).toContain('1000')
    expect(codes).toContain('1100')
    expect(codes).toContain('2000')
    expect(codes).toContain('2100')
    expect(codes).toContain('3000')
    expect(codes).toContain('3100')
    expect(codes).toContain('3200')
    expect(codes).toContain('3300')
    expect(codes).toContain('3400')
    expect(codes).toContain('4000')
    expect(codes).toContain('4100')
  })

  it('returns readonly array', () => {
    const all = getAllLedgerAccounts()
    expect(Array.isArray(all)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateLedgerAccountCode
// ---------------------------------------------------------------------------

describe('validateLedgerAccountCode', () => {
  it('returns account for valid code', () => {
    expect(validateLedgerAccountCode('1000')).toEqual(CASH_REVOLUT_TREASURY)
    expect(validateLedgerAccountCode('4100')).toEqual(PROFESSIONAL_DEBT)
  })

  it('throws for unknown code', () => {
    expect(() => validateLedgerAccountCode('9999')).toThrow('Unknown ledger account code: 9999')
  })

  it('throws for empty string', () => {
    expect(() => validateLedgerAccountCode('')).toThrow('Unknown ledger account code: ')
  })
})
