# Project Status

Last updated: 2026-04-01

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
| Professional onboarding | Multi-step with dual gate (go-live vs first booking eligibility) | In progress (Wave 2 backend scope complete) | Manual acceptance/sign-off still pending to mark Wave 2 done |
| Booking lifecycle | Explicit state machine + request booking + slot hold | In progress (Wave 2 backend scope complete) | Manual acceptance/sign-off still pending to mark Wave 2 done |
| Recurring scheduling | Reserved cycles, release windows, pause/change deadlines | In progress (engine + release job delivered) | Validate production release behavior in cron/Inngest and close manual QA |
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
46. PT-BR copy normalization pass applied across core UI surfaces (`/buscar`, `/agenda`, `/configuracoes`, `/configuracoes-agendamento`, auth forms, booking/request forms) with encoding-fix cleanup.
47. Validation gate re-run after copy pass: `lint`, `typecheck`, `build`, `test:state-machines` all green.
46. Recovery gate closed with deterministic E2E fixtures:
- configured dedicated auto/manual professional fixtures for booking critical tests.
- local `.env.local` updated with `E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD`, `E2E_PROFESSIONAL_ID`, `E2E_MANUAL_PROFESSIONAL_ID`.
- full technical gate now green without skips: `lint`, `typecheck`, `build`, `test:state-machines`, `test:e2e` (`7 passed`).
47. Production stability hardening applied for unexpected global error screens:
- wrapped server-side Supabase reads in `app/(app)/layout.tsx` and made `components/public/PublicPageLayout.tsx` auth-agnostic on SSR (public pages no longer depend on auth/profile read to render).
- added resilient fallback path in `/buscar` for auth/profile/professional data fetch failures (renders without crashing).
- added safe country fallback in `app/layout.tsx` to avoid hard failure when request headers/cookies are unavailable.
- fixed runtime crash in public layout path by marking `components/public/PublicFooter.tsx` as client component (it uses `window`/click handler).
- validation run: `npm run lint`, `npm run typecheck`, `npm run build` all green.
48. Search UX compact + auto-apply pass delivered on `/buscar`:
- desktop filter bar compacted for tablet/iPad footprint, removed explicit `Aplicar` button, and switched to auto-apply through canonical query state.
- mobile drawer now applies filters in real time without closing, keeping `Limpar filtros` as explicit reset shortcut.
- search text now applies on `blur`; selects and price apply immediately; all filter changes reset `pagina=1`.
- price range slider updated to step `1`, supports moving min up/down, and keeps `min <= max`.
- search card price rendering now uses rounded-up integer display (no decimals) without changing checkout/payment formatting logic.
- availability count now appears below filter bar and above cards, including contextual category/specialty summary when selected.
- validation run: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines` all green.
49. Auth/header/search stability patch delivered:
- fixed search price slider thumb interaction so minimum value can move up/down from zero reliably.
- hardened auth redirect sanitization (`/` is no longer accepted as post-login target), preventing unwanted return to home after login.
- public header now includes explicit `Criar conta` button and a compact login popup (Entrar/Criar conta options) on login click.
- validation run: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines` all green.
50. Search card unification + message CTA baseline delivered:
- `/buscar` now uses separate search bar component (`SearchQueryBar`) above filters for both logged and logged-out users.
- desktop/mobile filters keep auto-apply behavior and no longer embed duplicate search input fields.
- professional cards are now unified (same layout logged vs logged-out): avatar photo, name, specialty, expandable tags, rounded integer price, short bio, badges, country, spoken languages, and `Agendar` shortcut.
- removed session-duration badge from search cards.
- replaced secondary search-card CTA from `Solicitar horário` to `Mandar mensagem`.
- added protected route `/mensagens` as a functional destination for message intent and preserved login-gate behavior for unauthenticated users.
- validation run: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines` all green.
51. Login routing policy hardened across password and OAuth:
- professional login always redirects to `/dashboard`.
- user and admin login always redirect to `/buscar` (member shell).
- callback and login forms no longer honor arbitrary `redirect` targets for post-login destination.
- modal login copy updated to reflect role-based destination behavior.
- validation run: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines` all green.
52. Header login popup upgraded to full auth form:
- login popup now renders full `LoginForm` (email, password, social login icons) directly in the overlay.
- popup size increased for better usability (`AuthOverlay`: larger desktop popover and larger centered mobile modal).
- bottom helper text now follows requested copy: `Ainda nao eh membro? Criar conta` with clickable link.
- mobile behavior remains centered popup modal.
53. Search card pricing subtitle improved:
- card subtitle now renders dynamic session duration in PT-BR: `por sessão de X min`.
- duration is sourced from `session_duration_minutes` with safe fallback to `60`.
54. Public profile permalink foundation delivered:
- search/favorites/dashboard/admin/profile-intent links now build canonical profile URL format `nome-1234` when `public_code` exists.
- profile route `/profissional/[id]` now resolves both legacy UUID links and new slug-code links.
- added migration `016-professional-public-profile-code.sql` to create/backfill unique 4-digit `public_code` with auto-assignment trigger for new professionals.
- schema snapshot updated through migration 016.
55. Public header auth-state fix delivered:
- after login, public header now detects session in client and switches CTA from `Login/Criar conta` to `Minha área`.
- language corrected and standardized with accent: `Minha área`.
56. Google OAuth callback loop hardening delivered:
- `/auth/callback` now finalizes and redirects on the same request origin (no cross-domain base URL redirect).
- profile bootstrap switched to `upsert` for safer first-login completion.
- role-based destination remains enforced for all login methods:
  - profissional -> `/dashboard`
  - usuario/admin -> `/buscar`
