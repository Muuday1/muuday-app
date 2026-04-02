# Next Steps

Last updated: 2026-04-02

Execute in order. Build one batch at a time.

## Workspace best practices (must keep)

1. Use only `C:\dev\muuday-app` for active development, commits, and deploy actions.
2. Keep feature branches short-lived; delete local/remote branch right after merge to `main`.
3. Before production promotion, always create a rollback tag on current `main`.
4. Keep archived workspaces as read-only historical snapshots only.

## Auth flow validation after standardization (execute before new UI work)

1. Validate password login error UX for three cases:
- invalid credential (`E-mail ou senha incorretos`);
- unconfirmed email;
- social-only account (message must direct user to Google or password reset).
2. Validate signup duplicate-email flow:
- duplicate email must show standardized duplicate message and recovery link.
3. Validate profile security flow in `/perfil`:
- social-first account can set password in-session;
- password account can update password in-session;
- success/error messages must match shared catalog (`lib/auth/messages.ts`).
4. Validate role destinations remain unchanged after login:
- profissional -> `/dashboard`
- usuario/admin -> `/buscar`

## Search performance follow-up (no added cost)

1. Deploy current `/buscar` performance patch and re-measure with the same URLs used in baseline:
- `https://muuday-app.vercel.app/buscar`
- `https://muuday-app-muuday1s-projects.vercel.app/buscar`
2. Compare p50/p95 with before/after snapshots (at least 10 runs each, same region/time window).
3. If still slow on cold runs, next low-risk step is DB index validation for search-path reads (`professional_settings`, `availability`, `professional_specialties`, `professional_services` by `professional_id`) before any infra change.
4. Keep current constraint: no paid infra/services added for this optimization track.
5. Validate price-slider UX on real mobile devices:
- default range must show `0` to `+50 USD` equivalent in selected currency.
- max selected must include professionals priced above threshold.
- dragging both thumbs must remain smooth without triggering route refresh on every movement.
5.1 Validate max-thumb persistence in desktop/tablet:
- move max thumb to right edge and confirm it does not reset to `0` after pointer release.
- with no active price filter in URL (`precoMin/precoMax` absent), confirm UI starts in full-range mode.
- confirm setting max to edge still maps to open-ended filter (`precoMax` omitted from URL).
5.2 Validate specialty filter taxonomy behavior:
- select one category in `/buscar` and confirm specialty dropdown lists only real specialties from that category.
- confirm `Foco de atuação` tags never appear in specialty selector.
- confirm selecting specialty filters only professionals with matching canonical specialty.
5.3 Validate public language control (Portuguese-only mode):
- in desktop and mobile headers, confirm language control shows only `Português`.
- confirm page rendering remains in PT-BR after hard refresh and cookie carry-over from old locales.
- keep this mode until multi-language rollout is explicitly reopened in roadmap/docs.
6. Validate logout consistency on both deployment domains:
- from authenticated app shell, `Sair` must always redirect to `/` on the same domain where logout was triggered.
- after logout, accessing `/buscar` on that same domain must stay in public (non-member) mode until next login.
7. Validate signup duplicate-email behavior in preview/production:
- attempt cadastro with an existing email and confirm process is blocked with `Esqueceu a senha? Clique aqui.`.
- confirm no redirect to member area occurs in duplicate-email attempts.
- run one fresh alias signup (e.g., `+test`) to confirm confirmation email flow still works.
8. Validate new user-signup success modal:
- complete user signup with fresh email and confirm modal appears with verification instructions.
- click `OK` and verify redirect to landing page (`/`).
- confirm user is not left authenticated immediately after modal close.
9. Validate public professional-card navigation when logged out:
- from `/buscar` (logged out), open at least 5 different professional cards and confirm profile page loads (no 404).
- test both permalink formats if available (`/profissional/<uuid>` and `/profissional/nome-1234`).
- confirm blocked/incomplete professionals still return not found as expected by gate model.
10. Apply updated Supabase auth confirmation template in active project:
- run `npx tsx scripts/ops/update-supabase-templates.ts <SUPABASE_MANAGEMENT_TOKEN>` from `C:\dev\muuday-app`.
- validate with a fresh user signup that the confirmation email subject/body matches the new standard copy.
- confirm the CTA link, fallback URL box, and warning copy render correctly across Gmail/Outlook/mobile.

