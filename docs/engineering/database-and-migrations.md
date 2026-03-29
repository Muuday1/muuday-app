# Database and Migrations

Last updated: 2026-03-29

## Source of truth

Ordered SQL migrations under `db/sql/migrations` are the authoritative DB evolution source.

## Important note

`db/sql/schema/supabase-schema.sql` is currently behind the latest migration state for booking foundations and operations tables. Do not treat it as the canonical runtime model.

## Key migration milestones

1. `005-production-booking-foundation.sql`
- Extended booking states and UTC fields
- Professional booking settings
- Availability rules and exceptions
- Slot locks
- Payments foundation
- Booking sessions
- Calendar integration foundation

2. `006-booking-operations-and-reminders.sql`
- Payment refund fields and status extension
- Notifications table for reminders and ops signals

## Migration safety rules

1. Prefer additive and reversible migration steps.
2. Review RLS impact before applying to production.
3. Validate app behavior after each migration set with smoke tests.
4. Keep migration docs and project status in sync.

## Runtime entities (high level)

- `profiles`
- `professionals`
- `availability`, `availability_rules`, `availability_exceptions`
- `bookings`, `booking_sessions`, `slot_locks`
- `payments`
- `notifications`
- `professional_settings`
- `calendar_integrations`

## Related docs

- [Architecture Overview](../architecture/overview.md)
- [Project Status](../project/project-status.md)