57. Auth pages logo navigation fix delivered:
- logo in auth layout (`/login`, `/cadastro`, and related auth pages) is now clickable and redirects to home (`/`) on desktop and mobile.
58. Signup user locale auto-fill refinement delivered:
- in `/cadastro`, selecting country now always auto-updates timezone and preferred currency defaults.
- timezone and currency fields remain manually editable after auto-fill (user override preserved by UI behavior).
59. Professional signup review pipeline delivered:
- country selection now auto-updates timezone and preferred currency for professional signups (manual override preserved).
- added required title dropdown above full name for professional account creation.
- professional step now uses admin-qualified specialty autocomplete with custom-specialty suggestion flow.
- renamed tags input to `Foco de atuação` and expanded language capture to primary + secondary languages.
- added qualification/certificate attachment field and note capture in signup metadata.
- professional signup now redirects to `/cadastro/profissional-em-analise` instead of dashboard until admin approval.
- migration `017-wave2-professional-signup-review-pipeline.sql` added with `professional_applications` table and trigger updates for admin validation queue.
60. Search price-filter stability hotfix:
- replaced dual-overlapped native range inputs with custom dual-thumb slider in `PriceRangeSlider`.
- fixed iPad/Safari drag behavior where `preço mínimo` and `preço máximo` were stuck at `0`.
- preserved step `1`, invariant `mínimo <= máximo`, live auto-apply, and keyboard accessibility.
- corrected visible Portuguese accents in the slider label (`Preço`) and kept currency symbols consistent in search.
61. Search filter-to-cards linkage hotfix:
- `/buscar` now applies the availability filter using `readClient` (same data source used for cards) instead of always using `supabase` session client.
- added safe fallback: when availability query fails, results are not force-cleared.
- prevents false zero-results states after selecting filters (especially `Horário`) due to RLS/client mismatch.
62. Real-profession taxonomy expansion integrated across core surfaces:
- added migration `018-wave2-real-professions-taxonomy.sql` with extensive verifiable professions grouped by category/subcategory.
- added canonical taxonomy helper `lib/taxonomy/professional-specialties.ts` to load active catalog and professional specialty context.
- `/buscar` now prioritizes canonical specialties for filtering, query matching, and primary specialty display.
- `/cadastro` professional flow now loads approved specialties by selected category from canonical taxonomy (with fallback map).
- `/profissional/[id]`, `/perfil`, and `/admin` now render canonical specialties and keep `Foco de atuação` as a separate field.
- validation run green: `lint`, `typecheck`, `build`, `test:state-machines`.
63. Public search visibility now enforces full go-live gate:
- `/buscar` no longer lists professionals only by `status=approved`; it now also requires onboarding gate `canGoLive=true` (C2-C6 complete + admin approval).
- `/profissional/[id]` now blocks public access for incomplete professionals even if they are `approved`, while preserving own-profile access for the professional owner.
- added operational script `npm run fixtures:ensure-public-ready` (`scripts/ops/ensure-test-professionals-public-ready.cjs`) to normalize test fixtures across profile/settings/services/availability and keep them visible for QA.
- validation run green: `lint`, `typecheck`, `build`, `test:state-machines`.
64. Google OAuth callback loop hardening (admin/user/professional):
- replaced callback handler session exchange with cookie-safe server client flow in `app/auth/callback/route.ts`.
- callback now persists auth cookies on redirect response, preventing OAuth success -> `/login` loop caused by dropped session cookies.
- admin redirect policy reinforced at callback level: admin always resolves to `/buscar` after OAuth (even when profile completion fields are pending).
- role-based destination policy remains enforced after OAuth:
  - profissional -> `/dashboard`
  - usuario/admin -> `/buscar`
- validation run green: `lint`, `typecheck`, `build`, `test:state-machines`.
65. Login-route smoke validation + mobile login-overlay foundation fix:
- smoke-tested password login routing in production for all target roles:
  - admin -> `/buscar`
  - usuario -> `/buscar`
  - profissional -> `/dashboard`
