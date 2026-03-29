# Next Steps

Last updated: 2026-03-29

Execute in this order.

## Priority 1 - Monitoring activation

1. Configure Checkly checks using `docs/integrations/checkly.md`.
2. Validate alert channels (email/Slack) with a controlled failure test.
3. Record completion in `current-state.md` and `session-log.md`.

Dependencies:
- `BASE_URL` and `CRON_SECRET` available in Checkly.

## Priority 2 - Payment lifecycle hardening

1. Design and implement Stripe webhook-backed payment state updates.
2. Replace legacy payment capture placeholder in booking flow.
3. Add idempotency safeguards and refund reconciliation.
4. Update docs in `integrations/stripe` (create file if needed) and `project-status`.

Dependencies:
- Stripe credentials and webhook configuration.

## Priority 3 - Observability baseline

1. Add Sentry to server/client paths for production error tracking.
2. Add PostHog event taxonomy for core funnel events.
3. Document ownership, dashboards, and alert paths.

Dependencies:
- provider setup and keys.

## Priority 4 - Schema source alignment

1. Reconcile `db/sql/schema/supabase-schema.sql` with applied migration model.
2. Mark migration/source-of-truth policy explicitly after reconciliation.

## Do NOT do yet

1. Do not change production domain to `muuday.com` until monitoring and env parity are confirmed.
2. Do not parallelize edits across multiple agents on the same files.
3. Do not introduce new integrations without updating docs first-class status.

## Caution areas

1. Booking/payment code paths (`lib/actions/booking.ts`, `lib/actions/manage-booking.ts`).
2. Cron auth (`CRON_SECRET`) and base URL variables.
3. RLS-sensitive migrations.
