# Muuday Payments Engine — Master Plan

> **Status:** ACTIVE — Fase 1 Implementation In Progress
> **Last Updated:** 2026-04-24
> **Owner:** Engineering Team
> **Classification:** CRITICAL — Financial Infrastructure

---

## 1. Why This Document Exists

This is the **single source of truth** for the entire Muuday payments infrastructure. Every decision, every table, every state machine, every webhook flow, and every risk scenario is documented here. **If it's not in this document, it doesn't exist.**

### 1.1 The Golden Rule

> **No code is written for the payments engine without a corresponding entry in this plan.**

Every PR that touches money must reference a section of this document. Every architectural change must update this document FIRST.

### 1.2 Document Hierarchy

```
MASTER-PLAN.md (this file)
├── Sub-plans (per area):
│   ├── PLAN-01-ledger-foundation.md
│   ├── PLAN-02-stripe-payin.md
│   ├── PLAN-03-treasury-revolut.md
│   ├── PLAN-04-trolley-payouts.md
│   ├── PLAN-05-admin-monitoring.md
│   └── PLAN-06-security-compliance.md
├── Decisions:
│   └── DECISIONS.md (ADR-style decisions with rationale)
├── Runbooks:
│   ├── RUNBOOK-payout-failure.md
│   ├── RUNBOOK-dispute-after-payout.md
│   ├── RUNBOOK-treasury-insufficient.md
│   └── RUNBOOK-ledger-reconciliation.md
└── Checklists:
    ├── CHECKLIST-pre-deploy.md
    └── CHECKLIST-post-deploy.md
```

---

## 2. Architecture Decision: Why We Rejected Stripe Sync Engine

### 2.1 What is Stripe Sync Engine?

Supabase's official integration that syncs Stripe data (customers, subscriptions, invoices, charges) into Postgres tables via webhooks + scheduled backfills.

### 2.2 Why We Said NO

| Criteria | Stripe Sync Engine | Our Custom Layer |
|----------|-------------------|------------------|
| **Idempotency control** | Generic dedup by Stripe event ID | Custom inbox with retry, state machine, business logic gates |
| **Ledger double-entry** | ❌ Not supported | ✅ Core feature |
| **Trolley integration** | ❌ Not supported | ✅ Core feature |
| **Revolut integration** | ❌ Not supported | ✅ Core feature |
| **Dispute handling** | ❌ Raw data only | ✅ Full lifecycle with debt tracking |
| **State machines** | ❌ No state management | ✅ Payment, payout, batch, recipient lifecycle |
| **Real-time business logic** | ❌ Requires separate layer | ✅ Built into webhook handlers |
| **Observability** | ❌ Limited | ✅ Custom metrics, alerts, dashboards |
| **Historical backfill** | ✅ Excellent | ✅ We have `stripe_job_runs` for idempotent batches |
| **Setup time** | ✅ Minutes | ⚠️ Days (but we already built it) |

### 2.3 The Real Reason

> Stripe Sync Engine syncs **data**. We need to orchestrate **money**.
>
> Data sync is a solved problem. Money orchestration is not.

Our existing webhook infrastructure (`stripe_webhook_events` inbox, Inngest retry, idempotent processing) is **already superior** to what Sync Engine provides for our use case. Adding Sync Engine would:
1. Introduce a black box between Stripe and our ledger
2. Duplicate webhook handling (Sync Engine + our handlers)
3. Create sync lag and ordering issues
4. Add zero value for Trolley, Revolut, dispute handling, fee calculation

**Verdict:** We keep our custom layer. It gives us total control over every cent.

---

## 3. The Money Philosophy

