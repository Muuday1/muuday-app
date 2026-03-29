# Setup and Environments

Last updated: 2026-03-29

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

4. Run app

```bash
npm run dev
```

## Environment model

1. Local development
- `APP_BASE_URL=http://localhost:3000`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

2. Production (current)
- Active stable domain: `https://muuday-app.vercel.app`
- Future primary domain: `https://muuday.com`

3. Domain cutover strategy
- Update env values only:
  - `APP_BASE_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `APP_PRIMARY_DOMAIN`
  - `WAITLIST_CORS_ORIGINS` (transition support)

## Secrets handling rules

1. Never commit `.env.local`.
2. Keep SaaS tokens in provider-managed secret stores.
3. Rotate credentials if accidental exposure is detected.

## Related docs

- [Deployment and Operations](./deployment-and-operations.md)
- [Vercel and GitHub Actions](../integrations/vercel-github-actions.md)
