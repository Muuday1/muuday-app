# Open Validations Before Architecture Freeze

Last updated: 2026-03-29
Source: Part 3 and Part 5

## 1) Stripe corridor validation (critical)

Context:
- Platform entity preference: UK.
- Customer payments are global.
- Professional base is mostly Brazil.
- Target model uses Stripe Connect with delayed payout logic.

Validation questions:
1. Is the intended UK-platform-to-Brazil payout corridor supported in the required structure?
2. Is Separate Charges and Transfers the recommended model for this corridor?
3. What constraints apply to payout currency, hold windows, connected account model, and transfer timing?
4. What fallback architecture is recommended if current corridor assumptions are limited?

Blocking impact:
- Payments architecture cannot be fully frozen until this is validated.

## 2) Video provider final lock

Context:
- Preferred direction: LiveKit embedded model.
- Fallback: Google Meet link-based model.

Validation questions:
1. Does embedded provider complexity fit launch timeline and team capacity?
2. Is provider-agnostic abstraction fully ready before lock?
3. Does support telemetry/no-show evidence require embedded provider now?

Blocking impact:
- Session execution module should remain provider-agnostic until final lock.

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
