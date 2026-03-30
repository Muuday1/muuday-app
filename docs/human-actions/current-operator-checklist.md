# Current Operator Checklist

Last updated: 2026-03-30

Use this as the live checklist of actions that require human access to provider dashboards.

## Do now

1. Verify Vercel spending limits/budget alerts in dashboard.
2. Confirm Sentry alert rule is sending emails to `igorpinto.lds@gmail.com`.
3. Add Inngest keys in Vercel production env (can be deferred while cron fallback stays active):
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

## Completed in this cycle

1. Migration `011-favorites-rls-safety-net.sql` applied in production.
2. Migration `012-auth-signup-trigger-hardening.sql` applied in production.
3. Auth smoke validation completed successfully (`auth:validate-smoke` + inbox check).

## Do before Wave 2 close

1. Confirm final Checkly operational checks are green after latest deploy.
2. Record completion updates in:
- `docs/project/project-status.md`
- `docs/handover/current-state.md`
- `docs/handover/session-log.md`
