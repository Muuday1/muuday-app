-- ============================================
-- CRITICAL SECURITY FIX #1: Role Escalation Prevention
-- Run this in Supabase SQL Editor (prod project: jbbnbbrroifghrshplsq)
-- ============================================
-- Fixes TWO attack vectors:
--   1. Signup metadata injection: client sends role='admin' in signUp metadata
--   2. Profile self-update: user does UPDATE profiles SET role='admin' WHERE id=my_id
-- ============================================

-- =====================
-- FIX 1: Trigger function — validate role on signup
-- =====================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Only allow 'usuario' or 'profissional' from client metadata.
  -- 'admin' can NEVER be set via signup — must be promoted via SQL manually.
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'usuario');
  IF _role NOT IN ('usuario', 'profissional') THEN
    _role := 'usuario';
  END IF;

  INSERT INTO profiles (id, email, full_name, role, country, timezone, currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role,
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'BRL')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- FIX 2: RLS policy — prevent users from changing their own role
-- =====================
-- Drop the old permissive policy (no WITH CHECK = user can SET any column to anything)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate with WITH CHECK that blocks role changes
-- The trick: WITH CHECK ensures the new row's role equals the OLD role.
-- Since RLS doesn't give access to OLD directly, we compare against a subquery.
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  );

-- =====================
-- VERIFICATION QUERIES (run these after applying the migration)
-- =====================
-- 1. Check the trigger is correct:
--    SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
--
-- 2. Check the RLS policy:
--    SELECT polname, polqual, polwithcheck
--    FROM pg_policy
--    WHERE polrelid = 'profiles'::regclass;
--
-- 3. Test that role change is blocked (should fail):
--    UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
--    -- Expected: 0 rows updated (WITH CHECK violation)
--
-- 4. Test that normal updates still work:
--    UPDATE profiles SET full_name = 'Test' WHERE id = auth.uid();
--    -- Expected: 1 row updated
