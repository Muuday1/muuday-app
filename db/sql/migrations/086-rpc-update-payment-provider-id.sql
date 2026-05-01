-- Migration 086: RPC function to safely update payment provider_payment_id
-- Purpose: Eliminates the need for createAdminClient() in user-facing Stripe API routes.
--          The function validates ownership internally and updates provider_payment_id
--          with SECURITY DEFINER privileges.
-- Date: 2026-05-01

CREATE OR REPLACE FUNCTION update_payment_provider_id(
  p_payment_id UUID,
  p_provider_payment_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_user_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: user must be authenticated';
  END IF;

  -- Find the user_id of the booking associated with this payment
  SELECT b.user_id INTO v_booking_user_id
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  WHERE p.id = p_payment_id;

  IF v_booking_user_id IS NULL THEN
    RAISE EXCEPTION 'Payment or booking not found';
  END IF;

  -- Ownership check: the caller must own the booking
  IF v_booking_user_id <> v_current_user_id THEN
    RAISE EXCEPTION 'Forbidden: user does not own this payment';
  END IF;

  -- Update the provider_payment_id
  UPDATE payments
  SET
    provider_payment_id = p_provider_payment_id,
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- Verify the update happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found or update failed';
  END IF;
END;
$$;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.update_payment_provider_id TO authenticated, service_role;
