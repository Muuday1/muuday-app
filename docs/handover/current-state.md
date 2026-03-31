# Current State

Last updated: 2026-03-31 (session 29)

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
41. Recurring timeout cascade added in `/api/cron/booking-timeouts`:
- recurring parent cancellation now cascades to child bookings (`pending_confirmation`/`pending`)
- linked `booking_sessions` entries are cancelled to release inventory
42. Public landing and screen-inventory routes implemented:
- `/` now renders public landing (no auth redirect)
- `/sobre`, `/ajuda`, `/registrar-profissional` created as public pages
- public top nav order aligned with source-of-truth baseline
43. Public header now includes language/currency selectors (cookie-backed):
- language cookie: `muuday_public_language`
- currency cookie: `muuday_public_currency`
44. Logged-out search now reads public currency from query/cookie:
- supports `moeda` query param on `/buscar`
- preserves selected currency through search/filter/sort/pagination forms
45. Public booking intent now follows sign-up-first path from professional profile:
- `/profissional/[id]` CTA routes unauthenticated users to `/cadastro?role=usuario&redirect=...`
- cadastro now accepts `role` and sanitized `redirect` params
46. Professional dashboard (`/dashboard`) now delivers action-first workspace blocks:
- urgent + pending actions
- upcoming sessions
- quick actions
- account health + finance snapshots (Wave 2 scope)
47. Professional agenda (`/agenda`) now supports control-center views:
- `overview`, `pending`, `requests`, `settings`
- context-aware rendering for pending confirmations and request queue
- booking rules and calendar-health visibility in settings view
48. Configuracoes split by role:
- user accounts keep preference settings flow
- professional accounts now get business-oriented setup hub (profile/services, calendar, booking rules, finance)
49. Public booking intent on professional profile now uses modal flow:
- signup is primary
- login is secondary
- redirect target is preserved for both actions
50. Added e2e coverage for professional workspace guard/navigation/surfaces:
- `tests/e2e/professional-workspace.spec.ts`
- `.env.local.example` now includes `E2E_PROFESSIONAL_EMAIL` and `E2E_PROFESSIONAL_PASSWORD`
- latest run: `7 passed, 0 skipped` (fixtures configured locally)
51. Added machine-checkable onboarding gate engine:
- `lib/professional/onboarding-gates.ts` defines C1-C10 stage checks and gate outcomes.
- `lib/professional/onboarding-state.ts` centralizes snapshot load + evaluation.
52. First-booking eligibility now uses onboarding gate engine (not only `first_booking_enabled`) in:
- `lib/actions/booking.ts`
- `lib/actions/request-booking.ts`
- `/agendar/[id]` and `/solicitar/[id]` route guards.
53. Added new professional route `/onboarding-profissional`:
- stage list
- gate list
- C10 requirements matrix
- submit-for-review action.
54. Added migration `015-wave2-onboarding-gate-matrix-foundation.sql`:
- creates `professional_services`
- adds readiness flags in `professional_settings`
- backfills baseline service + readiness compatibility.
55. Profile setup flows now upsert a primary service baseline (C4 structure) on save:
- `/completar-perfil`
- `/editar-perfil-profissional`
- `lib/actions/professional.ts`.
56. Professional settings now include Wave 2 operational readiness controls (C6/C7 placeholders) and direct access to onboarding checklist.
57. Role-routing hotfix delivered after production regression report:
- login now redirects by role (professional -> `/dashboard`; others -> `/buscar`) when no explicit redirect is provided.
- middleware now redirects authenticated `/login` and `/cadastro` by role and enforces professional routes for `profissional` only.
- admin can use user flows (`/agendar`, `/solicitar`, `/favoritos`) while keeping `/admin` protected.
58. Search and professional profile discovery now filter to true professional profiles only:
- `/buscar` query uses inner profile join + `profiles.role = profissional`.
- `/profissional/[id]` now requires linked `profiles.role = profissional`.
59. Agenda role detection no longer infers professional mode from orphan/legacy rows in `professionals`; it now requires `profiles.role = profissional`.
60. Auth and signup stabilization patch delivered:
- signout now returns to landing page (`/`), not login page.
- login now surfaces explicit `email not confirmed` and oauth failure messages instead of generic invalid-credentials only.
- oauth callback now has guarded exchange flow, profile bootstrap fallback, and role-aware redirect.
61. Signup UX parity patch delivered:
- role cards restored with icons for `usuario` and `profissional`.
- password confirmation field added with client validation.
- country selection now uses full ISO country list.
- professional signup step now captures expanded onboarding fields (headline, category, specialties, languages, jurisdiction, experience, price, duration) into signup metadata.
62. Test-data boost executed in production-like environment:
- inserted 8 approved fantasy professional records across all search categories (tag marker: `seed_fantasy_wave2_20260330`) plus availability blocks.
- inserted using authenticated professional context to accelerate search/funnel QA without new credential sharing.
63. Professional workspace resilience patch for duplicate-profile data:
- added canonical resolver `lib/professional/current-professional.ts` to deterministically pick one professional row by `user_id`.
- replaced fragile `.single()`/`.maybeSingle()` lookups in core professional pages/actions (dashboard/agenda/perfil/configuracoes/disponibilidade/financeiro/onboarding + booking/request actions).
- objective: prevent role-professional journeys from collapsing when legacy/seed data contains multiple `professionals` rows for the same user.

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
5. E2E fixture stability must be preserved (IDs and professional settings) to keep zero-skip behavior in CI/local runs.

