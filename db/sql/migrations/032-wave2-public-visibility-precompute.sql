-- Wave 2 performance hardening: precomputed public visibility.
-- This removes per-request gate evaluation in search/profile recommendation paths.

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS is_publicly_visible BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visibility_checked_at TIMESTAMPTZ;

-- Search/query hot path index.
CREATE INDEX IF NOT EXISTS idx_professionals_status_public_visibility
  ON public.professionals (status, is_publicly_visible, rating DESC, total_reviews DESC);

-- Safe baseline for existing approved profiles.
UPDATE public.professionals
SET
  is_publicly_visible = COALESCE(is_publicly_visible, FALSE),
  visibility_checked_at = COALESCE(visibility_checked_at, NOW())
WHERE status = 'approved';
