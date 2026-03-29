# Roadmap

Last updated: 2026-03-29

Source baseline: `docs/spec/source-of-truth/part1..part5`

## Now

### Wave 0 - Baseline alignment and schema parity

1. Resolve production schema drift for booking foundation tables and API exposure.
2. Stabilize deterministic e2e critical journeys with dedicated fixtures.
3. Keep monitoring and observability activation running in production.
4. Keep handover/docs aligned with wave progress.

### Wave 1 - Foundations and discovery parity

1. Enforce taxonomy governance and moderation model.
2. Enforce tier limits/entitlements and discovery influence rules.
3. Align search, filter, rank, cards, trust signals, and favorites/rebooking behavior.

## Next

### Wave 2 - Onboarding and booking lifecycle parity

1. Finalize dual onboarding gates (public listing vs first booking acceptance).
2. Finalize booking state machine, request booking, slot hold, and recurring scheduling rules.
3. Finalize timezone-safe booking views and timeline/event integrity.

### Wave 3 - Payments, billing, payouts, revenue engine

1. Replace legacy payment placeholders with Stripe-backed lifecycle.
2. Implement payout eligibility, weekly payout scheduling, and reconciliation.
3. Implement professional subscription billing with grace/block logic.
4. Implement internal ledger and audit-grade financial projections.

## Later

### Wave 4 - Admin trust operations and notifications

1. Structured case queue for disputes/refunds/payout failures/moderation.
2. Audit logs for sensitive admin actions.
3. Notification dispatcher + in-app inbox + reminder reliability.
4. Review moderation and trust-flag governance.

### Wave 5 - Session provider and compliance freeze

1. Final provider lock with provider-agnostic session abstraction.
2. Sensitive-category disclaimer versioning and booking acceptance snapshots.
3. External validations closure (Stripe corridor, legal, tax/accounting).

## Open validations (must close before architecture freeze)

1. Stripe UK platform to Brazil payout corridor confirmation.
2. Final session provider lock decision.
3. Legal wording freeze for sensitive-category scope and disclaimers.
4. Tax/accounting operational model confirmation.

## Approved future stack additions

| Component | Purpose | Status |
| --- | --- | --- |
| Stripe full integration | Marketplace charging, refunds, payouts, billing | Planned |
| Admin case queue | Operational exception handling | Planned |
| Notification dispatcher and inbox hardening | Reliable operational communication | In progress |
| Session provider abstraction | Video/session execution flexibility | Planned |

## Under evaluation

1. Final video provider path for v1 launch.
2. Deeper tax automation beyond MVP light model.
3. Advanced trust automation beyond manual + rule-based controls.
