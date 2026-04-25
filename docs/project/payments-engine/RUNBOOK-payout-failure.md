# Runbook: Payout Failure

> **Scenario:** A payout batch or individual payout item fails after submission to Trolley.
> **Impact:** Professional does not receive expected funds. Money may be in limbo.
> **Severity:** HIGH — affects professional trust and cash flow.

---

## 1. Detection

### Automated Alerts
- Inngest logs: `payout-batch-create` function returns `reason: 'trolley_batch_failed'` or `reason: 'all_trolley_payments_failed'`
- Trolley webhook: `batch.updated` with `status: 'failed'`
- Dashboard: Admin `/admin/finance/payouts` shows batch status = `failed`
- Email notification: Professional receives `sendPayoutFailedEmail` (if triggered)

### Manual Detection
- Professional reports missing payout via support channel
- Admin notices batch stuck in `processing` for > 48 hours
- Reconciliation shows treasury debited but no matching Trolley completion

---

## 2. Immediate Response (First 15 minutes)

### 2.1 Identify the Failure Scope
```sql
-- Get batch details
SELECT id, status, failure_reason, submitted_at, trolley_batch_id
FROM payout_batches
WHERE status IN ('failed', 'processing')
  AND submitted_at < NOW() - INTERVAL '6 hours'
ORDER BY submitted_at DESC
LIMIT 10;
```

### 2.2 Check Trolley API Directly
Use the Trolley dashboard or API to check the batch status:
- If `trolley_batch_id` exists: check `https://api.trolley.com/v1/batches/{id}`
- If batch doesn't exist in Trolley: submission never reached Trolley (network/auth error)
- If batch exists but status = `failed`: Trolley-side failure (insufficient funds, recipient issue)

### 2.3 Check Individual Items
```sql
-- Find failed items in the batch
SELECT id, professional_id, net_amount, status, failure_reason, trolley_payment_id
FROM payout_batch_items
WHERE batch_id = '<batch_id>'
  AND status = 'failed';
```

---

## 3. Root Cause Analysis

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| `all_trolley_payments_failed` | Trolley auth error or API outage | Check `TROLLEY_API_KEY`/`TROLLEY_API_SECRET` validity |
| `trolley_batch_failed` | Batch creation succeeded but processing failed | Check Trolley dashboard for batch-level error |
| Item `failed` with Trolley error | Invalid recipient, frozen account, or PayPal issue | Check recipient status in Trolley |
| Batch stuck `processing` > 48h | Trolley webhook not received | Manually sync via Trolley API or dashboard |
| Treasury check passed but batch failed | Race condition: funds moved between check and submission | Verify current treasury balance |

---

## 4. Recovery Procedures

### 4.1 Funds Not Left Muuday (Batch Never Submitted to Trolley)
- **Status:** `failed` before Trolley submission
- **Professional balance:** UNCHANGED (available balance still holds the amount)
- **Action:**
  1. Fix root cause (auth, treasury, etc.)
  2. Re-run payout batch creation manually:
     - Option A: Wait for next cron run (if periodicity allows)
     - Option B: Admin uses `forcePayout` action for individual professionals
  3. No ledger reversal needed — no ledger entries were created

### 4.2 Funds Left Muuday but Trolley Failed to Deliver
- **Status:** `failed` after Trolley processing
- **Professional balance:** Already debited (ledger entries exist)
- **Action:**
  1. Verify funds returned to Revolut treasury via Trolley dashboard
  2. Create reversal ledger entries:
     ```sql
     -- Debit: CASH_REVOLUT_TREASURY (asset increases)
     -- Credit: PROFESSIONAL_BALANCE (equity increases)
     -- Use buildForceBalanceAdjustmentTransaction or manual insert
     ```
  3. Restore professional's available balance via `update_professional_balance_atomic`:
     ```sql
     SELECT update_professional_balance_atomic(
       '<professional_id>',
       '<amount>'::bigint,  -- positive = increase available
       0, 0, 0
     );
     ```
  4. Mark batch/item as `cancelled` with recovery note
  5. Notify professional that funds were returned and will be included in next payout

### 4.3 Partial Batch Failure (Some Items Failed, Some Succeeded)
- **Status:** Mixed `completed`/`failed` items
- **Action:**
  1. For failed items: follow procedure 4.2 above per item
  2. For completed items: no action needed
  3. Update batch status to `force_completed` if majority succeeded

---

## 5. Post-Incident Actions

1. **Log incident** in admin dashboard with:
   - Batch ID, affected professional IDs, amounts
   - Root cause, recovery steps taken
   - Time to resolution

2. **Update metrics:**
   - Increment `payout_failure_count` in observability
   - Update `avg_payout_time` if applicable

3. **Communication:**
   - If > 5 professionals affected: send mass notification
   - If > R$ 10,000 total: escalate to leadership

4. **Prevention:**
   - If auth error: rotate Trolley API credentials
   - If recipient issue: improve KYC validation before payout
   - If race condition: review treasury sufficiency check timing

---

## 6. Contact Escalation

| Level | Trigger | Contact |
|-------|---------|---------|
| L1 | Single failure, < R$ 1,000 | Engineering on-call |
| L2 | Multiple failures, or > R$ 1,000 | Engineering + Finance lead |
| L3 | Systemic failure, or > R$ 10,000 | CTO + CEO + Legal |

---

## 7. Related Code

- `inngest/functions/payout-batch-create.ts` — Batch creation logic
- `lib/payments/trolley/client.ts` — Trolley API client
- `lib/actions/admin/finance.ts` — `forcePayout()`, `adjustProfessionalBalance()`
- `lib/payments/ledger/entries.ts` — `buildForceBalanceAdjustmentTransaction()`
- `lib/payments/ledger/balance.ts` — `updateProfessionalBalance()`
