# Next Steps

Last updated: 2026-03-30

Execute in order. Build one batch at a time.

## Priority 0 - Foundation lock (must finish first)

### Done
1. ~~Validate and close production schema parity for booking foundation tables and APIs.~~ Done (migrations 001-006 applied).
2. ~~Re-run critical e2e booking tests and require deterministic pass/fail behavior.~~ Done (2/3 pass deterministically).
3. ~~Sentry DSN configured and env vars deployed to Vercel.~~ Done.
4. ~~Upgraded to Supabase Pro (spend cap enabled) and Vercel Pro.~~ Done.

### Remaining
1. Apply migration 007 (RLS cleanup — remove duplicate favorites and stale payments policies). SQL ready in `db/sql/migrations/007-rls-cleanup.sql`.
2. Configure Supabase custom SMTP with Resend for auth emails (`noreply@muuday.com`).
3. Re-authenticate Vercel MCP in Claude Settings → MCP Servers.
4. Verify Vercel spending limits via dashboard.
5. Verify Checkly checks are active in production.
6. Record final parity status in:
- `docs/project/project-status.md`
- `docs/handover/current-state.md`

Dependencies:
- Migration 007: user runs SQL in Supabase SQL Editor.
- SMTP: user configures in Supabase dashboard (Auth → SMTP Settings).
- Vercel MCP: user re-authenticates in Claude Settings.

## Priority 1 - Wave 1 delivery batch

### Done
1. ~~Finalize taxonomy governance surfaces (category/subcategory/specialty/tag moderation).~~ Done — admin CRUD at `/admin/taxonomia`.
2. ~~Finalize tier entitlement enforcement (limits and feature gating).~~ Done — `lib/tier-config.ts`, tier column, badges.
3. ~~Align search relevance/filter/card behavior with Part 1 rules.~~ Done — tier-weighted ranking, public search.
4. ~~Validate review/trust/favorites behavior against Part 1 constraints.~~ Done — uniqueness, professional response, edit lifecycle.
5. ~~Route guards for public/user/professional/admin paths.~~ Done — middleware updated.
6. ~~Public search accessible without login, booking intent triggers login.~~ Done.

## Priority 2 - Wave 2 delivery batch

1. Enforce dual gate model for professionals (go-live vs first-booking eligibility).
2. Finish request-booking lifecycle, proposal expiration, and conversion flow.
3. Finalize booking state machine transition map and tests.
4. Finalize recurring scheduling deadlines and reserved-slot release behavior.
5. Enforce onboarding field-gate matrix end-to-end (account, review, go-live, first booking, payout).
6. Validate role-specific navigation and route guards for public/user/professional/admin paths.

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
