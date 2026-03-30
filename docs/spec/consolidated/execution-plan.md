# Muuday Execution Plan

Last updated: 2026-03-29
Planning baseline: Part 1 to Part 5 source files

## Execution mode

1. Build in waves.
2. Each wave has clear exit criteria.
3. Do not start next wave before core acceptance criteria are met.
4. Keep implementation and docs synchronized at every checkpoint.

## Wave 0 - Baseline alignment and schema parity

Goal: align current production with required booking foundation contracts.

Tasks:
1. Apply production schema parity for booking foundation tables and policies.
2. Validate RLS behavior for profile/professional/booking/payment/case paths.
3. Confirm e2e fixtures for:
- regular bookable professional
- manual-accept professional
4. Re-run smoke tests and require no critical skips on gated journeys.

Exit criteria:
1. Booking foundation schema is available in production API.
2. `npm run test:e2e` has deterministic pass/fail behavior for critical flows.
3. Documentation updated with migration/version status.

## Wave 1 - Foundations, taxonomy, search, and profile trust baseline

Goal: deliver Part 1 capabilities with controlled taxonomy and high-signal discovery.

Tasks:
1. Enforce taxonomy governance model in data and admin tooling.
2. Implement tier entitlement enforcement for limits and visibility flags.
3. Finalize search ranking/filter behavior per spec.
4. Align profile cards and trust signals with source-of-truth rules.
5. Ensure reviews model constraints and response flow are enforced.
6. Implement public/user/professional/admin route guards and navigation baselines.
7. Ensure public search is accessible without login and booking intent triggers sign-up/login modal.

Exit criteria:
1. Taxonomy CRUD/governance path is operational.
2. Tier limits and boosts are enforceable and testable.
3. Search ranking and filter behavior match spec.
4. Review uniqueness and edit lifecycle are validated.

## Wave 2 - Professional onboarding and booking lifecycle

Goal: fully align onboarding and booking lifecycle with Part 2.

Tasks:
1. Enforce dual-gating model:
- public listing eligibility
- first-booking acceptance eligibility
2. Complete booking state transition map and transition guards.
3. Implement request-booking lifecycle and proposal expiration handling.
4. Finalize slot hold, expiration, and recovery rules.
5. Enforce recurring scheduling rules with deadline-based operations.
6. Implement full professional onboarding stages with explicit field gate matrix.
7. Implement role-specific screen architecture (user/professional/admin) with nested secondary areas.

Exit criteria:
1. Full onboarding states are observable and auditable.
2. Booking state machine transitions are explicit and tested.
3. Request-booking and recurring scheduling rules pass integration tests.
4. Onboarding gate matrix is enforced and traceable in backend checks.
5. Role-based route guards and navigation rules are validated in e2e paths.

## Wave 3 - Payments, billing, payouts, and revenue engine

Goal: implement Part 3 with Stripe-backed lifecycle, internal ledger integrity, and admin safety.

Tasks:
1. Implement booking charge/capture/refund flows with idempotent webhooks.
2. Implement payout eligibility and weekly payout batching.
3. Implement professional subscription billing and grace-state logic.
4. Implement recurring billing interactions with session-based payout release.
5. Implement internal ledger projections and exports by role.

Exit criteria:
1. Payment lifecycle is provider-backed and idempotent.
2. Payout flow works with hold/dispute gating.
3. Professional billing states control booking eligibility correctly.
4. Ledger explains every booking-financial journey without gaps.

## Wave 4 - Admin case operations, trust and safety, notifications

Goal: implement Part 4 operations layer and reliability controls.

Tasks:
1. Ship structured case queue with assignment/status transitions.
2. Implement dispute/no-show evidence workflows.
3. Implement review moderation and trust-flag workflows.
4. Implement event-driven notification dispatcher and inbox behavior.
5. Implement admin audit logs for sensitive actions.

Exit criteria:
1. High-risk operational paths run through case workflows.
2. Admin can resolve disputes/refunds with full traceability.
3. Inbox/notification and timeline events are consistent by role.

## Wave 5 - Session provider abstraction and compliance completion

Goal: implement Part 5 readiness and freeze architecture safely.

Tasks:
1. Implement provider-agnostic session execution abstraction.
2. Finalize provider selection path after explicit validation.
3. Implement sensitive-category disclaimer versioning and acceptance snapshots.
4. Complete external validation checklist (payments corridor, legal/tax language).

Exit criteria:
1. Session execution supports selected provider without coupling core booking logic.
2. Compliance and disclaimer evidence is persisted per booking.
3. Open validations are resolved or explicitly risk-accepted.

## Immediate next actions (ordered)

1. Finish Wave 0 schema parity and fixture hardening.
2. Lock taxonomy governance and tier entitlements (Wave 1 start gate).
3. Publish implementation tickets by domain from this plan.
4. Keep weekly status update against this plan in `docs/project/project-status.md`.
