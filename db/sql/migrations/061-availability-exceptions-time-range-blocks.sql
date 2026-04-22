-- ============================================
-- Migration 061: availability_exceptions time-range blocks
-- ============================================
-- Purpose: Allow availability_exceptions to block specific time ranges
-- (not just full days). Previously is_available=false required NULL
-- start/end times, which only supported full-day blocks.
--
-- After this migration:
--   is_available = false + start/end NULL  -> blocks entire day
--   is_available = false + start/end SET   -> blocks only that time range
--   is_available = true  + start/end SET   -> custom available window (unchanged)
-- ============================================

-- 1. Drop the old restrictive CHECK constraint
ALTER TABLE availability_exceptions
  DROP CONSTRAINT IF EXISTS availability_exceptions_check;

-- 2. Add the new CHECK constraint that allows time ranges for blocks
ALTER TABLE availability_exceptions
  ADD CONSTRAINT availability_exceptions_check CHECK (
    (is_available = false AND start_time_local IS NULL AND end_time_local IS NULL)
    OR
    (is_available = false AND start_time_local IS NOT NULL AND end_time_local IS NOT NULL AND start_time_local < end_time_local)
    OR
    (is_available = true AND start_time_local IS NOT NULL AND end_time_local IS NOT NULL AND start_time_local < end_time_local)
  );

-- 3. Add index for efficient time-range overlap queries
CREATE INDEX IF NOT EXISTS availability_exceptions_time_range_idx
  ON availability_exceptions(professional_id, date_local, start_time_local, end_time_local)
  WHERE start_time_local IS NOT NULL AND end_time_local IS NOT NULL;
