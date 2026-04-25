-- Migration 080: Add payout_periodicity to professional_settings
--
-- Enables professionals to choose their payout frequency:
--   weekly   = every week (default, matches current behavior)
--   biweekly = every 2 weeks
--   monthly  = once per month
--
-- The eligibility engine uses this + last_payout_at to decide
-- whether a professional should be included in a given batch.

ALTER TABLE public.professional_settings
ADD COLUMN IF NOT EXISTS payout_periodicity TEXT NOT NULL DEFAULT 'weekly'
CHECK (payout_periodicity IN ('weekly', 'biweekly', 'monthly'));

-- Backfill existing rows with the default (preserves current weekly behavior)
UPDATE public.professional_settings
SET payout_periodicity = 'weekly'
WHERE payout_periodicity IS NULL;

-- Add index for efficient eligibility scanning
CREATE INDEX IF NOT EXISTS idx_professional_settings_payout_periodicity
ON public.professional_settings(professional_id, payout_periodicity);

-- Add helpful comment
COMMENT ON COLUMN public.professional_settings.payout_periodicity IS
  'How often this professional receives payouts: weekly, biweekly, or monthly';
