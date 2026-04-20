-- ============================================
-- Guide Feedback Foundation
-- Useful flag + Report issue for guides
-- ============================================

-- --------------------------------------------
-- 1) Guide feedback (useful + reports)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS guide_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('useful', 'report')),
  message TEXT CHECK (LENGTH(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guide_slug, visitor_id, feedback_type)
);

CREATE INDEX IF NOT EXISTS idx_guide_feedback_guide ON guide_feedback(guide_slug, feedback_type);
CREATE INDEX IF NOT EXISTS idx_guide_feedback_reports ON guide_feedback(feedback_type, created_at DESC);

-- --------------------------------------------
-- 2) RLS Policies
-- --------------------------------------------
ALTER TABLE guide_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guide_feedback_public_select ON guide_feedback;
CREATE POLICY guide_feedback_public_select ON guide_feedback
  FOR SELECT USING (feedback_type = 'useful');

DROP POLICY IF EXISTS guide_feedback_public_insert ON guide_feedback;
CREATE POLICY guide_feedback_public_insert ON guide_feedback
  FOR INSERT WITH CHECK (TRUE);
