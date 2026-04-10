# User Journey: Session Management

Last updated: 2026-03-29

## Goal

Enable user and professional to manage post-booking lifecycle safely: confirmation, reminders, reschedule/cancel, completion, no-show, and dispute initiation.

## Actors

1. User
2. Professional
3. Admin operations
4. Reminder and timeout automation

## Canonical lifecycle scope

1. Pending/confirmed states and manual-accept deadlines.
2. Reschedule and cancellation paths with reason capture.
3. No-show and lateness policy effects.
4. Session timeline events and evidence.
5. Dispute window and escalation handoff to admin case operations.

## Key rules from canonical spec

1. Internal state machine is richer than user-facing labels.
2. Timeline/audit visibility is required.
3. Reminder cadence is multi-touch and timezone-safe.
4. Platform technical failure handling differs from user/professional fault handling.

## Current implementation status

`In progress`

- Core agenda and state transitions exist.
- Reminder/timeout cron baseline exists.
- Full admin-case and finance-case linkage is incomplete.

## Gaps

1. Full structured dispute case lifecycle integration.
2. Full provider-backed refund/payout interaction for all terminal states.
3. Full session provider abstraction parity (Agora active, adapter hardening still pending).

## Next steps

1. Attach booking timeline and dispute actions to structured case queue.
2. Align no-show and dispute outcomes with payment/payout state updates.
3. Implement provider-agnostic session event model.

## Related docs

- [Admin Operations Journey](./admin-operations.md)
- [Session Execution Journey](./video-session-execution.md)
- [Open Validations](../../spec/consolidated/open-validations.md)
