# Current State

Last updated: 2026-03-30 (session 25)

## Canonical baseline status

1. 5-part source-of-truth specification imported into `docs/spec/source-of-truth/`.
2. Consolidated execution artifacts created (`master-spec`, `execution-plan`, `open-validations`, `journey-coverage-matrix`, unified AI protocol).
3. Existing docs realigned to this baseline.

## Implemented today (`Done`)

1. Core app routes for auth, search, profile, booking, agenda, and admin are live.
2. Baseline booking logic exists (slot locks, scheduling checks, state transitions).
3. Basic admin moderation views exist.
4. CI baseline and cron baseline exist.
5. Monitoring and analytics instrumentation baseline exists (activation parity still pending).
6. Documentation governance and handover system are active.
7. Production schema parity for booking foundation (migrations 001-012 applied).
8. Sentry DSN configured and next.config.js wrapped with withSentryConfig.
9. Playwright e2e tests load env vars from .env.local automatically — 2/3 pass deterministically.
10. Security fixes applied: role escalation trigger, RLS update policy, favorites RLS, profiles select restriction.
11. Upgraded to Supabase Pro (spend cap enabled, PITR available but disabled) and Vercel Pro.
12. Sentry env vars added to Vercel deployment.
13. Wave 1 taxonomy schema applied: specialties table, professional_specialties junction, tier column, category_id FK, tag_suggestions table (migrations 008-009).
14. Taxonomy seed data: 8 categories, 23 subcategories, 59 specialties populated in production.
15. Role-based route guards in middleware (public search, professional routes, admin routes).
16. Tier entitlement config created (`lib/tier-config.ts`).
17. Public search: `/buscar` and `/profissional/[id]` accessible without login, with login redirect on booking intent.
18. Admin taxonomy CRUD at `/admin/taxonomia` with tree view, inline edit, tag moderation.
19. Tier-aware search ranking (quality + volume + tier boost) and tier badges on cards/profiles.
20. Review constraints: unique per user-professional, professional response field, edit lifecycle tracking (migration 010).
21. Sentry hardening updates: router transition hook + new `webpack.treeshake.removeDebugLogging` config.
22. Feature-flag baseline implemented in booking UI using PostHog (`booking_recurring_enabled`).
23. Added migration 011 (`favorites` RLS safety net) to prevent policy drift after cleanup scripts.
24. Inngest selected for background-job orchestration; env slots added.
25. Monitoring ownership and incident SLA baseline formalized in runbook.
26. Added Supabase Auth smoke validation command (`npm run auth:validate-smoke`) with dry-run and cleanup modes.
27. Added migration 012 (`auth-signup-trigger-hardening`) to fix signup failure from DB trigger/role drift.
28. Applied migrations 011 + 012 in production and validated `auth:validate-smoke` successfully.
29. Added first Inngest workflow (`sync-booking-reminders`) sharing logic with cron fallback.
30. Started Wave 2 dual-gate implementation (`013-wave2-dual-gate-first-booking`) with booking guard + admin release toggle.
31. Migration `014-wave2-request-bookings-foundation.sql` applied in production (operator-confirmed).
32. Request-booking app flow delivered:
- New user route: `/solicitar/[id]`
- New server actions in `lib/actions/request-booking.ts`
- Agenda queue/actions for request booking in `/agenda`
- Profile CTA for request booking where tier allows
33. Role split hardened in middleware for user-only routes (`/agendar`, `/solicitar`, `/favoritos`).
34. Inngest endpoint health verified in production (`/api/inngest` returns cloud mode + keys + function).
35. Search UX/currency patch reinforced:
- removed top category chips from `/buscar`
- filter labels now follow selected currency symbol (not fixed BRL)
- cards use selected user currency consistently on search/favorites/profile
36. Search filter UX parity update applied:
- horizontal filter bar below search input (desktop)
- specialty filter disabled until category is selected
- location/country rendered by full country name
- category/specialty/language/location filter options derived from currently available professionals
37. Request-booking state transition guard wired into server actions:
- explicit allowed transitions via `lib/booking/request-booking-state-machine.ts`
- optimistic update guards now include `.eq('status', currentStatus)` to reduce race-condition overwrites
38. Role-based navigation shell updated:
- user nav: Buscar, Bookings, Favoritos, Perfil
- professional nav: Dashboard, Calendario, Financeiro, Configuracoes
- app logo now routes to landing page (`/`)
39. Professional workspace guard tightened and `/financeiro` page added as Wave 2 finance surface stub.
40. State machine validation script added:
- `npm run test:state-machines`
- validates direct booking and request-booking transition maps/terminal states/critical edges.

## Partially implemented (`In progress`)

1. Full taxonomy governance and entitlement parity with Part 1.
2. Full onboarding and request-booking parity with Part 2 (foundation delivered, full parity still pending).
3. Stripe-backed payment and payout lifecycle parity with Part 3.
4. Structured case queue and full trust operations parity with Part 4.
5. Session provider abstraction and compliance freeze parity with Part 5.

## Blocked / open validations

1. Stripe corridor validation for UK platform to Brazil-heavy professional payouts.
2. Final session provider lock decision.
3. Final legal/tax wording freeze for sensitive categories.
4. Inngest cloud may still show stale "unattached syncs" from older deployments; latest endpoint is healthy and attached sync must be validated in dashboard.

### Resolved blockers
- ~~Production schema parity gaps affecting some booking foundations in production API.~~ Resolved: migrations 001-006 applied 2026-03-29.
- ~~Monitoring and on-call ownership undefined.~~ Resolved: baseline owner and SLA defined 2026-03-30.

## Active execution mode

Wave-driven delivery is now mandatory:

1. Wave 0: schema parity + deterministic quality baseline. **Status: Done.** Schema applied (001-012), e2e passing baseline (2/3), Sentry active, Vercel env vars set, Vercel MCP connected, Pro plans active on both Supabase and Vercel, auth smoke flow validated.
2. Wave 1: foundations/discovery/tier parity. **Status: Done.** Taxonomy schema + seed (8 cat, 23 sub, 59 spec), admin CRUD, route guards, tier config + badges, search ranking with tier boost, review constraints + response flow, public search.
3. Wave 2: onboarding and booking lifecycle parity. **Status: In progress.** Dual-gate + request-booking foundation delivered; next items are booking transition/test parity, recurring release rules, and onboarding gate completion.
4. Wave 3: payments/revenue parity.
5. Wave 4: admin/trust/notifications parity.
6. Wave 5: session provider + compliance freeze.

## Last meaningful changes

1. Imported full 5-part product specification as canonical source in repo docs.
2. Consolidated new master spec and execution plan with open-validation register.
3. Updated roadmap, status, architecture, journeys, and handover docs to execution-wave model.
4. Added `docs/human-actions/` with consolidation verification, human decision backlog, and concrete open-tool options.
5. Added explicit retention/deletion policy by data type in `docs/engineering/data-governance-and-lifecycle.md`.
6. Updated source-of-truth specs with AI-agnostic build instructions, role-split screen inventory, explicit route-guard rules, and detailed professional onboarding matrix.
