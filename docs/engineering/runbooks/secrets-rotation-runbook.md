# Secrets Rotation Runbook

Last updated: 2026-05-04

## Objective

Define periodic, auditable secret rotation for production-critical credentials.

## Moving from `.env.local` to Vercel (cloud source of truth)

Do **not** share `.env.local` files between team members. Vercel Environment Variables are the canonical source of truth for all environments.

### One-time migration

1. Push every secret from your local `.env.local` to Vercel:
   ```bash
   # Production
   vercel env add <KEY> production

   # Preview
   vercel env add <KEY> preview

   # Development (optional — only for shared dev defaults)
   vercel env add <KEY> development
   ```

2. Delete `.env.local` from your machine (keep a backup until you verify the next step).

3. Sync Vercel env vars back to your local workspace:
   ```bash
   vercel env pull .env.local
   ```
   This overwrites `.env.local` with the encrypted values from Vercel. Treat the file as ephemeral — never commit it.

4. Add `.env.local` to `.gitignore` (already present in most Next.js starters; verify it is there).

### Sharing with teammates

Teammates only need:
- Access to the Vercel project (invite via Vercel Dashboard)
- Run `vercel env pull .env.local` after joining

No Slack DMs, no email attachments, no shared drives.

## Automated rotation

A new GitHub Actions workflow (`secrets-auto-rotation.yml`) runs monthly and attempts to rotate overdue secrets automatically.

### What it does

1. Reads `secrets-rotation-register.json`
2. Identifies overdue secrets
3. Attempts provider-specific rotation via APIs for supported providers:
   - **Resend** — creates a new API key automatically
   - **OpenAI** — creates a new API key automatically
   - **Upstash** — rotates Redis REST token automatically
   - **Vercel** — creates a new API token automatically
   - **Stripe** — only restricted keys; Secret Keys still require manual Dashboard rotation
4. Updates the rotated secret in Vercel Env Variables automatically
5. Stamps the register with new `last_rotated_at` / `next_due_at`
6. Opens a GitHub Issue for any secrets that still need manual action

### Running locally

```bash
# Dry run (no changes)
npm run secrets:rotate:auto:dry

# Live rotation (will mutate Vercel env + register)
npm run secrets:rotate:auto

# Rotate only specific providers/secrets
npm run secrets:rotate:auto -- --only RESEND_API_KEY,UPSTASH_REDIS_REST_TOKEN
```

### Running from GitHub Actions

1. Go to **Actions → Secrets Auto-Rotation → Run workflow**
2. Choose **Dry run** first to preview what will happen
3. Uncheck dry run and re-run to apply changes

### Required secrets for automation

The workflow needs these GitHub Secrets configured:

| Secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Update Vercel env vars after rotation |
| `VERCEL_PROJECT_ID` | Target Vercel project (also set as `vars`) |
| `VERCEL_TEAM_ID` | Vercel team slug (also set as `vars`) |
| `RESEND_API_KEY` | Create new Resend keys |
| `OPENAI_API_KEY` or `OPENAI_ADMIN_KEY` | Create new OpenAI keys |
| `UPSTASH_EMAIL` + `UPSTASH_API_KEY` | Rotate Upstash Redis tokens |
| `STRIPE_SECRET_KEY` | Verify Stripe permissions (manual for secret keys) |

### Providers still requiring manual rotation

These secrets do **not** have public APIs for automated rotation and must be handled manually:

- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ACCESS_TOKEN` — rotate in Supabase Dashboard
- `STRIPE_SECRET_KEY` — rotate in Stripe Dashboard (Restricted Keys are auto-capable)
- `STRIPE_WEBHOOK_SECRET` — re-create endpoint or reveal secret in Stripe Dashboard
- `GOOGLE_CLIENT_SECRET` — rotate in Google Cloud Console
- `CLOUDFLARE_API_TOKEN` — rotate in Cloudflare Dashboard (API exists but needs Account Owner token)
- `GITHUB_TOKEN` — rotate in GitHub Developer Settings
- `NOTION_API_TOKEN` — rotate in Notion Integrations
- `AGORA_APP_CERTIFICATE` — rotate in Agora Dashboard
- `CALENDAR_TOKEN_ENCRYPTION_KEY` / `CALENDAR_OAUTH_STATE_SECRET` / `CRON_SECRET` / `SUPABASE_DB_WEBHOOK_SECRET` / `MAKE_WEBHOOK_SECRET` / `INNGEST_SIGNING_KEY` — generate new random strings locally and update Vercel

## Manual rotation workflow (for non-automated secrets)

Follow the steps below when the automated rotator cannot handle a provider, or when rotating on-demand outside the monthly schedule.

This runbook covers all entries in `secrets-rotation-register.json`, including:

1. `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
2. `SUPABASE_ACCESS_TOKEN`
3. `CRON_SECRET`
4. `SUPABASE_DB_WEBHOOK_SECRET`
5. `RESEND_API_KEY`
6. `UPSTASH_REDIS_REST_TOKEN`
7. `STRIPE_SECRET_KEY`
8. `STRIPE_WEBHOOK_SECRET`
9. `OPENAI_API_KEY` / `OPENAI_API_KEY_SERVICE`
10. `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ANALYTICS_TOKEN`
11. `GITHUB_TOKEN`
12. `GOOGLE_CLIENT_SECRET`
13. `NOTION_API_TOKEN`
14. `NETLIFY_ACCESS_TOKEN`
15. `TELEGRAM_BOT_TOKEN`
16. `AGORA_APP_CERTIFICATE`
17. `CALENDAR_TOKEN_ENCRYPTION_KEY`
18. `CALENDAR_OAUTH_STATE_SECRET`
19. `VERCEL_API_TOKEN`
20. `FIGMA_API_TOKEN`
21. `GEMINI_API_KEY`
22. `INNGEST_SIGNING_KEY`
23. `CHECKLY_API_KEY`
24. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (rotate with Stripe key rollovers)

## Rotation cadence

| Secret | Cadence | Immediate rotation triggers |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Every 90 days | suspected leak, owner offboarding, CI exposure |
| `CRON_SECRET` | Every 365 days | suspected leak, unauthorized cron hit |
| `RESEND_API_KEY` | Every 180 days | suspected leak, unexpected mail activity |
| `UPSTASH_REDIS_REST_TOKEN` | Every 365 days | suspected leak, unauthorized token use |
| `STRIPE_SECRET_KEY` | Every 180 days | suspected leak, Stripe security event |
| `STRIPE_WEBHOOK_SECRET` | Every 365 days | webhook endpoint changes, suspected replay/injection |
| `TROLLEY_API_KEY` / `TROLLEY_API_SECRET` | Every 180 days | suspected leak, Trolley security event |
| `TROLLEY_WEBHOOK_SECRET` | Every 180 days | webhook endpoint changes, suspected replay/injection |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | With Stripe key rollovers | publishable key drift with secret key rollover |

> **Canonical cadence source:** `secrets-rotation-register.json`. The JSON register is the single source of truth; this table is for quick reference only.

## Rotation workflow (production-safe)

### 1) Prepare

1. Open a maintenance ticket with:
- owner,
- target secret(s),
- planned window,
- rollback path.
2. Confirm where each secret is currently stored:
- Vercel (`Production`, `Preview`, `Development`),
- GitHub Actions secrets,
- local operator `.env.local` (if used for scripts).
3. Confirm smoke checks to run after cutover:
- auth flow,
- booking flow,
- cron endpoints,
- email delivery (for Resend),
- cache/rate-limit behavior (for Upstash).

### 2) Generate new secret in provider

1. Create new credential in provider dashboard.
2. Do not revoke old credential yet.
3. Label key with creation date and environment.

### 3) Roll out secret

1. Update `Preview` first (when applicable) and run smoke checks.
2. Update `Production` in Vercel.
3. Update GitHub secrets when workflow uses the same credential.
4. Redeploy app after env update.

Special case: `CRON_SECRET`

1. Update Vercel secret first.
2. Update GitHub Actions secret `CRON_SECRET` immediately after.
3. Trigger `booking-crons.yml` manually and verify success.

