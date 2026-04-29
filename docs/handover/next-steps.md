# Next Steps

Last updated: 2026-04-29

Execute in order. Keep changes batchable, validated, and documented.

## Immediate queue

1. ~~Run production smoke for onboarding review loop~~ ✅ **Complete** — 47 unit tests added covering `reviewProfessionalDecisionService` (21 tests), `submitProfessionalForReview` (7 tests), and both API routes (19 tests). PT-BR copy fixes applied across admin-service.ts, submit-review.ts, and route files. Test suite: 938/89.
2. ~~Sprint 5 — Remaining APIs extraction~~ ✅ **Complete** — `lib/actions/admin.ts` (172 lines), `admin-plans.ts` (31 lines), `admin-taxonomy.ts` (47 lines), and `email.ts` (270 lines) are all thin wrappers delegating to dedicated service modules (`lib/admin/admin-service.ts`, `lib/email/email-action-service.ts`). No god files remain in `actions/`.
3. ~~Continue professional operations polish with focus on calendar UX and scheduling-rule clarity in `/disponibilidade`~~ ✅ **Complete** — Invalid Tailwind classes fixed, PT-BR accents restored, calendar legend/exception indicators added, exception loading wired into availability workspace, redundant duplicate cards removed from embedded variant. Additional code-level improvements committed 2026-04-28: beforeunload protection, unsaved-changes indicator, sticky save bar, per-day 'Copiar para...' schedule copy, specific Supabase error messages, TIME_OPTIONS extended to 05:00.
4. ~~Keep onboarding tracker copy/progression consistent~~ ✅ **Complete** — PT-BR accent fixes applied to OnboardingTrackerModal.tsx, constants.ts, and professional-workspace-section.tsx. Optional fetch non-blocking verified (try/catch wrapper with 3.5s timeout).
5. Close remaining PT-BR cleanup on lower-traffic admin/member surfaces. ✅ **Complete** — Fixed mojibake, missing accents, and English labels across `agenda`, `AdminPlanConfigForm`, `ProfessionalAgendaPage`, `admin/finance`, and `member/finance` surfaces.
6. ~~Evaluate and either merge or archive `feat/landing-page-redesign` explicitly~~ ✅ **Archived** — branch was 12 days behind main, would have reverted months of work (API v1, E2E tests, services, migrations). Main already has a superior LandingPage component with animations, carousels, and multi-section layout.
7. ~~Apply migration 062 in production to sync `availability_rules` for professionals who saved availability before the dual-write fix~~ ✅ **Applied** — confirmed in `session-log.md` Entry 84.
8. ~~Notification Preferences & Inbox (P1.8 / CROSS-03)~~ ✅ **Complete** — `/configuracoes/notificacoes` with per-category channel toggles and quiet hours; `/notificacoes` inbox with date grouping, category filters, unread indicators, and context-aware deep links.

## Payment Engine — Next Tasks (in order)

