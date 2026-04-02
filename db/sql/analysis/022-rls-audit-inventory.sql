-- ============================================
-- RLS AUDIT INVENTORY (read-only)
-- ============================================
-- Purpose:
-- 1) Verify which user-data tables have RLS enabled.
-- 2) Verify policy coverage for critical tables.
-- 3) Detect obvious risky policies (USING true on sensitive tables).
--
-- Run in Supabase SQL Editor (production and preview) and save output.

-- --------------------------------------------
-- A) Inventory of user-data tables
-- --------------------------------------------
WITH user_data_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'professionals',
    'bookings',
    'payments',
    'reviews',
    'messages',
    'favorites',
    'notifications',
    'request_bookings',
    'professional_applications',
    'professional_services',
    'booking_sessions',
    'availability_rules',
    'availability_exceptions',
    'calendar_integrations',
    'professional_settings',
    'tag_suggestions'
  ]) AS table_name
),
table_inventory AS (
  SELECT
    t.table_name,
    c.oid IS NOT NULL AS table_exists,
    COALESCE(c.relrowsecurity, FALSE) AS rls_enabled,
    COALESCE(c.relforcerowsecurity, FALSE) AS rls_forced
  FROM user_data_tables t
  LEFT JOIN pg_class c
    ON c.relname = t.table_name
   AND c.relkind = 'r'
   AND c.relnamespace = 'public'::regnamespace
)
SELECT
  ti.table_name,
  ti.table_exists,
  ti.rls_enabled,
  ti.rls_forced,
  COALESCE(p.policy_count, 0) AS policy_count
FROM table_inventory ti
LEFT JOIN (
  SELECT tablename, COUNT(*)::int AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p
  ON p.tablename = ti.table_name
ORDER BY
  ti.table_exists DESC,
  ti.rls_enabled ASC,
  ti.table_name;

-- --------------------------------------------
-- B) Critical table policy details
-- --------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'payments', 'messages', 'reviews')
ORDER BY tablename, cmd, policyname;

-- --------------------------------------------
-- C) Risk scan: permissive TRUE policies in sensitive tables
-- --------------------------------------------
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'payments', 'messages', 'reviews')
  AND (
    COALESCE(qual, '') ~* '^\s*true\s*$'
    OR COALESCE(with_check, '') ~* '^\s*true\s*$'
  )
ORDER BY tablename, policyname;

-- --------------------------------------------
-- D) Generic guardrail: any public table with user-ish foreign keys and RLS OFF
-- --------------------------------------------
WITH candidate_tables AS (
  SELECT DISTINCT c.table_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name IN (
      'user_id',
      'professional_id',
      'booking_id',
      'profile_id',
      'sender_id',
      'recipient_id'
    )
)
SELECT
  ct.table_name,
  cls.relrowsecurity AS rls_enabled
FROM candidate_tables ct
JOIN pg_class cls
  ON cls.relname = ct.table_name
 AND cls.relkind = 'r'
 AND cls.relnamespace = 'public'::regnamespace
WHERE COALESCE(cls.relrowsecurity, FALSE) = FALSE
ORDER BY ct.table_name;
