# Pro Plan Utilization Audit (No-Extra Focus)
Date: 2026-04-14  
Workspace: `C:\dev\muuday-app`

## 1) What Was Executed Now

### 1.1 Supabase advisor hardening migration (applied)
- Migration file added:
  - `db/sql/migrations/040-advisor-low-risk-hardening.sql`
- Applied directly to project `jbbnbbrroifghrshplsq` using MCP `apply_migration`.

### 1.2 Changes included in migration 040
- Added missing FK indexes (20 indexes) for advisor performance findings.
- Removed duplicate indexes:
  - `professional_specialties_professional_idx`
  - `slot_locks_expires_at_idx`
- Closed security lint for RLS-without-policy on `public.professional_subcategories`:
  - Added read policy for approved/owner/admin
  - Added own-management policy
  - Added admin-management policy
- Hardened function `search_path` on flagged public functions:
  - `assign_professional_public_code`
  - `compute_ends_at`
  - `compute_remaining_sessions`
  - `emit_payment_event_to_inngest`
  - `fill_payments_legacy_required_fields`
  - `normalize_taxonomy_text`
  - `professional_tier_limits`
  - `search_text_from_array`
  - `update_updated_at`

## 2) Evidence Snapshot

### 2.1 Supabase plan and enabled extensions
- Organization plan: `pro`
- Enabled and active extensions relevant to Pro usage:
  - `pg_cron`
  - `pg_net`
  - `pgsodium`
  - `supabase_vault`
  - `pg_stat_statements`

### 2.2 Active DB cron jobs
- `cleanup-expired-slot-locks` (`*/5 * * * *`)
- `clear-expired-slot-locks-fast` (`* * * * *`)
- `cancel-stale-pending-bookings` (`*/10 * * * *`)
- `http-public-visibility-sync` (`*/15 * * * *`)

### 2.3 Trigger/webhook path in DB
- Payment triggers present:
  - `trg_emit_payment_event_to_inngest_insert`
  - `trg_emit_payment_event_to_inngest_update`

### 2.4 Project inventory (Supabase)
- `jbbnbbrroifghrshplsq` (`muuday-app`)  
  - status: `ACTIVE_HEALTHY`
  - estimated main-table rows present (non-zero)
  - DB size: `18 MB`
- `fpbovccncdwokafywsra` (`Muuday1's Project`)  
  - status: `ACTIVE_HEALTHY`
  - sampled public tables with `0` estimated rows
  - DB size: `11 MB`

## 3) Keep vs Delete Checklist

Use this checklist before deleting any project.

### 3.1 Supabase `jbbnbbrroifghrshplsq` (muuday-app)
- Keep if all true:
  - App envs point to this `ref`
  - Active traffic/webhooks hit this DB
  - Current migrations and data are here
  - Storage buckets in production are here
- Current recommendation: **KEEP**

### 3.2 Supabase `fpbovccncdwokafywsra` (Muuday1's Project)
- Delete/archive candidate if all true:
  - No env variable references this `ref`
  - No active integrations/webhooks depend on it
  - No unique production data exists there
  - No upcoming test plan needs it
- Current recommendation: **CANDIDATE TO PAUSE/DELETE** (appears low-usage/empty)

### 3.3 Vercel projects
- `muuday-app` (app domains): keep
- `muuday-site` (`muuday.com` / `www.muuday.com`): keep if marketing site is active

## 4) No-Extra-Cost Optimization Plan

## 4.1 Supabase (included value, no add-ons)
1. Keep running `get_advisors` weekly and close lints in small batches.
2. Keep `pg_cron` jobs in DB for pure data maintenance (already in place).
3. Keep using `pg_stat_statements` to identify heavy queries and trim query costs.
4. Continue using `supabase_vault` and `pgsodium` for sensitive values/tokens.
5. Reduce duplicate/legacy policies to lower RLS evaluation overhead.

## 4.2 Vercel (included value, no add-ons)
1. Ensure Spend Management uses auto-pause at threshold (not alert-only).
2. Keep `@vercel/analytics` and `@vercel/speed-insights` enabled (already active).
3. Keep cron routes minimal and protected with secret validation (already implemented).
4. Periodically prune stale preview branches/deployments for operational hygiene.

## 5) Remaining Manual/Console Items

These are not code-blocking, but need dashboard confirmation:
- Vercel Spend Management: verify **Pause all production deployments** threshold is enabled.
- Supabase Auth security:
  - enable leaked password protection in Auth settings.
- Optional: review public bucket list policy if directory listing is not needed.

## 6) Notes About Advisor Items Not Auto-Changed

Not auto-changed in this run because they require product/security decision:
- Extension schema relocation warnings (`pg_trgm`, `pg_net` in `public`) may break references.
- Some RLS policy optimization warnings (multiple permissive policies) need careful policy consolidation.
- Auth password leak protection is a dashboard-level toggle (not SQL migration).
