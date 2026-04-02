-- ============================================
-- Wave 2: Booking atomic slot constraint
-- Goal:
-- - enforce atomic slot uniqueness at DB layer
-- - prevent race conditions between conflict check and insert
-- ============================================

-- 1) Normalize existing conflicting active bookings (keep earliest, cancel duplicates).
WITH active_duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY professional_id, start_time_utc
      ORDER BY created_at ASC, id ASC
    ) AS duplicate_rank
  FROM public.bookings
  WHERE start_time_utc IS NOT NULL
    AND booking_type <> 'recurring_parent'
    AND status IN ('pending', 'pending_payment', 'pending_confirmation', 'confirmed')
)
UPDATE public.bookings b
SET
  status = 'cancelled',
  cancellation_reason = COALESCE(cancellation_reason, 'duplicate_slot_conflict'),
  metadata = COALESCE(b.metadata, '{}'::jsonb) || jsonb_build_object(
    'auto_cancelled_by', '021-wave2-booking-atomic-slot-constraint',
    'auto_cancelled_reason', 'duplicate_active_slot'
  )
WHERE b.id IN (
  SELECT id
  FROM active_duplicates
  WHERE duplicate_rank > 1
);

-- 2) Enforce uniqueness only for active slot-reserving bookings.
-- recurring_parent rows are package wrappers and are excluded from slot uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_active_professional_start_idx
  ON public.bookings (professional_id, start_time_utc)
  WHERE start_time_utc IS NOT NULL
    AND booking_type <> 'recurring_parent'
    AND status IN ('pending', 'pending_payment', 'pending_confirmation', 'confirmed');