### Resolved blockers
- ~~Production schema parity gaps affecting some booking foundations in production API.~~ Resolved: migrations 001-006 applied 2026-03-29.
- ~~Monitoring and on-call ownership undefined.~~ Resolved: baseline owner and SLA defined 2026-03-30.

## Active execution mode

Wave-driven delivery is now mandatory:

1. Wave 0: schema parity + deterministic quality baseline. **Status: Done.** Schema applied (001-012), e2e passing baseline (2/3), Sentry active, Vercel env vars set, Vercel MCP connected, Pro plans active on both Supabase and Vercel, auth smoke flow validated.
2. Wave 1: foundations/discovery/tier parity. **Status: Done.** Taxonomy schema + seed (8 cat, 23 sub, 59 spec), admin CRUD, route guards, tier config + badges, search ranking with tier boost, review constraints + response flow, public search.
3. Wave 2: onboarding and booking lifecycle parity. **Status: In progress.** Dual-gate + request-booking foundation + B3 workspace + C10 gate engine delivered; next items are recurring release rules and production activation of migration 015.
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
64. Recovery Sprint started on branch `codex/recovery-sprint-ux-stability` with strict scope lock (no Stripe/integration expansion).
65. Public navigation and copy recovery:
- mobile hamburger menu in public header with language/currency and login/minha área shortcuts.
- public pages `/`, `/sobre`, `/ajuda`, `/registrar-profissional` rewritten for user-facing language (no internal jargon).
66. Auth recovery:
- `SocialAuthButtons` now forwards redirect intent to callback.
- `/auth/callback` now sanitizes and applies `next` redirects, handles missing profile bootstrap, and preserves role-aware routing.
- login page copy/labels standardized to PT-BR and error handling clarified.
67. Signup recovery:
- professional 3-step flow maintained.
- inline field-level validation and error summary added.
- category remains select and expanded professional fields remain enforced.
68. Search recovery:
- canonical query-state contract consolidated in `/buscar`.
- mobile filters moved to drawer component (`components/search/MobileFiltersDrawer.tsx`).
69. Professional workspace/profile recovery:
- dashboard rewritten with translated UI status mapping.
- profile avatar now uses uploaded image when available.
- mobile booking CTA now preserves auth flow for logged-out visitors.
70. Favorites recovery:
- remove action now returns explicit success/error feedback + aria-live status.
71. Recovery E2E stability patch applied:
- booking helper now treats `/profissional/:id?erro=primeiro-agendamento-bloqueado` as environment skip (no false failure).
- professional settings workspace test now uses unambiguous `Calendario` selector.
72. Recovery technical gate re-run completed successfully:
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run test:state-machines` ✅
- `npm run test:e2e` ✅ (`4 passed`, `3 skipped`, `0 failed`).
73. Recovery fixture hardening completed:
- provisioned dedicated `auto_accept` and `manual` professionals with onboarding/booking minimums to exercise booking forms.
- updated local E2E env fixture values (`E2E_PROFESSIONAL_*` + `E2E_MANUAL_PROFESSIONAL_ID`).
74. Full quality gate now passes with full E2E coverage:
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run test:state-machines` ✅
- `npm run test:e2e` ✅ (`7 passed`, `0 skipped`, `0 failed`).
