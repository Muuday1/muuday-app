-- ============================================
-- Migration 070: Payments Ledger Schema
-- ============================================
-- Creates all tables for the double-entry ledger,
-- payout batch system, Trolley recipients, Revolut treasury,
-- and dispute resolution.
--
-- CRITICAL: Tables must be created in dependency order.
-- payout_batches and payout_batch_items are created BEFORE
-- ledger_entries because ledger_entries has FK references.
--
-- All monetary amounts are BIGINT minor units (e.g. R$ 150.00 = 15000).
-- All timestamps are TIMESTAMPTZ (UTC).
-- ============================================

-- --------------------------------------------
-- 1) ledger_accounts — Chart of Accounts
--    (No FK dependencies — create first)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id UUID REFERENCES public.ledger_accounts(id),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ledger_accounts_type_idx
  ON public.ledger_accounts(type) WHERE is_active = true;

-- --------------------------------------------
-- 2) payout_batches — Batch Payout Records
--    (Created BEFORE ledger_entries which references it)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'treasury_check', 'insufficient_funds', 'submitted', 'processing', 'completed', 'force_completed', 'failed', 'cancelled')
  ),
  total_amount BIGINT NOT NULL DEFAULT 0,
  total_fees BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  trolley_batch_id TEXT,
  treasury_balance_before BIGINT,
  treasury_balance_after BIGINT,
  revolut_transaction_id TEXT,
  failure_reason TEXT,
  scheduled_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payout_batches_status_idx
  ON public.payout_batches(status, created_at DESC);
CREATE INDEX IF NOT EXISTS payout_batches_trolley_idx
  ON public.payout_batches(trolley_batch_id) WHERE trolley_batch_id IS NOT NULL;

