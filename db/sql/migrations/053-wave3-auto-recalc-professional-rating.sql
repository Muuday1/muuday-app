-- ============================================
-- Auto-recalc professional rating on review changes
-- ============================================
-- Goals:
-- - Automatically update professionals.rating and professionals.total_reviews
--   whenever a review is inserted, updated (visibility toggle), or deleted.
-- - Only count visible reviews (is_visible = true).
-- - Avoid recalculating the entire professionals table on every change.
-- ============================================

-- --------------------------------------------
-- 1) Helper function to recalc rating for a specific professional
-- --------------------------------------------
CREATE OR REPLACE FUNCTION recalc_professional_rating(p_professional_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE professionals
  SET
    rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE professional_id = p_professional_id
        AND is_visible = true
    ), 0),
    total_reviews = COALESCE((
      SELECT COUNT(*)
      FROM reviews
      WHERE professional_id = p_professional_id
        AND is_visible = true
    ), 0),
    updated_at = NOW()
  WHERE id = p_professional_id;
END;
$$;

-- --------------------------------------------
-- 2) Trigger function invoked on review changes
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trigger_recalc_professional_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_professional_id UUID;
BEGIN
  -- Determine which professional_id was affected
  IF TG_OP = 'DELETE' THEN
    v_professional_id := OLD.professional_id;
  ELSE
    v_professional_id := NEW.professional_id;
  END IF;

  -- For UPDATE: if professional_id changed, recalc both old and new professionals
  IF TG_OP = 'UPDATE' AND OLD.professional_id IS DISTINCT FROM NEW.professional_id THEN
    PERFORM recalc_professional_rating(OLD.professional_id);
    PERFORM recalc_professional_rating(NEW.professional_id);
    RETURN NEW;
  END IF;

  -- For INSERT: only recalc if review is visible
  IF TG_OP = 'INSERT' AND NEW.is_visible = true THEN
    PERFORM recalc_professional_rating(v_professional_id);
    RETURN NEW;
  END IF;

  -- For UPDATE: only recalc if visibility or rating changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_visible IS DISTINCT FROM NEW.is_visible
       OR OLD.rating IS DISTINCT FROM NEW.rating THEN
      PERFORM recalc_professional_rating(v_professional_id);
    END IF;
    RETURN NEW;
  END IF;

  -- For DELETE: always recalc (the review is gone)
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_professional_rating(v_professional_id);
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- --------------------------------------------
-- 3) Attach trigger to reviews table
-- --------------------------------------------
DROP TRIGGER IF EXISTS trg_recalc_professional_rating ON reviews;

CREATE TRIGGER trg_recalc_professional_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_professional_rating();

-- --------------------------------------------
-- 4) Index to support fast recalc queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_professional_visible
ON reviews(professional_id, is_visible)
WHERE is_visible = true;

-- --------------------------------------------
-- 5) Backfill existing professionals (one-time)
-- --------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT professional_id
    FROM reviews
    WHERE is_visible = true
  LOOP
    PERFORM recalc_professional_rating(r.professional_id);
  END LOOP;
END $$;
