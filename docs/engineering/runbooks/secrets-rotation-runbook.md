# Secrets Rotation Runbook

Last updated: 2026-04-17

## Objective

Define periodic, auditable secret rotation for production-critical credentials.

This runbook covers all entries in `secrets-rotation-register.json`, including:

1. `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
2. `SUPABASE_ACCESS_TOKEN`
3. `CRON_SECRET`
4. `SUPABASE_DB_WEBHOOK_SECRET`
5. `RESEND_API_KEY`
6. `UPSTASH_REDIS_REST_TOKEN`
7. `STRIPE_SECRET_KEY` / `STRIPE_BR_SECRET_KEY`
8. `STRIPE_WEBHOOK_SECRET` / `STRIPE_BR_WEBHOOK_SECRET`
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
| `CRON_SECRET` | Every 60 days | suspected leak, unauthorized cron hit |
| `RESEND_API_KEY` | Every 90 days | suspected leak, unexpected mail activity |
| `UPSTASH_REDIS_REST_TOKEN` | Every 90 days | suspected leak, unauthorized token use |
| `STRIPE_SECRET_KEY` | Every 90 days | suspected leak, Stripe security event |
| `STRIPE_WEBHOOK_SECRET` | Every 90 days | webhook endpoint changes, suspected replay/injection |
| `STRIPE_CONNECT_CLIENT_ID` | Every 180 days review | app reconfiguration/security review |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | With Stripe key rollovers | publishable key drift with secret key rollover |

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
3. Connect onboarding path still works.

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

## Automation coverage

Scheduled workflows now enforce reminders and sync checks:

1. `.github/workflows/secrets-rotation-reminder.yml`
- runs daily
- checks due windows from the JSON register
- fails when any secret is `due_soon` or `overdue`
- uploads machine-readable report artifact

2. `.github/workflows/secrets-sync-audit.yml`
- runs weekly + manual dispatch
- validates expected secret names exist in both GitHub and Vercel targets
- fails when any mapped secret is missing on either side
- uploads machine-readable report artifact

## Minimum ownership rule

1. Rotation owner: founder/operator until team expansion.
2. No secret rotation is considered complete without register entry and smoke validation evidence.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
