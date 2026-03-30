-- ============================================
-- Wave 2 foundation: dual gate for professionals
-- Gate A: visibility/go-live remains tied to `professionals.status = approved`
-- Gate B: first booking acceptance tied to `professionals.first_booking_enabled`
-- ============================================

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS first_booking_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_booking_gate_note TEXT,
  ADD COLUMN IF NOT EXISTS first_booking_gate_updated_at TIMESTAMPTZ;

-- Backward-compatible bootstrap:
-- Existing approved professionals are enabled so current production behavior is preserved.
UPDATE public.professionals
SET
  first_booking_enabled = true,
  first_booking_gate_note = COALESCE(first_booking_gate_note, 'legacy_approved_bootstrap'),
  first_booking_gate_updated_at = COALESCE(first_booking_gate_updated_at, NOW())
WHERE status = 'approved'
  AND first_booking_enabled IS DISTINCT FROM true;
