# Runbook: Treasury Insufficient Funds

> **Scenario:** The Revolut treasury balance is below the required amount to fund a payout batch.
> **Impact:** Payout batch is blocked. Professionals do not receive expected funds.
> **Severity:** HIGH — operational blocker affecting all payouts.

---

## 1. Detection

### Automated Alerts
- Inngest logs: `payout-batch-create` returns `reason: 'insufficient_funds'`
- Dashboard: Batch status = `insufficient_funds` in `/admin/finance/payouts`
- Treasury metric: `treasury_buffer_percentage` drops below configured threshold
- Scheduled alert: Daily treasury snapshot emails admin if balance < minimum

### Manual Detection
- Admin notices no payouts processed on scheduled day
- Reconciliation shows treasury balance declining
- Stripe settlement delayed or smaller than expected

### Key Query
```sql
-- Latest treasury snapshot
SELECT balance_minor, currency, recorded_at
FROM treasury_snapshots
ORDER BY recorded_at DESC
LIMIT 1;

-- Current minimum buffer from env
-- (check VERCEL env: MINIMUM_TREASURY_BUFFER_MINOR)
```

---

## 2. Immediate Assessment (First 5 minutes)

### 2.1 Check Current Treasury
```sql
SELECT balance_minor, currency, recorded_at
FROM treasury_snapshots
ORDER BY recorded_at DESC
LIMIT 5;
```

### 2.2 Check Pending Batch Requirements
```sql
-- If a batch was blocked, see how much was needed
SELECT id, total_net, treasury_balance_before, failure_reason
FROM payout_batches
WHERE status = 'insufficient_funds'
ORDER BY created_at DESC
LIMIT 5;
```

### 2.3 Check Incoming Stripe Settlements
```sql
-- Expected Stripe settlements in next 7 days
SELECT id, amount, status, expected_arrival
FROM stripe_settlements
WHERE status IN ('pending', 'in_transit')
  AND expected_arrival < NOW() + INTERVAL '7 days'
ORDER BY expected_arrival;
```

---

## 3. Root Cause Analysis

| Cause | Indicators | Likelihood |
|-------|-----------|------------|
| Stripe settlement delayed | `stripe_settlements` shows pending > 7 days | Medium |
| Payout batch larger than expected | Unusual spike in completed bookings | Medium |
| Unexpected withdrawals | Manual transfers from Revolut | Low |
| FX rate movement | Treasury in non-BRL currency | Low |
| Fraud/disputes | Multiple chargebacks draining balance | Low |

---

## 4. Recovery Procedures

### 4.1 Short-Term: Fund Treasury Immediately

**Option A: Manual Transfer to Revolut**
1. Transfer funds from Muuday corporate account to Revolut Business
2. Wait for transfer to complete (usually instant for internal transfers)
3. Re-run payout batch:
   - Admin uses `forcePayout` for each professional
   - Or: update batch status to `draft` and wait for next cron

**Option B: Defer Part of Batch**
1. Identify professionals with largest payouts
2. Use `forcePayout` only for smaller amounts that fit in treasury
3. Defer large payouts to next cycle

**Option C: Emergency Credit Line**
1. If available, draw from Revolut credit line
2. Document as emergency bridge financing
3. Repay from next Stripe settlement

### 4.2 Re-Run the Blocked Batch

```sql
-- Option 1: Reset batch to draft for next cron
UPDATE payout_batches
SET status = 'draft',
    failure_reason = NULL,
    updated_at = NOW()
WHERE id = '<batch_id>';

-- Option 2: Admin force payout (per professional)
-- Use /admin/finance dashboard → Force Payout action
```

### 4.3 Long-Term: Prevent Recurrence

1. **Increase minimum buffer:**
   - Update `MINIMUM_TREASURY_BUFFER_MINOR` env var
   - Current default: R$ 50,000 (5,000,000 minor units)

2. **Improve cash flow forecasting:**
   - Monitor `stripe_settlements.expected_arrival`
   - Track weekly payout trends
   - Set alert if projected treasury < 2x weekly payout average

3. **Stripe settlement acceleration:**
   - Contact Stripe to reduce settlement delay
   - Enable daily settlements instead of weekly

---

## 5. Communication

### To Affected Professionals
> "Olá, seu pagamento desta semana foi temporariamente adiado devido a uma questão operacional na nossa conta de tesouraria. Estamos resolvendo e seu pagamento será processado em até 48 horas. Pedimos desculpas pelo inconveniente."

### Internal (Slack/Email)
> "ALERT: Treasury insufficient for payout batch [batch_id]. Required: [amount]. Available: [balance]. Action: [manual transfer/deferral]. ETA to resolution: [time]."

---

## 6. Metrics to Track

| Metric | Target | Alert If |
|--------|--------|----------|
| Treasury balance | > R$ 100,000 | < R$ 50,000 |
| Buffer percentage | > 20% | < 10% |
| Time to resolve insufficient funds | < 4 hours | > 4 hours |
| Payout deferral rate | < 1%/month | > 5%/month |

---

## 7. Related Code

- `inngest/functions/payout-batch-create.ts` — Treasury sufficiency check (Step 4)
- `lib/payments/revolut/client.ts` — `getTreasuryBalance()`
- `lib/payments/metrics.ts` — Treasury buffer calculation
- `app/api/admin/finance/treasury-status/route.ts` — Treasury dashboard API
- `inngest/functions/treasury-snapshot.ts` — Daily treasury recording
