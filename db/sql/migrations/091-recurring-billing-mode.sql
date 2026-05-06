-- Migration: recurring_billing_mode
-- Purpose: Allow professionals to choose between package (monthly) and per-session billing
-- Created: 2026-05-06

-- ---------------------------------------------------------------------------
-- Add recurring_billing_mode to professional_settings
-- ---------------------------------------------------------------------------
ALTER TABLE professional_settings
  ADD COLUMN IF NOT EXISTS recurring_billing_mode TEXT NOT NULL DEFAULT 'package'
  CHECK (recurring_billing_mode IN ('package', 'per_session'));

CREATE INDEX IF NOT EXISTS idx_professional_settings_billing_mode
  ON professional_settings(recurring_billing_mode);

-- ---------------------------------------------------------------------------
-- Add billing_mode to recurring_payment_settings
-- This is a snapshot at creation time so the cron job knows which logic to use.
-- ---------------------------------------------------------------------------
ALTER TABLE recurring_payment_settings
  ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'package'
  CHECK (billing_mode IN ('package', 'per_session'));

-- ---------------------------------------------------------------------------
-- RPC: update_recurring_payment_settings (add billing_mode param)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_recurring_payment_settings(
  p_settings_id UUID,
  p_auto_renew BOOLEAN DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_stripe_payment_method_id TEXT DEFAULT NULL,
  p_next_renewal_at TIMESTAMPTZ DEFAULT NULL,
  p_last_renewal_at TIMESTAMPTZ DEFAULT NULL,
  p_last_payment_intent_id TEXT DEFAULT NULL,
  p_billing_mode TEXT DEFAULT NULL
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
  SELECT rps.user_id INTO v_user_id
  FROM recurring_payment_settings rps
  WHERE rps.id = p_settings_id;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

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
    billing_mode = COALESCE(p_billing_mode, billing_mode),
    updated_at = NOW()
  WHERE id = p_settings_id;

  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create_recurring_payment_settings (add billing_mode param)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_recurring_payment_settings(
  p_user_id UUID,
  p_professional_id UUID,
  p_recurrence_group_id UUID,
  p_stripe_payment_method_id TEXT,
  p_stripe_customer_id TEXT,
  p_next_renewal_at TIMESTAMPTZ,
  p_price_total DECIMAL(10,2),
  p_currency TEXT DEFAULT 'BRL',
  p_billing_mode TEXT DEFAULT 'package'
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
    status,
    billing_mode
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
    'active',
    COALESCE(p_billing_mode, 'package')
  )
  ON CONFLICT (recurrence_group_id)
  DO UPDATE SET
    stripe_payment_method_id = EXCLUDED.stripe_payment_method_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    next_renewal_at = EXCLUDED.next_renewal_at,
    price_total = EXCLUDED.price_total,
    currency = EXCLUDED.currency,
    billing_mode = EXCLUDED.billing_mode,
    updated_at = NOW()
  RETURNING id INTO v_settings_id;

  RETURN v_settings_id;
END;
$$;
