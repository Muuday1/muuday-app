# Pre-Deploy Checklist — Payments Engine

> Use this checklist before ANY deployment that touches payment code, database migrations, or environment variables related to Stripe, Revolut, or Trolley.

---

## 1. Code Quality

- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No `console.log` left in payment-critical code (only `console.error`/`console.warn`)
- [ ] No `0n` BigInt literals (use `BigInt(0)` for ES2017 compatibility)
- [ ] All new env vars are documented in `.env.local.example`
- [ ] All new env vars have validation in `lib/config/env.ts`

---

## 2. Database

- [ ] Migration file created in `db/sql/migrations/`
- [ ] Migration follows naming convention: `NNN-descriptive-name.sql`
- [ ] Migration is idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, etc.)
- [ ] Migration tested locally against fresh schema
- [ ] Migration tested locally against production-like data (if possible)
- [ ] Migration includes rollback instructions in comments (if complex)
- [ ] Migration does NOT drop data without explicit backup step
- [ ] Migration applied to staging environment
- [ ] Migration applied to production (or scheduled for post-deploy)

---

## 3. Ledger Integrity

- [ ] All new ledger transaction templates are balanced (debits = credits)
- [ ] `validatePayoutCalculation()` passes for all test cases
- [ ] No changes to existing ledger account codes without ADR
- [ ] Atomic RPCs (`update_professional_balance_atomic`, `create_ledger_transaction_atomic`) are used for money movements

---

## 4. API & Webhooks

- [ ] Stripe webhook handler tested with sample event payload
- [ ] Trolley webhook handler tested with sample event payload
- [ ] Revolut webhook handler tested with sample event payload
- [ ] Webhook signature verification works with rotated secrets
- [ ] New API routes have rate limiting
- [ ] New API routes validate Origin/Referer (CSRF protection)
- [ ] New API routes use `createServerClient`, not `createAdminClient` (unless admin-only)

---

## 5. Security

- [ ] No secrets hardcoded in source code
- [ ] No `SELECT *` in payment queries
- [ ] All money amounts use BigInt (minor units)
- [ ] No floating-point arithmetic on money
- [ ] RLS policies checked for new tables
- [ ] Admin actions use rate limiting (`apiV1AdminWrite`)

---

## 6. Testing

- [ ] Unit tests pass for modified fee/ledger functions
- [ ] E2E tests pass (or skipped ones are documented)
- [ ] Manual test of happy path completed locally
- [ ] Manual test of error path completed locally
- [ ] Webhook endpoints respond with correct status codes

---

## 7. Environment Variables

- [ ] `STRIPE_SECRET_KEY` — verified for correct environment (test/live)
- [ ] `STRIPE_WEBHOOK_SECRET` — matches endpoint configuration
- [ ] `REVOLUT_API_KEY` — not expired
- [ ] `REVOLUT_REFRESH_TOKEN` — valid
- [ ] `TROLLEY_API_KEY` / `TROLLEY_API_SECRET` — valid
- [ ] `TROLLEY_WEBHOOK_SECRET` — matches endpoint configuration
- [ ] `MINIMUM_TREASURY_BUFFER_MINOR` — appropriate for current volume

---

## 8. Monitoring & Alerts

- [ ] New metrics added to `lib/payments/metrics.ts` (if applicable)
- [ ] New error scenarios log to console with `[context]` prefix
- [ ] Dashboard updated to show new data (if applicable)
- [ ] On-call engineer aware of deployment window

---

## 9. Rollback Plan

- [ ] Previous deployment commit SHA noted
- [ ] Database rollback script prepared (if schema change)
- [ ] Feature flags available to disable new behavior (if applicable)
- [ ] Estimated rollback time: < 15 minutes

---

## 10. Sign-Off

| Role | Name | Approved | Date |
|------|------|----------|------|
| Engineer | | [ ] | |
| Code Reviewer | | [ ] | |
| QA / Testing | | [ ] | |
| Finance Lead | | [ ] | (for money-touching changes) |

---

> **Remember:** When in doubt, do NOT deploy. Payments code requires extra caution.