## Security hardening — remaining items (from 2026-04-01 audit)

Items already fixed in code are documented in `project-status.md` item 71. The items below require infrastructure, DB, or architectural work. Each item is now assigned to a wave — see `docs/project/roadmap.md` and `docs/architecture/tech-stack.md` for full context.

### Wave 2 close — infrastructure hardening (deploy before Wave 3)

1. **Supabase DB connection pooling policy (new mandatory ops gate)**:
- set `SUPABASE_DB_POOLER_URL` (or `DATABASE_URL`) to Supavisor transaction endpoint (`:6543`) in production runtime.
- keep `SUPABASE_DB_DIRECT_URL` (or `DATABASE_DIRECT_URL`) restricted to migrations/maintenance contexts only.
- run `npm run db:validate-pooling` before every production release and after env edits.
2. **Exchange-rate source hardening** (baseline delivered): booking/request-booking/search now consume shared `getExchangeRates()` cache provider. Next step is operational: keep `exchange_rates` table populated by refresh job and add stale-rate alerting (>=24h).
3. **Booking race condition (schema + code applied)**:
- `021-wave2-booking-atomic-slot-constraint.sql` já aplicado em produção.
- pending action: run concurrency smoke (two simultaneous creates same slot -> one success, one deterministic collision).
4. ~~**In-memory rate limiting fallback**: Add monitoring alert/log when Upstash is unavailable and fallback is active (doesn't survive serverless cold starts).~~ Done (2026-04-01):
- `lib/security/rate-limit.ts` now emits throttled warning + Sentry signal `rate_limit_fallback_memory_active`.
- follow-up: create explicit Sentry alert rule for this signal in production.
5. ~~**Middleware DB query per request**: Encode user role in JWT custom claims (`raw_app_meta_data`) to avoid per-request profile SELECT.~~ Done (2026-04-01):
- middleware now resolves role from JWT claims first and falls back to DB only when claim is missing/invalid.
- follow-up: keep claim coverage high for legacy accounts to reduce fallback frequency.
- operational close step added:
  - run `npm run audit:auth-role-claims` and archive JSON output in `session-log`.
  - prerequisite: `SUPABASE_SERVICE_ROLE_KEY` must be a real service-role/secret key (not publishable/anon key).
  - monitor Sentry event `middleware_role_fallback_to_profile` to track fallback frequency trend over time.
6. **Verify database indexes**: Run `EXPLAIN ANALYZE` on production. Create composite indexes: `bookings(professional_id, status)`, `bookings(user_id, status)`, `availability_rules(professional_id, is_active)`, `availability_exceptions(professional_id, date_local)`, `payments(booking_id, status)`, `slot_locks(professional_id, start_time_utc)`.
7. ~~**Zod validation audit**: Ensure ALL server actions that accept user input have Zod schema validation (booking amounts, dates, IDs, profile fields).~~ Done (2026-04-01):
- `admin.ts` and `email.ts` fully covered with Zod input parsing.
- booking/request local datetime inputs hardened with semantic checks.
- Follow-up rule: every new server action must include schema parse on input boundary before auth/mutation side effects.
8. **GitHub Actions CI pipeline**: Create workflow `lint → typecheck → build → test:state-machines → test:e2e` on every push. Block Vercel deploy on failure.
9. **pg_trgm + GIN indexes**: schema already applied (`019`); pending operational validation (query plans + latency evidence).

### Wave 3 — payments security and compliance

9. **No payment gateway** (legacy payment flow): Integrate Stripe Connect (Separate Charges and Transfers). Current `provider: 'legacy'` + `status: 'captured'` records payments without processing. Must be replaced before revenue starts.
10. **Stripe webhook security**: Create `/api/webhooks/stripe` with signature verification (`stripe.webhooks.constructEvent`), idempotency handling, and Inngest retry queue.
10.1 **Status update (implemented in code, pending production apply):**
- `/api/webhooks/stripe` now verifies signature, persists idempotent inbox event, and enqueues Inngest processing.
- required DB migration to apply before enabling endpoint in production traffic:
  - `023-wave3-stripe-job-resilience-foundation.sql`.
 - operator decision (2026-04-02): `STRIPE_WEBHOOK_SECRET` provisioning is intentionally deferred until webhook go-live.
 - temporary expected state: `secrets:sync:audit` can fail only on `STRIPE_WEBHOOK_SECRET`; treat as acknowledged exception until enablement date.
10.2 **Post-apply validation required:**
- replay one valid Stripe test webhook and confirm:
  - one row in `stripe_webhook_events`,
  - one Inngest execution in `process-stripe-webhook-inbox`,
  - final status `processed` or `ignored` with no stuck `processing`.
11. **Recurring booking atomicity**: Wrap parent + child + session inserts in Postgres RPC transaction.
12. **Supabase Vault**: Use for encrypted storage of sensitive payout/bank details. Never store card numbers (Stripe Elements handles).
- prework done: policy + guards + SQL audit pack delivered (`docs/engineering/financial-pii-encryption-and-vault.md`, `lib/stripe/pii-guards.ts`, `db/sql/analysis/024-wave3-pii-column-audit.sql`).
- next action before Stripe go-live: run `024-wave3-pii-column-audit.sql` in production and store evidence in handover/session log.
- decision pending to close before Wave 3 freeze:
  - `recommended`: Stripe-only storage for payout/KYC sensitive data.
  - `fallback`: local encrypted columns with Vault-backed key path + audited read access.
13. **Admin audit trail**: Add `admin_audit_log` table — `(admin_user_id, action, target_table, target_id, old_value, new_value, timestamp)`. Required for financial compliance.
13. **Admin audit trail**: foundation delivered in code + migration (`022-admin-audit-log-foundation.sql` + `lib/admin/audit-log.ts` + `lib/actions/admin.ts` integration).
- pending operator action: apply migration `022` in production Supabase.
- post-apply validation required:
  - execute one mutation from each admin action and confirm one `admin_audit_log` row per action.
  - confirm non-admin cannot read/write `admin_audit_log` via direct API.
- follow-up scope (Wave 3): extend audit coverage to manual financial/admin operations in `manage-booking` (refund/reversal/exception paths).
14. **RLS audit for payment tables**: Verify all new financial tables have correct RLS policies before going live.
15. ~~**Rate limiting expansion**: Add rate limits to Stripe webhook endpoint, booking creation, and signup/login for brute force prevention.~~ Done (2026-04-01):
- auth guard endpoint added: `/api/auth/attempt-guard` (`login`, `signup`, `oauth_start`).
- booking creation paths now use `bookingCreate` preset.
- stripe webhook endpoint now has `stripeWebhook` limiter (`/api/webhooks/stripe`).
- follow-up (Wave 3): tune thresholds with real traffic (signature-verified webhook processing already implemented in code and pending production migration apply `023`).
16. **Background job resilience for Stripe (partially delivered in code, pending production migration apply):**
- delivered:
  - webhook processing via Inngest with durable idempotency inbox + retry/backoff,
  - weekly payout-eligibility scan job (`read-only` financial scan),
  - subscription renewal check job,
  - failed payment retry queue/job.
- still pending to close this item:
  - apply migration `023` in production,
  - confirm Inngest cloud receives these new functions on active app sync,
  - run end-to-end dry run with Stripe test events and record evidence in `session-log`.
16. ~~**CORS hardening**: Explicit CORS policy on all API routes, especially webhooks.~~ Done for all current API routes (2026-04-01):
- centralized CORS policy helper in `lib/http/cors.ts`.
- explicit CORS + `OPTIONS` applied to all current `app/api/*` handlers.
- follow-up rule: every new webhook route (`/api/webhooks/*`) must use `WEBHOOK_API_CORS_POLICY` from the same helper.

### Wave 4 — operational monitoring

17. **Sentry alert rules**: templates and signal instrumentation are now in place; execute dashboard setup for:
- error rate spike,
- payment failures,
- auth failures,
- webhook processing delays.
- reference: `docs/engineering/runbooks/error-budget-and-alerting.md`.
18. **Checkly synthetic monitoring**: baseline already active (API + browser journeys + email subscriptions). Keep checks green and aligned with domain/env changes.

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
4. Deploy Wave 2 close infrastructure hardening (items 1-8 above) before starting Wave 3.
5. After Wave 2 manual sign-off + infrastructure hardening, start Wave 3 scope only:
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
30. Run focused QA pass on updated professional profile experience (`/profissional/[id]`):
- validate specialty appears once and category is not displayed in header.
- validate `Foco de atuação`, badges/favorite, `Sobre mim`, `Idiomas`, `Rating`, and `Comentários` sections render correctly.
- validate in-page availability booking block:
  - duration selector updates displayed price and `por sessão de X min`;
  - recurrence controls behave as expected;
  - `Agendar sessão` and `Mandar mensagem` routes are correct for logged-in and logged-out users.
- validate recommendations carousel links and card data for approved/public professionals only.
31. Keep workspace hygiene enforced:
- start all dev sessions from `C:\dev\muuday-app` only.
- treat `C:\Users\igorp\OneDrive\Documents\Muuday` as archived/non-active.
- if a legacy file is needed from OneDrive, import it intentionally into `artifacts/` with a dedicated commit and update handover docs.
32. Run visual QA on `/profissional/[id]` sticky rail behavior:
- desktop/laptop: booking rail stays visible while scrolling to `Comentários` and recommendation carousel.
- confirm left column card widths are consistent with calendar width and no extra full-width profile cards remain.
- mobile/tablet: verify no overlap/regression in CTA visibility when sticky rail is not active.
33. Validate logged-out CTA parity between `/buscar` and `/profissional/[id]`:
- logged-out click on `Agendar sessão` or `Mandar mensagem` in professional page must open the same login modal as search cards.
- logged-in click must navigate directly with no modal.
- confirm this behavior on desktop and mobile modal variants.
34. Validate guest currency selector parity:
- on `/profissional/[id]` while logged out, header must show currency selector like `/buscar`.
- switching currency should persist via cookie and reflect converted values after navigation back to search/profile views.
35. Run recurring-package acceptance test from profile entry point:
- in `/profissional/[id]`, select `Recorrência`, choose session count, date and time, then click `Agendar sessão`.
- confirm `/agendar/[id]` opens with prefilled recurring mode and selected package size.
- submit once and verify package bookings are created together (parent + child sessions) and visible in agenda context.
36. Validate password-recovery delivery in production:
- request reset for one known existing account and confirm email arrival + working link.
- verify endpoint fallback by checking route logs for `admin generateLink` failures (should be rare).
- confirm Vercel env has valid `SUPABASE_SERVICE_ROLE_KEY` (service role, not publishable key) so admin-path delivery remains active.

Dependencies:
- Wave 1 critical path complete.

## Priority 3 - Wave 3 delivery batch

### Pre-requisites (must complete before starting Wave 3 code)
1. Stripe corridor validation for UK platform to Brazil payout confirmed with Stripe support.
2. Wave 2 close infrastructure hardening deployed (items 1-8 in security hardening section).
3. Install Stripe MCP server for Claude Code: `npm install @anthropic-ai/tool-use-package-stripe` or configure MCP in `.claude.json`.

### Stripe integration — implementation sequence
4. `npm install stripe` and configure Stripe Connect (Separate Charges and Transfers) per Part 3 spec.
5. Create Supabase migration for payment tables:
   - `stripe_customers(id, user_id, stripe_customer_id, created_at)`
   - `stripe_connected_accounts(id, professional_id, stripe_account_id, onboarding_complete, created_at)`
   - `payment_intents(id, booking_id, stripe_payment_intent_id, amount, currency, status, created_at)`
   - `transfers(id, payment_intent_id, stripe_transfer_id, amount, currency, status, created_at)`
   - `subscriptions(id, professional_id, stripe_subscription_id, plan, status, current_period_end, created_at)`
   - `internal_ledger(id, booking_id, entry_type, amount, currency, description, created_at)`
   - `admin_audit_log(id, admin_user_id, action, target_table, target_id, old_value, new_value, created_at)`
   - RLS policies for all new tables.
6. Professional onboarding → Stripe Express connected account creation flow.
7. Booking checkout → Stripe Payment Intent → `/api/webhooks/stripe` confirmation → booking status update.
8. Replace legacy `provider: 'legacy'` + `status: 'captured'` with real Stripe charge flow.
9. Implement payout eligibility and weekly payout batch via Inngest cron.
10. Implement professional subscription billing (3-month free trial, then Stripe Billing) with grace/block logic.
11. Implement internal ledger entries on every financial event (charge, refund, transfer, subscription).
12. Wire Inngest for: webhook processing retry, failed payment retry, payout batch, subscription renewal checks.
13. Supabase Vault for encrypted payout/bank details storage.
14. Admin audit trail logging on all admin mutations.
15. Rate limiting on: Stripe webhook endpoint, booking creation, signup/login.
16. CORS explicit policy on all API routes.
17. Env vars to add to Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`.

Dependencies:
- Stripe corridor validation packet submitted and response path active.
- Wave 2 close infrastructure hardening complete.

## Priority 4 - Wave 4 delivery batch

### Operations
1. Implement structured admin case queue and audit-first moderation controls.
2. Review moderation and trust-flag governance.

### Monitoring and alerting
3. Configure Sentry alert rules (manual dashboard) using runbook thresholds for: error rate spike, payment failures, auth failures, webhook delays.
4. Keep Checkly monitoring active and validated after each deploy (uptime + critical-path journeys).
5. Configure PostHog alerts (manual dashboard): signup drop-off and booking conversion drop.

### Notifications
6. Finalize event-driven notification dispatcher + in-app inbox via Inngest.
7. Multi-channel routing (email + in-app + future push).

### Scale (deploy when threshold met)
8. ~~Redis cache (Upstash) for public profiles (5min TTL), taxonomy (1h), exchange rates (1h)~~ Done in Wave 2 baseline.
9. ~~Next.js ISR with `revalidateTag` for public profile pages~~ Done in Wave 2 baseline (`revalidateTag('public-profiles')` on profile-affecting mutations).

## Priority 5 - Wave 5 delivery batch

1. Implement provider-agnostic session execution abstraction.
2. Freeze compliance disclaimer versioning and checkout acceptance snapshots.
3. Close external validations (Stripe corridor final, legal, tax/accounting).

## Post-MVP — scale triggers (deploy only when threshold is met)

1. Typesense or Meilisearch for dedicated search — trigger: > 2k professionals or search latency > 500ms p95.
2. Cloudflare Images or imgproxy for image optimization — trigger: > 1k uploaded avatars or LCP > 2.5s on profiles.
3. Deep tax automation — trigger: new jurisdictions or regulatory complexity beyond light model.

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
9. Validate unified account flow in `/perfil` for user/admin:
- confirm notification toggles persist correctly without navigating to `/configuracoes`.
- confirm timezone/currency changes are saved and reflected on next session.
- confirm security + risk zone actions (password reset entry and logout) remain functional.
10. Validate professional role split after settings refactor:
- professional still opens `/configuracoes` workspace normally.
- user/admin direct access to `/configuracoes` is redirected to `/perfil`.
- keep professional nav unchanged (`Dashboard`, `Calendário`, `Financeiro`, `Configurações`).
11. Validate customer-only booking boundary:
- login with professional account and attempt `/agendar/{id}` and `/solicitar/{id}`.
- both routes must redirect to `/dashboard?erro=conta-profissional-nao-pode-contratar`.
- keep this as non-negotiable guard: professionals cannot purchase sessions; they must use `usuario` account.
12. Validate compact auth modal behavior after density patch:
- desktop (`/buscar` and `/profissional/[id]` while logged out): modal must show title, email, password, `Entrar`, Google button, and `Criar conta` without internal scrollbar.
- mobile (375x812 baseline): modal remains centered; content can scroll only when device height is truly constrained.
- confirm `Esc` + backdrop click still close modal and login redirect behavior remains role-based.
13. Validate sticky booking rail behavior after tablet/desktop expansion:
- `/profissional/[id]` on tablet (`md`) and desktop must keep booking box visible while scrolling `Sobre mim`, `Idiomas`, `Disponibilidade`, `Rating`, `Comentários`, and recomendações.
- confirm no horizontal overflow or clipping in iPad portrait/landscape.
- confirm mobile remains non-sticky and does not overlap content/CTAs.
14. Validate Postgres full-text search baseline (`019-wave2-search-pgtrgm.sql`):
- confirm RPC `search_public_professionals_pgtrgm` is callable by app roles (`anon/authenticated`).
- run `/buscar` smoke for:
  - no filters (cached baseline),
  - text query,
  - category + specialty,
  - language + location,
  - min/max price.
15. Record scale trigger policy for search engine migration:
- keep Postgres (`pg_trgm + GIN`) until `> 2k` active professionals.
- when threshold is crossed, create Wave 3/4 migration task to Typesense with zero-downtime dual-run (`Postgres + Typesense`) before cutover.
16. Validate composite indexes for audit P2:
- run `db/sql/analysis/wave2-indexes-explain-analyze.sql`.
- attach results in handover with:
  - whether planner used index scan/bitmap index scan,
  - execution time before/after where available,
  - any query still showing seq scan and next index action.
17. Validate JWT role-claim coverage after middleware JWT-first patch:
- confirm active auth sessions contain `app_metadata.role` (or `raw_app_meta_data.role`) for `usuario`, `profissional`, and `admin`.
- monitor middleware behavior in preview/prod and verify DB fallback only occurs for legacy/missing-claim accounts.
- after claim coverage is confirmed, keep fallback for safety but treat frequent fallback hits as data backfill action item.
18. Finalize deploy-blocking policy in platform settings (human action required):
- GitHub: set branch protection on `main` requiring status check `CI` before merge.
- Vercel: keep production branch as `main` and disable any bypass path that promotes failed commits.
- confirm no direct production deploy path exists outside branch-protected `main`.
19. Configure CI/E2E and Checkly secrets in GitHub repository settings:
- required for CI main gate: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD`, `E2E_PROFESSIONAL_ID`, `E2E_MANUAL_PROFESSIONAL_ID`, `E2E_BLOCKED_PROFESSIONAL_ID`.
- required for synthetic monitoring workflow: `CHECKLY_API_KEY`, `CHECKLY_ACCOUNT_ID`.
- optional variable overrides: `E2E_BASE_URL`, `CHECKLY_BASE_URL`.
20. Complete the pending RLS audit evidence pass (critical before Wave 3 finance hardening):
- run `db/sql/analysis/022-rls-audit-inventory.sql` in production and attach output.
- run `db/sql/analysis/023-rls-cross-user-isolation.sql` with real sample UUIDs for `bookings`, `payments`, hidden `reviews`, and `messages` (if implemented).
- run `npm run audit:rls:api` with explicit `RLS_SAMPLE_*` IDs when auto-discovery returns no rows.
- if `messages` table is not implemented yet, explicitly log "N/A — Wave 4 inbox not launched" and keep as tracked gap.
21. Execute first full secrets-rotation cycle and record baseline due dates:
- follow `docs/engineering/runbooks/secrets-rotation-runbook.md`.
- rotate and validate now: `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- stamp baseline in register after each completed rotation batch:
  - `npm run secrets:rotation:stamp -- --secrets <SECRET_A,SECRET_B> --date <YYYY-MM-DD> --by <owner>`.
- run sync audit immediately after every rotation:
  - `npm run secrets:sync:audit`.
- required automation precondition in GitHub settings:
  - `VERCEL_TOKEN` (secret), `VERCEL_PROJECT_ID` (variable), optional `VERCEL_TEAM_ID` (variable).
22. Add recurring operator reminder cadence for secret rotation:
- automated by `.github/workflows/secrets-rotation-reminder.yml` (daily schedule).
- cadence source-of-truth is `docs/engineering/runbooks/secrets-rotation-register.json` (`cadence_days` 60/90/180).
- workflow fails when any secret is due soon (`<=14 days`) or overdue, so alerts do not depend on manual calendar reminders.
23. Normalize `payments` schema across all environments using canonical migration `026`:
- apply `db/sql/migrations/026-wave3-payments-insert-compatibility-hotfix.sql` in every non-prod/prod environment that still has schema drift.
- verify post-apply:
  - defaults exist for `base_price_brl`, `platform_fee_brl`, `total_charged`.
  - trigger `trg_fill_payments_legacy_required_fields` is active.
  - INSERT policy `System creates payments for booking owner` references `payments.user_id` / `payments.professional_id` in booking ownership checks.
- run smoke for both flows:
  - direct booking (`/agendar`)
  - request acceptance (`/solicitar`)
  and confirm no new `payment_capture_failed` cancellations are generated.
