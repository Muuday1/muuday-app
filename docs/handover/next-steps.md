# Next Steps

Last updated: 2026-04-01

Execute in order. Build one batch at a time.

## Security hardening — remaining items (from 2026-04-01 audit)

Items already fixed in code are documented in `project-status.md` item 71. The items below require infrastructure, DB, or architectural work:

### P1 — High priority

1. **Hardcoded currency exchange rates** (`lib/actions/booking.ts`, `lib/actions/request-booking.ts`): Replace hardcoded `rates` map with dynamic rates stored in Supabase (updated via cron/API). Add staleness check — refuse bookings if rates are older than 24h.
2. **No payment gateway** (legacy payment flow): Before Wave 3 launch, integrate Stripe. Current `provider: 'legacy'` + `status: 'captured'` flow records payments without processing them. Must be explicitly gated to beta/free-tier only.

### P2 — Medium priority

3. **Booking race condition**: Conflict check + lock + insert are not atomic. Consider wrapping in a Postgres transaction via `supabase.rpc()` or adding a unique constraint on `(professional_id, start_time_utc)`.
4. **In-memory rate limiting fallback**: When Upstash is unavailable, the memory fallback doesn't survive serverless cold starts. Add monitoring alert when Upstash is down.
5. **Middleware DB query per request**: Encode user role in JWT custom claims (`raw_app_meta_data`) to avoid per-request profile SELECT in middleware. Fall back to DB only when claim is missing.
6. **Verify database indexes**: Run `EXPLAIN ANALYZE` on production for key queries. Confirm composite indexes exist for: `bookings(professional_id, status)`, `bookings(user_id, status)`, `availability_rules(professional_id, is_active)`, `availability_exceptions(professional_id, date_local)`, `payments(booking_id, status)`, `slot_locks(professional_id, start_time_utc)`.
7. **Recurring booking atomicity**: `createBooking` for recurring type does parent insert, child inserts, and session inserts as separate operations. Wrap in RPC transaction.

### P3 — Low priority

8. **No admin audit trail**: Add `admin_audit_log` table to record admin mutations with `(admin_user_id, action, target_table, target_id, old_value, new_value, timestamp)`.

## Wave 2 closure checklist (authoritative current sequence)

1. Run manual acceptance for Wave 2 (must be green before closing wave):
- recorrência/deadlines: dentro do prazo permitido; fora do prazo bloqueado com `reason_code`; release automático de slots reservados no deadline de 7 dias.
- gates C1-C10: profissional incompleto fora da busca pública; gate de primeiro booking bloqueando ações críticas; desbloqueio automático após requisitos completos.
- role split: `profissional -> /dashboard`; `usuario/admin -> /buscar`; guardas de workspace cruzado bloqueando acesso indevido.
2. Confirm Inngest operational attachment:
- app path atual `https://muuday-app.vercel.app/api/inngest`.
- eliminar syncs antigos não anexados no dashboard.
3. Keep fixture integrity for e2e (open-gate + blocked-gate):
- manter `E2E_PROFESSIONAL_ID` e `E2E_BLOCKED_PROFESSIONAL_ID` válidos.
- manter script `npm run fixtures:ensure-public-ready` disponível para recuperação de fixture.
4. After Wave 2 manual sign-off, start Wave 3 scope only:
- Stripe real billing/payout + ledger interno, sem reabrir contratos de gate de Wave 2.

## Priority 0 - Foundation lock (must finish first)

### Done
1. ~~Validate and close production schema parity for booking foundation tables and APIs.~~ Done (migrations 001-006 applied).
2. ~~Re-run critical e2e booking tests and require deterministic pass/fail behavior.~~ Done (2/3 pass deterministically).
3. ~~Sentry DSN configured and env vars deployed to Vercel.~~ Done.
4. ~~Upgraded to Supabase Pro (spend cap enabled) and Vercel Pro.~~ Done.
5. ~~Apply migration 011 (favorites RLS safety net) in production.~~ Done.
6. ~~Apply migration 012 (auth signup trigger hardening) in production.~~ Done.
7. ~~Validate Supabase Auth email flow end-to-end (signup + reset).~~ Done via `auth:validate-smoke` + inbox confirmation.
8. ~~Record final parity status in docs.~~ Done.

### Remaining
1. None.

Dependencies:
- None.

## Priority 1 - Wave 1 delivery batch

