# Troubleshooting Guide

Last updated: 2026-04-29

## Build failures

### `Type error: Cannot find module '@/types/supabase'`
- Run `npm run db:gen-types` to regenerate `types/supabase-generated.ts`.
- Ensure `DATABASE_URL` is set in `.env.local`.

### `npm run build` fails with memory error
- Vercel Functions default to 1024MB. Increase via `maxDuration` or reduce SSR page count.
- Check for circular imports in `lib/`.

### `npm run typecheck` fails after adding a table
- Regenerate Supabase types: `npm run db:gen-types`
- Add the new table to RLS policy tests if it has row-level security.

## Runtime errors

### `Invalid or missing environment variables`
- Check `lib/config/env.ts` for the required variable.
- Ensure it is set in `.env.local` (local) or Vercel dashboard (production).
- Empty strings are treated as undefined — make sure the value is not `""`.

### Rate limit errors (`429`)
- Redis primary: check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Fallback memory store: resets on every deployment. Use only for local dev.

### Supabase auth session lost after refresh
- Check cookie settings in `lib/supabase/server.ts`: `secure`, `sameSite: 'lax'`, `httpOnly`.
- In local dev over HTTP, `secure: false` is required.

### Booking not appearing in calendar
- Verify `professional_settings` row exists for the professional.
- Check `availability` table has slots for the target date.
- Recompute visibility: `recomputeProfessionalVisibility(supabase, professionalId)`.

## E2E test failures

### `Error: E2E credential secrets are missing`
- Set `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD` in GitHub secrets.
- These are only validated on `main` push, not on PRs.

### Playwright fixture auto-heal failed
- Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets.
- The auto-heal script (`npm run fixtures:ensure-public-ready`) requires service-role access.

## Database

### `db:validate-pooling` fails
- Ensure `SUPABASE_DB_POOLER_URL` uses port `6543` (Supavisor transaction mode).
- Direct connection (port `5432`) must not be used in serverless runtime.

### Missing foreign key or enum value
- Check `db/sql/` for the latest migrations.
- Run `npx supabase migration up` if working with the local CLI.

## Common commands

```bash
# Regenerate Supabase types
npm run db:gen-types

# Validate DB pooling config
npm run db:validate-pooling

# Run unit tests
npm run test:unit

# Run E2E tests locally
npm run test:e2e

# Lint and typecheck
npm run lint && npm run typecheck
```
