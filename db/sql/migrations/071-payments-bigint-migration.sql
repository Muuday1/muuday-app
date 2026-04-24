-- ============================================
-- Migration 071: Payments BIGINT Migration
-- ============================================
-- Strategy: Add `_minor` suffixed columns alongside existing DECIMAL.
-- Backfill from DECIMAL × 100. Application code migrates to use _minor.
-- In a future migration, we'll drop DECIMAL columns and rename.
--
-- This is safer than ALTER TYPE on columns with existing data.
-- ============================================

-- --------------------------------------------
-- Add _minor columns to payments table
-- --------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS amount_total_minor BIGINT,
  ADD COLUMN IF NOT EXISTS base_price_brl_minor BIGINT,
  ADD COLUMN IF NOT EXISTS platform_fee_brl_minor BIGINT,
  ADD COLUMN IF NOT EXISTS total_charged_minor BIGINT,
  ADD COLUMN IF NOT EXISTS refunded_amount_minor BIGINT;

-- --------------------------------------------
-- Backfill _minor columns from DECIMAL counterparts
-- --------------------------------------------
-- Temporarily disable the non-admin update guard trigger
-- so we can populate the new _minor columns for all rows.
-- This is safe: the migration runs as a single transaction.
ALTER TABLE public.payments DISABLE TRIGGER trg_guard_payments_non_admin_update;

UPDATE public.payments
SET
  amount_total_minor = COALESCE((amount_total * 100)::bigint, 0),
  base_price_brl_minor = COALESCE((base_price_brl * 100)::bigint, 0),
  platform_fee_brl_minor = COALESCE((platform_fee_brl * 100)::bigint, 0),
  total_charged_minor = COALESCE((total_charged * 100)::bigint, 0),
  refunded_amount_minor = COALESCE((refunded_amount * 100)::bigint, 0)
WHERE
  amount_total_minor IS NULL
  OR base_price_brl_minor IS NULL
  OR platform_fee_brl_minor IS NULL
  OR total_charged_minor IS NULL
  OR refunded_amount_minor IS NULL;

-- Re-enable the guard trigger after backfill
ALTER TABLE public.payments ENABLE TRIGGER trg_guard_payments_non_admin_update;

-- --------------------------------------------
-- Ensure non-null defaults for new columns
-- --------------------------------------------
ALTER TABLE public.payments
  ALTER COLUMN amount_total_minor SET NOT NULL,
  ALTER COLUMN amount_total_minor SET DEFAULT 0,
  ALTER COLUMN base_price_brl_minor SET NOT NULL,
  ALTER COLUMN base_price_brl_minor SET DEFAULT 0,
  ALTER COLUMN platform_fee_brl_minor SET NOT NULL,
  ALTER COLUMN platform_fee_brl_minor SET DEFAULT 0,
  ALTER COLUMN total_charged_minor SET NOT NULL,
  ALTER COLUMN total_charged_minor SET DEFAULT 0,
  ALTER COLUMN refunded_amount_minor SET NOT NULL,
  ALTER COLUMN refunded_amount_minor SET DEFAULT 0;

-- --------------------------------------------
-- Add _minor columns to bookings table (price fields)
-- --------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS price_brl_minor BIGINT,
  ADD COLUMN IF NOT EXISTS price_user_currency_minor BIGINT,
  ADD COLUMN IF NOT EXISTS price_total_minor BIGINT;

UPDATE public.bookings
SET
  price_brl_minor = COALESCE((price_brl * 100)::bigint, 0),
  price_user_currency_minor = COALESCE((price_user_currency * 100)::bigint, 0),
  price_total_minor = COALESCE((price_total * 100)::bigint, 0)
