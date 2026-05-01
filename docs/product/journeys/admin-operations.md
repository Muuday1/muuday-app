# User Journey: Admin Operations

Last updated: 2026-03-29

## Goal

Give Muuday operators structured control over publication review, moderation, disputes, refunds/payout exceptions, trust flags, and sensitive operational actions.

## Actors

1. Admin/Ops
2. Payments Ops
3. Trust and Safety Ops
4. Content/Discovery Ops

## Canonical admin domains

1. First publication review and listing moderation.
2. Structured case queue for disputes/exceptions.
3. Review moderation and trust-flag management.
4. Financial exception actions (refund, adjustment, payout holds).
5. Notification/audit oversight and timeline integrity.

## Admin navigation baseline

Top-level admin destinations:

1. Dashboard
2. Operations
3. Professionals
4. Users
5. Finance
6. Catalog
7. Growth
8. Settings

Design rule:
- keep top-level nav focused and place detailed operational pages inside these domains.

## Required system characteristics

1. Case entity with owner, priority, status, evidence, and linked entities.
2. Explicit role-safe admin actions with audit logs.
3. Ability to navigate quickly between booking/payment/user/professional/case contexts.
4. Event-first operations model, not scattered manual actions.

## Current implementation status

`In progress`

- Core admin moderation views exist.
- Full structured case subsystem and deep audit controls are not fully implemented.

## Gaps

1. Full case queue object and transitions.
2. Full audit event model for sensitive actions.
3. Full dispute/refund/payout exception workflows tied to case ownership.

## Next steps

1. Implement case queue data model and service layer.
2. Implement admin action audit log and policy gates.
3. Implement admin dashboards for publication backlog, disputes, payout failures, and recurring issues.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Next Steps](../../../NEXT_STEPS.md)
- [Trust and Compliance Journey](./trust-safety-compliance.md)


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