### Done
1. ~~Finalize taxonomy governance surfaces (category/subcategory/specialty/tag moderation).~~ Done — admin CRUD at `/admin/taxonomia`.
2. ~~Finalize tier entitlement enforcement (limits and feature gating).~~ Done — `lib/tier-config.ts`, tier column, badges.
3. ~~Align search relevance/filter/card behavior with Part 1 rules.~~ Done — tier-weighted ranking, public search.
4. ~~Validate review/trust/favorites behavior against Part 1 constraints.~~ Done — uniqueness, professional response, edit lifecycle.
5. ~~Route guards for public/user/professional/admin paths.~~ Done — middleware updated.
6. ~~Public search accessible without login, booking intent triggers login.~~ Done.

## Priority 2 - Wave 2 delivery batch

0. Deploy latest `AuthOverlay` portal fix and run focused post-deploy smoke:
- mobile `/buscar` -> header `Login` popup must open centered on viewport (not anchored to top/header).
- password login routing must remain stable:
  - admin -> `/buscar`
  - usuário -> `/buscar`
  - profissional -> `/dashboard`.

0. Stabilization gate before continuing Wave 2:
- deploy latest professional-profile resolver patch before validation runs (duplicate `professionals` rows handling).
- verify email/password login for known accounts (admin, professional, user) after auth patch
- verify Google login callback completes and lands on expected destination
- verify signup UX changes (icons, full countries, confirm password, expanded professional fields) in desktop/mobile
- verify logout now returns to landing page
- verify seeded fantasy professionals are visible in `/buscar` and filters
- automated gate status: `lint/typecheck/build/test:state-machines/test:e2e` fully green on branch `codex/recovery-sprint-ux-stability` (`7 passed`, `0 skipped`).

