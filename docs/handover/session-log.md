# Session Log

Use this for meaningful checkpoints only.

## 2026-03-29

### Entry 1
- Completed production validation for cron endpoints and login availability.
- Updated production env alignment for URL/CORS consistency.
- Follow-up: activate Checkly checks and alerts.

### Entry 2
- Introduced canonical app URL resolver and updated auth/waitlist/email usage.
- Added Checkly setup guidance.
- Follow-up: migrate to final domain via env-only change when ready.

### Entry 3
- Rebuilt documentation governance structure across project/architecture/engineering/integrations/product.
- Removed stale and agent-specific prompt/handoff documents.
- Follow-up: keep `project-status` and `handover/current-state` synchronized every meaningful change.

### Entry 4
- Created persistent handover system in `docs/handover/` with overview, state, next steps, operating rules, constraints, context map, and this log.
- Follow-up: contributors must update handover files during execution, not only at session end.

### Entry 5
- Audited booking journey readiness on professional side against code reality.
- Confirmed gap: advanced `professional_settings` are implemented in backend reads but not exposed in professional UI for editing.
- Follow-up: implement dedicated professional booking settings page before deeper booking lifecycle expansion.

### Entry 6
- Delivered professional booking settings UI at `/configuracoes-agendamento` with save flow to `professional_settings`.
- Added direct navigation links from `/perfil` and `/disponibilidade` to advanced booking settings.
- Validation completed with `typecheck` and `lint` (only pre-existing lint warnings remained).

### Entry 7
- Added Sentry instrumentation baseline (client/server/edge init + global error capture + booking server-action error capture).
- Added PostHog baseline (provider, auth events, booking funnel events, route pageviews).
- Updated canonical schema snapshot `db/sql/schema/supabase-schema.sql` through migration `006`.
- Improved professional agenda to expose pending confirmation SLA/deadline context.
- Added Playwright e2e baseline (`playwright.config.ts`, `tests/e2e/booking-critical.spec.ts`, `npm run test:e2e`).

### Entry 8
- Added Checkly monitoring-as-code structure (`checkly/` + `checkly.config.js`) with API and browser journey checks.
- Added local Checkly browser journey validation (`playwright.checkly.config.ts`, `npm run test:checkly-local`).
- Added `.github/workflows/checkly-validate.yml` for parse/syntax checks.

### Entry 9
- Completed Checkly cloud activation and controlled fail/recovery validation sessions.
- Shifted Checkly to free-first pre-launch profile.

### Entry 10
- Expanded Playwright booking smoke tests and stabilized selectors.
- Created dedicated non-self professional fixture for production e2e regular-booking coverage.
- Confirmed remaining manual-confirmation smoke blocker due production schema/API drift.

### Entry 11
- Imported 5-part Muuday product specification into `docs/spec/source-of-truth/` as canonical baseline.
- Added consolidated spec docs (`master-spec`, `execution-plan`, unified AI protocol, open-validations, journey matrix).
- Updated project, architecture, journey, and handover docs to execution-wave model aligned with the new canonical baseline.

### Entry 12
- Consolidated new journey coverage docs for payments/revenue, trust/compliance, and session execution.
- Validated docs structure and local markdown links under `docs/` for consistency.
- Follow-up: execute Wave 0 implementation tasks and keep `current-state`/`next-steps` updated after each shipped batch.

### Entry 13
- Completed consolidation verification pass and documented remaining doc gaps in `docs/human-actions/consolidation-verification.md`.
- Added `docs/human-actions/decision-backlog.md` with explicit human-owned P0/P1/P2 decisions.
- Added `docs/human-actions/tool-options-and-stack-gaps.md` with 3 concrete options per open capability and stack-gap recommendations.

### Entry 14
- Added explicit data governance policy with retention/deletion matrix by data type in `docs/engineering/data-governance-and-lifecycle.md`.
- Strengthened continuity rules to require docs updates during each section/prompt and immediate indexing of newly created docs files.
- Updated handover and human-action backlog to reflect that policy is documented and next step is lifecycle automation rollout.

### Entry 15
- Clarified consolidated docs to explicitly state video provider decision scope as LiveKit (preferred) vs Google Meet (fallback), instead of generic wording.
- Aligned `tech-stack`, `open-validations`, and `human-actions/tool-options-and-stack-gaps` with canonical source-of-truth.

### Entry 16
- Added explicit "by when" deadlines per wave for human decisions in `docs/human-actions/decision-backlog.md`.
- Linked handover execution queue to those wave-gated decision deadlines.

