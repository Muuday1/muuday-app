# Human Decision Backlog

Last updated: 2026-04-01

This list includes decisions and validations that should be owned by a human decision-maker.
Ordered by execution impact.

## Recently resolved

1. Monitoring and on-call ownership
- Resolved: 2026-03-30
- Owner: founder operator (`igorpinto.lds@gmail.com`)
- SLA adopted:
- Sev 1 ack <= 15m, mitigate <= 2h
- Sev 2 ack <= 4h, mitigate <= 24h
- Sev 3 ack next business block, mitigate <= 3 business days

2. Search scaling strategy (Wave 2)
- Resolved: 2026-04-01
- Decision: keep Postgres-first search with `pg_trgm + GIN` now; migrate to Typesense only after `> 2k` active professionals (or if latency remains > 500ms p95 after tuning).

## Decision deadlines by wave (by when)

| Decision | Owner | Must be decided by when | Why |
| --- | --- | --- | --- |
| Stripe corridor and legal entity confirmation | Founder/Ops/Finance/Legal | Before Wave 3 start gate | Blocks payment architecture freeze |
| Tax/accounting operating model | Finance/Accounting | Before Wave 3 exit gate | Blocks ledger reconciliation and finance ops hardening |
| Refund/dispute authority matrix | Operations lead | Before Wave 4 start gate | Needed for case queue and safe refund operations |
| Monitoring and on-call ownership | Ops | Resolved (2026-03-30) | Baseline operational response policy active |
| Final session provider decision (LiveKit vs Google Meet) | Product + Engineering | Before Wave 5 start gate | Blocks session provider freeze |
| Legal/compliance text freeze | Legal/Compliance + Founder | Before Wave 5 exit gate | Blocks sensitive-category launch readiness |
| Data retention/legal-hold final approval | Legal/Compliance + Ops | Before Wave 4 exit gate | Required before lifecycle automation rollout completion |
| Domain cutover plan (`muuday-app.vercel.app` -> `muuday.com`) | Product + Ops | Before public launch checklist | Avoids go-live DNS and auth drift |

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
- Status: **Done (2026-03-30)**. Keep policy updated if ownership changes.

5. Background job orchestrator lock
- Decision: Inngest account created and selected as preferred orchestrator baseline.
- Owner: ops/engineering.
- Next action: wire first non-critical workflow and validate retries/idempotency before broader adoption.

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
