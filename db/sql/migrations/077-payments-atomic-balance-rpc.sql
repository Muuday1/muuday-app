-- ============================================
-- Migration 077: Atomic Professional Balance Update RPC
-- ============================================
-- Replaces the read-modify-write pattern in updateProfessionalBalance()
-- with an atomic PostgreSQL function, eliminating race conditions.
--
-- The function updates balances by applying deltas directly in SQL,
-- which is atomic under PostgreSQL's row-level locking.
-- ============================================

CREATE OR REPLACE FUNCTION public.update_professional_balance_atomic(
  p_professional_id UUID,
  p_available_delta BIGINT DEFAULT 0,
  p_withheld_delta BIGINT DEFAULT 0,
  p_pending_delta BIGINT DEFAULT 0,
  p_debt_delta BIGINT DEFAULT 0
)
RETURNS TABLE (
  professional_id UUID,
  available_balance BIGINT,
  withheld_balance BIGINT,
  pending_balance BIGINT,
  total_debt BIGINT,
  currency TEXT,
  last_payout_at TIMESTAMPTZ,
  last_calculated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert: if row exists, atomically add deltas; if not, insert with delta values
  INSERT INTO public.professional_balances (
    professional_id,
    available_balance,
    withheld_balance,
    pending_balance,
    total_debt,
    currency,
    last_calculated_at
  )
  VALUES (
    p_professional_id,
    p_available_delta,
    p_withheld_delta,
    p_pending_delta,
    p_debt_delta,
    'BRL',
    NOW()
  )
  ON CONFLICT (professional_id) DO UPDATE SET
    available_balance = professional_balances.available_balance + p_available_delta,
    withheld_balance = professional_balances.withheld_balance + p_withheld_delta,
    pending_balance = professional_balances.pending_balance + p_pending_delta,
    total_debt = professional_balances.total_debt + p_debt_delta,
    last_calculated_at = NOW(),
    updated_at = NOW()
  RETURNING
    professional_balances.professional_id,
    professional_balances.available_balance,
    professional_balances.withheld_balance,
    professional_balances.pending_balance,
    professional_balances.total_debt,
    professional_balances.currency,
    professional_balances.last_payout_at,
    professional_balances.last_calculated_at;
END;
$$;

-- Grant execute to authenticated users (admin actions use service role)
GRANT EXECUTE ON FUNCTION public.update_professional_balance_atomic(UUID, BIGINT, BIGINT, BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_professional_balance_atomic(UUID, BIGINT, BIGINT, BIGINT, BIGINT) TO service_role;
