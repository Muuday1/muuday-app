# Control Snapshot - 2026-04-14

## Done

- Wave 2 is closed and production is stable.
- Public shell, search, profile, and professional signup flows are live.
- Professional dashboard onboarding now uses the dashboard tracker modal as the primary flow.
- `/onboarding-profissional` is deprecated and safely redirects into the dashboard flow.
- Search currency changes now correctly update price-filter behavior.
- PT-BR copy cleanup has been applied across the main public and onboarding surfaces.
- Calendar sync and full calendar management were moved out of the onboarding modal into `/disponibilidade`.
- Supabase DB webhook to `/api/webhooks/supabase-db` remains active with non-blocking `202` handling.
- Vercel Skew Protection remains enabled.

## Current production truth

- Active workspace: `C:\dev\muuday-app`
- Archive workspace: `C:\Users\igorp\OneDrive\Documents\Muuday`
- Wave 3 real-money scope is still closed.
- PITR is still intentionally deferred for cost reasons until pre-payments go-live.

## Pending

1. Finish remaining professional operations polish, especially calendar UX and onboarding ergonomics.
2. Continue removing stale technical language from user-facing professional flows.
3. Keep public design, search, and profile consistency tight as media assets evolve.
4. Close remaining pre-Wave-3 operational hardening items.

## Blockers

1. Wave 3 depends on payment-rail execution and compliance closure.
2. Sensitive-category legal/tax wording is not fully frozen.
3. Some local operator-only environment snapshots exist outside version control and should stay local-only unless intentionally normalized.

## Next

1. Keep active docs aligned with current production truth.
2. Finish UX cleanup on professional calendar and remaining admin/professional operational surfaces.
3. Reopen Wave 3 only after the current stabilization backlog is materially closed.