- implemented structural fix for mobile header login popup centering in `components/auth/AuthOverlay.tsx`:
  - overlay now renders through `createPortal(..., document.body)` to avoid `position: fixed` being constrained by header `backdrop-blur`.
  - keeps desktop popover behavior and mobile modal fallback logic intact.
66. Wave 2 recurring deadline policy engine finalized in backend:
- canonical module `lib/booking/recurring-deadlines.ts` now defines fixed 7-day rules for release/change/pause.
- shared recurring decision contract added (`allowed`, `reason_code`, `deadline_at_utc`, `reference_at_utc`).
67. Recurring reserved-slot release flow delivered:
- new ops runner `lib/ops/recurring-slot-release.ts` releases eligible recurring reserved sessions/bookings at deadline.
- `/api/cron/booking-timeouts` now executes recurring release and returns structured release summary.
68. Inngest parity expanded for recurring release:
- new function `release-recurring-reserved-slots` added in `inngest/functions/index.ts` (hourly cron + event trigger).
- `/api/inngest` now serves reminder sync + recurring release workflows.
69. Gate matrix enforcement hardened end-to-end:
- canonical gate evaluator remains `evaluateOnboardingGates` and gate bypass paths were removed from onboarding state loader.
- booking/request actions now return structured gate reason codes for first-booking blocks.
- recurring manage-booking actions now return deterministic `reasonCode` + `deadlineAtUtc` when blocked by recurring deadline policy.
70. Wave 2 automated technical gate revalidated on new backend scope:
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run test:state-machines` ✅
- `npm run test:e2e` ✅ (`10 passed`, `2 skipped` fixture-dependent scenarios in `wave2-onboarding-gates.spec.ts`).

71. Security hardening audit — P0/P1/P2 fixes applied:
- **P0-1**: Admin mutations moved from client-side Supabase calls to server actions (`lib/actions/admin.ts`) with explicit `role === 'admin'` checks. Admin page now imports and calls `adminUpdateProfessionalStatus`, `adminUpdateFirstBookingGate`, `adminToggleReviewVisibility`, `adminDeleteReview` instead of direct `supabase.from().update()`.
- **P0-2**: Added `Content-Security-Policy` header to `next.config.js` covering `script-src`, `connect-src`, `img-src`, `frame-ancestors`, `object-src`, `form-action`, `base-uri` directives.
- **P0-3**: Removed query string token fallback from cron endpoints (`/api/cron/booking-reminders`, `/api/cron/booking-timeouts`). Tokens now accepted only via `Authorization: Bearer` or `x-cron-secret` headers.
- **P0-4**: Cron endpoints now require `CRON_SECRET` in all environments. Previously allowed unauthenticated access when secret was unset in non-production (preview/staging deployments are publicly accessible).
- **P0-5**: Email IDOR mitigated — added `assertCallerCanEmailRecipient` guard to all transactional email server actions. Verifies caller either owns the recipient email or has a booking relationship. Referral invite emails now verify inviterName matches caller's profile.
- **P1-8**: Mass assignment vulnerability fixed in `/configuracoes` — `saveField` now whitelists allowed fields (`currency`, `timezone`, `notification_preferences`, `full_name`, `country`). Blocks attempts to update `role`, `email`, or other restricted columns.
- **P1-9**: OAuth callback no longer accepts `role` query parameter for new profile creation. Always defaults to `'usuario'`. Professional onboarding requires explicit post-signup flow.
- **P1-10**: Silent catch block in `lib/supabase/server.ts` now logs in development mode to surface unexpected cookie-setting failures.
- **P2-12**: Cron timeout handler now filters `status = 'pending_confirmation'` at database level instead of loading all bookings and filtering in JavaScript.
- **P2-17**: Removed unnecessary `PUT` export from Inngest route handler (`/api/inngest`).
- **P2-19**: Cron error responses no longer include internal error details in production. Details only shown when `NODE_ENV !== 'production'`.
- validation run: `npm run typecheck` green.

## Immediate next actions

1. Complete Wave 2 manual acceptance checklist (recurring deadlines, C1-C10 gates, role routes) and mark Wave 2 as `Done` only after manual sign-off.
2. Confirm Inngest dashboard is attached to current app path (`/api/inngest`) and remove stale unattached sync records.
3. Keep E2E fixtures stable and close skipped `wave2-onboarding-gates.spec.ts` scenarios by maintaining both open-gate and blocked-gate professional fixtures.
4. After Wave 2 sign-off, open Wave 3 scope (Stripe real billing/payout/ledger) without changing current Wave 2 gate contracts.

## Continuity rule

Every meaningful implementation change must update:

1. `docs/project/project-status.md`
2. `docs/handover/current-state.md`
3. `docs/handover/next-steps.md`
