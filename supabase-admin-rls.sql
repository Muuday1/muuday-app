-- ============================================
-- ADMIN RLS POLICIES
-- Run this in Supabase SQL Editor (prod project: jbbnbbrroifghrshplsq)
-- ============================================

-- Allow admins to view ALL professionals (regardless of status)
CREATE POLICY "Admins can view all professionals"
  ON professionals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to update any professional (approve/reject/suspend)
CREATE POLICY "Admins can update all professionals"
  ON professionals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to view ALL reviews (including hidden ones)
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to update reviews (toggle visibility)
CREATE POLICY "Admins can update reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to view ALL bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to view ALL profiles
-- (profiles already have "viewable by everyone" policy, so this is just for clarity)

-- ============================================
-- SET YOUR USER AS ADMIN
-- Replace 'YOUR_USER_ID' with your actual auth.users id
-- Find it: SELECT id, email FROM auth.users;
-- ============================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'igorpinto.ids@gmail.com';
