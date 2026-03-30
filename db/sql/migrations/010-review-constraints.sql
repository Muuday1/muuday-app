-- ============================================
-- Wave 1: Review constraints and professional response
-- ============================================

-- 1) Add unique constraint: one review per user per professional
-- (booking_id unique already ensures one per booking, but this prevents
--  multiple reviews from same user to same professional across bookings)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_professional_unique
  ON reviews (user_id, professional_id);

-- 2) Add professional response fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'professional_response') THEN
    ALTER TABLE reviews ADD COLUMN professional_response text;
    ALTER TABLE reviews ADD COLUMN professional_response_at timestamptz;
  END IF;
END $$;

-- 3) Add updated_at for review edit lifecycle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'updated_at') THEN
    ALTER TABLE reviews ADD COLUMN updated_at timestamptz;
  END IF;
END $$;

-- 4) Add edit window constraint: reviews can only be edited within 48h
-- (enforced in application layer, but we track the timestamp)
