# Next Steps

Last updated: 2026-03-29

Execute in this order.

## Priority 1 - Monitoring activation (no product logic changes)

1. Configure Checkly checks using `docs/integrations/checkly.md`.
2. Validate alert channels (email/Slack) with a controlled failure test.
3. Record completion in `current-state.md` and `session-log.md`.

Dependencies:
- `BASE_URL` and `CRON_SECRET` available in Checkly.

## Priority 2 - Observability activation (operational)

1. Set Sentry env vars in Vercel and validate controlled frontend/server errors.
2. Set PostHog env vars in Vercel and validate event ingestion in Live Events.
3. Create baseline dashboards/alerts and assign ownership.
4. Record completion in `project-status.md` and integration docs.

Dependencies:
- provider keys and production deploy.

## Priority 3 - Quality expansion (safe)

1. Run `npm run test:e2e` with configured `E2E_*` envs against production/staging.
2. Add one smoke test for professional manual confirmation flow.
3. Add one smoke test for cancellation/refund policy UX gating.
4. Keep tests non-destructive and environment-gated.

Dependencies:
- dedicated E2E credentials and stable professional fixture.

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
