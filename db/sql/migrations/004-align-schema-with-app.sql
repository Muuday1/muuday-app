-- ============================================
-- Schema alignment for app runtime expectations
-- ============================================
-- 1) availability.updated_at is used by UI/actions
-- 2) bookings.cancellation_reason is used when cancelling
-- ============================================

ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
