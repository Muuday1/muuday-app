# Secrets Rotation Execution Checklist

**Date:** 2026-04-27
**Status:** Prepared for execution — all 28 secrets are overdue (17 days past due)
**Trigger:** `secrets-rotation-reminder.yml` failing daily

> **⚠️ CRITICAL:** This checklist requires access to provider dashboards (Stripe, Supabase, Vercel, GitHub, etc.). Do NOT attempt rotation without verifying rollback paths.

---

## Pre-Rotation Setup

1. Open a maintenance ticket with:
   - Owner: `igorpinto.lds@gmail.com`
   - Target: All 28 secrets in `secrets-rotation-register.json`
   - Planned window: 2–4 hours
   - Rollback path: Vercel deployment history + GitHub secret history

2. Confirm smoke-check endpoints:
   - Auth flow: `/auth/login`
   - Booking flow: `/api/v1/bookings` (test creation)
   - Cron endpoints: `/api/cron/booking-reminders`
   - Email delivery: trigger password reset
   - Cache/rate-limit: public profile load

3. Ensure `npm run secrets:rotation:check` is runnable locally for verification.

---

## Batch 1 — Core Infrastructure (Highest Risk)

Rotate these first. Each requires immediate smoke check.

| # | Secret | Provider | Rotation Steps | Smoke Check |
|---|--------|----------|---------------|-------------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → Service Role Key → Regenerate | 1. Generate new key in Supabase<br>2. Update Vercel `Production` env<br>3. Update Vercel `Preview` env<br>4. Update GitHub Actions secret<br>5. Redeploy<br>6. Revoke old key | `npm run auth:validate-smoke --dry-run` |
| 2 | `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens | Same as above | Admin-only script smoke run |
| 3 | `SUPABASE_DB_WEBHOOK_SECRET` | Supabase Dashboard → Database → Webhooks | Same as above | DB webhook health check |
| 4 | `CRON_SECRET` | Self-generated (openssl rand -hex 32) | 1. Generate new secret<br>2. Update Vercel `Production` + `Preview`<br>3. Update GitHub Actions secret `CRON_SECRET`<br>4. Trigger `booking-crons.yml` manually<br>5. Verify success | `booking-crons.yml` manual run |

---

## Batch 2 — Payment & Financial (Critical)

| # | Secret | Provider | Rotation Steps | Smoke Check |
|---|--------|----------|---------------|-------------|
| 5 | `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | 1. Create new restricted key<br>2. Update Vercel `Production` + `Preview`<br>3. Update GitHub Actions<br>4. Test checkout intent creation<br>5. Revoke old key | Stripe sandbox checkout flow |
| 6 | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Reveal/Regenerate | Same as above | Webhook signature validation test |
| 7 | `REVOLUT_CLIENT_ID` | Revolut Business Dashboard → API → Credentials | Same as above | Revolut API health check |
| 8 | `REVOLUT_API_KEY` | Revolut Business Dashboard → API → Credentials | Same as above | Treasury balance API call |
| 9 | `REVOLUT_REFRESH_TOKEN` | Revolut OAuth flow | Same as above | Token refresh test |
| 10 | `REVOLUT_PRIVATE_KEY` | Generate new RSA key pair | Same as above | JWT client assertion test |
| 11 | `TROLLEY_API_KEY` | Trolley Dashboard → API Keys | Same as above | Trolley API health check |
| 12 | `TROLLEY_API_SECRET` | Trolley Dashboard → API Keys | Same as above | HMAC signature test |
| 13 | `TROLLEY_WEBHOOK_SECRET` | Trolley Dashboard → Webhooks | Same as above | Webhook HMAC verification test |

---

## Batch 3 — Communications & Monitoring

