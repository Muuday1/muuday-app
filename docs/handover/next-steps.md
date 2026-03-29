# Next Steps

Last updated: 2026-03-29

Execute in this order.

## Priority 1 - Monitoring activation (no product logic changes)

1. Confirm inbox delivery for controlled fail/recovery sessions already triggered in Checkly.
   - Check inbox and spam/junk for `igorpinto.lds@gmail.com`.
   - If still missing, add Checkly sender/domain allowlist and rerun controlled fail/recovery.
2. Add secondary alert channel (Slack) and subscribe it to the monitoring group.
3. Define check ownership/escalation response policy.
4. Create a dedicated bookable professional fixture and point `CHECKLY_BOOKING_PROFESSIONAL_ID` to it (to enforce full booking-screen assertions without fallback).
5. Record completion in `current-state.md` and `session-log.md`.

Dependencies:
- Checkly alert channels available.

## Priority 2 - Observability activation (operational)

1. Set Sentry env vars in Vercel and validate controlled frontend/server errors.
2. Set PostHog env vars in Vercel and validate event ingestion in Live Events.
3. Create baseline dashboards/alerts and assign ownership.
4. Record completion in `project-status.md` and integration docs.

Dependencies:
- provider keys and production deploy.

## Priority 3 - Quality expansion (safe)

1. Resolve production schema drift for booking foundation:
   - apply migration `005-production-booking-foundation.sql` (or equivalent) so `professional_settings` and `availability_rules` are available through API.
2. Configure one professional fixture with `confirmation_mode = manual` after schema is available.
3. Set/update env vars:
   - `E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_PROFESSIONAL_ID`, `E2E_MANUAL_PROFESSIONAL_ID`
4. Re-run `npm run test:e2e` and require `3 passed, 3 total` (no skips) before promoting to release gate.
5. Keep tests non-destructive and environment-gated.

Dependencies:
- dedicated E2E credentials, regular fixture (done), and manual-confirmation fixture (blocked by schema drift).

## Priority 4 - Payment lifecycle hardening (deferred by product decision)

1. Design Stripe webhook-backed payment state updates.
2. Replace legacy payment capture placeholder in booking flow.
3. Add idempotency safeguards and refund reconciliation.
4. Add integration doc for Stripe before implementation.

Dependencies:
- Stripe credentials and explicit go-ahead.

## Recently completed

1. Professional booking settings UI delivered (`/configuracoes-agendamento`).
2. Profile and availability pages now include direct links to advanced booking settings.
3. Sentry/PostHog baseline instrumentation added in code.
4. Canonical schema snapshot updated through migration `006`.
5. Professional agenda now surfaces pending confirmation SLA visibility.
6. Playwright critical booking e2e baseline added.

## Do NOT do yet

1. Do not start Stripe implementation until explicit product go-ahead.
2. Do not change production domain to `muuday.com` until monitoring and env parity are confirmed.
3. Do not parallelize edits across multiple agents on the same files.
4. Do not introduce new integrations without updating docs first-class status.

## Caution areas

1. Booking/payment code paths (`lib/actions/booking.ts`, `lib/actions/manage-booking.ts`).
2. Cron auth (`CRON_SECRET`) and base URL variables.
3. RLS-sensitive migrations.
