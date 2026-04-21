-- ============================================================
-- Deploy: Migration 052 — Atomic Booking Transactions
-- ============================================================
-- Purpose: Deploy atomic PostgreSQL functions for booking creation
--          to eliminate race conditions between bookings + payments.
--
-- Prerequisites:
--   - Migration 026 (payments trigger) must already be applied
--   - Tables: bookings, payments, booking_sessions must exist
--
-- How to run:
--   1. Open Supabase SQL Editor (https://supabase.com/dashboard)
--   2. Paste this entire file
--   3. Click "Run"
--   4. Verify with: SELECT proname FROM pg_proc WHERE proname LIKE 'create_%_booking%';
--
-- Rollback: See rollback-migration-052.sql
-- ============================================================

BEGIN;

-- --------------------------------------------
-- 1) Atomic one_off booking + payment
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_booking_with_payment(
  p_user_id UUID,
  p_professional_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_start_time_utc TIMESTAMPTZ,
  p_end_time_utc TIMESTAMPTZ,
  p_timezone_user TEXT,
  p_timezone_professional TEXT,
  p_duration_minutes INTEGER,
  p_status TEXT,
  p_booking_type TEXT,
  p_confirmation_mode_snapshot TEXT,
  p_cancellation_policy_snapshot JSONB,
  p_price_brl DECIMAL(10,2),
  p_price_user_currency DECIMAL(10,2),
  p_price_total DECIMAL(10,2),
  p_user_currency TEXT,
  p_notes TEXT,
  p_session_purpose TEXT,
  p_booking_metadata JSONB,
  p_payment_provider TEXT,
  p_payment_amount_total DECIMAL(10,2),
  p_payment_currency TEXT,
  p_payment_status TEXT,
  p_payment_metadata JSONB,
  p_captured_at TIMESTAMPTZ
)
RETURNS TABLE(booking_id UUID, payment_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_payment_id UUID;
BEGIN
  INSERT INTO bookings (
    user_id, professional_id, scheduled_at, start_time_utc, end_time_utc,
    timezone_user, timezone_professional, duration_minutes, status, booking_type,
    confirmation_mode_snapshot, cancellation_policy_snapshot,
    price_brl, price_user_currency, price_total, user_currency,
    notes, session_purpose, metadata
  ) VALUES (
    p_user_id, p_professional_id, p_scheduled_at, p_start_time_utc, p_end_time_utc,
    p_timezone_user, p_timezone_professional, p_duration_minutes, p_status, p_booking_type,
    p_confirmation_mode_snapshot, p_cancellation_policy_snapshot,
    p_price_brl, p_price_user_currency, p_price_total, p_user_currency,
    p_notes, p_session_purpose, COALESCE(p_booking_metadata, '{}'::jsonb)
  )
  RETURNING bookings.id INTO v_booking_id;

  INSERT INTO payments (
    booking_id, user_id, professional_id, provider,
    amount_total, currency, status, metadata, captured_at
  ) VALUES (
    v_booking_id, p_user_id, p_professional_id, p_payment_provider,
    p_payment_amount_total, p_payment_currency, p_payment_status,
    COALESCE(p_payment_metadata, '{}'::jsonb), p_captured_at
  )
  RETURNING payments.id INTO v_payment_id;

  RETURN QUERY SELECT v_booking_id, v_payment_id;
END;
$$;

-- --------------------------------------------
-- 2) Atomic batch bookings + payment
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_batch_bookings_with_payment(
  p_bookings JSONB,
  p_user_id UUID,
  p_professional_id UUID,
  p_payment_provider TEXT,
  p_payment_amount_total DECIMAL(10,2),
  p_payment_currency TEXT,
  p_payment_status TEXT,
  p_payment_metadata JSONB,
  p_captured_at TIMESTAMPTZ
)
RETURNS TABLE(booking_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_first_booking_id UUID;
  b JSONB;
BEGIN
  FOR b IN SELECT jsonb_array_elements(p_bookings)
  LOOP
    INSERT INTO bookings (
      user_id, professional_id, scheduled_at, start_time_utc, end_time_utc,
      timezone_user, timezone_professional, duration_minutes, status, booking_type,
      batch_booking_group_id, confirmation_mode_snapshot, cancellation_policy_snapshot,
      price_brl, price_user_currency, price_total, user_currency,
      notes, session_purpose, metadata
    ) VALUES (
      p_user_id,
      p_professional_id,
      (b->>'scheduled_at')::timestamptz,
      (b->>'start_time_utc')::timestamptz,
      (b->>'end_time_utc')::timestamptz,
      b->>'timezone_user',
      b->>'timezone_professional',
      (b->>'duration_minutes')::integer,
      b->>'status',
      COALESCE(b->>'booking_type', 'one_off'),
      b->>'batch_booking_group_id',
      b->>'confirmation_mode_snapshot',
      COALESCE(b->'cancellation_policy_snapshot', '{}'::jsonb),
      (b->>'price_brl')::decimal(10,2),
      (b->>'price_user_currency')::decimal(10,2),
      (b->>'price_total')::decimal(10,2),
      b->>'user_currency',
      b->>'notes',
      b->>'session_purpose',
      COALESCE(b->'metadata', '{}'::jsonb)
    )
    RETURNING bookings.id INTO v_booking_id;

    IF v_first_booking_id IS NULL THEN
      v_first_booking_id := v_booking_id;
    END IF;

    RETURN QUERY SELECT v_booking_id;
  END LOOP;

  INSERT INTO payments (
    booking_id, user_id, professional_id, provider,
    amount_total, currency, status, metadata, captured_at
  ) VALUES (
    v_first_booking_id, p_user_id, p_professional_id, p_payment_provider,
    p_payment_amount_total, p_payment_currency, p_payment_status,
    COALESCE(p_payment_metadata, '{}'::jsonb), p_captured_at
  );
END;
$$;

-- --------------------------------------------
-- 3) Atomic recurring booking (parent + children + sessions) + payment
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_recurring_booking_with_payment(
  p_parent JSONB,
  p_children JSONB,
  p_sessions JSONB,
  p_user_id UUID,
  p_professional_id UUID,
  p_payment_provider TEXT,
  p_payment_amount_total DECIMAL(10,2),
  p_payment_currency TEXT,
  p_payment_status TEXT,
  p_payment_metadata JSONB,
  p_captured_at TIMESTAMPTZ
)
RETURNS TABLE(parent_booking_id UUID, child_booking_ids UUID[], session_ids UUID[], payment_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
  v_child_ids UUID[] := ARRAY[]::UUID[];
  v_session_ids UUID[] := ARRAY[]::UUID[];
  v_payment_id UUID;
  c JSONB;
  s JSONB;
  v_child_id UUID;
  v_session_id UUID;
BEGIN
  INSERT INTO bookings (
    user_id, professional_id, scheduled_at, start_time_utc, end_time_utc,
    timezone_user, timezone_professional, duration_minutes, status, booking_type,
    recurrence_group_id, recurrence_periodicity, recurrence_interval_days,
    recurrence_end_date, recurrence_occurrence_index, recurrence_auto_renew,
    confirmation_mode_snapshot, cancellation_policy_snapshot,
    price_brl, price_user_currency, price_total, user_currency,
    notes, session_purpose, metadata
  ) VALUES (
    p_user_id, p_professional_id,
    (p_parent->>'scheduled_at')::timestamptz,
    (p_parent->>'start_time_utc')::timestamptz,
    (p_parent->>'end_time_utc')::timestamptz,
    p_parent->>'timezone_user',
    p_parent->>'timezone_professional',
    (p_parent->>'duration_minutes')::integer,
    p_parent->>'status',
    COALESCE(p_parent->>'booking_type', 'recurring_parent'),
    p_parent->>'recurrence_group_id',
    p_parent->>'recurrence_periodicity',
    (p_parent->>'recurrence_interval_days')::integer,
    p_parent->>'recurrence_end_date',
    (p_parent->>'recurrence_occurrence_index')::integer,
    (p_parent->>'recurrence_auto_renew')::boolean,
    p_parent->>'confirmation_mode_snapshot',
    COALESCE(p_parent->'cancellation_policy_snapshot', '{}'::jsonb),
    (p_parent->>'price_brl')::decimal(10,2),
    (p_parent->>'price_user_currency')::decimal(10,2),
    (p_parent->>'price_total')::decimal(10,2),
    p_parent->>'user_currency',
    p_parent->>'notes',
    p_parent->>'session_purpose',
    COALESCE(p_parent->'metadata', '{}'::jsonb)
  )
  RETURNING bookings.id INTO v_parent_id;

  DELETE FROM bookings WHERE parent_booking_id = v_parent_id;

  FOR c IN SELECT jsonb_array_elements(p_children)
  LOOP
    INSERT INTO bookings (
      user_id, professional_id, scheduled_at, start_time_utc, end_time_utc,
      timezone_user, timezone_professional, duration_minutes, status, booking_type,
      parent_booking_id, recurrence_group_id, recurrence_periodicity, recurrence_interval_days,
      recurrence_end_date, recurrence_occurrence_index, recurrence_auto_renew,
      confirmation_mode_snapshot, cancellation_policy_snapshot,
      price_brl, price_user_currency, price_total, user_currency,
      notes, session_purpose, metadata
    ) VALUES (
      p_user_id, p_professional_id,
      (c->>'scheduled_at')::timestamptz,
      (c->>'start_time_utc')::timestamptz,
      (c->>'end_time_utc')::timestamptz,
      c->>'timezone_user',
      c->>'timezone_professional',
      (c->>'duration_minutes')::integer,
      c->>'status',
      COALESCE(c->>'booking_type', 'recurring_child'),
      v_parent_id,
      c->>'recurrence_group_id',
      c->>'recurrence_periodicity',
      (c->>'recurrence_interval_days')::integer,
      c->>'recurrence_end_date',
      (c->>'recurrence_occurrence_index')::integer,
      (c->>'recurrence_auto_renew')::boolean,
      c->>'confirmation_mode_snapshot',
      COALESCE(c->'cancellation_policy_snapshot', '{}'::jsonb),
      (c->>'price_brl')::decimal(10,2),
      (c->>'price_user_currency')::decimal(10,2),
      (c->>'price_total')::decimal(10,2),
      c->>'user_currency',
      c->>'notes',
      c->>'session_purpose',
      COALESCE(c->'metadata', '{}'::jsonb)
    )
    RETURNING bookings.id INTO v_child_id;

    v_child_ids := array_append(v_child_ids, v_child_id);
  END LOOP;

  FOR s IN SELECT jsonb_array_elements(p_sessions)
  LOOP
    INSERT INTO booking_sessions (
      parent_booking_id, start_time_utc, end_time_utc, status, session_number
    ) VALUES (
      v_parent_id,
      (s->>'start_time_utc')::timestamptz,
      (s->>'end_time_utc')::timestamptz,
      s->>'status',
      (s->>'session_number')::integer
    )
    RETURNING booking_sessions.id INTO v_session_id;

    v_session_ids := array_append(v_session_ids, v_session_id);
  END LOOP;

  INSERT INTO payments (
    booking_id, user_id, professional_id, provider,
    amount_total, currency, status, metadata, captured_at
  ) VALUES (
    v_parent_id, p_user_id, p_professional_id, p_payment_provider,
    p_payment_amount_total, p_payment_currency, p_payment_status,
    COALESCE(p_payment_metadata, '{}'::jsonb), p_captured_at
  )
  RETURNING payments.id INTO v_payment_id;

  RETURN QUERY SELECT v_parent_id, v_child_ids, v_session_ids, v_payment_id;
END;
$$;

-- --------------------------------------------
-- 4) Grant execute permissions
-- --------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_booking_with_payment TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_batch_bookings_with_payment TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_recurring_booking_with_payment TO authenticated, service_role;

COMMIT;
