-- ============================================
-- HIGH SECURITY FIX #4: Restrict Profiles SELECT
-- Run this in Supabase SQL Editor (prod project: jbbnbbrroifghrshplsq)
-- ============================================
-- Problem: "Profiles are viewable by everyone" uses USING(true),
--   exposing all user emails, names, countries to unauthenticated access.
-- Fix: Only authenticated users can read profiles.
--   All app queries already run server-side with authenticated sessions.
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Allow only authenticated users to read profiles
-- This covers:
--   - Reading your own profile (layout, settings, perfil pages)
--   - Reading other profiles via joins (booking pages, agenda)
--   - Admin reading all profiles (admin dashboard)
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
