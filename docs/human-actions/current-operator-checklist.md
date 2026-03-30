# Current Operator Checklist

Last updated: 2026-03-30

Use this as the live checklist of actions that require human access to provider dashboards.

## Do now

1. Run SQL migration `013-wave2-dual-gate-first-booking.sql` in Supabase SQL Editor.
2. Add Inngest keys in Vercel production env:
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
3. In Inngest Cloud, sync app endpoint to `https://muuday-app.vercel.app/api/inngest`.

## Completed in this cycle

1. Migration `011-favorites-rls-safety-net.sql` applied in production.
2. Migration `012-auth-signup-trigger-hardening.sql` applied in production.
3. Auth smoke validation completed successfully (`auth:validate-smoke` + inbox check).
4. Vercel budget baseline configured (operator target £/$5 pre-launch guard).
5. Sentry on-call alert destination confirmed.

## Do before Wave 2 close

1. Confirm final Checkly operational checks are green after latest deploy.
2. Record completion updates in:
- `docs/project/project-status.md`
- `docs/handover/current-state.md`
- `docs/handover/session-log.md`
