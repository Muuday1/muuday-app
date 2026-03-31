# Next Steps

Last updated: 2026-03-31

Execute in order. Build one batch at a time.

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
