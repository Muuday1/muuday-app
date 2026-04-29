# Database and Migrations

Last updated: 2026-04-27

## Source of truth

Ordered SQL migrations under `db/sql/migrations` are the authoritative DB evolution source.

## Important note

Ordered migrations remain canonical runtime truth.
`db/sql/schema/supabase-schema.sql` was updated to reflect migrations through `069`, and should stay synchronized whenever a migration is added.

## Key migration milestones

### Wave 1 foundations
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

### Wave 2 hardening
7. `013-wave2-dual-gate-first-booking.sql`
   - Adds explicit first-booking gate fields on professionals
   - Preserves approved legacy professionals with bootstrap enablement
   - Enables Wave 2 split between go-live visibility and first-booking acceptance

8. `014-wave2-request-bookings-foundation.sql`
   - Adds `request_bookings` with explicit request/proposal lifecycle statuses
   - Adds request-booking indexes for professional/user queue and offer expiration
   - Adds RLS policies for user/professional/admin visibility and updates

9. `015-wave2-onboarding-gate-matrix-foundation.sql`
   - Onboarding gate matrix and C1-C9 tracker foundation

10. `020-composite-indexes-performance.sql`
    - Composite indexes for booking and search query paths

11. `040-advisor-low-risk-hardening.sql`
    - FK indexes, duplicate index removal, RLS policy hardening, function `search_path` fixes

### Wave 3 prep (payments foundation)
12. `023-wave3-stripe-job-resilience-foundation.sql`
    - `stripe_webhook_events` (idempotent webhook inbox)
    - `stripe_payment_retry_queue`, `stripe_subscription_check_queue`, `stripe_job_runs`

13. `024-wave3-payments-hardening.sql`
    - Payment table hardening and compatibility fixes

14. `052-booking-transactions.sql`
    - Booking transaction atomicity foundation

### Wave 4 backend (parallel delivery)
15. `053-wave3-auto-recalc-professional-rating.sql`
    - Trigger-based auto-recalc of `professionals.rating` and `total_reviews`

16. `054-wave4-chat-messaging-foundation.sql`
    - `conversations`, `conversation_participants`, `messages` tables
    - Auto-create conversation trigger on booking confirmation

17. `055-wave4-push-notifications-foundation.sql`
    - `push_subscriptions` table with RLS

18. `056-wave4-client-records-foundation.sql`
    - `client_records` and `session_notes` tables (CRM / prontuário)

19. `057-wave4-dispute-system-foundation.sql`
    - `cases`, `case_messages`, `case_actions` tables with enums

20. `058-wave4-multi-service-booking.sql`
    - `professional_services` table, `bookings.service_id` FK

### Wave 2 stabilization (post-parallel)
21. `061-availability-exceptions-time-range.sql`
    - Time-range support for availability exceptions (not just full-day block)

22. `062-availability-rules-backfill.sql`
    - Backfills `availability_rules` for professionals who saved before dual-write fix

23. `063-video-session-waiting-room.sql`
    - `professional_ready_at` timestamp for waiting room game

24. `064-session-lifecycle-tracking.sql`
    - Session join/leave/presence tracking

25. `065-search-sessions.sql`
    - Search session analytics tracking

26. `066-market-isolation-part1.sql` / `067-market-isolation-part2.sql`
    - Market isolation for multi-region rollout

27. `068-kyc-ocr-fields.sql`
    - KYC OCR verification fields

28. `069-unified-push-native-tokens.sql`
    - Unified push notification token storage (native + web)

### Wave 3 payments engine (ledger + payouts)
29. `070-payments-ledger-schema.sql`
    - Double-entry ledger, payout batch system, Trolley recipients, Revolut treasury, dispute resolution tables

30. `071-payments-bigint-migration.sql`
    - Adds `_minor` suffixed BIGINT columns alongside DECIMAL for atomic currency handling

31. `072-payments-ledger-accounts-bootstrap.sql`
    - Initial chart of accounts for the double-entry ledger

32. `073-payments-booking-functions-minor.sql`
    - Updates booking transaction RPC functions to populate `_minor` columns

33. `074-payments-stripe-settlements.sql`
    - Tracks Stripe payouts (settlements) landing in Revolut for treasury reconciliation

34. `075-payments-phase4-payout-enhancement.sql`
    - Debt tracking and Trolley fee absorption fields on payout_batch_items

35. `076-payments-force-completed-status.sql`
    - Adds `force_completed` status to payout_batches + item_count column

36. `077-payments-atomic-balance-rpc.sql`
    - Atomic professional balance update RPC (eliminates read-modify-write races)

37. `078-payments-atomic-ledger-rpc.sql`
    - Atomic ledger transaction RPC (single-function multi-entry insert)

38. `079-payments-atomic-balance-last-payout-at.sql`
    - Atomically updates `last_payout_at` inside the balance RPC

39. `080-professional-payout-periodicity.sql`
    - Adds `payout_periodicity` to professional_settings (weekly/biweekly/monthly)

### Wave 3 (applied 2026-04-28)
40. `081-professional-subscriptions.sql`
    - Stripe subscription lifecycle for professional monthly billing
    - **Status:** Applied to production 2026-04-28. Verified with Stripe webhook handler tests and admin/professional subscription action tests.

41. `082-case-management-enhancement.sql`
    - Cases table: priority, assignment, SLA, evidence
    - **Status:** Applied to production 2026-04-28.

42. `083-review-moderation.sql`
    - Reviews table: `moderation_status`, `rejection_reason`, `flag_reasons`
    - **Status:** Applied to production 2026-04-28.

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
- `plan_configs`
- `calendar_integrations`
- `conversations`, `conversation_participants`, `messages`
- `push_subscriptions`
- `client_records`, `session_notes`
- `cases`, `case_messages`, `case_actions`
- `professional_services`
- `stripe_webhook_events`, `stripe_payment_retry_queue`, `stripe_subscription_check_queue`, `stripe_job_runs`, `stripe_settlements`
- `search_sessions`
- `kyc_verifications`
- `admin_audit_log`
- `ledger_accounts`, `ledger_entries`
- `payout_batches`, `payout_batch_items`, `booking_payout_items`
- `professional_balances`
- `professional_subscriptions`
- `trolley_recipients`
- `revolut_treasury_snapshots`
- `dispute_resolutions`

## Active DB cron jobs

1. `cleanup-expired-slot-locks` (`*/5 * * * *`)
2. `clear-expired-slot-locks-fast` (`* * * * *`)
3. `cancel-stale-pending-bookings` (`*/10 * * * *`)
4. `http-public-visibility-sync` (`*/15 * * * *`)

## Related docs

- [Architecture Overview](../architecture/overview.md)
- [Project Status](../project/project-status.md)
- [Pro Plan Utilization Audit](../handover/pro-plan-utilization-audit-2026-04-14.md)