1. ~~Enforce dual gate model for professionals (go-live vs first-booking eligibility).~~ Done (migration 013 + admin toggle + booking guard).
2. ~~Finish request-booking lifecycle, proposal expiration, and conversion flow (foundation).~~ Done (migration 014 + `/solicitar` + `/agenda` queue/actions + conversion).
3. ~~Finalize booking state machine tests (direct + request-booking transitions).~~ Done (`npm run test:state-machines` validates transition maps and terminal states).
4. Finalize recurring scheduling deadlines and reserved-slot release behavior.
- In progress: timeout cascade for recurring parent -> child/session cancellation is implemented.
- Remaining: cycle-level reserved-slot release deadlines and pause/change deadline enforcement.
5. Enforce onboarding field-gate matrix end-to-end (account, review, go-live, first booking, payout).
- In progress: gate engine + checklist route + first-booking enforcement already delivered in app code.
- Remaining: apply migration `015-wave2-onboarding-gate-matrix-foundation.sql` in production and validate real flags.
6. ~~Validate and tighten role-specific navigation + route guards for public/user/professional/admin paths.~~ Done (role-based nav in app layout + professional route hardening incl. `/financeiro`).
7. ~~Wire first Inngest non-critical workflow while keeping cron as fallback.~~ In progress — first workflow shipped and endpoint healthy; cloud sync attachment confirmation still pending.
8. Confirm Inngest cloud app has attached sync to latest endpoint path (`/api/inngest`) and clear stale unattached sync history.
9. ~~Implement source-of-truth unauthenticated booking modal behavior (signup primary + login secondary) on public search/profile booking intent.~~ Done on `/profissional/[id]` via `PublicBookingAuthModal`.
10. ~~Run professional workspace acceptance e2e with dedicated professional credentials to unskip all B3 checks (`E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD`).~~ Done (`7/7` e2e green with manual+auto booking coverage).
11. Add/validate onboarding acceptance tests for `/onboarding-profissional`:
- stage/gate visibility
- blocked vs unblocked submit-for-review behavior
- first-booking gate message alignment with checklist.
12. Complete Wave 2 B3 UX polish pass (desktop + mobile):
- copy consistency (`Bookings` vs localized labels)
- responsive spacing and CTA hierarchy for dashboard/agenda/configuracoes
- finalize any remaining empty/error state polish for professional workspace
12.1 Validate search compact UX in real devices:
- iPad portrait/landscape spacing for `/buscar` compact filter bar.
- slider min/max interaction quality with step 1 on touch.
- confirm auto-apply behavior: text on blur, selects/range immediate.
- confirm count banner appears below filters and above cards for filtered/unfiltered states.
12.2 Validate auth/header behavior in preview/production:
- login from public header opens compact popup with `Entrar` + `Criar conta`.
- `Criar conta` button is visible next to `Login` in desktop public header.
- successful email/password and Google login must never redirect to `/` (home); expected default remains role-based (`/dashboard` or `/buscar`).
12.3 Validate unified search card behavior across auth states:
- logged and logged-out `/buscar` must show exactly the same card structure/content.
- specialty is shown in subtitle (not category).
- tags expand/collapse interaction works on desktop (hover title + expand button) and mobile (tap button).
- session-duration badge remains removed.
- secondary card action is `Mandar mensagem` and redirects to login when visitor is not authenticated.
12.4 Validate login destination policy by role in production:
- profissional -> always `/dashboard`.
- usuario -> always `/buscar`.
- admin -> always `/buscar`.
- verify both password login and Google OAuth callback.
12.5 Validate header login popup UX parity:
- desktop header login opens larger popup with full form (email/senha + social).
- helper text/link `Ainda nao eh membro? Criar conta` is visible and clickable.
- mobile header login opens centered popup with same auth options.
12.6 Validate search card subtitle copy:
- cards show `por sessão de X min` with dynamic minutes from each professional.
- confirm fallback value (`60 min`) when duration is missing.
13. Run production sanity pass after role-routing hotfix:
- professional account login lands at `/dashboard`
- admin account login lands at `/buscar` (with `/admin` still available)
- `/buscar` list excludes non-professional profiles
- `/agenda` shows user view for admin and professional view only for professional role
14. Run production sanity pass after stability hardening patch:
- confirm `/`, `/buscar`, and `/login` no longer show global error page (`Ocorreu um erro inesperado`)
- confirm logged-out public pages render even if Supabase request has transient failure
- monitor Sentry for residual runtime exceptions in `app/(app)/layout` and `PublicPageLayout`.
15. Data hygiene cleanup: remove legacy `professionals` row tied to admin test account to avoid analytics/ops noise (optional but recommended).
16. Apply migration `016-professional-public-profile-code.sql` in production and validate canonical profile URLs:
- from logged-out `/buscar`, clicking a professional opens `/profissional/nome-1234`.
- legacy `/profissional/<uuid>` links still resolve.
- confirm admin/favorites/dashboard links open canonical permalink after migration backfill.
17. Validate public-header auth state in preview/production:
- while logged out, header shows `Login` + `Criar conta`.
- after login, header must hide those buttons and show only `Minha área`.
- validate desktop and mobile header flows.
18. Validate Google OAuth end-to-end on production domain:
- start from public header login popup and from `/login`.
- complete Google auth and confirm no loop back to login.
- confirm post-login destination by role (`profissional -> /dashboard`, `usuario/admin -> /buscar`).
19. Validate auth-page branding navigation:
- on `/login` and `/cadastro`, clicking the Muuday logo must always redirect to home (`/`).
20. Validate signup locale defaults in preview/production:
- in `/cadastro` (role `usuario`), selecting country must auto-update timezone + preferred currency.
- after auto-fill, user must still be able to manually change timezone and currency before submit.
21. Apply and validate migration `017-wave2-professional-signup-review-pipeline.sql` in production:
- confirm `professional_applications` table and RLS policies exist.
- confirm signup trigger writes one pending application for each new professional.
- confirm custom specialty suggestions create moderation entries for admin review.
22. Validate new professional signup review UX:
- title dropdown required above full name.
- approved-specialty autocomplete works and custom-specialty flow requires validation message.
- `Foco de atuação`, idiomas (principal/secundários), anos de experiência, certificados field set all persist into signup metadata.
- successful professional signup lands on `/cadastro/profissional-em-analise` and no longer enters dashboard directly.
23. Validate `/buscar` preço em touch devices after hotfix:
- drag `preço mínimo` and `preço máximo` in both directions (including from `0` to >`0` and back).
- confirm query auto-apply still updates URL/results with step `1`.
- confirm keyboard interaction (arrow/page/home/end) still updates values for accessibility baseline.
24. Validate filter-to-card linkage in `/buscar` after availability-client fix:
- apply `Categoria`, `Especialidade`, `Idioma`, `Horário` one by one and confirm cards no longer disappear unexpectedly.
- confirm only genuinely empty filters return zero results.
24.1 Run a focused PT-BR QA pass in preview/production:
- validate accented labels and feedback messages in `/login`, `/cadastro`, `/buscar`, `/agenda`, `/configuracoes`, `/configuracoes-agendamento`, `/agendar/[id]`, `/solicitar/[id]`.
- validate no mojibake (`Ã`, `â`, `?` in words) remains in visible UI.
25. ~~Apply migration `018-wave2-real-professions-taxonomy.sql` in production.~~ Done (operator-confirmed on 2026-03-31).
26. Run post-migration sanity checks for canonical specialties:
- sample legacy professionals migrated into `professional_specialties`.
- `/cadastro` professional category -> specialty options populated from taxonomy.
- `/buscar` category/specialty filtering and card subtitle use canonical specialties.
- `/admin` and `/perfil` show canonical specialties plus separate `Foco de atuação`.
27. Run fixture-public-visibility hardening after every test-account creation/reset:
- command: `npm run fixtures:ensure-public-ready`
- prerequisite: valid `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` (service role).
- expected result: all fixture professionals used in QA/E2E remain `canGoLive=true`, appear in `/buscar`, and open `/profissional/[id]` without 404.
28. Sanity check public visibility gate enforcement:
- create one incomplete professional (missing onboarding requirements) and confirm it does **not** appear on `/buscar`.
- complete onboarding + approve and confirm listing appears automatically.
29. After deploying OAuth callback patch, run auth smoke manually with Google:
- admin account (`igorpinto.lds@gmail.com`) must complete OAuth and land in `/buscar` with no loop to `/login`.
- professional OAuth must land in `/dashboard`.
- repeat from both `/login` and public header login popup.

