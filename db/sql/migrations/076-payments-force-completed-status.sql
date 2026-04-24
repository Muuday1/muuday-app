-- ============================================
-- Migration 076: Add force_completed status + item_count column
-- ============================================
-- 1) Adds 'force_completed' to payout_batches.status CHECK constraint
--    (used by admin force payout action)
-- 2) Adds item_count column to payout_batches for batch size tracking
--
-- Applied: 2026-04-24
-- ============================================

-- --------------------------------------------
-- 1) Add force_completed to status CHECK constraint
-- --------------------------------------------
-- PostgreSQL does not support ALTER TABLE ALTER COLUMN to modify CHECK constraints.
-- We must drop and recreate the constraint.
ALTER TABLE public.payout_batches
  DROP CONSTRAINT IF EXISTS payout_batches_status_check;

ALTER TABLE public.payout_batches
  ADD CONSTRAINT payout_batches_status_check
  CHECK (status IN (
    'draft',
    'treasury_check',
    'insufficient_funds',
    'submitted',
    'processing',
    'completed',
    'force_completed',
    'failed',
    'cancelled'
  ));

-- --------------------------------------------
-- 2) Add item_count column to payout_batches
-- --------------------------------------------
ALTER TABLE public.payout_batches
  ADD COLUMN IF NOT EXISTS item_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.payout_batches.item_count IS
  'Number of items in this payout batch';
