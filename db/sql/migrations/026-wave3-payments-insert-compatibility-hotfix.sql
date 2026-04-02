-- ============================================
-- Wave 3 hotfix: payments insert compatibility
-- ============================================
-- Context:
-- Production schema drift introduced additional NOT NULL columns in `payments`
-- (`base_price_brl`, `platform_fee_brl`, `total_charged`) that are not part of
-- the current booking/request insert payload. This caused:
-- "Falha ao processar pagamento. Nenhum agendamento foi confirmado."
--
-- Goals:
-- 1) Keep existing booking/request inserts working without changing app payload.
-- 2) Preserve RLS hardening and fix WITH CHECK predicate to avoid tautologies.
-- 3) Keep rollout safe and idempotent.

BEGIN;

-- 1) Ensure legacy-required columns have safe defaults
ALTER TABLE public.payments
  ALTER COLUMN base_price_brl SET DEFAULT 0,
  ALTER COLUMN platform_fee_brl SET DEFAULT 0,
  ALTER COLUMN total_charged SET DEFAULT 0;

-- 2) Backfill existing rows with nulls (defensive)
UPDATE public.payments
SET
  base_price_brl = COALESCE(base_price_brl, amount_total, 0),
  platform_fee_brl = COALESCE(platform_fee_brl, 0),
  total_charged = COALESCE(total_charged, amount_total, base_price_brl, 0)
WHERE
  base_price_brl IS NULL
  OR platform_fee_brl IS NULL
  OR total_charged IS NULL;

-- 3) Fill missing legacy-required fields on insert/update
CREATE OR REPLACE FUNCTION public.fill_payments_legacy_required_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.base_price_brl IS NULL THEN
    NEW.base_price_brl := COALESCE(NEW.amount_total, 0);
  END IF;

  IF NEW.platform_fee_brl IS NULL THEN
    NEW.platform_fee_brl := 0;
  END IF;

  IF NEW.total_charged IS NULL THEN
    NEW.total_charged := COALESCE(NEW.amount_total, NEW.base_price_brl, 0);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_payments_legacy_required_fields ON public.payments;
CREATE TRIGGER trg_fill_payments_legacy_required_fields
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.fill_payments_legacy_required_fields();

-- 4) Recreate INSERT policy with strict booking ownership checks
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
        WHERE b.id = payments.booking_id
          AND b.user_id = payments.user_id
          AND b.professional_id = payments.professional_id
      )
    )
    OR (
      professional_id IN (
        SELECT pr.id
        FROM public.professionals pr
        WHERE pr.user_id = auth.uid()
      )
      AND booking_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = payments.booking_id
          AND b.user_id = payments.user_id
          AND b.professional_id = payments.professional_id
      )
    )
  );

COMMIT;
