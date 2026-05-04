# Secrets Incident Response Runbook

Last updated: 2026-05-04

## Objective

Define the exact steps to take when a secret is suspected or confirmed leaked, including revocation order, smoke validation, and customer notification triggers.

## Severity levels

| Level | Trigger | Examples |
|-------|---------|----------|
| **P0 — Critical** | Production secret confirmed leaked | `STRIPE_SECRET_KEY` (live), `SUPABASE_SERVICE_ROLE_KEY`, `REVOLUT_PRIVATE_KEY` |
| **P1 — High** | Production secret suspected leaked | Commit history shows env var, screenshot shared, ex-employee had access |
| **P2 — Medium** | Test/sandbox secret leaked | `STRIPE_SECRET_KEY` (test), E2E credentials, personal API keys |
| **P3 — Low** | Public or low-sensitivity exposure | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## Response playbook

### Step 1 — Stop the bleeding (first 5 minutes)

1. **Do not panic-commit fixes.** A rushed commit may preserve the secret in git history.
2. **Identify the secret(s)** and confirm which environments are affected:
   - Vercel Production
   - Vercel Preview
   - GitHub Actions secrets
   - Local machines
3. **Revoke in provider dashboard FIRST** (before updating Vercel):
   - Stripe: Dashboard → Developers → Restricted Keys / API Keys → Revoke
   - Supabase: Dashboard → Project Settings → API → Regenerate service_role_key
   - Resend: Dashboard → API Keys → Revoke
   - OpenAI: Dashboard → API Keys → Delete
   - Upstash: Console → Redis → Reset password
   - Cloudflare: Dashboard → My Profile → API Tokens → Roll
   - Vercel: Dashboard → Tokens → Delete
4. **Rotate any dependent secrets** (webhook secrets, signing keys, encryption keys) if the primary secret could have been used to read or tamper with them.

### Step 2 — Update environment (next 10 minutes)

1. Generate a **new secret** in the provider dashboard.
2. Update **Vercel Production** env var via dashboard or `vercel env add <KEY> production`.
3. Update **Vercel Preview** if the secret is used in preview deployments.
4. Update **GitHub Actions secrets** if the workflow uses the same credential.
5. Trigger a **production redeploy**.
6. Update the local `.env.local` with `vercel env pull .env.local`.

### Step 3 — Validate (next 15 minutes)

Run smoke checks for the rotated secret:

- **Stripe**: Create a test PaymentIntent in live mode (small amount, then refund).
- **Supabase**: Run `npm run auth:validate-smoke -- --email=... --cleanup`.
- **Resend**: Trigger a password reset email and confirm delivery.
- **Upstash**: Load a public profile and verify no auth errors.
- **General**: Check Sentry for new errors in the 15 minutes after redeploy.

### Step 4 — Audit and sweep (next 30 minutes)

1. **Git history**: If the secret was committed, use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) or `git filter-repo` to remove it from history, then force-push. Coordinate with the team before force-pushing.
2. **Sentry logs**: Search for the leaked secret value in Sentry events. If found, delete those events.
3. **Vercel logs**: Check function logs for the past 24h for any unauthorized usage patterns.
4. **Provider logs**: Check Stripe/Supabase/Resend dashboards for unexpected API calls.
5. **Notify affected users** if the leak could have exposed customer data:
   - P0: Immediate email + in-app notification
   - P1: Email within 24h
   - P2/P3: Internal post-mortem only

### Step 5 — Post-mortem (within 48 hours)

1. Document the incident in `docs/engineering/runbooks/secrets-incident-log.md` (create if missing).
2. Update `secrets-rotation-register.json` with the new rotation date.
3. Identify the root cause and add a preventive measure:
   - Missing guardrail? Add validation.
   - Human error? Improve process/docs.
   - Tool bug? Fix or replace the tool.
4. Review access controls: who has admin access to each dashboard? Remove ex-employees or unused integrations.

## Revoke-first order by provider

| Provider | Revoke location | Time to take effect |
|----------|----------------|---------------------|
| Stripe | Dashboard → Developers → API keys | Immediate |
| Supabase | Dashboard → Settings → API | Immediate |
| Resend | Dashboard → API Keys | Immediate |
| OpenAI | Dashboard → API Keys | Immediate |
| Upstash | Console → Redis → Reset password | Immediate |
| Cloudflare | Dashboard → My Profile → API Tokens | Immediate |
| Vercel | Dashboard → Tokens | Immediate |
| GitHub | Settings → Developer settings → Personal access tokens | Immediate |
| Google Cloud | Console → APIs & Services → Credentials | ~1 minute |

## Emergency contacts

| Service | Emergency URL |
|---------|---------------|
| Stripe | https://support.stripe.com/contact |
| Supabase | https://supabase.com/dashboard/support |
| Vercel | https://vercel.com/help |
| GitHub | https://support.github.com/contact |

## Related docs

- [Secrets Rotation Runbook](./secrets-rotation-runbook.md)
- [Secrets Rotation Register](./secrets-rotation-register.json)
