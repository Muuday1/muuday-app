# Current State

Last updated: 2026-04-25

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
7. Payment engine Phases 1–6 fully implemented: double-entry ledger, Stripe pay-in, Revolut settlement, Trolley payouts, refunds/disputes, admin finance dashboard.
8. Payment stack test coverage delivered: **736 tests passing across 72 files** (includes 447 new tests for ledger, Stripe webhook handlers, API routes, Revolut settlement, Trolley payout, Refund & Dispute infrastructure, dispute API routes, fee calculator, eligibility engine, debt monitor, bigint constants, format utils, ledger accounts, financial metrics, and subscription manager).

### In progress

1. Professional operations UX polish, especially calendar and scheduling ergonomics.
2. Remaining copy and consistency cleanup on member and admin surfaces.
3. Pre-Wave-3 financial and compliance hardening — payment engine code complete and tested. Needs E2E validation and production migration.

### Not open yet

1. Wave 3 real-money execution (blocked on E2E + compliance).
2. Final compliance/legal freeze for sensitive categories.

## Infrastructure state

1. Supabase Pro and Vercel Pro are active.
2. CI quality gates are in place for lint, typecheck, build, and test suites.
3. Search uses Postgres-first indexing strategy with `pg_trgm` and GIN baseline.
4. Upstash-backed rate limiting and Sentry/Checkly monitoring baselines are active.
5. Supabase DB webhooks feed `/api/webhooks/supabase-db` and enqueue async processing safely.
6. Calendar OAuth groundwork exists; full provider lifecycle remains an active implementation track.
7. Payment engine infrastructure complete: 9 ledger tables, 8 TS modules, 2 webhooks, 4 Inngest functions, admin finance dashboard with 5 pages. Test coverage added for ledger entries/balance, webhook handlers, and Stripe API routes.

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
15. Payment engine build fixes committed and pushed to `main` — TypeScript clean, lint clean, 186 pages generated.
16. Comprehensive documentation audit completed (2026-04-24) — see `docs/DOC-AUDIT-REPORT-2026-04-24.md`.
17. **Stripe Pay-in test coverage batch (2026-04-25):**
    - `lib/payments/ledger/entries.test.ts` — 19 tests (validation, transaction templates, RPC mocking)
    - `lib/payments/ledger/balance.test.ts` — 19 tests (queries, RPC updates, pure validation)
    - `lib/stripe/webhook-handlers.test.ts` — 10 tests (PI succeeded/failed, refund, payout, dispute)
    - `app/api/stripe/payment-intent/route.test.ts` — 12 tests (auth, state checks, PI creation/reuse)
    - `app/api/stripe/checkout-session/booking/route.test.ts` — 9 tests (auth, state checks, session creation)
    - `app/api/webhooks/stripe/route.test.ts` — 10 tests (CORS, rate limit, signature, persistence, enqueue)
18. **Stripe Settlement → Revolut test coverage batch (2026-04-25):**
    - `lib/payments/revolut/client.test.ts` — 18 tests (API client, auth refresh, webhook signature, treasury balance, health check)
    - `lib/payments/revolut/reconciliation.test.ts` — 10 tests (auto-match, tolerance, manual reconcile, deduplication, non-eligible tx filtering)
    - `app/api/webhooks/revolut/route.test.ts` — 10 tests (CORS, rate limit, signature verification, JSON parse, enqueue)
    - `inngest/functions/treasury-snapshot.test.ts` — 6 tests (skip unconfigured, alert below buffer, snapshot insert, webhook source)
    - `inngest/functions/treasury-reconciliation.test.ts` — 5 tests (handler invocation, mismatch warning, summary logging)