### 3.1 Core Principles (Non-Negotiable)

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. EVERY CENT IS ACCOUNTED FOR                                    │
│     → No floating-point arithmetic. Only BIGINT minor units.       │
│     → Every movement has a ledger entry.                           │
│                                                                    │
│  2. NEVER PAY WHAT YOU DON'T HAVE                                  │
│     → Treasury check BEFORE any payout.                            │
│     → No partial batches. All or nothing.                          │
│                                                                    │
│  3. NEVER PAY THE SAME BOOKING TWICE                               │
│     → booking_payout_items junction table with PK constraint.      │
│     → Booking included in batch with status ≥ submitted = locked.  │
│                                                                    │
│  4. PROFESSIONAL NEVER SEES A SURPRISE                             │
│     → Fees are transparent, calculated by Muuday, shown upfront.   │
│     → Balance is real-time (with 15-min cache).                    │
│                                                                    │
│  5. DISPUTE = PROFESSIONAL'S PROBLEM, NOT MINE                     │
│     → Dispute after payout → professional debt.                    │
│     → Debt recovered from future payouts.                          │
│     → I (Muuday) never eat a dispute loss.                         │
│                                                                    │
│  6. FX RISK IS MINE, NOT THE PROFESSIONAL'S                        │
│     → Professional receives exact BRL amount.                      │
│     → Muuday absorbs conversion costs.                             │
│                                                                    │
│  7. CODE CANNOT LIE ABOUT MONEY                                    │
│     → All financial code has at least 2 reviewers.                 │
│     → All state transitions are validated.                         │
│     → All amounts are checked invariants.                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 The Invariant Checklist

Every time money moves, these invariants MUST hold:

```typescript
// Invariant 1: Ledger balance
// For every transaction_id: SUM(debits) === SUM(credits)

// Invariant 2: Professional balance consistency
// available + withheld + pending - total_debt = SUM(all ledger entries for this professional)

// Invariant 3: Payout batch integrity
// batch.total_amount === SUM(items.amount)
// batch.net_amount === batch.total_amount - batch.total_fees

// Invariant 4: Treasury sufficiency
// treasury_balance >= batch.net_amount + MINIMUM_TREASURY_BUFFER

// Invariant 5: No double payout
// booking_id can only appear in ONE batch with status ≥ submitted

// Invariant 6: Dispute debt integrity
// dispute.remaining_debt === dispute.dispute_amount - dispute.recovered_amount
```

---

## 4. The State Machine Bible

### 4.1 Payment Lifecycle (Stripe)

```
requires_payment ──► pending ──► captured ──┬──► partial_refunded
                                            ├──► refunded
                                            ├──► held (dispute)
                                            │       └──► released (won)
                                            │       └──► refunded (lost)
                                            └──► [terminal]

pending ──► failed ──► [terminal]
```

**Transition Guards:**
- `captured` → `refunded`: Only if `refunded_amount === amount_total_minor`
- `captured` → `partial_refunded`: Only if `0 < refunded_amount < amount_total_minor`
- `held` → `released`: Only on `charge.dispute.closed` with `status = 'won'`
- `held` → `refunded`: Only on `charge.dispute.closed` with `status = 'lost'`
- `refunded` is TERMINAL — no transitions allowed

### 4.2 Booking → Payout Eligibility

```
confirmed ──► completed (session ended + auto/no-show detection)
    └──► cancelled (customer/pro cancellation)

completed ──► eligible (cooldown passed + all criteria met)
    └──► ineligible (dispute opened, refund processed, etc.)

eligible ──► included_in_batch (batch created + treasury check passed)
    └──► blocked (treasury insufficient, professional inactive, etc.)
```

**Eligibility Criteria (ALL must be true):**
1. Booking status = `completed`
2. Payment status = `captured`
3. `NOW() >= scheduled_end_at + INTERVAL '48 hours'`
4. Professional has `trolley_recipients.is_active = true`
5. No open dispute on this booking (`dispute_resolutions.status = 'open'`)
6. Professional `total_debt < MAX_PROFESSIONAL_DEBT_MINOR`
7. Booking NOT already in a batch with status ≥ `submitted`

### 4.3 Payout Batch Lifecycle

```
draft ──► treasury_check ──┬──► insufficient_funds ──► [retry next cycle]
                           │
                           └──► submitted ──► processing ──┬──► completed
                                                            ├──► failed
                                                            └──► cancelled
```

