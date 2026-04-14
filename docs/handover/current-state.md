# Current State

Last updated: 2026-04-14

## Operational truth

- Canonical workspace: `C:\dev\muuday-app`
- Archive-only workspace: `C:\Users\igorp\OneDrive\Documents\Muuday`
- Current branch target: `main`
- Active deployment model: Vercel production on merge/push to `main`
- Canonical spec baseline: `docs/spec/source-of-truth/part1..part5`

## Product state

### Done

1. Public shell is live with landing, search, profile, help, about, and professional-registration entry points.
2. Search supports taxonomy-aware filtering, public access, and currency-aware pricing.
3. Professional onboarding is live with admin-reviewed signup and dashboard tracker flow.
4. Dashboard tracker modal is now the primary onboarding experience for professionals.
5. Booking lifecycle, request booking, recurring foundations, and dual-gate onboarding model are implemented.
6. Public and member role routing are enforced in middleware and app surfaces.

### In progress

1. Professional operations UX polish, especially calendar and scheduling ergonomics.
2. Remaining copy and consistency cleanup on member and admin surfaces.
3. Pre-Wave-3 financial and compliance hardening.

### Not open yet

1. Wave 3 real-money execution.
2. Full payout and settlement operations.
3. Final compliance/legal freeze for sensitive categories.

## Infrastructure state

1. Supabase Pro and Vercel Pro are active.
2. CI quality gates are in place for lint, typecheck, build, and test suites.
3. Search uses Postgres-first indexing strategy with `pg_trgm` and GIN baseline.
4. Upstash-backed rate limiting and Sentry/Checkly monitoring baselines are active.
5. Supabase DB webhooks feed `/api/webhooks/supabase-db` and enqueue async processing safely.
6. Calendar OAuth groundwork exists; full provider lifecycle remains an active implementation track.

## Recently stabilized

1. Dashboard onboarding banner/modal were consolidated into one primary experience.
2. `/onboarding-profissional` was deprecated into a safe redirect.
3. Search currency switching was fixed to update price filters correctly.
4. PT-BR mojibake cleanup was applied across main public/search/profile surfaces.
5. Calendar sync controls were removed from the onboarding modal and concentrated in `/disponibilidade`.

## Open risks

1. Wave 3 remains the largest technical and operational risk area.
2. Legal/tax wording and sensitive-category compliance still require human closure.
3. Local environment drift remains a risk if work is done outside the canonical workspace.
4. Some operational docs had accumulated stale or corrupted text; active handover docs have now been reset, but older historical docs should be treated cautiously unless they are explicitly current.

## Rules for the next operator

1. Work only in `C:\dev\muuday-app`.
2. Keep `.env.*` snapshots local unless there is an explicit normalization task.
3. Update docs in the same batch as meaningful implementation changes.
4. Do not reopen Wave 3 implicitly through incidental implementation work.
5. Prefer short, current operational docs over long historical running logs in active files.
