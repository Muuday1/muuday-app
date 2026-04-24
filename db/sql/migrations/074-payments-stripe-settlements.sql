-- ============================================
-- Migration 074: Stripe Settlements Tracking
-- ============================================
-- Tracks Stripe payouts (settlements) that land in Revolut.
-- Each row represents one Stripe payout event.
-- Used for treasury reconciliation and ledger entry creation.
--
-- All monetary amounts are BIGINT minor units (e.g., R$ 150.00 = 15000).
-- All timestamps are TIMESTAMPTZ (UTC).
-- ============================================

-- --------------------------------------------
-- 1) stripe_settlements — Stripe Payout Tracking
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payout_id TEXT NOT NULL UNIQUE,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  fee BIGINT NOT NULL DEFAULT 0 CHECK (fee >= 0),
  net_amount BIGINT NOT NULL CHECK (net_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'failed', 'cancelled', 'reconciled')
  ),
  arrival_date TIMESTAMPTZ,
  settlement_date TIMESTAMPTZ,
  bank_reference TEXT,
  revolut_transaction_id TEXT,
  ledger_transaction_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_settlements_status_idx
  ON public.stripe_settlements(status, created_at DESC);
CREATE INDEX IF NOT EXISTS stripe_settlements_payout_idx
  ON public.stripe_settlements(stripe_payout_id);
CREATE INDEX IF NOT EXISTS stripe_settlements_reconciled_idx
  ON public.stripe_settlements(status)
  WHERE status = 'reconciled';

-- --------------------------------------------
-- 2) RLS Policies
-- --------------------------------------------
ALTER TABLE public.stripe_settlements ENABLE ROW LEVEL SECURITY;

-- Admins full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stripe_settlements'
    AND policyname = 'Admins full access on stripe_settlements'
  ) THEN
    CREATE POLICY "Admins full access on stripe_settlements"
      ON public.stripe_settlements FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- --------------------------------------------
-- 3) Helper: update trigger for updated_at
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.update_stripe_settlement_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stripe_settlements_updated_at ON public.stripe_settlements;
CREATE TRIGGER trg_stripe_settlements_updated_at
  BEFORE UPDATE ON public.stripe_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_settlement_updated_at();