**Transition Guards:**
- `draft` → `treasury_check`: All items validated, amounts calculated
- `treasury_check` → `submitted`: `treasury_balance >= net_amount + buffer`
- `treasury_check` → `insufficient_funds`: `treasury_balance < net_amount + buffer`
- `submitted` → `processing`: Trolley API acknowledged
- `processing` → `completed`: All items `status = 'completed'`
- `processing` → `failed`: Trolley reported batch failure
- Any status → `cancelled`: Only if status < `submitted` and admin action

### 4.4 Trolley Recipient Lifecycle

```
pending ──► in_review ──► approved ──► active
                              │
                              └──► rejected
```

**Transition Guards:**
- `pending` → `in_review`: Trolley API call made, awaiting KYC
- `in_review` → `approved`: Trolley webhook `recipient.updated` with approved status
- `in_review` → `rejected`: Trolley webhook with rejected status
- `approved` → `active`: Professional confirms payout method in dashboard
- `active` → [deactivated]: On `recipient.deactivated` webhook

---

## 5. The Webhook Contract

### 5.1 Stripe Webhooks (Existing + Extensions)

**Route:** `POST /api/webhooks/stripe`

| Event | Handler | Ledger Entry | Side Effects |
|-------|---------|--------------|--------------|
| `payment_intent.succeeded` | ✅ Exists | Debit: Customer Deposits Held; Credit: Stripe Receivable | Update booking status, notify user+pro |
| `payment_intent.payment_failed` | ✅ Exists | None (no money moved) | Cancel booking, notify user+pro |
| `charge.refunded` | ✅ Exists | Debit: Stripe Receivable; Credit: Customer Deposits Held | Update payment status |
| `charge.dispute.created` | 🆕 NEW | Debit: Professional Payable; Credit: Customer Deposits Held | Hold payout, create dispute record |
| `charge.dispute.closed` (won) | 🆕 NEW | Reverse hold entry | Release booking for payout |
| `charge.dispute.closed` (lost) | 🆕 NEW | Debit: Professional Debt; Credit: Cash | Customer refunded, pro in debt |
| `payout.paid` | 🆕 NEW | Debit: Cash; Credit: Stripe Receivable | Treasury snapshot updated |
| `invoice.paid` | ✅ Exists | Subscription revenue | Update pro billing status |
| `invoice.payment_failed` | ✅ Exists | None | Enqueue subscription check |
| `customer.subscription.updated` | ✅ Exists | None | Update pro billing status |
| `customer.subscription.deleted` | ✅ Exists | None | Update pro billing status |

### 5.2 Trolley Webhooks (New)

**Route:** `POST /api/webhooks/trolley`

| Event | Handler | Side Effects |
|-------|---------|--------------|
| `payment.created` | 🆕 NEW | Update item status → `processing` |
| `payment.processed` | 🆕 NEW | Update item → `completed`; release withheld balance; ledger entry |
| `payment.failed` | 🆕 NEW | Update item → `failed`; credit back to available balance; log reason |
| `payment.returned` | 🆕 NEW | Update item → `returned`; credit back to available balance |
| `recipient.created` | 🆕 NEW | Log; update `trolley_recipients` record |
| `recipient.updated` | 🆕 NEW | Sync KYC status, payout method, email |
| `recipient.deactivated` | 🆕 NEW | Set `is_active = false`; block future payouts |

### 5.3 Revolut Webhooks (New)

**Route:** `POST /api/webhooks/revolut`

| Event | Handler | Ledger Entry | Side Effects |
|-------|---------|--------------|--------------|
| `transaction.created` (inbound) | 🆕 NEW | Debit: Cash; Credit: Stripe Receivable | Treasury snapshot |
| `transaction.created` (outbound) | 🆕 NEW | Debit: Professional Payable; Credit: Cash | Verify against batch |
| `account.balance.updated` | 🆕 NEW | None | Insert treasury snapshot |

---

## 6. The Treasury Formula

### 6.1 Balance Equation

```
Treasury Balance = Stripe Settlements - Payouts - Dispute Refunds - Fees
```

