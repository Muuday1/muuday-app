# Open Validations Before Architecture Freeze

Last updated: 2026-04-10
Source: Part 3 and Part 5

## 1) BR rail provider final selection (RESOLVED — 2026-04-24)

Context:
- Payment architecture is **Stripe UK (pay-in) → Revolut Business (treasury) → Trolley (payout)**.
- Trolley is the **primary** payout provider for all corridors including BR.
- BR rail provider decision is **closed**: Airwallex vs dLocal is now a **contingency-only** evaluation.

Resolution:
- Trolley selected as primary payout provider (founder decision, 2026-04-24).
- Airwallex kept as first contingency if Trolley fails for BR corridor.
- dLocal kept as second contingency if Airwallex also fails.
- No separate BR entity needed — all payouts originate from UK entity via Trolley.

Validation questions (contingency only):
1. Which provider (Airwallex or dLocal) best fits as fallback for BR corridor?
2. What is the activation procedure if Trolley fails for BR?

Blocking impact:
- **NONE** — primary rail (Trolley) is locked. Contingency evaluation can proceed in parallel.

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
