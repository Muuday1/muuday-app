BEGIN;

-- 1) professional_settings provider check must support apple
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_settings_calendar_sync_provider_check'
  ) THEN
    ALTER TABLE public.professional_settings
      DROP CONSTRAINT professional_settings_calendar_sync_provider_check;
  END IF;

  ALTER TABLE public.professional_settings
    ADD CONSTRAINT professional_settings_calendar_sync_provider_check
    CHECK (
      calendar_sync_provider IS NULL
      OR calendar_sync_provider IN ('google', 'outlook', 'apple')
    );
END
$$;

-- 2) calendar_integrations operational contract
ALTER TABLE public.calendar_integrations
  ADD COLUMN IF NOT EXISTS auth_type TEXT NOT NULL DEFAULT 'oauth2',
  ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'disconnected',
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS sync_cursor TEXT,
  ADD COLUMN IF NOT EXISTS external_account_id TEXT,
  ADD COLUMN IF NOT EXISTS external_calendar_id TEXT NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS token_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS caldav_principal_url TEXT,
  ADD COLUMN IF NOT EXISTS caldav_calendar_url TEXT;

DO $$
DECLARE
  provider_constraint TEXT;
BEGIN
  SELECT c.conname
    INTO provider_constraint
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'calendar_integrations'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%provider%';

  IF provider_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.calendar_integrations DROP CONSTRAINT %I', provider_constraint);
  END IF;

  ALTER TABLE public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_provider_check
    CHECK (provider IN ('google', 'outlook', 'apple'));
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'calendar_integrations_auth_type_check'
  ) THEN
    ALTER TABLE public.calendar_integrations
      ADD CONSTRAINT calendar_integrations_auth_type_check
      CHECK (auth_type IN ('oauth2', 'caldav'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'calendar_integrations_connection_status_check'
  ) THEN
    ALTER TABLE public.calendar_integrations
      ADD CONSTRAINT calendar_integrations_connection_status_check
      CHECK (connection_status IN ('disconnected', 'pending', 'connected', 'error'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_status
  ON public.calendar_integrations(connection_status, provider, sync_enabled);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_last_sync
  ON public.calendar_integrations(last_sync_completed_at);

-- 3) Busy slots cache from external providers
CREATE TABLE IF NOT EXISTS public.external_calendar_busy_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  external_event_id TEXT,
  external_calendar_id TEXT,
  title TEXT,
  start_time_utc TIMESTAMPTZ NOT NULL,
  end_time_utc TIMESTAMPTZ NOT NULL,
  source_updated_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time_utc < end_time_utc)
);

CREATE INDEX IF NOT EXISTS idx_external_busy_slots_professional_time
  ON public.external_calendar_busy_slots(professional_id, start_time_utc, end_time_utc);

CREATE INDEX IF NOT EXISTS idx_external_busy_slots_provider
  ON public.external_calendar_busy_slots(provider, source_updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_external_busy_slots_event
  ON public.external_calendar_busy_slots(professional_id, provider, external_event_id)
  WHERE external_event_id IS NOT NULL;

ALTER TABLE public.external_calendar_busy_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read external busy slots" ON public.external_calendar_busy_slots;
CREATE POLICY "Authenticated users can read external busy slots"
  ON public.external_calendar_busy_slots
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners and admins manage external busy slots" ON public.external_calendar_busy_slots;
CREATE POLICY "Owners and admins manage external busy slots"
  ON public.external_calendar_busy_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = external_calendar_busy_slots.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = external_calendar_busy_slots.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

-- 4) Link Muuday booking <-> external calendar event
CREATE TABLE IF NOT EXISTS public.booking_external_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  external_calendar_id TEXT,
  external_event_id TEXT NOT NULL,
  event_etag TEXT,
  event_url TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'deleted')),
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, provider),
  UNIQUE (professional_id, provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_external_events_professional
  ON public.booking_external_calendar_events(professional_id, provider, sync_status);

CREATE INDEX IF NOT EXISTS idx_booking_external_events_booking
  ON public.booking_external_calendar_events(booking_id, provider);

ALTER TABLE public.booking_external_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and admins view booking external events" ON public.booking_external_calendar_events;
CREATE POLICY "Owners and admins view booking external events"
  ON public.booking_external_calendar_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = booking_external_calendar_events.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_external_calendar_events.booking_id
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Owners and admins manage booking external events" ON public.booking_external_calendar_events;
CREATE POLICY "Owners and admins manage booking external events"
  ON public.booking_external_calendar_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = booking_external_calendar_events.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = booking_external_calendar_events.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

COMMIT;
