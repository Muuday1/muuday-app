-- ============================================
-- RLS cleanup: remove duplicate and stale policies
-- ============================================

-- 1) payments: remove stale policy that uses professional_id = auth.uid() directly
--    (incorrect — should go through professionals.user_id join)
DROP POLICY IF EXISTS "Payments visible to participants" ON payments;

-- 2) favorites: remove duplicate INSERT policies (keep one)
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;

-- 3) favorites: remove duplicate SELECT policies (keep one)
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;

-- 4) favorites: remove duplicate DELETE policies (keep one)
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
