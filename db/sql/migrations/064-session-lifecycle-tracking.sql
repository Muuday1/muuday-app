-- ============================================
-- MIGRATION 064: Session Lifecycle Tracking
-- ============================================
-- Adds provider-agnostic session fields to bookings for:
-- - no-show evidence (who joined, when)
-- - session status tracking (not_ready -> join_open -> in_progress -> ended/failed)
-- - actual start/end timestamps (vs scheduled)
-- - failure reasons for dispute resolution
--
-- Aligned with Part 5 spec: provider-agnostic session room model.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'agora'
    CHECK (provider_type IN ('agora')),
  ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'not_ready'
    CHECK (session_status IN ('not_ready', 'join_open', 'in_progress', 'ended', 'failed')),
  ADD COLUMN IF NOT EXISTS client_joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS professional_joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_failure_reason TEXT;

COMMENT ON COLUMN bookings.provider_type IS
  'Video/session provider. Currently locked to agora. Future-proof for provider switching.';

COMMENT ON COLUMN bookings.session_status IS
  'Lifecycle: not_ready -> join_open (prof ready) -> in_progress (both joined) -> ended/failed.';

COMMENT ON COLUMN bookings.client_joined_at IS
  'Timestamp when the client first obtained an Agora token and connected. No-show evidence.';

COMMENT ON COLUMN bookings.professional_joined_at IS
  'Timestamp when the professional first obtained an Agora token and connected. No-show evidence.';

COMMENT ON COLUMN bookings.actual_started_at IS
  'Timestamp when both parties were connected and session truly began. May differ from scheduled_at.';

COMMENT ON COLUMN bookings.actual_ended_at IS
  'Timestamp when the session ended (either party left or connection dropped).';

COMMENT ON COLUMN bookings.session_failure_reason IS
  'Human-readable reason if session_status becomes failed (e.g. token_error, permission_denied).';

-- Index for admin/support queries looking for sessions in progress or failed
CREATE INDEX IF NOT EXISTS idx_bookings_session_status
  ON bookings(session_status, scheduled_at DESC)
  WHERE session_status IN ('join_open', 'in_progress', 'failed');

-- Index for no-show analysis: bookings where professional_ready_at is set but client never joined
CREATE INDEX IF NOT EXISTS idx_bookings_no_show_evidence
  ON bookings(professional_ready_at, client_joined_at, scheduled_at DESC)
  WHERE professional_ready_at IS NOT NULL AND client_joined_at IS NULL;
