# Integration: Make and HubSpot

Last updated: 2026-03-29

## Purpose

Support marketplace operations and growth workflows outside the core runtime, using event-driven automation and CRM lifecycle management.

## Current status

- `Planned`
- Blueprint and canonical event contract are documented.
- Live scenario activation and credential setup are pending.

## Scope boundaries

1. Core booking logic stays inside app/server/db.
2. Make orchestrates asynchronous workflows.
3. HubSpot is CRM projection, not source of truth for product invariants.

## Canonical event contract

Machine-readable event contract:

- [make-hubspot-event-contracts.json](./make-hubspot-event-contracts.json)

## Core blueprint

1. Waitlist intake -> upsert HubSpot contact.
2. Professional pending review -> onboarding pipeline task.
3. Booking confirmed -> reminders and lifecycle updates.
4. Booking completed -> review and rebooking nudges.
5. No-show -> support recovery process.

## Data mapping highlights

Contact-level fields should include:

- `muuday_role`
- `lifecycle_stage_muuday`
- `country`
- `timezone`
- `first_booking_at`
- `last_booking_status`
- `total_completed_sessions`
- `source_channel`

## Risks

1. Duplicate contact creation without strict idempotency.
2. Automation failures without dead-letter and alert path.
3. Drift between CRM stage and actual product status if mapping is weak.

## Next steps

1. Configure HubSpot custom properties and lifecycle pipelines.
2. Implement Make scenarios with retries and dead-letter handling.
3. Add operational dashboard for automation success/failure SLAs.