### Entry 17
- Updated tech-stack governance to require phase entry and growth trigger metadata for all active/proposed components.
- Added wave-based stack adoption mapping in roadmap and human-actions tool matrix.
- Added handover rule to review/update stack phase tracking at every Wave close.

### Entry 18
- Reworked source-of-truth spec files to remove tool-specific AI instruction splits and replace with unified AI-agnostic build instructions.
- Added explicit role split, route guards, and screen inventory baseline for public/user/professional/admin.
- Added detailed professional onboarding stages and gate matrix requirements for implementation readiness.

### Entry 18 (2026-03-29)
- Applied all production schema migrations (001-006) to live Supabase (`jbbnbbrroifghrshplsq`).
- Fixed `availability_exceptions` table schema mismatch (recreated with correct `date_local` column).
- Migrations applied: role escalation fix, RLS restrict, favorites RLS, schema alignment, production booking foundation (professional_settings, availability_rules, availability_exceptions, slot_locks, payments, booking_sessions, calendar_integrations + full RLS), booking operations and reminders (notifications table + partial refund support).
- Wave 0 schema parity task: `Done`.
- Follow-up: validate e2e fixtures against new schema, continue Wave 0 exit criteria.

### Entry 19 (2026-03-30)
- Upgraded to Supabase Pro (spend cap enabled, PITR available but disabled) and Vercel Pro.
- Sentry env vars deployed to Vercel.
- Confirmed Supabase billing: Pro with spend cap = no surprise charges; daily backups included; PITR ~$100/mth extra, not needed yet.
- Created migration 007 (RLS cleanup: remove duplicate favorites policies and stale payments policy). Not yet applied.
- Vercel MCP requires re-authentication (user action needed).
- Follow-up: apply migration 007, configure Supabase custom SMTP with Resend (`noreply@muuday.com`), verify Vercel spending limits, verify Checkly checks.

### Entry 20 (2026-03-30) — Wave 0 closed, Wave 1 started
- **Wave 0 formally closed.** All exit criteria met.
- Vercel MCP reconnected and verified (project READY, team confirmed).
- Applied migration 008 (Wave 1 taxonomy + tiers schema): specialties table, professional_specialties junction, tier column on professionals, category_id FK, tag_suggestions table, RLS for all taxonomy tables.
- Applied migration 009 (taxonomy seed): consolidated 8 categories to new slugs, seeded 23 subcategories and 59 specialties matching search-config, backfilled category_id on existing professionals.
- Updated middleware for role-based route guards: public search (/buscar, /profissional), professional-only routes, admin-only routes, redirect param on login.
- Created `lib/tier-config.ts` with tier entitlement limits (specialties, tags, services, booking window per tier).
- Updated `types/index.ts` CATEGORIES to match new taxonomy slugs.
- Updated `lib/search-config.ts` legacy slug mapping with English DB slugs.
- Updated `lib/actions/professional.ts` to accept new + legacy category slugs.
- Build passes clean (0 errors, 0 warnings).
- Follow-up: admin taxonomy CRUD UI, search ranking refinement, review constraints, profile card trust signals.

### Entry 21 (2026-03-30) — Wave 1 core delivery
- Made search (`/buscar`) and professional profiles (`/profissional/[id]`) publicly accessible without login. Layout handles unauthenticated users with "Entrar" button.
- Login page now supports `?redirect=` param for post-login navigation (booking intent → login → booking).
- Created admin taxonomy CRUD page at `/admin/taxonomia`: tree view of categories → subcategories → specialties with inline edit, add, activate/deactivate. Tag suggestions moderation tab.
- Added tier-aware relevance ranking to search: weighted score from rating (50%), volume signals (35%), tier boost (15% premium, 8% professional).
- Added tier badges on search cards and professional profiles (Premium/Profissional visual indicators).
- Applied migration 010: review uniqueness constraint (one review per user-professional pair), professional_response + professional_response_at columns, updated_at for edit lifecycle.
- Professional profile page: shows professional response on reviews, uses new taxonomy category labels, tier badges.
- Updated professional profile page to use search-config category labels instead of hardcoded CATEGORIES.
- Build: 0 errors, 0 warnings.
- Wave 1 exit criteria status: taxonomy CRUD ✅, tier limits config ✅, search ranking ✅, review constraints ✅, route guards ✅, public search ✅.

### Entry 22 (2026-03-30) — Reliability and operations hardening
- Added Sentry hardening updates:
  - `instrumentation-client.ts` now exports `onRouterTransitionStart`.
  - `next.config.js` moved from deprecated `disableLogger` to `webpack.treeshake.removeDebugLogging`.
  - client init moved to `instrumentation-client.ts` (removed `sentry.client.config.ts` to avoid Turbopack deprecation path).