### 4) Validate and revoke old key

1. Validate all dependent paths.
2. Check error telemetry (Sentry) and synthetic checks (Checkly) for at least one cycle.
3. Revoke old key in provider.
4. Confirm old key no longer works.

## Validation checklist by secret

### Supabase service key

1. Admin-only script smoke runs (`auth:validate-smoke --dry-run`).
2. Server actions that require admin path succeed.
3. No permission errors in logs.

### CRON secret

1. `booking-crons.yml` succeeds after rotation.
2. Direct unauthenticated cron endpoint request fails.

### Resend API key

1. Trigger password reset email.
2. Confirm delivery and template rendering.

### Upstash token

1. Public profile loads with cache path.
2. No Upstash auth errors in logs.

### Stripe keys/secrets

1. Checkout intent creation works in test flow.
2. Webhook endpoint verifies signature with new `STRIPE_WEBHOOK_SECRET`.
3. Trolley payout onboarding path still works.

## Current rotation status

> **⚠️ ALL 28 SECRETS ARE OVERDUE as of 2026-04-27.**
> See `docs/engineering/runbooks/SECRETS-ROTATION-EXECUTION-2026-04-27.md` for the complete execution checklist.

Run the check locally:
```bash
npm run secrets:rotation:check -- --warn-window-days 14 --fail-on overdue
```

## Rotation register (must update every rotation)

Canonical register file:

- `docs/engineering/runbooks/secrets-rotation-register.json`

Use this command to stamp completed rotations:

```bash
npm run secrets:rotation:stamp -- --secrets CRON_SECRET,RESEND_API_KEY --date 2026-04-01 --by igor
```

Use this command to check due/overdue windows locally:

```bash
npm run secrets:rotation:check -- --warn-window-days 14 --fail-on due_soon,overdue
```

Use this command to verify sync coverage between GitHub Actions secrets and Vercel project env:

```bash
npm run secrets:sync:audit
```

Expected env for sync audit:

1. `GITHUB_REPOSITORY` (auto in GitHub Actions)
2. `GITHUB_TOKEN` or `GH_TOKEN`
3. `VERCEL_PROJECT_ID`
4. `VERCEL_TEAM_ID` (optional)
5. `VERCEL_TOKEN`

## New scripts (local / CI)

| Script | Purpose | Command |
|--------|---------|---------|
| `audit-env-local-vs-vercel.cjs` | Verify every key in `.env.local` exists in Vercel | `npm run secrets:env:audit` |
| `sync-env-to-vercel.cjs` | Create missing keys from `.env.local` in Vercel | `npm run secrets:env:sync` |
| `rotate-secrets.cjs` | Auto-rotate overdue secrets via provider APIs | `npm run secrets:rotate:auto:dry` / `npm run secrets:rotate:auto` |

**Safety notes:**
- `sync-env-to-vercel.cjs` defaults to `development` target. Use `--target production --confirm-production` for production.
- A built-in blocklist prevents local-only / test secrets (E2E passwords, `KIMI_API_KEY`, etc.) from being synced.
- `rotate-secrets.cjs` redacts all API errors so secret values never appear in logs or artifacts.

## Automation coverage

Scheduled workflows now enforce reminders and sync checks:

1. `.github/workflows/secrets-rotation-reminder.yml`
- runs daily
- checks due windows from the JSON register
- fails when any secret is `due_soon` or `overdue`
- uploads machine-readable report artifact

2. `.github/workflows/secrets-sync-audit.yml`
- runs weekly + manual dispatch
- validates expected secret names exist in both GitHub and Vercel targets (using `sync_targets` in the register)
- fails when any mapped secret is missing on either side
- uploads machine-readable report artifact

3. `.github/workflows/secrets-auto-rotation.yml`
- runs monthly (1st of month at 06:00 UTC)
- attempts automatic rotation for supported providers
- updates Vercel env vars and stamps the register
- opens GitHub Issues for manual actions
- supports dry-run mode

## Minimum ownership rule

1. Rotation owner: founder/operator until team expansion.
2. No secret rotation is considered complete without register entry and smoke validation evidence.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
