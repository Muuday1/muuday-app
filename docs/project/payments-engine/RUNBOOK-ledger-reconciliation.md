# Runbook: Ledger Reconciliation

> **Scenario:** Verify that the internal double-entry ledger is balanced and matches external provider balances.
> **Impact:** If ledger is unbalanced, money is unaccounted for — potential financial loss or misreporting.
> **Severity:** CRITICAL — must be checked daily.

---

## 1. What is Reconciliation?

Reconciliation ensures:
1. **Internal balance:** Every ledger transaction has equal debits and credits
2. **External balance:** Ledger accounts match real-world balances (Stripe, Revolut, Trolley)
3. **No missing transactions:** Every real transaction has a ledger entry

---

## 2. Daily Reconciliation Job

The automated reconciliation runs daily at 06:00 UTC via cron:
- `inngest/functions/reconciliation.ts` or `app/api/cron/reconciliation/route.ts`

### Check Job Status
```sql
SELECT run_key, status, completed_at, summary
FROM job_runs
WHERE job_name = 'daily_reconciliation'
ORDER BY started_at DESC
LIMIT 5;
```

---

## 3. Manual Reconciliation (When Automated Job Fails)

### 3.1 Step 1: Verify Ledger Balance (Debits = Credits)
```sql
-- Sum of all debits should equal sum of all credits
SELECT
  SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) -
  SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as difference
FROM ledger_transactions;
```

**Expected:** `difference = 0`

**If difference ≠ 0:**
- Find the date range where imbalance started
- Check for concurrent transactions without atomic RPC
- Look for `NULL` amounts or missing counterpart entries

### 3.2 Step 2: Verify Account Balances
```sql
-- Each account's net balance
SELECT
  account_code,
  SUM(CASE WHEN type = 'debit' THEN amount ELSE -amount END) as net_balance
FROM ledger_transactions
GROUP BY account_code
ORDER BY account_code;
```

**Expected balances:**
| Account | Code | Expected Sign |
|---------|------|--------------|
| CASH_REVOLUT_TREASURY | 1000 | Positive (asset) |
| STRIPE_RECEIVABLE | 1100 | Usually ~0 (settlements clear) |
| PROFESSIONAL_PAYABLE | 2000 | Negative (liability) |
| CUSTOMER_DEPOSITS_HELD | 2100 | Negative (liability) |
| PLATFORM_FEE_REVENUE | 3000 | Negative (revenue, credit balance) |
| STRIPE_FEE_EXPENSE | 3100 | Positive (expense) |
| TROLLEY_FEE_EXPENSE | 3200 | Positive (expense) |
| FX_COST_EXPENSE | 3300 | Positive (expense) |
| ADMIN_ADJUSTMENT | 3400 | Should be ~0 |
| PROFESSIONAL_BALANCE | 4000 | Negative (equity) |
| PROFESSIONAL_DEBT | 4100 | Positive (contra-equity) |

### 3.3 Step 3: Cross-Check with External Balances

**Revolut Treasury:**
```sql
-- Ledger says we have:
SELECT net_balance FROM (
  SELECT SUM(CASE WHEN type = 'debit' THEN amount ELSE -amount END) as net_balance
  FROM ledger_transactions WHERE account_code = '1000'
) t;

-- Compare with actual Revolut balance (from dashboard or API)
-- Difference should be 0
```

**Stripe Balance:**
```sql
-- Total captured payments minus refunds
SELECT SUM(CASE WHEN type = 'debit' THEN amount ELSE -amount END) as net_balance
FROM ledger_transactions WHERE account_code = '1100';

-- Should match Stripe dashboard balance
```

**Professional Balances:**
```sql
-- Sum of all professional balances (available + withheld + pending)
SELECT
  SUM(available_balance) as total_available,
  SUM(withheld_balance) as total_withheld,
  SUM(pending_balance) as total_pending,
  SUM(total_debt) as total_debt
FROM professional_balances;

-- total_available + total_withheld + total_pending should equal
-- the negative of PROFESSIONAL_BALANCE (4000) account
```

---

## 4. Common Discrepancies and Fixes

### 4.1 Missing Ledger Entry
**Symptom:** External balance changed but no matching ledger entry.
**Fix:**
1. Identify the missing transaction from provider logs
2. Create ledger entry with correct timestamp
3. Update related balances

### 4.2 Duplicate Ledger Entry
**Symptom:** Ledger balance > external balance by exact transaction amount.
**Fix:**
1. Find duplicate by `reference_id` and `created_at`
2. Mark one as void (do not delete — create reversal entry)
3. Create reversal ledger transaction

### 4.3 Amount Mismatch (Rounding)
**Symptom:** Small difference (usually 1-2 minor units).
**Cause:** Floating-point conversion before BigInt migration.
**Fix:**
1. Use `adjustProfessionalBalance` with audit note "rounding correction"
2. Create ledger adjustment entry (account 3400)

### 4.4 Race Condition (Concurrent Payout)
**Symptom:** Two payouts processed simultaneously, balance went negative.
**Fix:**
1. Verify atomic RPC `update_professional_balance_atomic` is being used
2. If not: update calling code to use atomic function
3. Manually correct balance for affected professional

---

## 5. Reconciliation Report Template

```
RECONCILIATION REPORT — YYYY-MM-DD
====================================
Ledger balanced: YES / NO
Difference: 0 minor units

Account Balances:
  1000 CASH_REVOLUT_TREASURY:  [value]
  1100 STRIPE_RECEIVABLE:       [value]
  ...

External Cross-Checks:
  Revolut actual:     [value]  | Ledger: [value]  | Diff: [value]
  Stripe actual:      [value]  | Ledger: [value]  | Diff: [value]
  Professional total: [value]  | Ledger: [value]  | Diff: [value]

Discrepancies found: [count]
Actions taken: [description]

Signed off by: [name] at [time]
```

---

## 6. Related Code

- `lib/payments/revolut/reconciliation.ts` — Revolut settlement reconciliation
- `lib/payments/ledger/entries.ts` — Ledger transaction builders
- `lib/payments/ledger/balance.ts` — Balance management
- `app/api/cron/reconciliation/route.ts` — Daily reconciliation cron
- `lib/payments/metrics.ts` — Reconciliation diff tracking