19. **Professional Payout via Trolley test coverage batch (2026-04-25):**
    - `lib/payments/trolley/client.test.ts` — 15 tests (API client, recipient/payment/batch creation, webhook HMAC signature, health check)
    - `lib/payments/trolley/onboarding.test.ts` — 12 tests (create recipient, idempotency, profile lookup, status sync, status mapping)
    - `app/api/webhooks/trolley/route.test.ts` — 9 tests (CORS, rate limit, signature, JSON parse, enqueue)
    - `inngest/functions/trolley-webhook-processor.test.ts` — 8 tests (recipient created/updated, payment updated, batch updated, unhandled)
    - `inngest/functions/payout-batch-create.test.ts` — 7 tests (no eligible, no trolley recipients, insufficient funds, trolley payment failure, batch failure, success with debt deduction)
20. **Refund & Dispute Engine test coverage batch (2026-04-25):**
    - `lib/payments/refund/engine.test.ts` — 14 tests (invalid percentage, no payment, not captured, exceeds refundable, Stripe not configured, API failure, pre-payout refund, post-payout dispute with debt, payment update failure, ledger failure, idempotency key, 100% refund, status update)
    - `lib/disputes/dispute-service.test.ts` — 33 tests (openCase validation/participant check, addCaseMessage validation/access control, resolveCase with/without refund, refund failure, getCaseById, getCaseMessages, listCases)
    - `lib/actions/admin/refund.test.ts` — 9 tests (not admin, rate limit, invalid inputs, admin client missing, success, failure, dispute resolution id)
    - `lib/actions/disputes.test.ts` — 13 tests (all server action wrappers: openCase, addCaseMessage, resolveCase, getCaseById, getCaseMessages, listCases)
21. **Dispute API routes test coverage batch (2026-04-25):**
    - `app/api/v1/disputes/route.test.ts` — 10 tests (POST/GET, rate limit, auth, invalid JSON, invalid body, success)
    - `app/api/v1/disputes/[caseId]/route.test.ts` — 11 tests (GET/PATCH, rate limit, auth, admin required for PATCH, invalid caseId, not found, success)
    - `app/api/v1/disputes/[caseId]/messages/route.test.ts` — 11 tests (POST/GET, rate limit, auth, invalid body, not found, success)
22. **Payment support modules test coverage batch (2026-04-25):**
    - `lib/payments/fees/calculator.test.ts` — 23 tests (calculatePayout debt deduction, zero/negative cases, trolley fee estimation, formatMinorUnits, parseToMinorUnits, validatePayoutCalculation invariants)
    - `lib/payments/eligibility/engine.test.ts` — 23 tests (shouldProfessionalReceivePayoutNow weekly/biweekly/monthly/unknown, checkBookingEligibility all 6 criteria, checkProfessionalEligibility balance/periodicity/minimum, scanPayoutEligibility empty/scans all)
    - `lib/payments/debt/monitor.test.ts` — 20 tests (getMaxProfessionalDebtThreshold env/default, checkDebtThresholds filtering/sorting/name resolution/fallbacks/error handling, alertAdminOnDebtThreshold notification creation, runDebtMonitoring end-to-end pipeline)
23. **Payment core modules test coverage batch (2026-04-25):**
    - `lib/payments/bigint-constants.test.ts` — 18 tests (B, FEES, THRESHOLDS, PERCENT constant values and types)
    - `lib/payments/format-utils.test.ts` — 26 tests (formatMinorUnits BRL/USD/negative/zero, minorToMajor, formatPayoutStatus all states, formatKycStatus all states and fallbacks)
    - `lib/payments/ledger/accounts.test.ts` — 20 tests (all 11 account constants, getLedgerAccountByCode, getAllLedgerAccounts, validateLedgerAccountCode)
    - `lib/payments/metrics.test.ts` — 15 tests (treasury buffer, avg payout time, dispute rate, ledger aggregates for revenue/payouts/refunds/fees, empty/edge cases)
    - `lib/payments/subscription/manager.test.ts` — 21 tests (createProfessionalSubscription with Stripe product/customer/subscription, syncSubscriptionFromStripe update/backfill, recordSubscriptionPayment, recordSubscriptionPaymentFailure, cancelProfessionalSubscription immediate/at-period-end, error handling)

## Open risks

1. Wave 3 risk reduced — payment engine code is complete and build-stable. Risk now concentrated in E2E validation and compliance freeze.
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
