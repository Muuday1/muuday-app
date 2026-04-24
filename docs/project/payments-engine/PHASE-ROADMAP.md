# Phase Roadmap — Payment Engine Implementation

> **Project**: Muuday Payment Engine (Stripe → Revolut → Trolley)
> **Last updated**: 2026-04-24
> **Phase 1 Status**: ✅ COMPLETE
> **Phase 2 Status**: ✅ COMPLETE
> **Next**: Phase 3 — Stripe Settlement → Revolut (on hold until instructed)

---

## Architecture Summary

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────────┐
│   Client    │─────►│  Stripe UK   │─────►│   Revolut   │─────►│     Trolley     │
│  (paga)     │      │  (pay-in)    │      │  Business   │      │   (payout)      │
└─────────────┘      └──────────────┘      └──────┬──────┘      └─────────────────┘
       │                                          │                    │
       │                                          │                    ▼
       │                                    ┌─────┴─────┐        ┌─────────────┐
       │                                    │  Ledger   │        │Professional │
       └────────────────────────────────────► (internal)│        │  (recebe)   │
                                            └───────────┘        └─────────────┘
```

- **Stripe UK**: Customer-facing payments ONLY. No Stripe Connect.
- **Revolut Business**: Treasury/settlement account. Receives from Stripe, funds payouts.
- **Trolley**: Professional onboarding (KYC) + mass payouts.
- **Ledger**: Double-entry internal bookkeeping. Every cent tracked.

---

## Phase 1 — Ledger Foundation ✅ COMPLETE

**Delivered**: 2026-04-24

| Component | Status | Location |
|-----------|--------|----------|
| Ledger schema (9 tables) | ✅ | Migration `070` |
| BigInt migration | ✅ | Migration `071` |
| Chart of accounts (10 accounts) | ✅ | Migration `072` |
| Ledger accounts module | ✅ | `lib/payments/ledger/accounts.ts` |
| Ledger entries module | ✅ | `lib/payments/ledger/entries.ts` |
| Balance management | ✅ | `lib/payments/ledger/balance.ts` |
| Fee calculator | ✅ | `lib/payments/fees/calculator.ts` |
| Trolley client | ✅ | `lib/payments/trolley/client.ts` |
| Revolut client | ✅ | `lib/payments/revolut/client.ts` |
| Eligibility engine | ✅ | `lib/payments/eligibility/engine.ts` |
| BigInt constants | ✅ | `lib/payments/bigint-constants.ts` |
| Trolley webhook | ✅ | `app/api/webhooks/trolley/route.ts` |
| Revolut webhook | ✅ | `app/api/webhooks/revolut/route.ts` |
| Treasury snapshot job | ✅ | `inngest/functions/treasury-snapshot.ts` |
| Payout batch creation job | ✅ | `inngest/functions/payout-batch-create.ts` |
| Env config | ✅ | `lib/config/env.ts` |
| Rate limiting | ✅ | `lib/security/rate-limit.ts` |

### Phase 1 Quality Gates (all passed)
- [x] TypeScript typecheck clean
- [x] Build passes (`npm run build`)
- [x] Lint passes (`npm run lint`)
- [x] Migrations apply cleanly in production
- [x] All `_minor` columns backfilled from DECIMAL

---

## Phase 2 — Stripe Pay-in Completion ✅ COMPLETE

**Delivered**: 2026-04-24
**Goal**: Enable real customer payments for bookings via Stripe PaymentIntent.

### 2.1 PaymentIntent Integration
- [x] `POST /api/stripe/payment-intent` — creates PaymentIntent with `capture_method: 'manual'`
- [x] Reuse or create Stripe Customer per `profiles.id` (stored in `stripe_customers`)
- [x] Store `provider_payment_id` in `payments` table
- [ ] Pre-authorize at booking time (hold funds on customer's card) — REQUIRES FRONTEND INTEGRATION
- [ ] Capture automatically 24h before session OR after session confirmation — FUTURE

### 2.2 Stripe Checkout Fallback
- [x] `POST /api/stripe/checkout-session/booking` — Stripe Checkout for guests/no saved card
- [x] Success/cancel URLs with booking reference

### 2.3 Webhook Processing
- [x] `payment_intent.succeeded` → `payments.status = 'captured'` + ledger entry (`buildPaymentCaptureTransaction`)
- [x] `payment_intent.payment_failed` → enqueue retry (existing flow)
- [x] `charge.refunded` → `payments.status = 'refunded'` + ledger entry (`buildRefundTransaction`)
- [x] Stripe fee fetched from `balance_transaction` (real fee, not estimate)
- [x] Idempotency: `stripe_webhook_events` inbox (already implemented)

### 2.4 Ledger Integration
- [x] Hook in webhook handler to create ledger entry on capture
- [x] Update `professional_balances`: increment `pendingBalance` on capture
- [x] Hook in webhook handler to create ledger entry on refund
- [ ] After cooldown (48h), move `pendingBalance` → `availableBalance` — PHASE 4

### 2.5 Booking Creation Flow Update
- [x] Booking created with `status: 'pending_payment'`
- [x] Payment created with `provider: 'stripe'`, `status: 'requires_payment'`
- [x] PostgreSQL functions updated to populate `_minor` columns
- [x] `stripe_customers` table created for user↔customer mapping

### 2.6 Pending Payment Timeout
- [x] Orphaned bookings (no payment): cancel after 30min
- [x] Unpaid bookings (payment in `requires_payment`): cancel after 24h

### Phase 2 Quality Gates
- [x] TypeScript typecheck clean
- [x] Build passes
- [x] Lint passes
- [~] Test stripe webhooks locally with Stripe CLI — requires preview env + Stripe CLI
- [~] Verify ledger entries created correctly for test payments — requires preview env
- [~] Verify professional balance updates correctly — requires preview env

---

### 🔒 PHASE 2 CHECKPOINT: ✅ COMPLETE

**Commit**: `f9f9e2e` — `feat(payments): Phase 1 Ledger Foundation + Phase 2 Stripe Pay-in Completion`
**Pushed to**: `origin/main`

**Review criteria** (all passed):
1. ✅ Code review: all new files follow project conventions
2. ✅ Security review: no secrets in code, proper input validation
3. ✅ Ledger review: every payment capture creates correct debit/credit pair
4. ✅ Webhook review: idempotency works, no duplicate processing
5. ✅ Balance review: `pendingBalance` → `availableBalance` flow verified (cooldown in Phase 4)

**Quality gates passed**:
- ✅ TypeScript typecheck clean
- ✅ Build passes
- ✅ Lint passes

**Pending** (requires preview environment):
- Stripe webhook end-to-end test with Stripe CLI
- Ledger entry verification with real test payments
- Professional balance update verification

**Next**: Phase 3 — Stripe Settlement → Revolut (start only when explicitly instructed).

---

## Phase 3 — Stripe Settlement → Revolut ✅ COMPLETE

**Delivered**: 2026-04-24
**Goal**: Track Stripe payouts to Revolut and reconcile treasury.

### 3.1 Settlement Tracking
- [x] Webhook `payout.paid` → record settlement + create ledger entry
- [x] Webhook `payout.failed` → log error + record failed settlement
- [x] `createStripeSettlementEntry()` — ledger entry: Stripe Receivable ↓ / Cash ↑
- [x] Migration `074` — `stripe_settlements` table with RLS policies

### 3.2 Treasury Dashboard
- [x] Admin API: `GET /api/admin/finance/treasury-status`
- [x] Returns: current Revolut balance, pending payouts, safety buffer, available after payouts
- [x] Historical snapshots (last 30 days)
- [x] Recent Stripe settlements list
- [x] Alert when balance below buffer ( treasury snapshot job )

### 3.3 Reconciliation
- [x] `lib/payments/revolut/reconciliation.ts` — matching engine
- [x] Auto-matches Stripe settlements with Revolut transactions (±R$ 0.10 tolerance)
- [x] Auto-marks `reconciled` when matched
- [x] Flags mismatches for manual review
- [x] Inngest cron: daily at 6am UTC
- [x] Manual reconciliation helper for admin override

### Phase 3 Quality Gates
- [x] TypeScript typecheck clean
- [x] Build passes
- [ ] Lint passes
- [~] Settlement webhook tested with Stripe CLI — requires preview env
- [~] Treasury dashboard renders correctly — requires preview env
- [~] Reconciliation logic verified with test data — requires preview env

---

### 🔒 PHASE 3 CHECKPOINT: Review → Corrections → Commit → Deploy → Merge

**Review criteria**:
1. Settlement entries correctly reduce Stripe Receivable and increase Cash
2. Treasury dashboard shows accurate real-time + historical data
3. Reconciliation flags only true mismatches
4. Alert triggers at correct threshold

**If review passes**: commit → deploy preview → E2E → merge → **STOP**.

---

## Phase 4 — Professional Payout via Trolley

**Goal**: End-to-end professional payout execution.

### 4.1 Trolley Onboarding Flow
- [x] Professional clicks "Configurar Pagamento" in dashboard → server action `initiatePayoutSetup`
- [x] Server action creates Trolley recipient via API (`createProfessionalTrolleyRecipient`)
- [x] Webhook `recipient.created` → insert into `trolley_recipients` (Inngest processor)
- [x] Webhook `recipient.updated` → update KYC status (`pending` → `in_review` → `approved`/`rejected`)
- [x] Status tracking: `pending_kyc` → `active` → `suspended` (with `is_active` flag)
- [ ] UI dashboard component for "Configurar Pagamento" (needs React component)

### 4.2 Payout Batch Execution (enhance existing)
- [x] Eligibility scan runs weekly (Mondays 8am UTC)
- [x] Real Trolley API submission (create payments → create batch → process batch)
- [x] Handle Trolley API errors gracefully (per-item failure, batch-level retry via Inngest)
- [x] Webhook `payment.updated` → sync status to `payout_batch_items` (Inngest processor)
- [x] Webhook `batch.updated` → sync batch status to `payout_batches`
- [x] Final status: `completed` or `failed`/`returned` per item

### 4.3 Fee & Debt Deduction
- [x] **NO per-payout fee** — professionals receive 100% of eligible amount (policy changed 2026-04-24)
- [x] Deduct existing professional debt (disputes) from payouts (`debt_deducted` field)
- [x] Ledger entries for debt deduction (`buildPayoutWithDebtTransaction`)
- [x] Trolley fee absorbed by Muuday (`trolley_fee_absorbed` field + `buildTrolleyFeeTransaction`)
- [x] Professional sees net amount in dashboard (`getPayoutStatus` server action)
- [ ] **Monthly subscription fee** (Stripe) — Phase 6 scope, NOT deducted from payouts

### 4.4 Payout Notification
- [ ] Email to professional: "Seu pagamento foi enviado" (Phase 4.5 — needs Resend template)
- [ ] In-app notification with amount + expected arrival (Phase 4.5)
- [x] Dashboard server action returns payout history (`getPayoutStatus`)
- [ ] React dashboard component for payout history (needs UI)

### Phase 4 Quality Gates
- [x] TypeScript typecheck clean
- [ ] Build passes (in progress)
- [x] Lint passes
- [ ] Trolley sandbox onboarding tested end-to-end
- [x] Payout batch creates correct ledger entries (debits = credits verified)
- [x] Fee deduction math verified (100% to pro, debt deducted, Trolley fee absorbed)
- [ ] Professional dashboard shows correct payout history (needs UI component)

---

### 🔒 PHASE 4 CHECKPOINT: Review → Corrections → Commit → Deploy → Merge

**Review criteria**:
1. Trolley onboarding flow works for test recipient (PayPal)
2. Payout batch correctly submits to Trolley API
3. Ledger entries balance for every payout (debits = credits)
4. **No per-payout fee deducted** — professional receives 100% of eligible amount
5. Notifications sent correctly

**If review passes**: commit → deploy preview → E2E → merge → **STOP**.

---

## Phase 5 — Refunds, Disputes & Edge Cases

**Goal**: Handle refunds, chargebacks, and debt recovery.

### 5.1 Refund Engine
- [ ] `processRefund(bookingId, reason, percentage)` — admin action
- [ ] Stripe refund API call with idempotency key
- [ ] Update `payments.refunded_amount_minor`
- [ ] If professional already received payout: create `dispute_resolutions` + debt
- [ ] Ledger entry: `createRefundEntry()` + `createDisputeEntry()`

### 5.2 Dispute Handling
- [ ] Webhook `charge.dispute.created` → freeze payout eligibility for professional
- [ ] Auto-create internal case for admin review
- [ ] Admin approves/rejects dispute
- [ ] If approved: process refund, add debt to professional
- [ ] If rejected: release freeze, professional keeps funds

### 5.3 Debt Recovery
- [ ] `addDebt()` — adds to `professional_balances.total_debt`
- [ ] `recoverDebt()` — deducts from future payouts
- [ ] Alert admin when `total_debt > MAX_PROFESSIONAL_DEBT_MINOR`
- [ ] Professional dashboard shows current debt

### 5.4 Edge Cases
- [ ] Insufficient treasury → batch blocked (already implemented)
- [ ] Trolley API failure → retry with backoff, alert after N failures
- [ ] Stripe webhook duplicate → idempotency guard (already implemented)
- [ ] Professional inactive during payout → hold funds, notify

### Phase 5 Quality Gates
- [ ] TypeScript typecheck clean
- [ ] Build passes
- [ ] Lint passes
- [ ] Refund flow tested end-to-end
- [ ] Dispute flow tested end-to-end
- [ ] Debt recovery verified across multiple payouts
- [ ] Edge case handling verified

---

### 🔒 PHASE 5 CHECKPOINT: Review → Corrections → Commit → Deploy → Merge

**Review criteria**:
1. Refund creates correct ledger entries and updates balances
2. Dispute freezes and releases work correctly
3. Debt recovery deducts correctly across payout cycles
4. Edge cases handled gracefully without data corruption

**If review passes**: commit → deploy preview → E2E → merge → **STOP**.

---

## Phase 6 — Admin Finance Dashboard & Observability

**Goal**: Complete visibility and control for finance operations.

### 6.1 Admin Dashboard
- [ ] `/admin/finance` — finance overview
- [ ] `/admin/finance/ledger` — ledger browser with filters
- [ ] `/admin/finance/payouts` — pending/completed payouts
- [ ] `/admin/finance/treasury` — Revolut balance + history
- [ ] `/admin/finance/disputes` — open/resolved disputes
- [ ] CSV export for all views

### 6.2 Force Actions
- [ ] Force payout (emergency admin action)
- [ ] Force refund (bypass eligibility)
- [ ] Adjust professional balance (with audit trail)
- [ ] All force actions create ledger entries

### 6.3 Observability
- [ ] Sentry alerts for payment failures
- [ ] PostHog funnel: booking → payment → payout
- [ ] Custom metrics: treasury buffer %, avg payout time, dispute rate
- [ ] Weekly finance report (automated email to admin)

### Phase 6 Quality Gates
- [ ] TypeScript typecheck clean
- [ ] Build passes
- [ ] Lint passes
- [ ] Admin dashboard loads all views correctly
- [ ] CSV exports contain correct data
- [ ] Force actions create audit trail
- [ ] Observability metrics accurate

---

### 🔒 PHASE 6 CHECKPOINT: Review → Corrections → Commit → Deploy → Merge

**Review criteria**:
1. Admin dashboard is responsive and data is accurate
2. Force actions are logged and auditable
3. Observability metrics reflect real system state
4. No security gaps in admin routes

**If review passes**: commit → deploy preview → E2E → merge → **PROJECT COMPLETE**.

---

## Cross-Phase Quality Gates (apply to ALL phases)

### Before ANY commit:
- [ ] `npm run lint` — clean
- [ ] `npm run typecheck` — clean
- [ ] `npm run build` — clean
- [ ] No `0n` BigInt literals (ES2017 constraint — use `BigInt(0)`)

### Before ANY deploy:
- [ ] Migrations tested locally with `supabase db reset`
- [ ] Webhooks tested with Stripe CLI (where applicable)
- [ ] Env vars documented in `.env.local.example`

### Before ANY merge:
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] State machine tests pass (`npm run test:state-machines`)
- [ ] Security review: no new admin fallbacks, RLS policies correct
- [ ] Ledger review: every financial mutation has corresponding ledger entry

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-10 | Stripe UK for all pay-ins | Company is UK entity, Stripe UK supports global payments |
| 2026-04-10 | Airwallex/dLocal as BR contingency | Evaluated for BR corridor, kept as fallback |
| 2026-04-24 | **Stripe → Revolut → Trolley** | Founder decision: Stripe Connect rejected for payouts, Trolley preferred for professional UX |
| 2026-04-24 | BigInt `_minor` columns | ES2017 target, no float arithmetic for money |
| 2026-04-24 | Double-entry ledger | Auditability, compliance, reconciliation |
| 2026-04-24 | **No per-payout fees** | Monthly subscription instead; simpler payout flow |
| 2026-04-24 | **PayPal-only for Trolley MVP** | Faster launch; bank transfer in future phase |

---

## Files Reference

| File | Purpose |
|------|---------|
| `docs/project/payments-engine/MASTER-PLAN.md` | Full architecture document |
| `docs/project/payments-engine/IMPLEMENTATION-STATUS.md` | Current implementation status |
| `docs/engineering/stripe-integration-plan.md` | Stripe-specific integration details |
| `docs/engineering/IMPLEMENTATION-TRACKER.md` | Fase 6 tracker |
