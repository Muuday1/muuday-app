# Next Steps

Last updated: 2026-03-30

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

1. ~~Enforce dual gate model for professionals (go-live vs first-booking eligibility).~~ Done (migration 013 + admin toggle + booking guard).
2. ~~Finish request-booking lifecycle, proposal expiration, and conversion flow (foundation).~~ Done (migration 014 + `/solicitar` + `/agenda` queue/actions + conversion).
3. ~~Finalize booking state machine tests (direct + request-booking transitions).~~ Done (`npm run test:state-machines` validates transition maps and terminal states).
4. Finalize recurring scheduling deadlines and reserved-slot release behavior.
- In progress: timeout cascade for recurring parent -> child/session cancellation is implemented.
- Remaining: cycle-level reserved-slot release deadlines and pause/change deadline enforcement.
5. Enforce onboarding field-gate matrix end-to-end (account, review, go-live, first booking, payout).
6. ~~Validate and tighten role-specific navigation + route guards for public/user/professional/admin paths.~~ Done (role-based nav in app layout + professional route hardening incl. `/financeiro`).
7. ~~Wire first Inngest non-critical workflow while keeping cron as fallback.~~ In progress — first workflow shipped and endpoint healthy; cloud sync attachment confirmation still pending.
8. Confirm Inngest cloud app has attached sync to latest endpoint path (`/api/inngest`) and clear stale unattached sync history.

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