1. ~~Implement real Trolley webhook HMAC verification~~ ✅ **Done** — `lib/payments/trolley/client.ts`
2. ~~Implement real Revolut webhook HMAC verification~~ ✅ **Done** — `lib/payments/revolut/client.ts`
3. ~~Apply migrations 070-076 to production Supabase~~ ✅ **Applied** — confirmed by operator
4. ~~**Test Trolley sandbox onboarding end-to-end**~~ ✅ **Done** — Sandbox test script (`scripts/test-trolley-sandbox.js`) passes 10/10 against live Trolley sandbox. Previous 403 was caused by incorrect auth (raw headers instead of HMAC-SHA256 `prsign` request signing). Fixed 2026-04-28. Validates: recipient CRUD, PayPal payout method update, empty batch creation, payment creation within batch, batch start-processing (expected 400 in sandbox due to no KYC/funds), webhook signature verification. Batch-first payout flow corrected in `lib/payments/trolley/client.ts` and `inngest/functions/payout-batch-create.ts`.
5. ~~**Test Stripe sandbox pay-in → ledger → payout flow**~~ ✅ **Unit tests delivered** — 128 new tests cover PaymentIntent API, Checkout Session API, Stripe webhook receiver/handlers, ledger integration, Revolut client/reconciliation, Revolut webhook receiver, and treasury Inngest functions. E2E sandbox validation remains open.
6. ~~**Professional Payout via Trolley test coverage**~~ ✅ **Done** — 51 tests across 5 files covering Trolley client, onboarding, webhook receiver, webhook processor, and payout batch creation. Test suite: 468/57.
7. ~~**Refund & Dispute Engine test coverage**~~ ✅ **Done** — 69 tests across 4 files covering refund engine (Stripe API, ledger, pre/post-payout), dispute service (cases, messages, resolution), admin refund action, and dispute actions. Test suite: 537/61.
8. ~~**Dispute API routes test coverage**~~ ✅ **Done** — 32 tests across 3 files covering `POST/GET /api/v1/disputes`, `GET/PATCH /api/v1/disputes/:caseId`, and `POST/GET /api/v1/disputes/:caseId/messages`. Test suite: 569/64.
9. ~~**Fee calculator test coverage**~~ ✅ **Done** — 23 tests for `lib/payments/fees/calculator.ts`. Test suite: 592/65.
10. ~~**Eligibility engine test coverage**~~ ✅ **Done** — 23 tests for `lib/payments/eligibility/engine.ts`. Test suite: 615/66.
11. ~~**Debt monitor test coverage**~~ ✅ **Done** — 20 tests for `lib/payments/debt/monitor.ts`. Test suite: 635/67.
12. ~~**Payment core modules test coverage**~~ ✅ **Done** — 100 tests across 5 files: bigint-constants (18), format-utils (26), ledger/accounts (20), metrics (15), subscription/manager (21). Test suite: 736/72.
13. ~~**Configure Vercel env vars**~~ ✅ **Done** — All 9 production secrets verified via `vercel env ls`.
14. ~~**Fix `.env.local`**~~ ✅ **Done** — Removed duplicate empty `SUPABASE_DB_DIRECT_URL` and `SUPABASE_DB_WEBHOOK_SECRET` lines. Added missing `REVOLUT_REFRESH_TOKEN` placeholder.
15. ~~**Booking engine test coverage**~~ ✅ **Done** — 49 tests across 3 files: slot-locks (10), recurrence-engine (15), availability-engine (24). Test suite: 785/75.
16. ~~**Booking support modules test coverage**~~ ✅ **Done** — 60 tests across 5 files: with-timeout (4), request-booking-state-machine (17), recurring-deadlines (14), availability-checks (15), slot-validation (10). Test suite: 845/80.
17. ~~**Booking engine final support modules test coverage**~~ ✅ **Done** — 46 tests across 5 files: request-eligibility (6), request-helpers (8), external-calendar-conflicts (5), payload-builders (7), create-booking (18). Test suite: 891/85.
18. ~~**Onboarding review loop test coverage**~~ ✅ **Done** — 47 tests across 4 files. Test suite: 938/89.
19. ~~**Operator Case Resolution System (ADMIN-01)**~~ ✅ **Done** — Migration 082 extends cases table with priority, assigned_to, sla_deadline. `/admin/casos` queue page with filtering, sorting, SLA indicators. `/admin/casos/[caseId]` detail with evidence, timeline, messages, decision form. Auto-creation from no-show detection. 12 new tests. Test suite: 950/89.
20. ~~**Review Moderation Queue Enhancement (REVIEW-01)**~~ ✅ **Done** — Migration 083 adds `moderation_status`, `rejection_reason`, `moderated_by`, `flag_reasons` to `reviews`. `/admin/avaliacoes` page with status filters, sort options, batch approve/reject, structured rejection reasons (6 options), auto-flags (profanity, conflicts_with_outcome, suspected_fake). 14 new tests. Test suite: 964/89.

## Pre-Wave-3 hardening

1. Keep production query-plan validation and index evidence current.
2. Keep JWT role-claim coverage and middleware fallback monitoring healthy.
3. Keep RLS audit evidence current for critical private tables.
4. Keep secrets rotation, sync audit, and DB pooling validation operational.
5. Keep Stripe resilience foundation aligned with DB migrations and operational tables, without opening real-money execution early.
6. Payment engine code is build-stable and unit-tested; focus shifts to E2E validation and production migration.

## Mobile app & API-first refactor

1. ~~Mobile app development is **not open** until API refactor is fully hardened.~~ API refactor is complete (P2.1). Mobile development active.
2. ~~Next mobile-app prerequisite: E2E validation of `/api/v1/*` surface with realistic mobile payloads.~~ E2E smoke tests pass (444 tests, 13/13 contract tests).
3. Sprint 6 complete: Booking flow (one-off) with Stripe PaymentSheet. Date picker, time slots, notes, PaymentSheet integration. Backend APIs: availability + payment-intent.
4. See `docs/project/mobile-app/08-master-backlog.md` for unified backlog across mobile + international tracks.

## International expansion

1. Market detection middleware (`docs/project/international-expansion/08-market-routing-implementation.md`) is documented but not implemented.
2. Sanity CMS integration for localised content is planned but not started.
3. Portuguese (PT) and Spanish (MX) content strategies are defined in `docs/project/international-expansion/04-cms-recommendation.md`.

## Wave 3 opening criteria

Do not open Wave 3 until all of the following are true:

1. Current stabilization backlog is materially closed.
2. Payment-rail execution order is confirmed and documented.
3. Financial compliance and audit posture are ready.
4. Operator runbooks and production secrets are current.

## Working rules

1. Use `C:\dev\muuday-app` only.
2. Keep OneDrive copies read-only.
3. Run validation before publishing meaningful changes.
4. Update `project-status.md`, `current-state.md`, and `next-steps.md` in the same batch for major changes.
5. Archive stale plans instead of letting active docs drift.
