# Human Decision Backlog

Last updated: 2026-03-29

This list includes decisions and validations that should be owned by a human decision-maker.
Ordered by execution impact.

## P0 - Blocking architecture decisions

1. Stripe corridor and legal entity confirmation
- Decide and validate UK platform -> Brazil-heavy payout corridor details with Stripe.
- Owner: founder/ops/legal + finance.
- Blocks: Wave 3 architecture freeze.

2. Final session provider decision
- Choose embedded provider path vs external link fallback for launch.
- Owner: product + engineering.
- Blocks: Wave 5 freeze and session UX finalization.

3. Legal/compliance text freeze
- Approve final disclaimer copy, regulated-service boundaries, and terms alignment.
- Owner: legal/compliance + founder.
- Blocks: sensitive-category rollout.

4. Tax/accounting operating model
- Approve bookkeeping model for held funds, reversals, and subscription revenue.
- Owner: finance/accounting.
- Blocks: Wave 3 ledger and reconciliation operations.

## P1 - Launch quality decisions

1. Domain cutover plan
- Define timeline and checklist to move from dev domain to `muuday.com`.
- Owner: product + ops.

2. Monitoring and on-call ownership
- Define alert recipients, escalation path, and incident SLA for Checkly/Sentry.
- Owner: ops.

3. Data retention and privacy policy operationalization
- Policy baseline already documented in `docs/engineering/data-governance-and-lifecycle.md`.
- Approve final retention windows and legal-hold exceptions by jurisdiction.
- Owner: legal/compliance + ops.

4. Refund/dispute authority matrix
- Approve who can trigger refunds, partial refunds, manual overrides, and exceptions.
- Owner: operations lead.

## P2 - Scale readiness decisions

1. Regional expansion policy
- Decide launch geographies and phased expansion constraints.
- Owner: strategy + legal.

2. Professional verification depth
- Approve which categories require stronger credential checks.
- Owner: trust/safety.

3. Risk thresholds
- Define no-show thresholds, suspension rules, and fraud review triggers.
- Owner: trust/ops.

## Cadence recommendation

1. Review this list weekly.
2. Move resolved items to `Done` with date and owner.
3. Update `docs/project/project-status.md` when blockers are removed.
