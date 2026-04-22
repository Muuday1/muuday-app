-- ============================================
-- MIGRATION 063: Video Session Waiting Room
-- ============================================
-- Adds professional_ready_at to bookings so the professional
-- must explicitly "enter" before the client connects to Agora.
-- This prevents burning Agora credits when the professional is late.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS professional_ready_at TIMESTAMPTZ;

-- Update schema snapshot comment to keep tooling aligned
COMMENT ON COLUMN bookings.professional_ready_at IS
  'Timestamp when the professional clicked to enter the session. Client only connects to Agora after this is set.';
