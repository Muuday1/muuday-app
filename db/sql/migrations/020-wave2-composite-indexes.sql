-- Wave 2 infrastructure hardening
-- Composite indexes for critical booking/search/payment query paths

CREATE INDEX IF NOT EXISTS idx_bookings_professional_status
  ON public.bookings (professional_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_user_status
  ON public.bookings (user_id, status);

CREATE INDEX IF NOT EXISTS idx_availability_rules_professional_active
  ON public.availability_rules (professional_id, is_active);

CREATE INDEX IF NOT EXISTS idx_payments_booking_status
  ON public.payments (booking_id, status);
