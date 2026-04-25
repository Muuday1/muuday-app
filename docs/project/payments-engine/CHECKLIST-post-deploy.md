# Post-Deploy Checklist — Payments Engine

> Use this checklist immediately after deploying payment-related code to production.

---

## 1. Immediate Verification (0-5 minutes)

- [ ] Deployment status shows SUCCESS on Vercel/dashboard
- [ ] Production URL responds with HTTP 200
- [ ] `/api/health` returns `{ ok: true }`
- [ ] `/api/health/rls` returns success
- [ ] No error spikes in logs (check first 2 minutes)

---

## 2. Database Verification (5-10 minutes)

- [ ] New migration applied successfully (check `job_runs` or Supabase dashboard)
- [ ] New columns/tables exist and have correct defaults
- [ ] No failed migration alerts
- [ ] Backfill completed (if applicable)
- [ ] Index creation finished (check for performance impact)

---

## 3. Critical Path Tests (10-20 minutes)

### Stripe
- [ ] Webhook endpoint `/api/webhooks/stripe` responds to HEAD/GET
- [ ] Test payment intent creation (sandbox) succeeds
- [ ] Test checkout session creation (sandbox) succeeds

### Revolut
- [ ] `getRevolutAccounts()` returns data (test via admin dashboard)
- [ ] Treasury snapshot job can be triggered manually

### Trolley
- [ ] `isTrolleyHealthy()` returns true
- [ ] Recipient creation (sandbox) succeeds

### Ledger
- [ ] Admin dashboard `/admin/finance/ledger` loads without errors
- [ ] Balance queries return correct data

---

## 4. Functional Verification (20-40 minutes)

### If New Feature
- [ ] Feature works end-to-end with test data
- [ ] Feature fails gracefully with invalid input
- [ ] Feature is hidden/disabled correctly for non-eligible users

### If Bug Fix
- [ ] Original bug scenario no longer reproduces
- [ ] No regression in related functionality
- [ ] Edge cases tested

### If Migration
- [ ] Old data still accessible and correct
- [ ] New data is stored in correct format
- [ ] Downstream consumers (dashboards, exports) work

---

## 5. Performance Check (40-50 minutes)

- [ ] Page load times within baseline (+20% acceptable)
- [ ] API response times within baseline
- [ ] No new N+1 queries introduced
- [ ] Database connection pool not exhausted

---

## 6. Monitoring & Observability (50-60 minutes)

- [ ] New logs appear correctly formatted
- [ ] Error tracking (Sentry) shows no new issues
- [ ] Metrics collected for new features
- [ ] Alerts fire correctly (test if possible)

---

## 7. Communication

- [ ] Team notified in #deployments channel
- [ ] Finance team notified (if money-touching change)
- [ ] Customer support briefed on changes (if user-visible)
- [ ] Documentation updated (if behavior changed)

---

## 8. Rollback Ready

- [ ] Previous deployment still available for instant rollback
- [ ] Rollback command tested (know the Vercel rollback URL)
- [ ] Database rollback script verified (if needed)
- [ ] On-call engineer has deploy commit SHA

---

## 9. 24-Hour Follow-Up

- [ ] Check error rates vs. baseline
- [ ] Check payout/reconciliation jobs completed successfully
- [ ] Check treasury balance trend normal
- [ ] Review customer support tickets for payment issues
- [ ] Confirm no disputes or chargebacks spike

---

## 10. Sign-Off

| Check | Status | Time |
|-------|--------|------|
| Deploy verified | [ ] | |
| Critical path tested | [ ] | |
| Monitoring healthy | [ ] | |
| 24h follow-up complete | [ ] | |

**Deploy approved for full traffic:** [ ]  
**Engineer:** _______________  
**Date/Time:** _______________

---

> **If ANY check fails:** Consider rollback immediately. Money problems get worse with time.
