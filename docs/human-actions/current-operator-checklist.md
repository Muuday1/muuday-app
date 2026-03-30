# Current Operator Checklist

Last updated: 2026-03-30

Use this as the live checklist of actions that require human access to provider dashboards.

## Do now

1. Run SQL migration `011-favorites-rls-safety-net.sql` in Supabase SQL Editor.
2. Run SQL migration `012-auth-signup-trigger-hardening.sql` in Supabase SQL Editor.
3. Validate Supabase Auth emails in production:
- run `npm run auth:validate-smoke -- --email=igorpinto.lds@gmail.com`
- signup confirmation email
- reset password email
4. Add Inngest keys in Vercel production env:
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
5. Confirm Sentry alert rule is sending emails to `igorpinto.lds@gmail.com`.

## Do before Wave 2 close

1. Confirm Vercel spending limits/budget alerts in dashboard.
2. Confirm final Checkly operational checks are green after latest deploy.
3. Record completion updates in:
- `docs/project/project-status.md`
- `docs/handover/current-state.md`
- `docs/handover/session-log.md`