| # | Secret | Provider | Rotation Steps | Smoke Check |
|---|--------|----------|---------------|-------------|
| 14 | `RESEND_API_KEY` | Resend Dashboard → API Keys | Update Vercel + GitHub | Trigger password reset email |
| 15 | `UPSTASH_REDIS_REST_TOKEN` | Upstash Dashboard → Database → REST API | Update Vercel + GitHub | Public profile load with cache |
| 16 | `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard → Project Settings → Client Keys | Update Vercel | Trigger controlled test error |
| 17 | `CHECKLY_API_KEY` | Checkly Dashboard → Account → API Keys | Update GitHub Actions | Checkly health check |
| 18 | `INNGEST_SIGNING_KEY` | Inngest Dashboard → Signing Key | Update Vercel | Inngest health check |
| 19 | `POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_KEY` | PostHog Dashboard → Project Settings | Update Vercel | Event firing test |

---

## Batch 4 — Third-Party Integrations

| # | Secret | Provider | Rotation Steps | Smoke Check |
|---|--------|----------|---------------|-------------|
| 20 | `OPENAI_API_KEY` | OpenAI Dashboard → API Keys | Update Vercel + GitHub | API call test |
| 21 | `OPENAI_API_KEY_SERVICE` | OpenAI Dashboard → API Keys | Update Vercel + GitHub | API call test |
| 22 | `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens | Update Vercel + GitHub | DNS/API call test |
| 23 | `CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Dashboard → Analytics | Update Vercel | Analytics load test |
| 24 | `GITHUB_TOKEN` | GitHub Settings → Developer Settings → Personal Access Tokens | Update GitHub Actions | CI run test |
| 25 | `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | Update Vercel + GitHub | OAuth flow test |
| 26 | `NOTION_API_TOKEN` | Notion Integrations | Update Vercel | API call test |
| 27 | `NETLIFY_ACCESS_TOKEN` | Netlify Dashboard → User Settings → Applications | Update Vercel | API call test |
| 28 | `TELEGRAM_BOT_TOKEN` | @BotFather → /revoke | Update Vercel | Bot message test |
| 29 | `AGORA_APP_CERTIFICATE` | Agora Console → Project Management | Update Vercel | Token generation test |
| 30 | `CALENDAR_TOKEN_ENCRYPTION_KEY` | Self-generated (openssl rand -hex 32) | Update Vercel | Calendar sync test |
| 31 | `CALENDAR_OAUTH_STATE_SECRET` | Self-generated (openssl rand -hex 32) | Update Vercel | OAuth state test |
| 32 | `VERCEL_API_TOKEN` | Vercel Dashboard → Settings → Tokens | Update GitHub Actions | API call test |
| 33 | `FIGMA_API_TOKEN` | Figma Settings → Personal Access Tokens | Update Vercel | API call test |
| 34 | `GEMINI_API_KEY` | Google AI Studio → API Keys | Update Vercel | API call test |
| 35 | `HUBSPOT_ACCESS_TOKEN` | HubSpot Settings → Integrations → API Key | Update Vercel | API call test |
| 36 | `MAKE_API_TOKEN` | Make Dashboard → Profile → API | Update Vercel | API call test |
| 37 | `MAKE_WEBHOOK_SECRET` | Make Dashboard → Webhooks | Update Vercel | Webhook signature test |

---

## Post-Rotation Verification

1. Run full register check:
   ```bash
   npm run secrets:rotation:check -- --warn-window-days 14 --fail-on overdue,due_soon
   ```

2. Run sync audit:
   ```bash
   npm run secrets:sync:audit
   ```

3. Stamp completed rotation:
   ```bash
   npm run secrets:rotation:stamp -- --secrets ALL --date 2026-04-27 --by igor
   ```

4. Run CI pipeline end-to-end:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   npm run test:unit
   ```

5. Verify `secrets-rotation-reminder.yml` passes on next scheduled run.

---

## Notes

- **Do NOT rotate all secrets at once.** Use batches with smoke checks between.
- **Do NOT revoke old keys immediately.** Wait 24h after confirming new keys work.
- **Keep a rollback log.** Note old key IDs and revocation dates.
- **STRIPE_BR_* keys were removed** from the register in the 2026-04 UK-only consolidation. Do not recreate them.
