# Muuday Unified AI Agent Execution Protocol

Last updated: 2026-03-29

This protocol replaces split vendor-specific instruction sets during implementation planning and delivery.

## Mission

Implement Muuday according to the 5-part source-of-truth specification with strict consistency across product, operations, and architecture.

## Global rules

1. Treat `docs/spec/source-of-truth/part1..part5` as canonical baseline.
2. Never drop a decision from the source files.
3. If implementation deviates, document the delta explicitly with rationale.
4. Keep behavior deterministic in core booking/payments/admin systems.
5. Prioritize reliability, auditability, and operational clarity over premature complexity.

## Required execution behavior

1. Work domain-first, not file-first.
2. For every task, define:
- product rule being implemented
- data model impact
- state transition impact
- role-specific UX impact
- test impact
- operations impact
3. Keep role boundaries explicit:
- user
- professional
- admin
- system automation
4. Use explicit enums/state machines for:
- booking states
- payment states
- payout states
- case statuses
- review statuses

## Money and risk safety rules

1. Separate booking lifecycle from finance lifecycle.
2. Make all financial actions idempotent and replay-safe.
3. Keep an internal ledger model as business source-of-truth.
4. Never expose admin-only finance actions to professional/user roles.
5. Snapshot policy and pricing context at booking/payment time.

## Booking and scheduling safety rules

1. UTC is canonical persisted time.
2. Always render with explicit timezone context by role.
3. Enforce slot hold before checkout completion.
4. Reject illegal state transitions.
5. Keep recurring schedule logic separate from billing logic.

## Trust and moderation safety rules

1. First publication requires review.
2. Sensitive category claims must be compliance-safe.
3. Review model is one-per-user-professional relationship.
4. Case queue is mandatory for disputes and operational exceptions.
5. All sensitive admin actions require audit log events.

## Notification and analytics rules

1. Notifications must be event-driven.
2. In-app inbox is separate from chat.
3. Event names and properties must be centralized and consistent.
4. Track required MVP funnel, booking, revenue, and trust events.

## Delivery standard for each implementation task

1. Update code.
2. Update tests.
3. Update docs in:
- project status
- relevant journey docs
- handover current-state and next-steps
4. Document what remains provisional or blocked.

## Definition of done for AI delivery

A task is only done when:
1. Product behavior matches source-of-truth rule.
2. State transitions and permissions are safe.
3. Tests cover critical outcomes and edge paths.
4. Operational ownership is clear.
5. Documentation reflects the new reality.
