# Next Steps

Last updated: 2026-04-25

Execute in order. Keep changes batchable, validated, and documented.

## Immediate queue

1. Run production smoke for onboarding review loop (`admin -> solicitar ajustes -> profissional corrige -> reenviar`) after each publish batch.
2. ~~Sprint 5 — Remaining APIs extraction~~ ✅ **Complete** — `lib/actions/admin.ts` (172 lines), `admin-plans.ts` (31 lines), `admin-taxonomy.ts` (47 lines), and `email.ts` (270 lines) are all thin wrappers delegating to dedicated service modules (`lib/admin/admin-service.ts`, `lib/email/email-action-service.ts`). No god files remain in `actions/`.
3. Continue professional operations polish with focus on calendar UX and scheduling-rule clarity in `/disponibilidade`.
4. Keep onboarding tracker copy/progression consistent and avoid reintroducing blocking optional fetches in modal open path.
5. Close remaining PT-BR cleanup on lower-traffic admin/member surfaces.
6. ~~Evaluate and either merge or archive `feat/landing-page-redesign` explicitly~~ ✅ **Archived** — branch was 12 days behind main, would have reverted months of work (API v1, E2E tests, services, migrations). Main already has a superior LandingPage component with animations, carousels, and multi-section layout.
7. ~~Apply migration 062 in production to sync `availability_rules` for professionals who saved availability before the dual-write fix~~ ✅ **Applied** — confirmed in `session-log.md` Entry 84.

## Payment Engine — Next Tasks (in order)

1. ~~Implement real Trolley webhook HMAC verification~~ ✅ **Done** — `lib/payments/trolley/client.ts`
2. ~~Implement real Revolut webhook HMAC verification~~ ✅ **Done** — `lib/payments/revolut/client.ts`
3. ~~Apply migrations 070-076 to production Supabase~~ ✅ **Applied** — confirmed by operator
4. **Test Trolley sandbox onboarding end-to-end** — PayPal recipient creation, KYC flow
5. ~~**Test Stripe sandbox pay-in → ledger → payout flow**~~ ✅ **Unit tests delivered** — 128 new tests cover PaymentIntent API, Checkout Session API, Stripe webhook receiver/handlers, ledger integration, Revolut client/reconciliation, Revolut webhook receiver, and treasury Inngest functions. E2E sandbox validation remains open.
6. ~~**Professional Payout via Trolley test coverage**~~ ✅ **Done** — 51 tests across 5 files covering Trolley client, onboarding, webhook receiver, webhook processor, and payout batch creation. Test suite: 468/57.
7. ~~**Refund & Dispute Engine test coverage**~~ ✅ **Done** — 69 tests across 4 files covering refund engine (Stripe API, ledger, pre/post-payout), dispute service (cases, messages, resolution), admin refund action, and dispute actions. Test suite: 537/61.
8. ~~**Dispute API routes test coverage**~~ ✅ **Done** — 32 tests across 3 files covering `POST/GET /api/v1/disputes`, `GET/PATCH /api/v1/disputes/:caseId`, and `POST/GET /api/v1/disputes/:caseId/messages`. Test suite: 569/64.
9. ~~**Fee calculator test coverage**~~ ✅ **Done** — 23 tests for `lib/payments/fees/calculator.ts`. Test suite: 592/65.
10. ~~**Eligibility engine test coverage**~~ ✅ **Done** — 23 tests for `lib/payments/eligibility/engine.ts`. Test suite: 615/66.
11. ~~**Debt monitor test coverage**~~ ✅ **Done** — 20 tests for `lib/payments/debt/monitor.ts`. Test suite: 635/67.
12. ~~**Payment core modules test coverage**~~ ✅ **Done** — 100 tests across 5 files: bigint-constants (18), format-utils (26), ledger/accounts (20), metrics (15), subscription/manager (21). Test suite: 736/72.
13. ~~**Configure Vercel env vars**~~ ✅ **Done** — All 9 production secrets verified via `vercel env ls`: `REVOLUT_PRIVATE_KEY`, `REVOLUT_CLIENT_ID`, `REVOLUT_API_KEY`, `REVOLUT_REFRESH_TOKEN`, `REVOLUT_ACCOUNT_ID`, `TROLLEY_API_KEY`, `TROLLEY_API_SECRET`, `TROLLEY_WEBHOOK_SECRET`, `TROLLEY_WEBHOOK_URL`.
14. ~~**Fix `.env.local`**~~ ✅ **Done** — Removed duplicate empty `SUPABASE_DB_DIRECT_URL` and `SUPABASE_DB_WEBHOOK_SECRET` lines. Added missing `REVOLUT_REFRESH_TOKEN` placeholder.
15. ~~**Booking engine test coverage**~~ ✅ **Done** — 49 tests across 3 files: slot-locks (10), recurrence-engine (15), availability-engine (24). Test suite: 785/75.
16. ~~**Booking support modules test coverage**~~ ✅ **Done** — 60 tests across 5 files: with-timeout (4), request-booking-state-machine (17), recurring-deadlines (14), availability-checks (15), slot-validation (10). Test suite: 845/80.

## Pre-Wave-3 hardening

1. Keep production query-plan validation and index evidence current.
2. Keep JWT role-claim coverage and middleware fallback monitoring healthy.
3. Keep RLS audit evidence current for critical private tables.
4. Keep secrets rotation, sync audit, and DB pooling validation operational.
5. Keep Stripe resilience foundation aligned with DB migrations and operational tables, without opening real-money execution early.
6. Payment engine code is build-stable and unit-tested; focus shifts to E2E validation and production migration.

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
