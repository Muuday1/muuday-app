-- Wave 2: EXPLAIN ANALYZE checklist for composite indexes
-- Run this in Supabase SQL Editor AFTER applying migration 020.

-- 0) Confirm indexes exist
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_bookings_professional_status',
    'idx_bookings_user_status',
    'idx_availability_rules_professional_active',
    'idx_payments_booking_status'
  )
ORDER BY indexname;

-- 1) Booking queue by professional + status
EXPLAIN (ANALYZE, BUFFERS)
SELECT b.id, b.scheduled_at, b.status
FROM public.bookings b
WHERE b.professional_id = (
  SELECT professional_id
  FROM public.bookings
  WHERE professional_id IS NOT NULL
  LIMIT 1
)
AND b.status IN ('pending_confirmation', 'confirmed', 'pending')
ORDER BY b.scheduled_at DESC
LIMIT 50;

-- 2) Booking history by user + status
EXPLAIN (ANALYZE, BUFFERS)
SELECT b.id, b.scheduled_at, b.status
FROM public.bookings b
WHERE b.user_id = (
  SELECT user_id
  FROM public.bookings
  WHERE user_id IS NOT NULL
  LIMIT 1
)
AND b.status IN ('confirmed', 'completed', 'cancelled', 'no_show')
ORDER BY b.scheduled_at DESC
LIMIT 50;

-- 3) Availability rules by professional + active flag
EXPLAIN (ANALYZE, BUFFERS)
SELECT ar.id, ar.weekday, ar.start_time_local, ar.end_time_local
FROM public.availability_rules ar
WHERE ar.professional_id = (
  SELECT professional_id
  FROM public.availability_rules
  WHERE professional_id IS NOT NULL
  LIMIT 1
)
AND ar.is_active = true
ORDER BY ar.weekday, ar.start_time_local;

-- 4) Payment lookup by booking + status
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.status, p.amount_total, p.created_at
FROM public.payments p
WHERE p.booking_id = (
  SELECT booking_id
  FROM public.payments
  WHERE booking_id IS NOT NULL
  LIMIT 1
)
AND p.status IN ('captured', 'partial_refunded', 'refunded')
ORDER BY p.created_at DESC;
