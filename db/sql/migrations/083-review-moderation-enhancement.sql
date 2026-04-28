-- ============================================
-- MIGRATION 083: Review Moderation Enhancement (REVIEW-01)
-- ============================================
-- Adds structured moderation workflow to reviews:
--   - moderation_status (pending/approved/rejected/flagged)
--   - rejection_reason + admin_notes
--   - moderated_by + moderated_at
--   - flag_reasons (auto-detected suspicious patterns)
-- Backfills existing reviews from is_visible boolean.
-- ============================================

-- 1. Add moderation_status with CHECK constraint
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- 2. Add moderation metadata columns
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS flag_reasons TEXT[] DEFAULT '{}'::TEXT[];

-- 3. Backfill: existing visible reviews → approved; invisible → pending
UPDATE reviews
  SET moderation_status = CASE WHEN is_visible = true THEN 'approved' ELSE 'pending' END
  WHERE moderation_status = 'pending';

-- 4. Indexes for moderation queue performance
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_at ON reviews(moderated_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(moderation_status) WHERE moderation_status = 'flagged';

-- 5. Ensure is_visible stays in sync with moderation_status
-- (Application code updates both; this is a safety net for direct SQL access)
CREATE OR REPLACE FUNCTION sync_review_visibility()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_visible := (NEW.moderation_status = 'approved');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_review_visibility ON reviews;
CREATE TRIGGER trg_sync_review_visibility
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_review_visibility();

-- 6. Update existing rows through trigger to ensure consistency
UPDATE reviews SET is_visible = is_visible WHERE is_visible IS NOT NULL;
