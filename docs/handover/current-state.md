# Current State

Last updated: 2026-04-22

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

1. Sprint 3 (Profile/Professional APIs extraction) is complete. All Server Actions in `lib/actions/professional.ts`, `professional-services.ts`, `availability-exceptions.ts`, `user-profile.ts`, `review.ts`, `favorites.ts`, `disputes.ts`, and `client-records.ts` have been extracted into service modules (`lib/*-service.ts`) and thin API routes (`/api/v1/*`). TypeScript and build pass cleanly.
2. CORS gap closed for all `/api/v1/*` endpoints. Preflight and response headers are now applied in `middleware.ts` for the entire versioned API surface, enabling cross-origin mobile app consumption.
3. Sprint 4 (Booking Lifecycle APIs extraction) is complete. `lib/actions/manage-booking.ts` and `lib/actions/request-booking.ts` have been extracted into `lib/booking/manage-booking-service.ts` and `lib/booking/request-booking-service.ts`. New API routes: `GET /api/v1/bookings`, `GET /api/v1/bookings/:id`, `PATCH /api/v1/bookings/:id/{confirm,cancel,reschedule,session-link,complete}`, `POST /api/v1/bookings/:id/{report-no-show,mark-user-no-show}`, and full request-booking lifecycle under `/api/v1/bookings/requests/*`.
4. Sprint 5 (Remaining APIs extraction) is complete: onboarding (`complete-profile`, `complete-account`), review-response, blog-engagement, guide-feedback, admin-plans, and admin-taxonomy have been extracted into service modules and `/api/v1/*` routes. TypeScript and build pass cleanly.
5. `lib/actions/admin.ts` (172 lines) and `lib/actions/email.ts` (270 lines) are thin wrappers. No god files remain in `actions/`.
6. Dashboard onboarding banner/modal were consolidated into one primary experience.
7. `/onboarding-profissional` was deprecated into a safe redirect.
8. Search currency switching was fixed to update price filters correctly.
9. PT-BR mojibake cleanup was applied across main public/search/profile surfaces.
10. Calendar sync controls were removed from the onboarding modal and concentrated in `/disponibilidade`.
11. Onboarding modal load path was split into `critical` + `optional` scopes to prevent long blocking spinner on open.
12. Optional tracker blocks now hydrate in background (`plan-pricing`, taxonomy, plan configs, FX rates) without blocking edits.
13. Two-tier availability architecture closed:
    - All read surfaces prefer `availability_rules` with fallback to legacy `availability`.
    - Onboarding save route now dual-writes to both tables atomically.
    - Backfill migration (062) syncs existing professionals after the onboarding fix.
    - Availability exceptions render visually on the professional calendar (day/week/month).
    - Slot-filtering and availability-merge utilities extracted with full unit-test coverage.
14. Comprehensive documentation audit completed (2026-04-24) — see `docs/DOC-AUDIT-REPORT-2026-04-24.md`.

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


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
