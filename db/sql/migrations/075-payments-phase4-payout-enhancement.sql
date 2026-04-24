-- ============================================
-- Migration 075: Phase 4 — Payout Enhancement
-- ============================================
-- Adds debt tracking and Trolley fee absorption fields to payout_batch_items
-- for proper ledger accounting and professional transparency.
--
-- All monetary amounts are BIGINT minor units.
-- ============================================

-- --------------------------------------------
-- 1) Add debt_deducted to payout_batch_items
-- --------------------------------------------
ALTER TABLE public.payout_batch_items
  ADD COLUMN IF NOT EXISTS debt_deducted BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.payout_batch_items.debt_deducted IS
  'Amount of professional debt deducted from this payout (minor units)';

-- --------------------------------------------
-- 2) Add trolley_fee_absorbed to payout_batch_items
-- --------------------------------------------
ALTER TABLE public.payout_batch_items
  ADD COLUMN IF NOT EXISTS trolley_fee_absorbed BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.payout_batch_items.trolley_fee_absorbed IS
  'Trolley processing fee absorbed by Muuday (not deducted from pro) — minor units';

-- --------------------------------------------
-- 3) Add professional_debt_before to payout_batch_items
-- --------------------------------------------
ALTER TABLE public.payout_batch_items
  ADD COLUMN IF NOT EXISTS professional_debt_before BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.payout_batch_items.professional_debt_before IS
  'Professional total debt before this payout deduction — minor units';

-- --------------------------------------------
-- 4) Add updated_at trigger if not exists
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_payout_batch_items_updated_at ON public.payout_batch_items;
CREATE TRIGGER set_payout_batch_items_updated_at
  BEFORE UPDATE ON public.payout_batch_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------
-- 5) Verify columns
-- --------------------------------------------
DO $$
DECLARE
  expected_cols TEXT[] := ARRAY['debt_deducted', 'trolley_fee_absorbed', 'professional_debt_before'];
  col TEXT;
  found INTEGER;
BEGIN
  FOREACH col IN ARRAY expected_cols
  LOOP
    SELECT COUNT(*) INTO found
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payout_batch_items'
      AND column_name = col;
    IF found = 0 THEN
      RAISE EXCEPTION 'Column % not found in payout_batch_items', col;
    END IF;
  END LOOP;
END $$;
