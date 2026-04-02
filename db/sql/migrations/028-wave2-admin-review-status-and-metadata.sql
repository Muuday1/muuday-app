-- ============================================
-- Wave 2: admin review decisions metadata
-- ============================================
-- Adds:
-- - professionals.admin_review_notes
-- - professionals.reviewed_by / reviewed_at
-- - status support for needs_changes

BEGIN;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS admin_review_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.professionals'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_status_check
  CHECK (
    status IN (
      'draft',
      'pending',
      'pending_review',
      'submitted_for_review',
      'needs_changes',
      'approved',
      'approved_live',
      'rejected',
      'suspended'
    )
  );

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.professional_applications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.professional_applications DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.professional_applications
  ADD CONSTRAINT professional_applications_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'needs_changes'));

COMMIT;

