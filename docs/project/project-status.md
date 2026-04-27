# Project Status

Last updated: 2026-04-25

Spec baseline: `docs/spec/source-of-truth/part1..part5`

## Snapshot

- Wave 0: Done
- Wave 1: Done
- Wave 2: Done (closed 2026-04-10)
- Payment engine (Phases 1–6): Fase 6.1–6.5 (Ledger, Stripe Pay-in, Revolut Settlement, Trolley Payout, Refund & Dispute) ✅ completas, incluindo rotas de API. Awaiting E2E testing before Wave 3 launch.
- Stabilization and UX refinement: In progress
- Wave 3 real-money execution: Blocked on E2E validation + compliance freeze
- Mobile app API refactor: Sprints 3–5 complete; mobile app dev not open
- International expansion: Docs complete; implementation not started

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
   - 69 tests for Refund & Dispute Engine (refund engine, dispute service, admin refund action, dispute actions)
   - 32 tests for Dispute API routes (`/api/v1/disputes/*`)
   - 23 tests for Fee calculator (`lib/payments/fees/calculator`)
   - 23 tests for Eligibility engine (`lib/payments/eligibility/engine`)
   - 20 tests for Debt monitor (`lib/payments/debt/monitor`)
   - 18 tests for BigInt constants (`lib/payments/bigint-constants`)
   - 26 tests for Format utils (`lib/payments/format-utils`)
   - 20 tests for Ledger accounts (`lib/payments/ledger/accounts`)
   - 15 tests for Financial metrics (`lib/payments/metrics`)
   - 21 tests for Subscription manager (`lib/payments/subscription/manager`)
   - Total project test suite: **736 tests passing in 72 files**
   - Vercel production env vars: all 9 payment-rail secrets configured (Revolut 5 + Trolley 4)
2. **Booking engine test coverage batch (2026-04-25):**
   - `lib/booking/slot-locks.test.ts` — 10 tests (acquire lock, renew own lock, locked by other, error handling, TTL, unique violation)
   - `lib/booking/recurrence-engine.test.ts` — 15 tests (weekly/biweekly/monthly/custom recurrence generation, booking window limits, end date limits, conflict detection)
   - `lib/booking/availability-engine.test.ts` — 24 tests (working hours validation, legacy rule mapping, buffered conflict detection, recurring slot generation)
   - Total project test suite: **785 tests passing in 75 files**
3. **Booking support modules test coverage batch (2026-04-25):**
   - `lib/booking/with-timeout.test.ts` — 4 tests (resolve, timeout, propagate rejection, fast promise)
   - `lib/booking/request-booking-state-machine.test.ts` — 17 tests (all status transitions, terminal states, same-state, unknown states, assert transition)
   - `lib/booking/recurring-deadlines.test.ts` — 14 tests (change/pause/release deadlines, allowed/blocked, missing reference, invalid date)
   - `lib/booking/availability-checks.test.ts` — 15 tests (slot within rules, exceptions allow/block, fail-closed on DB error, internal conflict detection)
   - `lib/booking/slot-validation.test.ts` — 10 tests (all checks pass, minimum notice, max window, working hours, exception block, internal conflict, external conflict, custom errors)
   - Total project test suite: **845 tests passing in 80 files**
4. **Booking engine support modules test coverage batch (2026-04-25):**
   - `lib/booking/request-eligibility.test.ts` — 6 tests (approved + tier checks, first-booking eligibility delegation, basic tier rejection, pending status rejection)
   - `lib/booking/request-helpers.test.ts` — 8 tests (toRequestBookingStatus valid/invalid/edge types, expireRequestIfNeeded offered→expired, future expiry unchanged, invalid date unchanged, DB error fallback, transition guard)
   - `lib/booking/external-calendar-conflicts.test.ts` — 5 tests (busy conflict true/false, DB error fail-open, null count, query filters)
   - `lib/booking/payload-builders.test.ts` — 7 tests (one_off payload fields, recurring parent/child payloads, sessions payload, batch payloads, null fallbacks, metadata shape)
   - `lib/booking/create-booking.test.ts` — 18 tests (one_off/recurring/batch success paths, lookup context fail, prepare slots fail, slot validation fail, lock conflict, lock error, price zero, prepare payment throw, persist fail, fallback record payment, record payment throw, lock release on success/error, profiles array shape, manual confirmation deadline)
   - Total project test suite: **891 tests passing in 85 files**
5. **PT-BR cleanup batch (2026-04-25):**
   - `app/(app)/agenda/page.tsx` — fixed mojibake (`confirma??o` → `confirmação`), added missing accents (`Visão geral`, `Pendências`, `sessões`, `solicitações`, `avançadas`, `Histórico`), translated English labels (`Requests` → `Solicitações`, `Business setup` → `Configurações do negócio`, `Control center` → `Central de controle`)
   - `components/admin/AdminPlanConfigForm.tsx` — translated English feature labels (`Sync Outlook` → `Sincronização Outlook`, `Export CSV` → `Exportar CSV`, `Export PDF` → `Exportar PDF`)
   - `components/agenda/ProfessionalAgendaPage.tsx` — added missing accents across 17 strings (`Conexão`, `Operação`, `rápida`, `calendário`, `pendências`, `única`, `edição`, `Próximas sessões`, `já está`, `ocupações`, `Confirmações`, `Confirmação`)
6. Two-tier availability architecture fully aligned:
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