- Added PostHog feature-flag baseline in booking checkout:
  - `lib/analytics/feature-flags.ts`
  - `booking_recurring_enabled` controls recurring package visibility without breaking default behavior.
- Added migration `011-favorites-rls-safety-net.sql` to ensure canonical favorites RLS policies are always present.
- Fixed `/login` static prerender blocker by wrapping `useSearchParams` usage in `Suspense`.
- Cleaned legacy React hook dependency warnings in admin/settings/profile pages (`next lint` now clean).
- Updated migration `008-wave1-taxonomy-tiers.sql` to bootstrap base taxonomy tables (`categories`, `subcategories`) for clean environments.
- Updated schema snapshot `db/sql/schema/supabase-schema.sql` to include Wave 1 and review-constraint entities through migration 011.
- Added Inngest integration doc + env slots (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) in `.env.local` and `.env.local.example`.
- Formalized monitoring ownership and incident SLA in operational docs and handover files.

### Entry 23 (2026-03-30) — Auth validation path without Inngest dependency
- Added operational smoke script `scripts/ops/validate-supabase-auth-flow.cjs` to validate Supabase signup + reset-password flows.
- Added `npm run auth:validate-smoke` script in `package.json`.
- Updated environment template with `SUPABASE_AUTH_TEST_EMAIL`.
- Updated setup/integration/handover/human-actions docs to make auth email validation execution-ready.

### Entry 24 (2026-03-30) — Signup failure diagnosis and safety migration
- Executed real auth smoke test; signup failed with Supabase `unexpected_failure` (`Database error saving new user`).
- Added migration `012-auth-signup-trigger-hardening.sql` with canonical role normalization and resilient profile upsert trigger behavior.
- Updated status/handover/human-actions docs to treat migration 012 as immediate production action before re-running auth smoke checks.

### Entry 25 (2026-03-30) — Wave 0 verification closure
- Confirmed operator applied migrations `011` and `012` in production.
- Confirmed auth smoke validation succeeded (signup + reset flow).
- Updated next-steps/project-status/current-state/human-actions to remove resolved blocker and keep only remaining pre-Wave-2 human checks.

### Entry 26 (2026-03-30) — Inngest activation path + Wave 2 kickoff
- Replaced Inngest placeholder with first non-critical workflow: `sync-booking-reminders` (cron + event trigger).
- Extracted reminder sync logic to `lib/ops/booking-reminders.ts` and reused it from both cron endpoint and Inngest function.
- Added migration `013-wave2-dual-gate-first-booking.sql` and implemented dual-gate booking enforcement in app/admin flows.
- Updated docs/handover/human-actions with production actions: apply migration 013 and complete Inngest cloud key/sync setup.

### Entry 27 (2026-03-30) — Wave 2 request-booking foundation delivery
- Added migration `014-wave2-request-bookings-foundation.sql` and synced canonical schema snapshot.
- Implemented request-booking server actions in `lib/actions/request-booking.ts`:
  - create request
  - professional offer proposal
  - professional decline
  - user accept proposal (conversion to booking + payment record)
  - user decline/cancel
  - proposal expiration handling
- Added new user route `/solicitar/[id]` and UI form component `components/booking/RequestBookingForm.tsx`.
- Extended `/agenda` with request-booking queue and role-specific actions via `components/booking/RequestBookingActions.tsx`.
- Updated professional profile CTA to expose "Solicitar horario" when tier allows.
- Search UX adjustment: removed top category chip strip from `/buscar` and made price display/filters currency-aware from user profile preference (`/buscar`, `/favoritos`, `/profissional/[id]`).
- Tightened middleware role split for user-only routes (`/agendar`, `/solicitar`, `/favoritos`).
- Validated code with `lint`, `typecheck`, `build`, and `test:e2e` (2 passed, 1 skipped).
- Verified Inngest endpoint health in production (`https://muuday-app.vercel.app/api/inngest` returned cloud mode with key detection and 1 function).

### Entry 28 (2026-03-30) — Search currency patch + request transition hardening
- Repaired `/buscar` filter labels so min/max price reflects selected currency symbol instead of fixed BRL text.
- Enforced dynamic render on `/buscar` to reduce stale profile-currency reads.
- Removed the top category-chip strip from search results area (category now lives in the horizontal filter bar).
- Moved search filters to a horizontal bar under the main search input.
- Enforced specialty dependency on category selection.
- Switched location/country UX to full country names and data-driven options from current professionals.
- Wired request-booking server actions to explicit transition guard (`assertRequestBookingTransition`) and status-matching updates (`.eq('status', currentStatus)`) for safer concurrent updates.
- Validation: `npm run lint`, `npm run typecheck`, `npm run build` all passed locally.

