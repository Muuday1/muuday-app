# Open Validations Before Architecture Freeze

Last updated: 2026-04-10
Source: Part 3 and Part 5

## 1) BR rail provider final selection (critical)

Context:
- Payment architecture is locked as entity-based dual rail.
- UK entity uses Stripe where supported.
- BR entity must use a BR-compatible rail for BR professionals/payouts.
- Final BR rail provider decision is pending (Airwallex vs dLocal).

Validation questions:
1. Which provider (Airwallex or dLocal) best fits startup volume, compliance constraints, and rollout speed?
2. What BR payout constraints apply to KYC fields, settlement timing, and payout methods?
3. What intercompany settlement model is required between UK and BR entities?
4. What operational fallback exists if BR rail onboarding is delayed?

Blocking impact:
- Wave 3 real-money BR payout rollout cannot be finalized until this is validated.

## 2) Video provider note (closed)

Status:
- Provider decision is locked to Agora for current roadmap execution.
- This item is no longer an open validation.

## 3) Legal/compliance text freeze

Context:
- Sensitive category scope and disclaimer strategy are defined at product level.
- Final legal wording and enforceable policy text still need review.

Validation questions:
1. Are profile and checkout disclaimers legally aligned with service scope?
2. Are terms clear on cross-border limitations and regulated claims?
3. Are no-show, cancellation, dispute, and refund policies fully aligned across product and terms?

Blocking impact:
- High-risk category launch readiness depends on this.

## 4) Tax/accounting operating model

Context:
- MVP policy is defined (light receipt model now, deeper automation later).

Validation questions:
1. What invoice/receipt responsibilities apply by entity and corridor?
2. How should held funds, transfers, reversals, and subscription revenue be booked operationally?
3. Which tax automation pieces are phase 2 vs pre-launch mandatory?

Blocking impact:
- Finance operations runbook and admin tooling need this clarity.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
