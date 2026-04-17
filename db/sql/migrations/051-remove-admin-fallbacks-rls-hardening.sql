-- ============================================
-- 051 - Fix missing RLS policies for professional self-management
-- ============================================
-- Problem: Several tables lacked RLS policies allowing authenticated
-- professionals/users to mutate their own data. This forced the app
-- to fall back to service_role / admin clients, bypassing RLS.
--
-- This migration adds the missing policies so the app can safely
-- remove adminSupabase fallbacks from user-facing server actions
-- and API routes.
-- ============================================

BEGIN;

-- 1) professionals: allow professionals to update their own row
-- (needed by onboarding save / completar-perfil)
DROP POLICY IF EXISTS "Professionals can update own profile" ON public.professionals;
CREATE POLICY "Professionals can update own profile"
  ON public.professionals
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 2) availability (legacy table): allow professional owners full access
-- (needed by onboarding save which still writes to this table)
ALTER TABLE IF EXISTS public.availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Availability is publicly readable" ON public.availability;
CREATE POLICY "Availability is publicly readable"
  ON public.availability
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Professionals manage own availability" ON public.availability;
CREATE POLICY "Professionals manage own availability"
  ON public.availability
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 3) notifications: allow professionals to insert system/ops notifications
-- with null user_id (e.g. no-show reports that notify ops).
-- The app checks caller authorization before inserting.
DROP POLICY IF EXISTS "Professionals can insert ops notifications" ON public.notifications;
CREATE POLICY "Professionals can insert ops notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (
      user_id IS NULL
      AND type LIKE 'ops.%'
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = notifications.booking_id
          AND b.professional_id IN (
            SELECT p.id FROM public.professionals p WHERE p.user_id = auth.uid()
          )
      )
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

COMMIT;
