# Current Operator Checklist

Last updated: 2026-04-24

Use this as the live checklist of actions that require human access to provider dashboards.

## Do now

1. Configure alert rules in Sentry (manual dashboard), based on:
   - `docs/engineering/runbooks/error-budget-and-alerting.md`
   - required rules: error-rate spike, payment failure events, auth failure events.
2. Configure PostHog alerts (manual dashboard), based on:
   - signup drop-off (`auth_signup_started -> auth_signup_succeeded`)
   - booking conversion drop (`booking_submit_clicked -> booking_created`)
3. Run one controlled validation cycle:
   - trigger one auth failure and one payment failure in preview;
   - confirm Sentry event + email alert;
   - confirm Checkly checks remain green after deployment.
4. Run deterministic Inngest resync after each deploy:
   - `curl -X PUT https://muuday-app.vercel.app/api/inngest --fail-with-body`
   - if historical unattached syncs remain visible in dashboard, treat as stale history when latest resync succeeds.

## Completed in previous cycles

1. Migration `011-favorites-rls-safety-net.sql` applied in production.
2. Migration `012-auth-signup-trigger-hardening.sql` applied in production.
3. Migration `013-wave2-dual-gate-first-booking.sql` applied in production.
4. Migration `014-wave2-request-bookings-foundation.sql` applied in production.
5. Migration `015-wave2-onboarding-gate-matrix-foundation.sql` applied in production.
6. Migration `022-admin-audit-log-foundation.sql` applied in production.
7. Migration `062-availability-rules-backfill.sql` applied in production.
8. Auth smoke validation completed successfully (`auth:validate-smoke` + inbox check).
9. Vercel budget baseline configured (operator target GBP/USD 5 pre-launch guard).
10. Sentry on-call alert destination confirmed.
11. Inngest endpoint health verified in production (`/api/inngest` cloud mode + keys + function count).
12. Supabase Pro plan active with advisor hardening (migration `040`).

## Do before Wave 3 start

1. Run `db/sql/analysis/024-wave3-pii-column-audit.sql` in production Supabase and attach output evidence to handover/session log.
2. Confirm final payout-sensitive data strategy:
   - preferred: Stripe-only (no local bank/KYC sensitive data),
   - fallback: local encrypted columns with Vault-backed key path and audited read access.
3. Confirm `pgcrypto` and `vault` extension availability in production, or register a gap ticket before enabling payout/KYC storage.
4. Complete secrets rotation baseline (see `docs/engineering/runbooks/secrets-rotation-runbook.md`):
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
   - `CRON_SECRET`
   - `RESEND_API_KEY`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (add only when Stripe webhook is enabled in production)