### Entry 29 (2026-03-30) — Wave 2 role-based navigation and route hardening
- Updated app shell navigation by role:
  - user: Buscar, Bookings, Favoritos, Perfil
  - professional: Dashboard, Calendario, Financeiro, Configuracoes
- Updated app logo destination to landing page (`/`) for desktop and mobile headers.
- Added `/financeiro` route (professional/admin) as Wave 2 financial surface stub, preserving Stripe-heavy implementation for Wave 3.
- Tightened middleware guards for professional-only workspace routes and user-only route redirect behavior.

### Entry 30 (2026-03-30) — Wave 2 transition-test automation
- Added `scripts/ops/test-state-machines.cjs`.
- Added npm command `npm run test:state-machines`.
- Validation covers:
  - booking transition map structure and required edges
  - request-booking transition map structure and required edges
  - terminal-state immutability checks

### Entry 31 (2026-03-30) — Recurring timeout cascade hardening
- Updated `api/cron/booking-timeouts` to cascade recurring parent timeout cancellation into:
  - child recurring bookings in pending confirmation path
  - booking_sessions rows for the same parent
- Goal: release recurring inventory quickly when manual confirmation SLA expires.

### Entry 32 (2026-03-30) — Public landing + role-split navigation baseline in app
- Replaced root redirect page with full public landing at `/` (no forced redirect to login/search).
- Added public top navigation baseline per source-of-truth: Home, Buscar profissionais, Registrar como profissional, Sobre nos, Ajuda, Login.
- Added new public pages: `/sobre`, `/ajuda`, `/registrar-profissional`.
- Added public language/currency controls in header with cookie persistence (`muuday_public_language`, `muuday_public_currency`).
- Updated `/buscar` to support logged-out currency preference via `moeda` query/cookie and carry it through filter/sort/pagination.
- Updated public professional booking CTAs to sign-up-first path (`/cadastro?role=usuario&redirect=...`).
- Updated signup flow to accept role preselection and safe redirect handling after account creation.

### Entry 33 (2026-03-30) — Wave 2 B3 professional workspace execution batch
- Restored and upgraded `/agenda` into professional control-center structure with view modes:
  - `overview`, `pending`, `requests`, `settings`
  - context-aware pending/request sections and booking-rule visibility
  - role-specific alerts integrated in agenda surface
- Expanded `/dashboard` action-first behavior remains active and connected to workspace-health alerting.
- Reworked `/configuracoes` into role-aware surface:
  - users keep preferences flow
  - professionals get business-oriented setup hub (profile/services, calendar, booking rules, finance) with account health context
- Implemented source-of-truth unauthenticated booking modal behavior on `/profissional/[id]`:
  - signup primary
  - login secondary
  - redirect preserved for booking intent
- Added professional workspace e2e suite:
  - `tests/e2e/professional-workspace.spec.ts`
  - added env template keys `E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD`
  - run result: 1 passed, 3 skipped (professional creds not configured in local env)

### Entry 34 (2026-03-30) — Wave 2 C onboarding gate-matrix implementation batch
- Added migration `015-wave2-onboarding-gate-matrix-foundation.sql`:
  - `professional_services` table (C4 service structure baseline)
  - `professional_settings` readiness flags for C6/C7 (`billing_card_on_file`, `payout_onboarding_started`, `payout_kyc_completed`)
  - compatibility backfill for existing professionals.
- Added centralized onboarding evaluation engine:
  - `lib/professional/onboarding-gates.ts`
  - `lib/professional/onboarding-state.ts`
- Wired first-booking eligibility to onboarding gate checks in:
  - `lib/actions/booking.ts`
  - `lib/actions/request-booking.ts`
  - `/agendar/[id]`
  - `/solicitar/[id]`
- Added `/onboarding-profissional` route with:
  - C1-C10 stage status
  - gate status cards
  - C10 matrix rendering
  - submit-for-review action integration (`lib/actions/professional-onboarding.ts`).
- Updated professional UX surfaces:
  - `/configuracoes` now shows onboarding gate visibility + readiness controls
  - `/perfil` now links directly to onboarding checklist
  - `/completar-perfil`, `/editar-perfil-profissional`, and `lib/actions/professional.ts` now sync primary service baseline into `professional_services`.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅
  - `npm.cmd run test:state-machines` ✅

