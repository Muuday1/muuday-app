-- Migration: recurring_payment_settings
-- Purpose: Store off-session payment configuration for recurring booking auto-renewal
-- Created: 2026-05-06

-- ---------------------------------------------------------------------------
-- Table: recurring_payment_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  recurrence_group_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- Stripe saved payment method for off-session charging
  stripe_payment_method_id TEXT,
  stripe_customer_id TEXT,

  -- Renewal configuration
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'payment_failed', 'cancelled')),

  -- Timing
  next_renewal_at TIMESTAMPTZ,
  last_renewal_at TIMESTAMPTZ,
  last_payment_intent_id TEXT,

  -- Pricing snapshot (frozen at creation time)
  price_total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE (recurrence_group_id)
);

-- Indexes for cron job queries and lookups
CREATE INDEX IF NOT EXISTS idx_recurring_payment_settings_user
  ON recurring_payment_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payment_settings_professional
  ON recurring_payment_settings(professional_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payment_settings_group
  ON recurring_payment_settings(recurrence_group_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payment_settings_next_renewal
  ON recurring_payment_settings(next_renewal_at)
  WHERE auto_renew = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_recurring_payment_settings_status
  ON recurring_payment_settings(status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE recurring_payment_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
DROP POLICY IF EXISTS "Users view own recurring payment settings"
  ON recurring_payment_settings;
CREATE POLICY "Users view own recurring payment settings"
  ON recurring_payment_settings
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only the user (or admin) can update auto_renew. Professionals CANNOT disable auto-renew.
DROP POLICY IF EXISTS "Users update own recurring payment settings"
  ON recurring_payment_settings;
CREATE POLICY "Users update own recurring payment settings"
  ON recurring_payment_settings
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- System/service_role can insert (from server actions / Inngest)
DROP POLICY IF EXISTS "System inserts recurring payment settings"
  ON recurring_payment_settings;
CREATE POLICY "System inserts recurring payment settings"
  ON recurring_payment_settings
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Auto-update updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recurring_payment_settings_updated_at
  ON recurring_payment_settings;
CREATE TRIGGER trg_recurring_payment_settings_updated_at
  BEFORE UPDATE ON recurring_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- RPC: create_recurring_payment_settings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_recurring_payment_settings(
  p_user_id UUID,
  p_professional_id UUID,
  p_recurrence_group_id UUID,
  p_stripe_payment_method_id TEXT,
  p_stripe_customer_id TEXT,
  p_next_renewal_at TIMESTAMPTZ,
  p_price_total DECIMAL(10,2),
  p_currency TEXT DEFAULT 'BRL'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_settings_id UUID;
BEGIN
  INSERT INTO recurring_payment_settings (
    user_id,
    professional_id,
    recurrence_group_id,
    stripe_payment_method_id,
    stripe_customer_id,
    next_renewal_at,
    price_total,
    currency,
    auto_renew,
    status
  ) VALUES (
    p_user_id,
    p_professional_id,
    p_recurrence_group_id,
    p_stripe_payment_method_id,
    p_stripe_customer_id,
    p_next_renewal_at,
    p_price_total,
    COALESCE(p_currency, 'BRL'),
    true,
    'active'
  )
  ON CONFLICT (recurrence_group_id)
  DO UPDATE SET
    stripe_payment_method_id = EXCLUDED.stripe_payment_method_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    next_renewal_at = EXCLUDED.next_renewal_at,
    price_total = EXCLUDED.price_total,
    currency = EXCLUDED.currency,
    updated_at = NOW()
  RETURNING id INTO v_settings_id;

  RETURN v_settings_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: update_recurring_payment_settings
-- Only the owner user (or admin) can update auto_renew.
-- Professionals cannot disable auto-renew via this RPC.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_recurring_payment_settings(
  p_settings_id UUID,
  p_auto_renew BOOLEAN DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_stripe_payment_method_id TEXT DEFAULT NULL,
  p_next_renewal_at TIMESTAMPTZ DEFAULT NULL,
  p_last_renewal_at TIMESTAMPTZ DEFAULT NULL,
  p_last_payment_intent_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Load the settings row and verify ownership
  SELECT rps.user_id INTO v_user_id
  FROM recurring_payment_settings rps
  WHERE rps.id = p_settings_id;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Non-admin, non-owner callers cannot update
  IF NOT v_is_admin AND auth.uid() != v_user_id THEN
    RETURN false;
  END IF;

  UPDATE recurring_payment_settings
  SET
    auto_renew = COALESCE(p_auto_renew, auto_renew),
    status = COALESCE(p_status, status),
    stripe_payment_method_id = COALESCE(p_stripe_payment_method_id, stripe_payment_method_id),
    next_renewal_at = COALESCE(p_next_renewal_at, next_renewal_at),
    last_renewal_at = COALESCE(p_last_renewal_at, last_renewal_at),
    last_payment_intent_id = COALESCE(p_last_payment_intent_id, last_payment_intent_id),
    updated_at = NOW()
  WHERE id = p_settings_id;

  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_recurring_settings_for_renewal (cron helper)
-- Returns settings that are due for renewal within the next N days.
-- Called by Inngest cron with service_role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_recurring_settings_for_renewal(
  p_lookahead_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  settings_id UUID,
  user_id UUID,
  professional_id UUID,
  recurrence_group_id UUID,
  stripe_payment_method_id TEXT,
  stripe_customer_id TEXT,
  price_total DECIMAL(10,2),
  currency TEXT,
  next_renewal_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    rps.id AS settings_id,
    rps.user_id,
    rps.professional_id,
    rps.recurrence_group_id,
    rps.stripe_payment_method_id,
    rps.stripe_customer_id,
    rps.price_total,
    rps.currency,
    rps.next_renewal_at
  FROM recurring_payment_settings rps
  WHERE rps.auto_renew = true
    AND rps.status = 'active'
    AND rps.stripe_payment_method_id IS NOT NULL
    AND rps.next_renewal_at <= (NOW() + (p_lookahead_days || ' days')::interval)
  ORDER BY rps.next_renewal_at ASC;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_last_child_session_end (cron helper)
-- Returns the end_time_utc of the last session for a recurring group.
-- Used to verify the current cycle is actually ending.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_last_child_session_end(
  p_recurrence_group_id UUID
)
RETURNS TIMESTAMPTZ
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT MAX(bs.end_time_utc)
  FROM booking_sessions bs
  WHERE bs.parent_booking_id = p_recurrence_group_id;
$$;
