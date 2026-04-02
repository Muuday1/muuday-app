# Current Operator Checklist

Last updated: 2026-04-01

Use this as the live checklist of actions that require human access to provider dashboards.

## Do now

1. In Inngest Cloud, confirm the app sync is attached to the current endpoint `https://muuday-app.vercel.app/api/inngest` and clear stale unattached sync records.
2. Run one manual cloud invocation of `sync-booking-reminders` and confirm success.
3. Apply migration `db/sql/migrations/015-wave2-onboarding-gate-matrix-foundation.sql` in production Supabase.
4. Validate professional onboarding checklist route `/onboarding-profissional` with a professional account after migration 015:
- gate cards render
- C10 matrix renders
- C6/C7 readiness toggles save correctly in `professional_settings`.
5. Fix local admin-key slot for ops scripts:
- set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` to the real service-role key (current value is publishable key).
- this is required for deterministic admin scripts (seed users, forced email-confirm test accounts, auth admin checks).
6. Start periodic secrets rotation baseline and register first cycle:
- follow `docs/engineering/runbooks/secrets-rotation-runbook.md`;
- rotate and validate at minimum:
  - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
  - `CRON_SECRET`
  - `RESEND_API_KEY`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- update rotation register with `date`, `owner`, and `next due`.
7. Apply migration `db/sql/migrations/022-admin-audit-log-foundation.sql` in production Supabase.
8. Validate admin audit trail after migration 022:
- execute each admin action once (`status`, `first booking gate`, `review visibility`, `review delete`);
- confirm corresponding rows in `admin_audit_log`;
- confirm direct API with non-admin cannot read/insert in `admin_audit_log`.
9. Configure alert rules in Sentry (manual dashboard), based on:
- `docs/engineering/runbooks/error-budget-and-alerting.md`
- required rules: error-rate spike, payment failure events, auth failure events.
10. Configure PostHog alerts (manual dashboard), based on:
- signup drop-off (`auth_signup_started -> auth_signup_succeeded`)
- booking conversion drop (`booking_submit_clicked -> booking_created`)
11. Run one controlled validation cycle:
- trigger one auth failure and one payment failure in preview;
- confirm Sentry event + email alert;
- confirm Checkly checks remain green after deployment.

## Completed in this cycle

1. Migration `011-favorites-rls-safety-net.sql` applied in production.
2. Migration `012-auth-signup-trigger-hardening.sql` applied in production.
3. Migration `013-wave2-dual-gate-first-booking.sql` applied in production.
4. Migration `014-wave2-request-bookings-foundation.sql` applied in production.
5. Auth smoke validation completed successfully (`auth:validate-smoke` + inbox check).
6. Vercel budget baseline configured (operator target GBP/USD 5 pre-launch guard).
7. Sentry on-call alert destination confirmed.
8. Inngest endpoint health verified in production (`/api/inngest` cloud mode + keys + function count).

## Do before Wave 2 close

1. Confirm final Checkly operational checks are green after latest deploy.
2. Confirm first-booking gate behavior with a professional that has:
- gate blocked state (at least one blocker)
- gate open state (all blockers resolved).
3. Record completion updates in:
- `docs/project/project-status.md`
- `docs/handover/current-state.md`
- `docs/handover/session-log.md`

## Do before Wave 3 start

1. Run `db/sql/analysis/024-wave3-pii-column-audit.sql` in production Supabase and attach output evidence to handover/session log.
2. Confirm final payout-sensitive data strategy:
- preferred: Stripe-only (no local bank/KYC sensitive data),
- fallback: local encrypted columns with Vault-backed key path and audited read access.
3. Confirm `pgcrypto` and `vault` extension availability in production, or register a gap ticket before enabling payout/KYC storage.
