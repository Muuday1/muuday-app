-- ============================================
-- Wave 2: onboarding + tiers expansion (video-only, global service)
-- ============================================
-- Canonical decisions:
-- - video-only (no in-person fields)
-- - no jurisdiction fields
-- - tier gates prepared for onboarding C1-C9

BEGIN;

-- 1) professionals: public profile enrichment + billing routing
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS video_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB,
  ADD COLUMN IF NOT EXISTS platform_region TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professionals_platform_region_check'
  ) THEN
    ALTER TABLE public.professionals
      ADD CONSTRAINT professionals_platform_region_check
      CHECK (platform_region IS NULL OR platform_region IN ('br', 'uk'));
  END IF;
END $$;

-- 2) professional_settings: onboarding C5/C6/C7 controls
ALTER TABLE public.professional_settings
  ADD COLUMN IF NOT EXISTS calendar_sync_provider TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS notification_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_push BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_whatsapp BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_settings_calendar_sync_provider_check'
  ) THEN
    ALTER TABLE public.professional_settings
      ADD CONSTRAINT professional_settings_calendar_sync_provider_check
      CHECK (
        calendar_sync_provider IS NULL
        OR calendar_sync_provider IN ('google', 'outlook')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_settings_buffer_time_minutes_check'
  ) THEN
    ALTER TABLE public.professional_settings
      ADD CONSTRAINT professional_settings_buffer_time_minutes_check
      CHECK (buffer_time_minutes BETWEEN 0 AND 120);
  END IF;
END $$;

UPDATE public.professional_settings
SET buffer_time_minutes = COALESCE(NULLIF(buffer_minutes, 0), 15)
WHERE buffer_time_minutes IS NULL OR buffer_time_minutes = 0;

-- 3) professional credentials for sensitive categories review
CREATE TABLE IF NOT EXISTS public.professional_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  credential_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_credentials_credential_type_check'
  ) THEN
    ALTER TABLE public.professional_credentials
      ADD CONSTRAINT professional_credentials_credential_type_check
      CHECK (
        credential_type IS NULL
        OR credential_type IN ('diploma', 'license', 'certification', 'other')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_professional_credentials_professional_id
  ON public.professional_credentials (professional_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_credentials_verified
  ON public.professional_credentials (professional_id, verified);

ALTER TABLE public.professional_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Credentials are viewable by owner or admin" ON public.professional_credentials;
CREATE POLICY "Credentials are viewable by owner or admin"
  ON public.professional_credentials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = professional_credentials.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Credentials can be created by owner or admin" ON public.professional_credentials;
CREATE POLICY "Credentials can be created by owner or admin"
  ON public.professional_credentials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = professional_credentials.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Credentials can be updated by admin" ON public.professional_credentials;
CREATE POLICY "Credentials can be updated by admin"
  ON public.professional_credentials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Credentials can be deleted by admin" ON public.professional_credentials;
CREATE POLICY "Credentials can be deleted by admin"
  ON public.professional_credentials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

-- 4) bookings: recurrence + multi-date batch linkage
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID,
  ADD COLUMN IF NOT EXISTS batch_booking_group_id UUID,
  ADD COLUMN IF NOT EXISTS recurrence_periodicity TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_interval_days INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_occurrence_index INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_auto_renew BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_recurrence_periodicity_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_recurrence_periodicity_check
      CHECK (
        recurrence_periodicity IS NULL
        OR recurrence_periodicity IN ('weekly', 'biweekly', 'monthly', 'custom_days')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_recurrence_interval_days_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_recurrence_interval_days_check
      CHECK (recurrence_interval_days IS NULL OR recurrence_interval_days BETWEEN 1 AND 365);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_recurrence_occurrence_index_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_recurrence_occurrence_index_check
      CHECK (recurrence_occurrence_index IS NULL OR recurrence_occurrence_index >= 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_recurrence_group
  ON public.bookings (recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_batch_group
  ON public.bookings (batch_booking_group_id)
  WHERE batch_booking_group_id IS NOT NULL;

-- 5) legacy cleanup: jurisdiction removed from active onboarding model
-- keep this guarded to avoid breaking older environments lacking the column.
ALTER TABLE public.professional_applications
  DROP COLUMN IF EXISTS jurisdiction;

COMMIT;

