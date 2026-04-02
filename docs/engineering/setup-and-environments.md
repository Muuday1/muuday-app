# Setup and Environments

Last updated: 2026-04-01

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create local env file from template

```bash
cp .env.local.example .env.local
```

3. Fill required environment variables (minimum)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- `APP_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_PRIMARY_DOMAIN`
- `CRON_SECRET`

Optional but recommended:

- `WAITLIST_CORS_ORIGINS`
- `RESEND_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `SUPABASE_AUTH_TEST_EMAIL` (for auth smoke validation)
- `SUPABASE_DB_POOLER_URL` (or `DATABASE_URL`) for direct SQL clients in runtime (must be `:6543` in production)
- `SUPABASE_DB_DIRECT_URL` (or `DATABASE_DIRECT_URL`) for migrations/maintenance only

4. Run app

```bash
npm run dev
```

5. Optional: run Supabase Auth smoke validation (signup + reset trigger)

```bash
npm run auth:validate-smoke -- --email=your-email@example.com
```

Notes:
- Add `--dry-run` to validate config without calling Supabase.
- Add `--cleanup` to auto-delete the created smoke user (requires service role key).

6. Optional: run Inngest locally (non-critical workflows)

```bash
npm run inngest:dev
```

## Environment model

1. Local development
- `APP_BASE_URL=http://localhost:3000`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

2. Production (current)
- Active stable domain: `https://muuday-app.vercel.app`
- Future primary domain: `https://muuday.com`

### Production DB connection policy (Supabase Pro / Supavisor)

1. Runtime/serverless direct SQL clients must use pooled connection string (Supavisor transaction mode):
- `SUPABASE_DB_POOLER_URL` (or `DATABASE_URL`) on port `6543`.
2. Direct database connection string must be reserved for migrations/maintenance only:
- `SUPABASE_DB_DIRECT_URL` (or `DATABASE_DIRECT_URL`) typically on port `5432`.
3. Before each production release, validate env with:

```bash
npm run db:validate-pooling
```

3. Domain cutover strategy
- Update env values only:
  - `APP_BASE_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `APP_PRIMARY_DOMAIN`
  - `WAITLIST_CORS_ORIGINS` (transition support)

## Secrets handling rules

1. Never commit `.env.local`.
2. Keep SaaS tokens in provider-managed secret stores.
3. Follow periodic rotation policy (not only incident-driven rotation):
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`: every 90 days
- `CRON_SECRET`: every 60 days
- `RESEND_API_KEY`: every 90 days
- `UPSTASH_REDIS_REST_TOKEN`: every 90 days
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`: every 90 days
4. Rotate credentials immediately on suspected exposure, owner offboarding, or unauthorized usage signal.
5. Record every completed rotation in runbook register.

## Related docs

- [Deployment and Operations](./deployment-and-operations.md)
- [Secrets Rotation Runbook](./runbooks/secrets-rotation-runbook.md)
- [Vercel and GitHub Actions](../integrations/vercel-github-actions.md)
