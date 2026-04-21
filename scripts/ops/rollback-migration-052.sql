-- ============================================================
-- Rollback: Migration 052 — Atomic Booking Transactions
-- ============================================================
-- Purpose: Remove the atomic booking functions if needed.
-- WARNING: After rollback, the app will fall back to manual
--          insert paths (non-atomic). Monitor Sentry for
--          `booking_create_atomic_fallback` events.
--
-- How to run:
--   1. Open Supabase SQL Editor
--   2. Paste this file
--   3. Click "Run"
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS public.create_booking_with_payment(
  UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INTEGER, TEXT, TEXT,
  TEXT, JSONB, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, TEXT, TEXT, JSONB, TIMESTAMPTZ
);

DROP FUNCTION IF EXISTS public.create_batch_bookings_with_payment(
  JSONB, UUID, UUID, TEXT, DECIMAL, TEXT, TEXT, JSONB, TIMESTAMPTZ
);

DROP FUNCTION IF EXISTS public.create_recurring_booking_with_payment(
  JSONB, JSONB, JSONB, UUID, UUID, TEXT, DECIMAL, TEXT, TEXT, JSONB, TIMESTAMPTZ
);

COMMIT;
