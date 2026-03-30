-- ============================================
-- Favorites RLS safety net (post 007 cleanup)
-- ============================================

-- Keep dropping legacy duplicate/stale policy names if they exist.
DROP POLICY IF EXISTS "Payments visible to participants" ON payments;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;

-- Ensure canonical favorites policies always exist.
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