### Entry 35 (2026-03-30) — Journey restoration hotfix (role routing and role scope)
- Fixed login redirect logic to respect role-based default journeys:
  - `profissional` -> `/dashboard`
  - `usuario` and `admin` -> `/buscar`
  - explicit safe `redirect` param still has priority.
- Fixed middleware auth-page redirect (`/login`, `/cadastro`) to route by role instead of forcing `/buscar`.
- Tightened route guard semantics:
  - professional workspace routes now require `profissional` role only.
  - user journeys (`/agendar`, `/solicitar`, `/favoritos`) now allow `usuario` and `admin`.
- Updated app shell navigation for admin to support admin+user operation model:
  - Buscar, Agenda, Favoritos, Perfil, Admin.
- Restored admin user-settings journey by removing forced redirect from `/configuracoes` to `/admin`.
- Prevented role-drift records from leaking into discovery journeys:
  - `/buscar` now filters professionals by joined `profiles.role = profissional`.
  - `/profissional/[id]` now requires linked `profiles.role = profissional`.
- Corrected `/agenda` role inference to use `profiles.role` instead of the mere existence of a `professionals` row.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅

### Entry 36 (2026-03-30) — Auth/cadastro stabilization + fantasy professionals
- Logout flow adjusted to return to landing (`/`) instead of `/login`.
- Login error handling improved:
  - explicit message for unconfirmed email
  - explicit message for oauth callback failure.
- OAuth callback hardened:
  - handles exchange errors with deterministic redirect
  - bootstraps missing profile row for social auth fallback
  - redirects by role after successful session exchange.
- Signup (`/cadastro`) upgraded:
  - role icons restored
  - password confirmation field added
  - full country list enabled
  - professional flow now collects expanded onboarding fields (headline/category/specialties/languages/jurisdiction/experience/price/duration) in metadata.
- Added canonical country source module `lib/countries.ts` (backed by `countries-list`) and wired `COUNTRIES` export through `lib/utils/index.ts`.
- Reduced social auth surface in UI to Google provider for stability in current environment.
- Seeded 8 fantasy approved professionals across all target categories (marker tag `seed_fantasy_wave2_20260330`) including availability rows for filter/testing coverage.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅

### Entry 37 (2026-03-30) — Duplicate professional row resilience patch
- Added `lib/professional/current-professional.ts` as canonical resolver for professional row selection by `user_id` (single-row deterministic fallback).
- Replaced fragile `.single()`/`.maybeSingle()` lookups by `user_id` in core professional flows:
  - `/dashboard`, `/agenda`, `/perfil`, `/financeiro`, `/configuracoes`, `/configuracoes-agendamento`, `/disponibilidade`, `/editar-perfil-profissional`, `/completar-perfil`, `/onboarding-profissional`
  - `lib/actions/professional.ts`, `lib/actions/professional-onboarding.ts`, `lib/actions/manage-booking.ts`, `lib/actions/request-booking.ts`
- Goal: avoid professional journey regression when seed/legacy data has multiple rows in `professionals` for one account.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅
  - `npm.cmd run build` ✅

### Entry 32 (2026-03-31) — Recovery Sprint UX/estabilidade (fase 1)
- Created branch `codex/recovery-sprint-ux-stability` and locked recovery scope to UX/stability only.
- Reworked public header for mobile hamburger navigation with visible language/currency controls and login/minha área access.
- Rewrote public-facing copy on `/`, `/sobre`, `/ajuda`, `/registrar-profissional` to remove internal product jargon.
- Hardened auth/OAuth flow:
  - `SocialAuthButtons` now forwards safe redirect intent to callback.
  - `/auth/callback` now handles `next` redirect safely, profile bootstrap fallback, and role-aware routing.
  - login messages and labels normalized in PT-BR.
- Improved signup journey quality:
  - kept professional 3-step model.
  - added inline field validation and error summary handling.
  - preserved role icons, country list, confirm password, category select, and expanded professional fields.
- Implemented search recovery foundation:
  - canonical query-state contract consolidated in `/buscar`.
  - added `components/search/MobileFiltersDrawer.tsx` and replaced long mobile collapsible filters with drawer behavior.
- Professional/profile UX recovery:
  - dashboard rewritten with explicit UI status mapping to avoid raw internal state leakage.
  - profile page uses avatar image when available with fallback to initial.
  - mobile sticky booking CTA now supports signup-first flow for visitors via modal.
- Favorites UX recovery:
  - explicit success/error feedback on remove.
  - loading/disabled hardening + aria-live status feedback.
- Validation status:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` pending final rerun after docs updates.
