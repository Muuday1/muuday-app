# Database and Migrations

Last updated: 2026-03-30

## Source of truth

Ordered SQL migrations under `db/sql/migrations` are the authoritative DB evolution source.

## Important note

Ordered migrations remain canonical runtime truth.
`db/sql/schema/supabase-schema.sql` was updated to reflect migrations through `014`, and should stay synchronized whenever a migration is added.

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

3. `008-wave1-taxonomy-tiers.sql`
- Base taxonomy tables bootstrap for clean environments (`categories`, `subcategories`)
- Specialties, professional-specialties, tier model, tag suggestion moderation

4. `010-review-constraints.sql`
- Unique review rule by user/professional
- Professional response and review edit lifecycle fields

5. `011-favorites-rls-safety-net.sql`
- Safe canonical recreation of favorites RLS policies
- Legacy stale policy cleanup guard

6. `012-auth-signup-trigger-hardening.sql`
- Hardens `handle_new_user` trigger with canonical role normalization
- Adds idempotent profile upsert behavior at auth signup boundary
- Reapplies canonical `profiles.role` check constraint

7. `013-wave2-dual-gate-first-booking.sql`
- Adds explicit first-booking gate fields on professionals
- Preserves approved legacy professionals with bootstrap enablement
- Enables Wave 2 split between go-live visibility and first-booking acceptance

8. `014-wave2-request-bookings-foundation.sql`
- Adds `request_bookings` with explicit request/proposal lifecycle statuses
- Adds request-booking indexes for professional/user queue and offer expiration
- Adds RLS policies for user/professional/admin visibility and updates

## Migration safety rules

1. Prefer additive and reversible migration steps.
2. Review RLS impact before applying to production.
3. Validate app behavior after each migration set with smoke tests.
4. Keep migration docs and project status in sync.

## Connection pooling policy (Supabase Pro)

1. For any runtime path that uses direct SQL clients (server actions/jobs/workers), use pooled connection string:
- `SUPABASE_DB_POOLER_URL` (or `DATABASE_URL`) with port `6543` (Supavisor transaction mode).
2. Keep direct Postgres connection string only for migrations/maintenance tooling:
- `SUPABASE_DB_DIRECT_URL` (or `DATABASE_DIRECT_URL`) with direct DB endpoint (typically `5432`).
3. Validate configuration before deploy:

```bash
npm run db:validate-pooling
```

## Runtime entities (high level)

- `profiles`
- `professionals`
- `categories`, `subcategories`, `specialties`, `professional_specialties`, `tag_suggestions`
- `availability`, `availability_rules`, `availability_exceptions`
- `bookings`, `booking_sessions`, `slot_locks`
- `request_bookings`
- `payments`
- `notifications`
- `professional_settings`
- `calendar_integrations`

## Related docs

- [Architecture Overview](../architecture/overview.md)
- [Project Status](../project/project-status.md)
