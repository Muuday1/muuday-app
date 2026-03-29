# User Journey: Admin Operations

Last updated: 2026-03-29

## Goal

Give admins operational control over professionals, reviews, and booking visibility.

## Actors

1. Admin
2. Support/ops owner

## Entry points

- `/admin`

## Happy path

1. Admin opens overview metrics.
2. Admin reviews professional pipeline and changes status.
3. Admin moderates reviews (publish/hide/delete).
4. Admin inspects recent booking records and statuses.

## Edge cases

1. Non-admin access is denied in UI.
2. Admin actions should remain auditable and reversible where possible.

## Current implementation status

- `Done` for operational UI and core moderation actions.
- `In progress` for deeper audit-trail controls and policy hardening.

## Gaps

1. Full server-side admin guardrails and explicit action audit logs can be improved.
2. SLA automation for pending items is not yet integrated.

## Next steps

1. Add audit log model for admin actions.
2. Add SLA alerts for pending professional and moderation queues.

## Related docs

- [Project Status](../../project/project-status.md)
- [Incident Runbook](../../engineering/runbooks/incident-runbook.md)
