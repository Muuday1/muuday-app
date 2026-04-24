/**
 * Chart of Accounts — Muuday Payments Ledger
 *
 * All ledger accounts are defined here as constants.
 * These MUST match the codes inserted by migration 072.
 *
 * To add a new account:
 * 1. Add it here with a unique code
 * 2. Add it to migration 072 (or a new migration)
 * 3. Update any affected ledger entry helpers
 * 4. Update MASTER-PLAN.md
 */

export type LedgerAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface LedgerAccount {
  code: string
  name: string
  type: LedgerAccountType
}

// ---------------------------------------------------------------------------
// Assets (1000-1999)
// ---------------------------------------------------------------------------

/** Cash held in Revolut Business account */
export const CASH_REVOLUT_TREASURY: LedgerAccount = {
  code: '1000',
  name: 'Cash — Revolut Treasury',
  type: 'asset',
}

/** Funds pending transfer from Stripe to Revolut */
export const STRIPE_RECEIVABLE: LedgerAccount = {
  code: '1100',
  name: 'Stripe Receivable',
  type: 'asset',
}

// ---------------------------------------------------------------------------
// Liabilities (2000-2999)
// ---------------------------------------------------------------------------

/** Amount owed to professionals for completed services */
export const PROFESSIONAL_PAYABLE: LedgerAccount = {
  code: '2000',
  name: 'Professional Payable',
  type: 'liability',
}

/** Customer funds held before service completion */
export const CUSTOMER_DEPOSITS_HELD: LedgerAccount = {
  code: '2100',
  name: 'Customer Deposits Held',
  type: 'liability',
}

// ---------------------------------------------------------------------------
// Revenue (3000-3999)
// ---------------------------------------------------------------------------

/** Muuday platform commission from bookings */
export const PLATFORM_FEE_REVENUE: LedgerAccount = {
  code: '3000',
  name: 'Platform Fee Revenue',
  type: 'revenue',
}

// ---------------------------------------------------------------------------
// Expenses (3100-3999)
// ---------------------------------------------------------------------------

/** Stripe processing fees on customer payments */
export const STRIPE_FEE_EXPENSE: LedgerAccount = {
  code: '3100',
  name: 'Stripe Fee Expense',
  type: 'expense',
}

/** Trolley payout processing fees */
export const TROLLEY_FEE_EXPENSE: LedgerAccount = {
  code: '3200',
  name: 'Trolley Fee Expense',
  type: 'expense',
}

/** Foreign exchange conversion costs absorbed by Muuday */
export const FX_COST_EXPENSE: LedgerAccount = {
  code: '3300',
  name: 'FX Cost Expense',
  type: 'expense',
}

// ---------------------------------------------------------------------------
// Equity / Contra Accounts (4000-4999)
// ---------------------------------------------------------------------------

/** Running balance tracking per professional (contra-equity) */
export const PROFESSIONAL_BALANCE: LedgerAccount = {
  code: '4000',
  name: 'Professional Balance',
  type: 'equity',
}

/** Debt owed by professionals from disputes (contra-equity) */
export const PROFESSIONAL_DEBT: LedgerAccount = {
  code: '4100',
  name: 'Professional Debt',
  type: 'equity',
}

// ---------------------------------------------------------------------------
// Account Lookup
// ---------------------------------------------------------------------------

const ACCOUNTS_BY_CODE: ReadonlyMap<string, LedgerAccount> = new Map([
  [CASH_REVOLUT_TREASURY.code, CASH_REVOLUT_TREASURY],
  [STRIPE_RECEIVABLE.code, STRIPE_RECEIVABLE],
  [PROFESSIONAL_PAYABLE.code, PROFESSIONAL_PAYABLE],
  [CUSTOMER_DEPOSITS_HELD.code, CUSTOMER_DEPOSITS_HELD],
  [PLATFORM_FEE_REVENUE.code, PLATFORM_FEE_REVENUE],
  [STRIPE_FEE_EXPENSE.code, STRIPE_FEE_EXPENSE],
  [TROLLEY_FEE_EXPENSE.code, TROLLEY_FEE_EXPENSE],
  [FX_COST_EXPENSE.code, FX_COST_EXPENSE],
  [PROFESSIONAL_BALANCE.code, PROFESSIONAL_BALANCE],
  [PROFESSIONAL_DEBT.code, PROFESSIONAL_DEBT],
])

export function getLedgerAccountByCode(code: string): LedgerAccount | undefined {
  return ACCOUNTS_BY_CODE.get(code)
}

export function getAllLedgerAccounts(): readonly LedgerAccount[] {
  return Array.from(ACCOUNTS_BY_CODE.values())
}

export function validateLedgerAccountCode(code: string): LedgerAccount {
  const account = getLedgerAccountByCode(code)
  if (!account) {
    throw new Error(`Unknown ledger account code: ${code}`)
  }
  return account
}
