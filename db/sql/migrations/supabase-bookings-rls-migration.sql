-- ============================================
-- BOOKING RLS FIX
-- Allow booking updates by:
-- 1) booking owner (user_id)
-- 2) assigned professional (professional_id -> professionals.user_id)
-- 3) admin role
-- ============================================

-- Keep this migration idempotent
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users and professionals can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;

CREATE POLICY "Users and professionals can update bookings"
  ON bookings FOR UPDATE
  USING (
    user_id = auth.uid() OR
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

