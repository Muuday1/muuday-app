# Project Status

Last updated: 2026-03-31

Spec baseline: `docs/spec/source-of-truth/part1..part5`

## Snapshot

- Canonical specification baseline imported: `Done`
- Documentation consolidation and execution framing: `Done`
- Product implementation parity with canonical baseline: `In progress`
- Architecture freeze readiness: `Blocked` (open external validations)

## Status by domain

| Domain | Target from spec | Current status | Primary gap |
| --- | --- | --- | --- |
| Taxonomy and discovery | Controlled taxonomy, weighted search, tier-aware discovery | Done | Taxonomy CRUD, tier ranking, public search operational |
| Professional tiers | Basic/Professional/Premium with strict entitlements | Done | Tier column, entitlement config, badges, search boost |
| Professional onboarding | Multi-step with dual gate (go-live vs first booking eligibility) | In progress | Full gate logic and admin review workflow parity pending |
| Booking lifecycle | Explicit state machine + request booking + slot hold | In progress | Full transition parity/tests and recurring release rules pending |
| Recurring scheduling | Reserved cycles, release windows, pause/change deadlines | Planned/In progress | Full recurring lifecycle parity pending |
| Payments and revenue | Stripe-backed charge/refund/payout/billing + ledger | In progress | Legacy placeholders still present; webhook/idempotent lifecycle pending |
| Admin trust operations | Structured case queue and audit-first moderation | In progress | Case queue and full audit workflows pending |
| Notifications and inbox | Event-driven email + in-app inbox + reminders | In progress | Delivery observability and full event routing pending |
| Session execution | Provider-agnostic model with delayed provider lock | Planned | Final provider implementation pending |
| Sensitive-category compliance | Disclaimer versioning and category-aware governance | Planned/In progress | Full compliance layer and legal text freeze pending |

## Critical blockers

1. ~~Production schema parity for booking foundation tables.~~ **Resolved 2026-03-29**: migrations 001-006 applied.
2. Stripe corridor validation for UK-platform to Brazil payout path.
3. Final legal/compliance wording freeze for sensitive categories.

## Recently completed

