-- Migration 085: Add 'batch' to bookings.booking_type constraint
-- Purpose: The application code fully supports batch bookings, but the database
--          CHECK constraint rejects booking_type = 'batch', causing insertion failures.
-- Date: 2026-05-01

-- Update the constraint on the bookings table to allow 'batch'
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_booking_type_check
  CHECK (booking_type IN ('one_off', 'recurring_parent', 'recurring_child', 'batch'));
