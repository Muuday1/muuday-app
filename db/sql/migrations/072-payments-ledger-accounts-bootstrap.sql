-- ============================================
-- Migration 072: Bootstrap Ledger Accounts
-- ============================================
-- Inserts the initial chart of accounts for the double-entry ledger.
-- These accounts are required for all ledger operations.
-- ============================================

INSERT INTO public.ledger_accounts (code, name, type, description)
VALUES
  -- Assets
  ('1000', 'Cash — Revolut Treasury', 'asset', 'Cash held in Revolut Business account'),
  ('1100', 'Stripe Receivable', 'asset', 'Funds pending transfer from Stripe to Revolut'),

  -- Liabilities
  ('2000', 'Professional Payable', 'liability', 'Amount owed to professionals for completed services'),
  ('2100', 'Customer Deposits Held', 'liability', 'Customer funds held before service completion'),

  -- Revenue
  ('3000', 'Platform Fee Revenue', 'revenue', 'Muuday platform commission from bookings'),

  -- Expenses
  ('3100', 'Stripe Fee Expense', 'expense', 'Stripe processing fees on customer payments'),
  ('3200', 'Trolley Fee Expense', 'expense', 'Trolley payout processing fees'),
  ('3300', 'FX Cost Expense', 'expense', 'Foreign exchange conversion costs absorbed by Muuday'),

  -- Equity (contra accounts for tracking)
  ('4000', 'Professional Balance', 'equity', 'Running balance tracking per professional (contra)'),
  ('4100', 'Professional Debt', 'equity', 'Debt owed by professionals from disputes (contra)')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = NOW();

-- Verify all accounts were inserted
DO $$
DECLARE
  expected_count INTEGER := 10;
  actual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO actual_count FROM public.ledger_accounts WHERE is_active = true;
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'Expected % ledger accounts, found %', expected_count, actual_count;
  END IF;
END $$;