Dependencies:
- Wave 1 critical path complete.

## Priority 3 - Wave 3 delivery batch

1. Replace legacy payment placeholders with Stripe-backed lifecycle.
2. Implement payout eligibility and weekly payout batch model.
3. Implement professional subscription billing with grace/block behavior.
4. Implement internal ledger and reconciliation projections.

Dependencies:
- Stripe corridor validation packet submitted and response path active.

## Priority 4 - Wave 4 and Wave 5 setup

1. Implement structured admin case queue and audit-first moderation controls.
2. Finalize event-driven notifications + inbox consistency.
3. Implement provider-agnostic session execution abstraction.
4. Freeze compliance disclaimer versioning and checkout acceptance snapshots.

Dependencies:
- Wave 3 stable baseline.

## Do not do yet

1. Do not freeze session provider until validation checklist in `docs/spec/consolidated/open-validations.md` is completed.
2. Do not treat legal/tax wording as final before explicit review.
3. Do not mark waves done without acceptance criteria in `docs/spec/consolidated/execution-plan.md`.

## Human-owned decisions to resolve in parallel

1. Work through `docs/human-actions/decision-backlog.md` from P0 to P2.
2. Follow the "Decision deadlines by wave (by when)" table as hard gates.
3. Decide open tools from `docs/human-actions/tool-options-and-stack-gaps.md`.
4. Update blockers in `docs/project/project-status.md` whenever a human decision is closed.
5. Approve final retention windows/legal-hold exceptions and then implement lifecycle cleanup jobs from `docs/engineering/data-governance-and-lifecycle.md`.
6. At each Wave close, run tech-stack phase review and update `docs/architecture/tech-stack.md` + `docs/project/roadmap.md`.

## Recovery Sprint checklist (before continuing Wave 2)

Status: `Done` for automated gate + fixture setup. Keep this list as regression checklist for future patches.

1. Validate public header mobile drawer behavior on real devices (open/close, language/currency persistence, login CTA).
2. Run manual auth journeys:
- login with valid user/professional credentials
- invalid credentials error message
- logout redirect to landing
- OAuth callback success/failure path
3. Validate signup UX end-to-end:
- user flow (country + confirm password)
- professional 3-step flow and inline validation errors
4. Validate search parity:
- desktop sticky horizontal filters
- mobile drawer filters
- currency consistency in cards and inputs
- specialty enabled only after category selection
5. Validate professional profile mobile sticky CTA for logged-out and logged-in states.
6. Validate favorites removal feedback and keyboard/focus accessibility in critical screens.
7. After checklist is green, resume Wave 2 backlog items (recurring deadlines/slot release + onboarding C1-C10 e2e parity).
8. ~~Configure deterministic booking E2E fixtures in `.env.local`:~~ Done.
- `E2E_PROFESSIONAL_ID` points to an approved professional with first-booking gate open.
- `E2E_MANUAL_PROFESSIONAL_ID` points to an approved professional in `manual` confirmation mode.
