# Integration: Supabase

Last updated: 2026-04-17

## Purpose

Primary backend platform for:

1. Auth sessions
2. PostgreSQL data model
3. RLS-based access controls

## Where it is used

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/admin.ts`
- App routes and server actions under `app/` and `lib/actions/`
- Operational smoke script: `scripts/ops/validate-supabase-auth-flow.cjs`

## Current status

- `Done` for core auth/data operations and wave 1 schema parity set
- `In progress` for production validation hygiene and DB operation observability

## Risks and notes

1. Canonical schema is migration-driven; every new migration must update snapshot and docs in the same task.
2. Admin client must remain server-only with strict secret handling.
3. **No admin fallbacks in user-facing code**: as of 2026-04-17, all `adminSupabase` / `createAdminClient()` fallbacks were removed from user- and professional-facing server actions and API routes. RLS policies are the single source of truth. Migration `051-remove-admin-fallbacks-rls-hardening.sql` closes the remaining gaps (notifications, payments trigger, storage policies).
4. Build-time env validation is enforced via `lib/config/env.ts` (loaded in `instrumentation.ts`). Missing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` will fail CI/production builds.
5. Current production auth smoke run returned signup `unexpected_failure`; apply migration `012-auth-signup-trigger-hardening.sql` before re-testing.

## Next steps

1. Keep migration documentation synchronized with runtime behavior.
2. Validate migration execution state in production before each wave gate.
3. Use `npm run auth:validate-smoke` as the baseline Auth email smoke check (signup + reset trigger) before wave gates.
4. Add DB operation observability and stronger audit traces for admin actions.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