### 6.2 Payout Batch Sufficiency Check

```typescript
const isTreasurySufficient = (
  treasuryBalance: bigint,
  batchNetAmount: bigint,
  config: TreasuryConfig
): boolean => {
  const required = batchNetAmount 
    + config.minimumBuffer 
    + (batchNetAmount * config.fxBufferPercentage / 100n);
  return treasuryBalance >= required;
};
```

**Default Config:**
- `minimumBuffer`: R$ 10,000 (1,000,000n minor units)
- `fxBufferPercentage`: 5%

### 6.3 Treasury Monitoring

**Inngest Cron:** `treasury-balance-snapshot` (every 15 minutes)
1. Call Revolut API: `GET /accounts/{id}/balance`
2. Insert `revolut_treasury_snapshots` row
3. Check against `MINIMUM_TREASURY_BUFFER`
4. If below: alert ops (Slack + email), block all payout batches

**Inngest Cron:** `treasury-reconciliation` (daily at 6am UTC)
1. Sum all ledger entries for Cash account (1000)
2. Compare with latest treasury snapshot
3. If difference > 0.01 BRL: alert ops, investigate

---

## 7. The Fee Structure

### 7.1 Professional-Paid Fees

| Periodicity | Fee (BRL) | Fee (minor) | Rationale |
|-------------|-----------|-------------|-----------|
| Weekly | R$ 15.00 | 1500n | Higher frequency = higher cost |
| Bi-weekly | R$ 10.00 | 1000n | Middle ground |
| Monthly | R$ 5.00 | 500n | Lowest cost, preferred |

### 7.2 Fee Application Order

```
1. Calculate total eligible amount from completed bookings
2. Deduct professional debt (from disputes)
3. Apply periodicity fee
4. Result = net_amount sent to Trolley
5. Trolley fee (if any) is absorbed by Muuday
```

### 7.3 Example Calculation

```
Eligible bookings:        R$ 500.00  = 50000n
Professional debt:        -R$ 25.00  = -2500n
Subtotal:                 R$ 475.00  = 47500n
Weekly fee:               -R$ 15.00  = -1500n
Net to Trolley:           R$ 460.00  = 46000n
Trolley fee (absorbed):   ~R$ 2.50   = 250n
Professional receives:    R$ 460.00  = 46000n
```

---

## 8. The Dispute Protocol

### 8.1 Dispute Before Payout

```
Stripe dispute webhook
    │
    ▼
Check: Was booking already paid out?
    │
    └── NO ──► Hold payout (move from available to withheld)
              │
              └── Dispute won ──► Release hold
              │
              └── Dispute lost ──► Refund customer
                                   │
                                   └── No professional debt
```

### 8.2 Dispute After Payout (The Critical Path)

```
Stripe dispute webhook
    │
    ▼
Check: Was booking already paid out?
    │
    └── YES ──► Create dispute_resolutions record
               │
               ├── recovery_method = 'future_withholding'
               │
               ├── Add dispute_amount to professional_balances.total_debt
               │
               ├── Deduct from available_balance (can go negative)
               │
               └── Future payouts deduct debt first
```

**Debt Recovery Algorithm:**
```typescript
const calculateNetPayout = (
  eligibleAmount: bigint,
  professionalDebt: bigint,
  fee: bigint
): bigint => {
  const afterDebt = eligibleAmount - professionalDebt;
  if (afterDebt <= 0n) return 0n; // All consumed by debt
  return afterDebt - fee;
};
```

**Debt Threshold:**
- If `total_debt > MAX_PROFESSIONAL_DEBT_MINOR` (R$ 500): BLOCK all payouts
- Alert professional: "Resolve dispute to resume payouts"

---

## 9. The Safety Layers

### 9.1 Layer 1: Schema Constraints

