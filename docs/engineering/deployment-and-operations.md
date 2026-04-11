# Deployment and Operations

Last updated: 2026-04-11

## Deployment platform

- Vercel production deployment for web app.
- Stable development-hidden domain currently: `https://muuday-app.vercel.app`.

## Release flow

1. Merge approved changes into `main`.
2. Let `CI` workflow complete successfully (`lint`, `typecheck`, `build`, `test:unit`, `test:e2e`).
3. Deploy to Vercel production.
4. Ensure stable alias points to latest ready deployment.
5. Run smoke checks.

## CI/CD guardrails

1. `main` must be branch-protected with required status check: `CI`.
2. CI fails main pushes if mandatory E2E secrets are missing:
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_PROFESSIONAL_EMAIL`
- `E2E_PROFESSIONAL_PASSWORD`
- `E2E_PROFESSIONAL_ID`
- `E2E_MANUAL_PROFESSIONAL_ID`
- `E2E_BLOCKED_PROFESSIONAL_ID`
3. CI also fails main pushes if DB pooling runtime secret is missing or invalid:
- `SUPABASE_DB_POOLER_URL` must point to Supavisor transaction port `6543`.
- workflow runs `npm run db:validate-pooling` in production mode (`REQUIRE_DB_POOLER=true`, `VERCEL_ENV=production`).
3. Playwright report is uploaded as artifact in CI for failed E2E troubleshooting.

## Scheduled operations

`booking-crons.yml` runs:

1. Booking reminders endpoint every 5 minutes.
2. Booking timeout endpoint every 15 minutes.

Required config:

- GitHub secret: `CRON_SECRET` (mandatory in all environments — endpoints reject requests when unset)
- GitHub variable: `CRON_BASE_URL`
- Tokens accepted via `Authorization: Bearer` or `x-cron-secret` headers only (query string not accepted)

## Database connection pooling (Supabase Pro / Supavisor)

1. Production runtime must use Supavisor pooled mode (`6543`) for any direct SQL client usage:
- `SUPABASE_DB_POOLER_URL` (or `DATABASE_URL`).
2. Direct DB URL is allowed only for migrations/maintenance tooling:
- `SUPABASE_DB_DIRECT_URL` (or `DATABASE_DIRECT_URL`).
3. Mandatory pre-release validation:

```bash
npm run db:validate-pooling
```

## API CORS policy

1. All route handlers under `app/api/*` must apply explicit CORS evaluation + preflight (`OPTIONS`).
2. Shared implementation is centralized in `lib/http/cors.ts`.
3. Environment-driven origins:
- `API_CORS_ORIGINS`: extra browser origins allowed for API routes.
- `WAITLIST_CORS_ORIGINS`: extra origins for `/api/waitlist`.
- `WEBHOOK_CORS_ORIGINS`: optional allowlist for future webhook browser origins (default posture is server-to-server only).
4. Current protected routes with explicit CORS handling:
- `/api/auth/password-reset`
- `/api/auth/attempt-guard`
- `/api/waitlist`
- `/api/inngest`
- `/api/cron/booking-reminders`
- `/api/cron/booking-timeouts`
- `/api/webhooks/stripe`
- `/api/webhooks/stripe-br`
- `/api/webhooks/supabase-db`

## Supabase Database Webhooks -> Inngest bridge

Use Supabase DB Webhooks to reduce polling delay and enqueue business workflows as events.

Route:
- `POST /api/webhooks/supabase-db`

Required secret:
- `SUPABASE_DB_WEBHOOK_SECRET`
- Send as one of:
  - `Authorization: Bearer <secret>`
  - `x-webhook-secret: <secret>`
  - `x-supabase-webhook-secret: <secret>`

Current event mapping:
1. Every DB webhook payload enqueues `supabase/db.change.received`.
2. `payments` table `INSERT`/`UPDATE` also enqueues `supabase/payments.changed`.
3. Inngest function `process-supabase-payments-change` processes `supabase/payments.changed` and:
- updates booking status when payment becomes `captured` or `failed`,
- writes idempotent notifications for user/professional.

Supabase Dashboard configuration (recommended):
1. Table: `public.payments`
2. Events: `INSERT`, `UPDATE`
3. Method: `POST`
4. URL: `https://<your-domain>/api/webhooks/supabase-db`
5. Headers: `x-supabase-webhook-secret: <SUPABASE_DB_WEBHOOK_SECRET>`

## Secrets rotation operations

1. Secret rotation policy is periodic and mandatory (see runbook).
2. Rotation must cover at minimum:
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `UPSTASH_REDIS_REST_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
3. Every rotation requires:
- production-safe rollout,
- smoke validation,
- runbook register update with next due date.

## Monitoring baseline

1. Internal: GitHub Action logs for cron runs.
2. External: Checkly synthetic monitoring pipeline (`validate` -> `checkly:test` -> `checkly:deploy` on main) when secrets are configured.
3. Error telemetry: Sentry (client, server, edge).

## On-call and escalation (current scale)

1. Primary on-call owner: founder operator (`igorpinto.lds@gmail.com`).
2. Alert channels:
- Checkly email alerts (failure + recovery)
- Sentry email alerts (error and issue spikes)
3. SLA:
- Sev 1: ack <= 15 minutes, mitigate <= 2 hours
- Sev 2: ack <= 4 hours, mitigate <= 24 hours
- Sev 3: ack next business block, mitigate <= 3 business days

## Incident handling

Use runbooks in `docs/engineering/runbooks`:

- release-checklist
- incident-runbook
- rollback-runbook
- secrets-rotation-runbook
- error-budget-and-alerting

## Operational risks to watch

1. Secret mismatch between GitHub and Vercel environments.
2. Domain alias drift after deploy.
3. DB schema drift against app assumptions.

## Related docs

- [Vercel and GitHub Actions](../integrations/vercel-github-actions.md)
- [Checkly Monitoring](../integrations/checkly.md)
- [Data Governance and Lifecycle](./data-governance-and-lifecycle.md)
- [Secrets Rotation Runbook](./runbooks/secrets-rotation-runbook.md)
