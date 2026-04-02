-- ============================================
-- Wave 3 security hardening: payments (safe rollout)
-- Goal:
-- - tighten INSERT/UPDATE controls on payments
-- - preserve current booking/request flows
-- - keep service-role/admin paths working
-- ============================================

-- Ensure RLS stays enabled.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------
-- 1) INSERT policy hardening (same policy name)
-- -------------------------------------------------
-- Booking owner can only create payment rows tied to their own booking.
-- Admin can still create rows.
DROP POLICY IF EXISTS "System creates payments for booking owner" ON public.payments;
CREATE POLICY "System creates payments for booking owner"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR (
      user_id = auth.uid()
      AND booking_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = booking_id
          AND b.user_id = auth.uid()
          AND b.professional_id = professional_id
      )
    )
  );

-- -------------------------------------------------
-- 2) UPDATE policy hardening (same policy name)
-- -------------------------------------------------
-- Keeps participant updates possible to avoid breaking current flow.
-- Fine-grained field hardening is enforced by trigger below.
DROP POLICY IF EXISTS "Users and professionals update own payments" ON public.payments;
CREATE POLICY "Users and professionals update own payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = booking_id
          AND b.user_id = user_id
          AND b.professional_id = professional_id
      )
    )
    OR (
      professional_id IN (
        SELECT pr.id
        FROM public.professionals pr
        WHERE pr.user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = booking_id
          AND b.user_id = user_id
          AND b.professional_id = professional_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = booking_id
          AND b.user_id = user_id
          AND b.professional_id = professional_id
      )
    )
    OR (
      professional_id IN (
        SELECT pr.id
        FROM public.professionals pr
        WHERE pr.user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = booking_id
          AND b.user_id = user_id
          AND b.professional_id = professional_id
      )
    )
  );

-- -------------------------------------------------
-- 3) Non-admin UPDATE guard trigger
-- -------------------------------------------------
-- Participants can only update refund-related fields and status.
-- Admin/service-role retain full control.
CREATE OR REPLACE FUNCTION public.guard_payments_non_admin_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  -- service role paths (cron/webhook/jobs) keep full capability
  IF auth.role() = 'service_role' THEN
    NEW.updated_at := COALESCE(NEW.updated_at, NOW());
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  ) INTO is_admin;

  IF is_admin THEN
    NEW.updated_at := COALESCE(NEW.updated_at, NOW());
    RETURN NEW;
  END IF;

  -- Non-admin must keep all non-refund fields immutable.
  IF (
    to_jsonb(NEW) - ARRAY['status', 'refund_percentage', 'refunded_amount', 'refunded_at', 'updated_at']
  ) IS DISTINCT FROM (
    to_jsonb(OLD) - ARRAY['status', 'refund_percentage', 'refunded_amount', 'refunded_at', 'updated_at']
  ) THEN
    RAISE EXCEPTION 'payments update blocked: non-admin can only update refund/status fields';
  END IF;

  -- Keep status transitions bounded for non-admin actors.
  IF NEW.status NOT IN ('captured', 'partial_refunded', 'refunded', 'failed') THEN
    RAISE EXCEPTION 'payments update blocked: invalid non-admin status transition';
  END IF;

  IF OLD.status = 'refunded' AND NEW.status <> 'refunded' THEN
    RAISE EXCEPTION 'payments update blocked: refunded status is terminal for non-admin updates';
  END IF;

  IF NEW.refund_percentage IS NOT NULL
    AND (NEW.refund_percentage < 0 OR NEW.refund_percentage > 100) THEN
    RAISE EXCEPTION 'payments update blocked: refund_percentage out of range';
  END IF;

  IF NEW.refunded_amount IS NOT NULL AND NEW.refunded_amount < 0 THEN
    RAISE EXCEPTION 'payments update blocked: refunded_amount cannot be negative';
  END IF;

  IF NEW.refunded_amount IS NOT NULL AND NEW.refunded_amount > COALESCE(
    (to_jsonb(OLD)->>'amount_total')::numeric,
    (to_jsonb(OLD)->>'amount')::numeric,
    0
  ) THEN
    RAISE EXCEPTION 'payments update blocked: refunded_amount cannot exceed amount_total';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_payments_non_admin_update ON public.payments;
CREATE TRIGGER trg_guard_payments_non_admin_update
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_payments_non_admin_update();
