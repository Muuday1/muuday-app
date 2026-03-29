# Next Steps

Last updated: 2026-03-29

Execute in order. Build one batch at a time.

## Priority 0 - Foundation lock (must finish first)

1. Validate and close production schema parity for booking foundation tables and APIs.
2. Re-run critical e2e booking tests and require deterministic pass/fail behavior.
3. Record parity status in:
- `docs/project/project-status.md`
- `docs/handover/current-state.md`

Dependencies:
- DB migration and API exposure parity.

## Priority 1 - Wave 1 delivery batch

1. Finalize taxonomy governance surfaces (category/subcategory/specialty/tag moderation).
2. Finalize tier entitlement enforcement (limits and feature gating).
3. Align search relevance/filter/card behavior with Part 1 rules.
4. Validate review/trust/favorites behavior against Part 1 constraints.

Dependencies:
- Priority 0 completed.

## Priority 2 - Wave 2 delivery batch

1. Enforce dual gate model for professionals (go-live vs first-booking eligibility).
2. Finish request-booking lifecycle, proposal expiration, and conversion flow.
3. Finalize booking state machine transition map and tests.
4. Finalize recurring scheduling deadlines and reserved-slot release behavior.

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