WHERE
  price_brl_minor IS NULL
  OR price_user_currency_minor IS NULL
  OR price_total_minor IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN price_brl_minor SET NOT NULL,
  ALTER COLUMN price_brl_minor SET DEFAULT 0,
  ALTER COLUMN price_user_currency_minor SET NOT NULL,
  ALTER COLUMN price_user_currency_minor SET DEFAULT 0,
  ALTER COLUMN price_total_minor SET NOT NULL,
  ALTER COLUMN price_total_minor SET DEFAULT 0;

-- --------------------------------------------
-- Add _minor columns to payout_batches (when created via old code)
-- --------------------------------------------
-- These are on NEW tables so no backfill needed, but ensure schema consistency
ALTER TABLE public.payout_batches
  ADD COLUMN IF NOT EXISTS total_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS total_fees_minor BIGINT,
  ADD COLUMN IF NOT EXISTS net_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS treasury_balance_before_minor BIGINT,
  ADD COLUMN IF NOT EXISTS treasury_balance_after_minor BIGINT;

-- No backfill needed (new table, empty), just set defaults
ALTER TABLE public.payout_batches
  ALTER COLUMN total_amount_minor SET DEFAULT 0,
  ALTER COLUMN total_fees_minor SET DEFAULT 0,
  ALTER COLUMN net_amount_minor SET DEFAULT 0;

-- --------------------------------------------
-- Add _minor columns to payout_batch_items
-- --------------------------------------------
ALTER TABLE public.payout_batch_items
  ADD COLUMN IF NOT EXISTS amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS fee_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS net_amount_minor BIGINT;

ALTER TABLE public.payout_batch_items
  ALTER COLUMN amount_minor SET DEFAULT 0,
  ALTER COLUMN fee_amount_minor SET DEFAULT 0,
  ALTER COLUMN net_amount_minor SET DEFAULT 0;

-- --------------------------------------------
-- Add _minor columns to professional_balances
-- --------------------------------------------
ALTER TABLE public.professional_balances
  ADD COLUMN IF NOT EXISTS available_balance_minor BIGINT,
  ADD COLUMN IF NOT EXISTS withheld_balance_minor BIGINT,
  ADD COLUMN IF NOT EXISTS pending_balance_minor BIGINT,
  ADD COLUMN IF NOT EXISTS total_debt_minor BIGINT;

ALTER TABLE public.professional_balances
  ALTER COLUMN available_balance_minor SET DEFAULT 0,
  ALTER COLUMN withheld_balance_minor SET DEFAULT 0,
  ALTER COLUMN pending_balance_minor SET DEFAULT 0,
  ALTER COLUMN total_debt_minor SET DEFAULT 0;

-- --------------------------------------------
-- Add _minor columns to revolut_treasury_snapshots
-- --------------------------------------------
ALTER TABLE public.revolut_treasury_snapshots
  ADD COLUMN IF NOT EXISTS balance_minor BIGINT;

ALTER TABLE public.revolut_treasury_snapshots
  ALTER COLUMN balance_minor SET DEFAULT 0;

-- --------------------------------------------
-- Add _minor columns to dispute_resolutions
-- --------------------------------------------
ALTER TABLE public.dispute_resolutions
  ADD COLUMN IF NOT EXISTS dispute_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS recovered_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS remaining_debt_minor BIGINT;

ALTER TABLE public.dispute_resolutions
  ALTER COLUMN dispute_amount_minor SET DEFAULT 0,
  ALTER COLUMN recovered_amount_minor SET DEFAULT 0,
  ALTER COLUMN remaining_debt_minor SET DEFAULT 0;

-- --------------------------------------------
-- Comments for future developers
-- --------------------------------------------
COMMENT ON COLUMN public.payments.amount_total_minor IS 'Amount in minor units (cents). Source of truth. DECIMAL columns are deprecated.';
COMMENT ON COLUMN public.bookings.price_brl_minor IS 'Price in minor units (cents). Source of truth. DECIMAL columns are deprecated.';
COMMENT ON COLUMN public.payout_batches.total_amount_minor IS 'Amount in minor units (cents). Source of truth.';
