# Project Status

Last updated: 2026-03-30

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

## Immediate next actions

1. ~~Close Wave 0 schema parity and e2e fixture stability.~~ **Done** — schema applied, e2e passing baseline, Sentry active, Pro plans active.
2. ~~Start Wave 1 parity tasks (taxonomy governance + tier entitlements + search parity).~~ **Done** — taxonomy, tiers, search ranking, review constraints, public search, admin CRUD all delivered.
3. Continue Wave 2 parity tasks:
- recurring deadline + slot-release behavior
- onboarding gate matrix enforcement end-to-end
4. Validate UX polish pass for role-specific shells (desktop/mobile) and finalize copy consistency (`Bookings` vs localized labels).
4. Confirm Inngest cloud app sync is attached to latest deployment path (clear stale unattached sync records).
5. Prepare Stripe corridor validation packet and run external confirmation process.
6. Implement sign-up/login modal UX for unauthenticated booking intent (currently sign-up-first page flow is live; modal variant still pending from source-of-truth detail).

## Continuity rule

Every meaningful implementation change must update:

1. `docs/project/project-status.md`
2. `docs/handover/current-state.md`
3. `docs/handover/next-steps.md`
