-- Migration 062: Backfill availability_rules from legacy availability
--
-- Context: the onboarding save route was writing only to the legacy `availability`
-- table. All read surfaces prefer `availability_rules`, so stale or missing data
-- in that table could cause professionals to see outdated slots.
--
-- This migration re-syncs availability_rules from availability for every
-- professional that has legacy rows. Professionals without legacy rows are
-- left untouched (their availability_rules, if any, are preserved).

-- Step 1: Remove stale availability_rules rows for professionals that have
-- legacy availability data. This ensures we don't keep outdated backfill data
-- from the initial 005 migration.
DELETE FROM availability_rules
WHERE professional_id IN (
  SELECT DISTINCT professional_id FROM availability
);

-- Step 2: Insert fresh rules from the legacy table. Use the professional's
-- timezone from professional_settings when available, otherwise fall back to
-- the platform default. ON CONFLICT skips exact duplicates safely.
INSERT INTO availability_rules (
  professional_id,
  weekday,
  start_time_local,
  end_time_local,
  timezone,
  is_active
)
SELECT
  a.professional_id,
  a.day_of_week,
  a.start_time,
  a.end_time,
  COALESCE(ps.timezone, 'America/Sao_Paulo'),
  a.is_active
FROM availability a
LEFT JOIN professional_settings ps ON ps.professional_id = a.professional_id
ON CONFLICT (professional_id, weekday, start_time_local, end_time_local) DO NOTHING;