```sql
-- No negative amounts
CHECK (amount >= 0)

-- No negative balances  
CHECK (available_balance >= 0)  -- Wait: this would prevent negative from disputes
-- Actually: we ALLOW negative available_balance (debt)
-- But we BLOCK payouts when debt exceeds threshold

-- Status machine enforcement
CHECK (status IN ('draft', 'treasury_check', ...))

-- Foreign key integrity
REFERENCES ... ON DELETE RESTRICT (never cascade for financial data)
```

### 9.2 Layer 2: Application Validation

```typescript
// Before any payout batch submission:
1. Validate all items have amount > 0
2. Validate batch.total === SUM(items.amount)
3. Validate treasury sufficiency
4. Validate no duplicate bookings
5. Validate all professionals are active
```

### 9.3 Layer 3: Database Triggers

```sql
-- Trigger: Prevent modifying completed ledger entries
CREATE TRIGGER ledger_entries_immutable
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION reject_ledger_update();

-- Trigger: Auto-update professional_balances on ledger insert
CREATE TRIGGER ledger_to_balance_sync
  AFTER INSERT ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_balance();

-- Trigger: Prevent deleting payout batches with status ≥ submitted
CREATE TRIGGER payout_batch_delete_guard
  BEFORE DELETE ON payout_batches
  FOR EACH ROW
  WHEN (OLD.status IN ('submitted', 'processing', 'completed'))
  EXECUTE FUNCTION reject_delete();
```

### 9.4 Layer 4: Reconciliation Jobs

**Daily Reconciliation (6am UTC):**
1. Ledger balance check: SUM(debits) === SUM(credits) per transaction
2. Professional balance check: ledger sum matches balance table
3. Treasury check: ledger cash matches Revolut snapshot
4. Payout batch check: batch totals match item sums
5. Booking coverage check: no booking paid twice

**Weekly Reconciliation (Monday 7am UTC):**
1. Stripe balance reconciliation: Stripe dashboard vs ledger
2. Trolley reconciliation: Trolley dashboard vs payout_batch_items
3. Revolut reconciliation: Revolut dashboard vs treasury snapshots
4. Generate reconciliation report for finance team

### 9.5 Layer 5: Human Approval

**Auto-approve threshold:** Batches ≤ R$ 50,000
**Manual approval required:** Batches > R$ 50,000
**Emergency stop:** Admin can cancel any batch with status < `submitted`

---

## 10. The Observability Stack

### 10.1 Metrics (Sent to Monitoring)

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `payments.treasury.balance` | Gauge | < R$ 10,000 = CRITICAL |
| `payments.batch.items_total` | Counter | Per batch |
| `payments.batch.amount_total` | Counter | Per batch |
| `payments.batch.failure_rate` | Rate | > 5% = WARNING |
| `payments.professional.balance` | Gauge | Per professional |
| `payments.professional.debt` | Gauge | > R$ 500 = WARNING |
| `payments.dispute.open_count` | Gauge | > 10 = WARNING |
| `payments.ledger.reconciliation_diff` | Gauge | > 0 = CRITICAL |
| `payments.webhook.processing_latency` | Histogram | > 30s = WARNING |

### 10.2 Alerts

| Alert | Channel | Escalation |
|-------|---------|------------|
| Treasury below buffer | Slack #ops-critical + SMS | 5 min |
| Payout batch failed | Slack #ops-critical + email | Immediate |
| Ledger reconciliation mismatch | Slack #ops-critical + SMS | Immediate |
| Professional debt > threshold | Slack #ops + email | 1 hour |
| Webhook processing lag > 5 min | Slack #ops | 15 min |
| Duplicate webhook detected | Slack #ops | Immediate |

### 10.3 Audit Log

Every financial action is logged:
```
[2026-04-24T10:00:00Z] ACTION=payout_batch_created
  batch_id=uuid, total_amount=50000n, item_count=12, triggered_by=cron

[2026-04-24T10:01:00Z] ACTION=treasury_check_passed
  batch_id=uuid, treasury_before=150000n, required=65000n

[2026-04-24T10:01:30Z] ACTION=batch_submitted_to_trolley
  batch_id=uuid, trolley_batch_id=trolley_123

[2026-04-24T10:05:00Z] ACTION=ledger_entry_created
  transaction_id=uuid, account=2000, type=debit, amount=50000n
```

