-- ============================================
-- RLS CROSS-USER ISOLATION TEST (direct API model)
-- ============================================
-- Purpose:
-- Validate that user A cannot read user B's private rows directly by ID.
-- Critical tables: bookings, payments, reviews (hidden), messages (if implemented).
--
-- How to use:
-- 1) Replace the UUID constants below with real IDs from your environment.
-- 2) Run in Supabase SQL Editor.
-- 3) Script raises EXCEPTION if leakage is detected.
--
-- Notes:
-- - reviews can be publicly readable when is_visible = true by product design.
--   This test validates hidden/private review isolation only.
-- - messages section runs only if table exists.

DO $$
DECLARE
  -- Required actors
  user_a UUID := '00000000-0000-0000-0000-0000000000aa';
  user_b UUID := '00000000-0000-0000-0000-0000000000bb';

  -- Required sample rows that belong to user_b scope
  sample_booking_id UUID := '00000000-0000-0000-0000-000000000101';
  sample_payment_id UUID := '00000000-0000-0000-0000-000000000201';
  sample_hidden_review_id UUID := '00000000-0000-0000-0000-000000000301';
  sample_message_id UUID := '00000000-0000-0000-0000-000000000401'; -- optional if messages table missing

  leakage_count INT := 0;
  messages_exists BOOLEAN := FALSE;
BEGIN
  -- Basic sanity on placeholders
  IF user_a::text LIKE '%0000000000aa' OR user_b::text LIKE '%0000000000bb' THEN
    RAISE EXCEPTION 'Replace user_a/user_b placeholders before running this test.';
  END IF;

  -- Simulate authenticated request for user_a
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);

  -- 1) bookings: user_a must not fetch user_b booking by direct ID
  SELECT COUNT(*) INTO leakage_count
  FROM public.bookings b
  WHERE b.id = sample_booking_id;

  IF leakage_count > 0 THEN
    RAISE EXCEPTION 'RLS LEAK: user_a can read bookings.id=%', sample_booking_id;
  END IF;

  -- 2) payments: user_a must not fetch user_b payment by direct ID
  SELECT COUNT(*) INTO leakage_count
  FROM public.payments p
  WHERE p.id = sample_payment_id;

  IF leakage_count > 0 THEN
    RAISE EXCEPTION 'RLS LEAK: user_a can read payments.id=%', sample_payment_id;
  END IF;

  -- 3) reviews: validate hidden review is not visible cross-user
  SELECT COUNT(*) INTO leakage_count
  FROM public.reviews r
  WHERE r.id = sample_hidden_review_id;

  IF leakage_count > 0 THEN
    RAISE EXCEPTION 'RLS LEAK: user_a can read hidden reviews.id=%', sample_hidden_review_id;
  END IF;

  -- 4) messages: run only if table exists
  SELECT to_regclass('public.messages') IS NOT NULL INTO messages_exists;
  IF messages_exists THEN
    SELECT COUNT(*) INTO leakage_count
    FROM public.messages m
    WHERE m.id = sample_message_id;

    IF leakage_count > 0 THEN
      RAISE EXCEPTION 'RLS LEAK: user_a can read messages.id=%', sample_message_id;
    END IF;
  ELSE
    RAISE NOTICE 'messages table not found in public schema; skipping message isolation check.';
  END IF;

  RAISE NOTICE 'RLS cross-user isolation test passed for user_a=% against user_b samples.', user_a;
END
$$;

-- ============================================
-- Helper query to collect sample IDs (run manually first)
-- ============================================
-- Replace :user_b_uuid with real UUID, then run each query:
--
-- SELECT id FROM public.bookings WHERE user_id = ':user_b_uuid'::uuid LIMIT 1;
-- SELECT id FROM public.payments WHERE user_id = ':user_b_uuid'::uuid LIMIT 1;
-- SELECT id FROM public.reviews WHERE user_id = ':user_b_uuid'::uuid AND COALESCE(is_visible, false) = false LIMIT 1;
-- SELECT id FROM public.messages WHERE sender_id = ':user_b_uuid'::uuid OR recipient_id = ':user_b_uuid'::uuid LIMIT 1;
