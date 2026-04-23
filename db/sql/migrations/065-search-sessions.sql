-- ============================================
-- MIGRATION 065: Search Sessions
-- ============================================
-- Tracks user search intent to enable abandoned-search
-- re-engagement automations via Resend.
--
-- A session is "converted" when the user creates a booking
-- within the conversion window (default 2h) after searching.
-- Sessions marked abandoned are idempotent-safe: Resend
-- automations only run once per contact per event type.

CREATE TABLE IF NOT EXISTS public.search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT,
  filters JSONB DEFAULT '{}',
  result_count INTEGER,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  abandoned_event_emitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.search_sessions IS
  'Tracks search intent for abandoned-search recovery automations.';

COMMENT ON COLUMN public.search_sessions.query IS
  'Free-text query string from the search bar.';

COMMENT ON COLUMN public.search_sessions.filters IS
  'Applied filters (category, subcategory, specialty, price, availability, etc.) as JSONB.';

COMMENT ON COLUMN public.search_sessions.result_count IS
  'Number of professional results returned for this search.';

COMMENT ON COLUMN public.search_sessions.converted_at IS
  'Timestamp when the user created a booking after this search; NULL if not converted.';

COMMENT ON COLUMN public.search_sessions.abandoned_event_emitted_at IS
  'Timestamp when the Resend abandoned_search event was emitted; prevents duplicate emits.';

-- Index for the abandoned-search cron: unconverted sessions older than the window
CREATE INDEX IF NOT EXISTS idx_search_sessions_abandoned_scan
  ON public.search_sessions(user_id, searched_at)
  WHERE converted_at IS NULL AND abandoned_event_emitted_at IS NULL;

-- Index for backfill / analytics: recent searches per user
CREATE INDEX IF NOT EXISTS idx_search_sessions_user_recent
  ON public.search_sessions(user_id, searched_at DESC);

-- Enable RLS
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own search sessions
DROP POLICY IF EXISTS "Users can read own search sessions" ON public.search_sessions;
CREATE POLICY "Users can read own search sessions"
  ON public.search_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own search sessions
DROP POLICY IF EXISTS "Users can insert own search sessions" ON public.search_sessions;
CREATE POLICY "Users can insert own search sessions"
  ON public.search_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all rows (for cron jobs / server actions)
DROP POLICY IF EXISTS "Service role can manage all search sessions" ON public.search_sessions;
CREATE POLICY "Service role can manage all search sessions"
  ON public.search_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
