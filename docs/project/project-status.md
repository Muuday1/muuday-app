# Project Status

Last updated: 2026-04-25

Spec baseline: `docs/spec/source-of-truth/part1..part5`

## Snapshot

- Wave 0: Done
- Wave 1: Done
- Wave 2: Done (closed 2026-04-10)
- Payment engine (Phases 1–6): Fase 6.1–6.4 (Ledger, Stripe Pay-in, Revolut Settlement, Trolley Payout) ✅ completas. Awaiting E2E testing before Wave 3 launch.
- Stabilization and UX refinement: In progress
- Wave 3 real-money execution: Blocked on E2E validation + compliance freeze

## Production state

1. Public shell is live and usable for logged-out and logged-in journeys.
2. Search, profile, and booking entry flows are operational.
3. Professional signup and admin-reviewed onboarding pipeline are operational.
4. Dashboard tracker modal is the active professional onboarding experience.
5. Calendar configuration and sync are being concentrated in `/disponibilidade`.
6. Onboarding modal now loads via `critical` bootstrap + optional background hydration, reducing open-time blocking.

## Infrastructure state

1. Supabase Pro and Vercel Pro are active.
2. CI quality gates exist and are part of the release path.
3. Search indexing and rate limiting baselines are in place.
4. Monitoring exists through Sentry and Checkly.
5. DB webhook to async processing bridge is live.

## Major completed milestones

1. Taxonomy, search, and discovery foundations are implemented.
2. Tier enforcement and professional visibility gates are implemented.
3. Booking lifecycle and request-booking foundations are implemented.
4. Professional onboarding review pipeline is implemented.
5. Dashboard onboarding tracker has replaced the old standalone onboarding page.
6. Public/member PT-BR cleanup and search currency-filter corrections have shipped.
7. Structured admin review adjustments + per-term legal acceptance flow shipped end-to-end.
8. Onboarding modal performance split (`modal-context` by scope) shipped with non-blocking optional data.
9. Stripe Pay-in Completion (Fase 6.2) fully implemented with test coverage: PaymentIntent API, Checkout Session API, webhook receiver, and ledger integration.

## Active gaps

1. Professional operations UX still needs refinement, especially around calendar and scheduling experience.
2. Financial infrastructure implemented; Stripe pay-in + ledger integration tested. Compliance hardening and E2E testing remain open before Wave 3 launch.
3. Some lower-traffic surfaces still need copy and consistency cleanup.
4. Documentation drift identified in comprehensive audit (2026-04-24) — see `docs/DOC-AUDIT-REPORT-2026-04-24.md` for full findings.

## Recently closed

1. Payment stack test coverage delivered:
   - 38 tests for `lib/payments/ledger/` (entries + balance)
   - 10 tests for `lib/stripe/webhook-handlers` (capture, refund, settlement, dispute)
   - 21 tests for `app/api/stripe/*` routes (PaymentIntent + Checkout Session)
   - 10 tests for `app/api/webhooks/stripe` (webhook receiver)
   - Total project test suite: **468 tests passing in 57 files**
2. Two-tier availability architecture fully aligned:
   - All read surfaces prefer `availability_rules` with fallback to legacy `availability`.
   - Onboarding save route dual-writes to both tables with symmetric rollback.
   - Modal-context route prefers `availability_rules` with legacy fallback.
   - Backfill migration (062) ensures professionals with pre-fix onboarding data are synced.
   - Availability exceptions render on professional calendar and filter all slot pickers.

## Blockers

1. Wave 3 depends on E2E testing of payment flows (Stripe sandbox → Trolley sandbox) and compliance readiness.
2. Sensitive-category legal/tax wording is not fully frozen.

## Continuity rule

Every meaningful implementation batch should update:

1. `docs/project/project-status.md`
2. `docs/handover/current-state.md`
3. `docs/handover/next-steps.md`


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