-- --------------------------------------------
-- 3) payout_batch_items — Individual Payouts Within Batch
--    (Created BEFORE booking_payout_items which references it)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  fee_amount BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  trolley_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'returned')
  ),
  failure_reason TEXT,
  booking_ids UUID[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payout_batch_items_batch_idx
  ON public.payout_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS payout_batch_items_professional_idx
  ON public.payout_batch_items(professional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payout_batch_items_status_idx
  ON public.payout_batch_items(status);

-- --------------------------------------------
-- 4) ledger_entries — Double-Entry Journal
--    (References payout_batches which now exists)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  payout_batch_id UUID REFERENCES public.payout_batches(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES public.ledger_accounts(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount BIGINT NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ledger_entries_transaction_idx
  ON public.ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS ledger_entries_booking_idx
  ON public.ledger_entries(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ledger_entries_payment_idx
  ON public.ledger_entries(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ledger_entries_payout_batch_idx
  ON public.ledger_entries(payout_batch_id) WHERE payout_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ledger_entries_account_created_idx
  ON public.ledger_entries(account_id, created_at DESC);

-- --------------------------------------------
-- 5) professional_balances — Per-Professional Running Balance
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_balances (
  professional_id UUID PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  available_balance BIGINT NOT NULL DEFAULT 0,
  withheld_balance BIGINT NOT NULL DEFAULT 0,
  pending_balance BIGINT NOT NULL DEFAULT 0,
  total_debt BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  last_payout_at TIMESTAMPTZ,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS professional_balances_available_idx
  ON public.professional_balances(available_balance)
  WHERE available_balance > 0;

-- --------------------------------------------
-- 6) trolley_recipients — Trolley Recipient Profiles
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.trolley_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL UNIQUE REFERENCES public.professionals(id) ON DELETE CASCADE,
  trolley_recipient_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'paypal' CHECK (payout_method IN ('paypal', 'bank_transfer')),
  paypal_email TEXT,
  bank_account_json JSONB,
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    kyc_status IN ('pending', 'in_review', 'approved', 'rejected')
  ),
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trolley_recipients_active_idx
  ON public.trolley_recipients(is_active, kyc_status)
  WHERE is_active = true;

-- --------------------------------------------
-- 7) revolut_treasury_snapshots — Treasury Balance Tracking
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.revolut_treasury_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  balance BIGINT NOT NULL,
  currency TEXT NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'api' CHECK (source IN ('api', 'webhook', 'manual')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS revolut_treasury_snapshots_account_currency_idx
  ON public.revolut_treasury_snapshots(account_id, currency, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS revolut_treasury_snapshots_at_idx
  ON public.revolut_treasury_snapshots(snapshot_at DESC);

-- --------------------------------------------
-- 8) dispute_resolutions — Post-Payout Dispute Tracking
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispute_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  original_payout_batch_id UUID REFERENCES public.payout_batches(id) ON DELETE SET NULL,
  dispute_amount BIGINT NOT NULL CHECK (dispute_amount >= 0),
  recovery_method TEXT NOT NULL DEFAULT 'future_withholding' CHECK (
    recovery_method IN ('future_withholding', 'immediate_chargeback')
  ),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'recovered', 'written_off', 'waived')
  ),
  recovered_amount BIGINT NOT NULL DEFAULT 0,
  remaining_debt BIGINT NOT NULL,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dispute_resolutions_professional_idx
  ON public.dispute_resolutions(professional_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS dispute_resolutions_booking_idx
  ON public.dispute_resolutions(booking_id);
CREATE INDEX IF NOT EXISTS dispute_resolutions_status_idx
  ON public.dispute_resolutions(status) WHERE status = 'open';

-- --------------------------------------------
-- 9) booking_payout_items — Junction: bookings ↔ payout_batch_items
--    Prevents double-payout of a single booking
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_payout_items (
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payout_batch_item_id UUID NOT NULL REFERENCES public.payout_batch_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (booking_id, payout_batch_item_id)
);

CREATE INDEX IF NOT EXISTS booking_payout_items_batch_item_idx
  ON public.booking_payout_items(payout_batch_item_id);

-- --------------------------------------------
-- 10) RLS Policies (admin-only for financial tables)
-- --------------------------------------------
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trolley_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revolut_treasury_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payout_items ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- ledger_accounts: admins full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ledger_accounts'
    AND policyname = 'Admins full access on ledger_accounts'
  ) THEN
    CREATE POLICY "Admins full access on ledger_accounts"
      ON public.ledger_accounts FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- ledger_entries: admins full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ledger_entries'
    AND policyname = 'Admins full access on ledger_entries'
  ) THEN
    CREATE POLICY "Admins full access on ledger_entries"
      ON public.ledger_entries FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- professional_balances: admins full access; professionals read own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'professional_balances'
    AND policyname = 'Admins full access on professional_balances'
  ) THEN
    CREATE POLICY "Admins full access on professional_balances"
      ON public.professional_balances FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'professional_balances'
    AND policyname = 'Professionals read own balance'
  ) THEN
    CREATE POLICY "Professionals read own balance"
      ON public.professional_balances FOR SELECT
      USING (
        professional_id IN (
          SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- payout_batches: admins full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payout_batches'
    AND policyname = 'Admins full access on payout_batches'
  ) THEN
    CREATE POLICY "Admins full access on payout_batches"
      ON public.payout_batches FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- payout_batch_items: admins full access; professionals read own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payout_batch_items'
    AND policyname = 'Admins full access on payout_batch_items'
  ) THEN
    CREATE POLICY "Admins full access on payout_batch_items"
      ON public.payout_batch_items FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payout_batch_items'
    AND policyname = 'Professionals read own payout items'
  ) THEN
    CREATE POLICY "Professionals read own payout items"
      ON public.payout_batch_items FOR SELECT
      USING (
        professional_id IN (
          SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- trolley_recipients: admins full access; professionals read/update own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trolley_recipients'
    AND policyname = 'Admins full access on trolley_recipients'
  ) THEN
    CREATE POLICY "Admins full access on trolley_recipients"
      ON public.trolley_recipients FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trolley_recipients'
    AND policyname = 'Professionals read own trolley recipient'
  ) THEN
    CREATE POLICY "Professionals read own trolley recipient"
      ON public.trolley_recipients FOR SELECT
      USING (
        professional_id IN (
          SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- revolut_treasury_snapshots: admins read only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'revolut_treasury_snapshots'
    AND policyname = 'Admins read revolut_treasury_snapshots'
  ) THEN
    CREATE POLICY "Admins read revolut_treasury_snapshots"
      ON public.revolut_treasury_snapshots FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- dispute_resolutions: admins full access; professionals read own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dispute_resolutions'
    AND policyname = 'Admins full access on dispute_resolutions'
  ) THEN
    CREATE POLICY "Admins full access on dispute_resolutions"
      ON public.dispute_resolutions FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dispute_resolutions'
    AND policyname = 'Professionals read own disputes'
  ) THEN
    CREATE POLICY "Professionals read own disputes"
      ON public.dispute_resolutions FOR SELECT
      USING (
        professional_id IN (
          SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- booking_payout_items: admins full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_payout_items'
    AND policyname = 'Admins full access on booking_payout_items'
  ) THEN
    CREATE POLICY "Admins full access on booking_payout_items"
      ON public.booking_payout_items FOR ALL
      USING (public.is_admin());
  END IF;
END $$;