1. 5-part source-of-truth package imported into `docs/spec/source-of-truth/`.
2. Unified spec docs created (`master-spec`, `execution-plan`, `open-validations`, unified AI protocol).
3. Existing docs and journey mapping updated to execution-wave model.
4. Explicit data governance and lifecycle policy documented with retention/deletion matrix by data type.
5. Source-of-truth updated for AI-agnostic build instructions, role-based screen inventory, route guards, and professional onboarding gate matrix.
6. Production schema parity achieved — migrations 001-010 applied to live Supabase.
7. Sentry SDK baseline hardened: router transition hook + current treeshake config.
8. Playwright e2e auto-loads .env.local — 2/3 critical booking tests pass deterministically.
9. Security hardening: role escalation fix, RLS profile update restriction, favorites RLS, profiles select restriction.
10. Upgraded to Supabase Pro (spend cap enabled, no surprise charges) and Vercel Pro.
11. Sentry DSN + env vars deployed to Vercel.
12. Monitoring ownership and incident SLA baseline formalized (Checkly + Sentry email to founder operator).
13. Added favorites RLS safety-net migration (`011`) to protect against policy drift.
14. PostHog feature-flag baseline in booking UI implemented (`booking_recurring_enabled`).
15. Added Supabase Auth smoke validation command (`npm run auth:validate-smoke`) for signup/reset flow checks.
16. Added migration `012-auth-signup-trigger-hardening.sql` to stabilize auth trigger and canonical role mapping.
17. Applied migrations `011` and `012` in production and validated auth signup/reset flow successfully.
18. Added first Inngest workflow (`sync-booking-reminders`) with cron fallback preserved.
19. Started Wave 2 dual-gate foundation with migration `013-wave2-dual-gate-first-booking.sql` and booking/admin guard logic.
20. Request-booking foundation delivered in app:
- New route `/solicitar/[id]` with request form and timezone-aware submission.
- Agenda now shows request-booking queue for user/professional with offer/accept/decline/cancel actions.
- Request-to-booking conversion flow implemented with proposal expiration handling.
21. Middleware updated for stricter role split on user-only routes (`/agendar`, `/solicitar`, `/favoritos`).
22. Canonical schema snapshot updated through migration `014-wave2-request-bookings-foundation.sql`.
23. Inngest production endpoint health validated at `https://muuday-app.vercel.app/api/inngest` (`mode=cloud`, keys detected, function registered).
24. Search filter UX patched to remove top category-chip strip and keep price labels/cards aligned with selected currency symbol.
25. Request-booking flow hardened with explicit request-state transition guards in server actions (`assertRequestBookingTransition`) plus optimistic status checks on updates.
26. Search filters now follow source-of-truth UX detail: horizontal filter bar, specialty gated by category, full country names, and filter options derived from existing professionals.
27. Role-based navigation updated in app shell:
- user primary nav: Buscar, Bookings, Favoritos, Perfil
- professional primary nav: Dashboard, Calendario, Financeiro, Configuracoes
- logo routes to landing (`/`) from app shell
28. Route-guard hardening for professional workspace paths (`/dashboard`, `/disponibilidade`, `/configuracoes-agendamento`, `/editar-perfil-profissional`, `/completar-perfil`, `/financeiro`).
29. Added state-machine validation automation (`npm run test:state-machines`) covering direct booking and request-booking transition maps, terminal states, and required edges.
30. Recurring lifecycle hardening in timeout cron: when a recurring parent expires in manual confirmation, child bookings and booking_sessions are cancelled in cascade to release schedule inventory faster.
31. Public experience baseline delivered on role-split rules:
- New landing page at `/` with public navigation baseline (Home, Buscar profissionais, Registrar como profissional, Sobre nos, Ajuda, Login).
- New public pages: `/sobre`, `/ajuda`, `/registrar-profissional`.
- Public header includes language and currency selectors persisted in cookies.
- Public booking intent now routes to sign-up-first flow (`/cadastro?role=usuario&redirect=...`) from professional profile CTAs.
- Logged-out search now accepts public currency preference (`moeda` query + cookie) and keeps selection across filter/sort/pagination forms.
32. B3 Wave 2 professional workspace surfaces expanded:
- `/dashboard` now renders action-first professional workspace cards, account health alerts, and quick actions.
- `/agenda` now supports professional control-center views (`overview`, `pending`, `requests`, `settings`) with context-aware sections and booking rule visibility.
- `/configuracoes` now renders business-oriented professional setup surface (profile/services, calendar, booking rules, finance links) while preserving user preferences for user accounts.
33. Public booking auth flow now follows source-of-truth modal behavior:
- unauthenticated profile CTAs open modal
- primary action is account creation
- secondary action is login
- both preserve redirect intent
34. Added professional workspace e2e suite (`tests/e2e/professional-workspace.spec.ts`) and env template keys for professional credentials.
35. Added Wave 2 onboarding gate-matrix engine (`lib/professional/onboarding-gates.ts`) with deterministic C1-C10 stage evaluation and explicit gate outputs (review/go-live/first-booking/payout).
36. Added centralized onboarding state loader (`lib/professional/onboarding-state.ts`) and wired first-booking eligibility checks into booking/request flows (server actions + `/agendar` + `/solicitar`).
37. Added new professional onboarding checklist route (`/onboarding-profissional`) with stage status, gate status, C10 matrix rendering, and submit-for-review action.
38. Added migration `015-wave2-onboarding-gate-matrix-foundation.sql`:
- `professional_services` table (C4 service structure baseline)
- C6/C7 readiness flags in `professional_settings` (`billing_card_on_file`, `payout_onboarding_started`, `payout_kyc_completed`)
- legacy-safe backfill for existing professionals.
39. Professional setup surfaces now sync legacy profile pricing into service structure baseline:
- `/completar-perfil`
- `/editar-perfil-profissional`
- `lib/actions/professional.ts`
40. Professional settings now expose operational readiness controls (C6/C7 placeholders) and gate visibility in workspace UX.
41. Journey restoration hotfix after production regression report:
- role-aware login/auth-page redirects restored (`profissional -> /dashboard`, user/admin -> `/buscar`)
- admin can execute user journeys while keeping admin panel access
- professional workspace routes now restricted to professional role only
- discovery/profile pages now exclude non-professional role records from professional listing
- `/agenda` now uses profile role for view-mode resolution (no role drift by orphan rows)
42. Auth/cadastro stabilization batch delivered:
- logout now returns to landing page
- login now differentiates unconfirmed-email and oauth callback errors
- oauth callback now handles exchange failures + missing profile fallback + role-aware redirect
- signup UI restored role icons, password confirmation, full country list, and expanded professional onboarding fields
43. Search test-data coverage expanded:
- inserted 8 approved fantasy professionals across categories with availability slots for QA (`seed_fantasy_wave2_20260330`)
44. Professional journey resilience hardened for duplicate profile rows:
- added canonical professional resolver (`lib/professional/current-professional.ts`) and replaced `user_id`-based `.single()`/`.maybeSingle()` usage in critical professional routes/actions.
- prevents professional workspace fallback to user flow when multiple `professionals` records exist for one account.
45. Recovery technical gate revalidated on `codex/recovery-sprint-ux-stability`:
- fixed E2E selector drift in professional workspace tests.
- hardened booking E2E helper to treat `primeiro-agendamento-bloqueado` redirect as environment skip.
- green checks: `lint`, `typecheck`, `build`, `test:state-machines`, `test:e2e` (4 passed, 3 skipped).

## Immediate next actions

1. ~~Close Wave 0 schema parity and e2e fixture stability.~~ **Done** — schema applied, e2e passing baseline, Sentry active, Pro plans active.
2. ~~Start Wave 1 parity tasks (taxonomy governance + tier entitlements + search parity).~~ **Done** — taxonomy, tiers, search ranking, review constraints, public search, admin CRUD all delivered.
3. Continue Wave 2 parity tasks:
- recurring deadline + slot-release behavior
- apply migration `015-wave2-onboarding-gate-matrix-foundation.sql` in production
- finalize onboarding gate matrix enforcement end-to-end with migration 015 live
4. Validate UX polish pass for role-specific shells (desktop/mobile) and finalize copy consistency (`Bookings` vs localized labels).
5. Confirm Inngest cloud app sync is attached to latest deployment path (clear stale unattached sync records).
6. Prepare Stripe corridor validation packet and run external confirmation process.
7. Set `.env.local` for full booking E2E coverage:
- keep `E2E_PROFESSIONAL_EMAIL` / `E2E_PROFESSIONAL_PASSWORD`
- add a professional ID with first-booking gate open for booking form assertions
- add `E2E_MANUAL_PROFESSIONAL_ID` for manual-confirmation assertions.

## Continuity rule

Every meaningful implementation change must update:

1. `docs/project/project-status.md`
2. `docs/handover/current-state.md`
3. `docs/handover/next-steps.md`