---

## 11. The Rollout Strategy

### 11.1 Phase 1: Ledger Foundation (CURRENT)
- ✅ Migrations: all new tables
- 🔄 TypeScript: ledger constants, entry helpers, balance calc
- 🔄 Env vars: Trolley, Revolut, payout config
- 🔄 Tests: ledger invariants

### 11.2 Phase 2: Stripe Pay-in Completion
- Real PaymentIntent creation for bookings
- Replace legacy auto-capture flow
- Refund via Stripe API
- Dispute handling

### 11.3 Phase 3: Treasury Integration
- Revolut API client
- Treasury snapshot cron
- Stripe settlement tracking

### 11.4 Phase 4: Trolley Payout Pipeline
- Trolley API client
- Professional onboarding
- Payout batch creation
- Trolley webhook handlers

### 11.5 Phase 5: Admin & Monitoring
- Admin dashboard
- Alerting
- Reconciliation jobs

### 11.6 Go-Live Checklist

```
□ All migrations applied in staging
□ All state machine tests passing
□ All integration tests passing
□ Reconciliation job run manually with 0 diffs
□ Treasury balance > R$ 50,000
□ Trolley account funded
□ Revolut account linked to Stripe
□ Webhook endpoints registered with all providers
□ Alert channels tested
□ Rollback plan documented
□ Finance team trained on dashboard
□ Legal review of terms of service (fees, disputes)
```

---

## 12. The Change Protocol

### 12.1 When This Plan Changes

Any of these events trigger a plan update:
- [ ] New table added to schema
- [ ] State machine transition changed
- [ ] New webhook event handled
- [ ] Fee structure modified
- [ ] New risk scenario identified
- [ ] New environment variable added
- [ ] Security policy changed
- [ ] Rollout phase completed

### 12.2 Change Approval

```
1. Engineer proposes change → opens PR
2. PR updates this document FIRST
3. PR references specific section changed
4. 2 reviewers required (1 senior, 1 finance-aware)
5. All tests must pass
6. Reconciliation must show 0 diffs
7. Merge only after explicit approval
```

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Minor units** | Integer representation of currency (R$ 150.00 = 15000) |
| **Ledger entry** | A single debit or credit record in the double-entry journal |
| **Transaction** | A group of ledger entries that balance to zero |
| **Payout batch** | A group of payouts to professionals submitted together |
| **Treasury** | The Revolut Business account holding Muuday's funds |
| **Double-entry** | Every debit has an equal credit; books always balance |
| **Dispute** | A customer challenging a charge through Stripe |
| **Withholding** | Holding back part of a payout for risk mitigation |
| **FX** | Foreign exchange (currency conversion) |
| **RLS** | Row Level Security (PostgreSQL feature) |

---

## 14. Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-04-24 | Reject Stripe Sync Engine | Custom layer gives total control over ledger + payouts | ✅ Final |
| 2026-04-24 | Use BIGINT minor units | Prevents float rounding; industry standard for finance | ✅ Final |
| 2026-04-24 | Muuday absorbs FX costs | Simpler for professionals; business decision | ✅ Final |
| 2026-04-24 | PayPal-only for MVP | Faster onboarding; bank transfer unlocks at 200 payments | ✅ Final |
| 2026-04-24 | 48h payout cooldown | Balance between cash flow and dispute window | ✅ Tentative |
| 2026-04-24 | R$ 10,000 treasury buffer | Safety margin for operational continuity | ✅ Tentative |
| 2026-04-24 | R$ 500 max professional debt | Threshold before payout blocking | ✅ Tentative |
| 2026-04-24 | Weekly batch schedule (Mondays) | Predictable for professionals; operational rhythm | ✅ Tentative |

---

> **"Money is the easiest thing to get wrong and the hardest thing to debug. We will be paranoid, we will be redundant, and we will never ship a payment feature without exhaustive testing."**
>
> — Muuday Engineering Principle #1
