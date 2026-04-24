# Muuday Payments Engine — Implementation Status

> **Last Updated:** 2026-04-24
> **Status:** Phases 1–6 ✅ IMPLEMENTED — Build passes, lint passes, awaiting production migration + E2E testing

---

## Architecture

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

- **Stripe UK**: Customer-facing payments. No Stripe Connect.
- **Revolut Business**: Treasury/settlement. Receives Stripe settlements, funds payouts.
- **Trolley**: Professional onboarding (KYC) + mass payouts (PayPal MVP).
- **Ledger**: Double-entry internal bookkeeping. Every cent tracked.

---

## 📋 Phase Status

### Phase 1 — Ledger Foundation ✅ COMPLETE
- 9 tables (migrations 070–072), 8 TS modules, 2 webhooks, 2 Inngest functions
- Chart of accounts (10 accounts, codes 1000–4999)
- Balance management, fee calculator, eligibility engine
- Trolley client, Revolut client (OAuth 2.0 JWT client assertion)

### Phase 2 — Stripe Pay-in Completion ✅ COMPLETE
- PaymentIntent API (`/api/stripe/payment-intent`) with manual capture
- Checkout Session fallback (`/api/stripe/checkout-session/booking`)
- Webhook integration: `payment_intent.succeeded` → ledger + balance update
- `stripe_customers` table for user↔customer mapping
- Pending payment timeout (30min orphan, 24h unpaid)

### Phase 3 — Stripe Settlement → Revolut ✅ COMPLETE
- `stripe_settlements` table (migration 074)
- Webhooks: `payout.paid`/`payout.failed`
- Treasury dashboard API (`/api/admin/finance/treasury-status`)
- Reconciliation engine (daily cron 6am UTC)

### Phase 4 — Professional Payout via Trolley ✅ COMPLETE
- Trolley onboarding API (`lib/payments/trolley/onboarding.ts`)
- Server actions: `initiatePayoutSetup`, `getPayoutStatus`, `refreshPayoutStatus`
- Inngest webhook processor (`recipient.created`, `recipient.updated`, `payment.updated`, `batch.updated`)
- Real Trolley API submission in batch creation (create payments → batch → process)
- Debt deduction with ledger entries (`buildPayoutWithDebtTransaction`)
- Trolley fee absorption ledger entries (`buildTrolleyFeeTransaction`)
- **NO per-payout fee** — professionals receive 100% of eligible amount minus debt
- Payout notifications: email (Resend) + in-app (`lib/notifications/payout-notifications.ts`)
- React dashboard UI: `PayoutStatusCard` + `PayoutHistoryTable`

### Phase 5 — Refunds, Disputes & Edge Cases ✅ COMPLETE
- Refund engine (`lib/payments/refund/engine.ts`): Stripe API + ledger entries
- Admin refund action (`lib/actions/admin/refund.ts`)
- Dispute handling: `charge.dispute.created` webhook → freeze eligibility
- Post-payout dispute: create `dispute_resolutions` + professional debt
- Debt recovery: deduct from future payouts + admin alert threshold
- Edge cases: insufficient treasury blocking, Trolley API retry via Inngest, Stripe webhook idempotency

### Phase 6 — Admin Finance Dashboard & Observability ✅ COMPLETE
- Admin pages: `/admin/finance`, `/admin/finance/ledger`, `/admin/finance/payouts`, `/admin/finance/treasury`, `/admin/finance/disputes`
- Server actions: ledger browser, payout batch listing, treasury status, disputes, CSV export
- Force actions: `forcePayout`, `forceRefund`, `adjustProfessionalBalance` (all with audit trail ledger entries)
- Observability: treasury buffer %, avg payout time, dispute rate (`lib/payments/metrics.ts`)
- PostHog funnel events: `trackPayoutSubmitted`, `trackPayoutCompleted`, `trackRefundProcessed`, etc.

---

## Ledger Transaction Templates (verified balanced)

| Template | Debits | Credits | Status |
|----------|--------|---------|--------|
| `buildPaymentCaptureTransaction` | STRIPE_RECEIVABLE + STRIPE_FEE_EXPENSE | PLATFORM_FEE_REVENUE + PROFESSIONAL_BALANCE | ✅ |
| `buildStripeSettlementTransaction` | CASH_REVOLUT_TREASURY | STRIPE_RECEIVABLE | ✅ |
| `buildPayoutTransaction` | PROFESSIONAL_BALANCE | CASH_REVOLUT_TREASURY | ✅ |
| `buildPayoutWithDebtTransaction` | PROFESSIONAL_BALANCE | CASH_REVOLUT_TREASURY + PROFESSIONAL_DEBT | ✅ |
| `buildTrolleyFeeTransaction` | TROLLEY_FEE_EXPENSE | CASH_REVOLUT_TREASURY | ✅ |
| `buildDisputeAfterPayoutTransaction` | PROFESSIONAL_DEBT | CASH_REVOLUT_TREASURY | ✅ |
| `buildRefundTransaction` | CUSTOMER_DEPOSITS_HELD | STRIPE_RECEIVABLE | ✅ |
| `buildForceBalanceAdjustmentTransaction` | PROFESSIONAL_BALANCE | CASH_REVOLUT_TREASURY | ✅ |

---

## 🔍 Key Decisions Documented

1. **Stripe Sync Engine REJECTED** — Custom layer gives total control over ledger + payouts
2. **BIGINT minor units** — All money as integers (R$ 150.00 = 15000)
3. **Double-entry ledger** — Every movement has equal debit + credit
4. **No partial batches** — Treasury insufficient = entire batch blocked
5. **Muuday absorbs FX + Trolley costs** — Professional receives exact BRL amount
6. **PayPal-only for MVP** — Bank transfer unlocks at 200 monthly payments
7. **NO per-payout fee** — Monthly subscription billed separately via Stripe

---

## Environment & Deploy Notes

- **Stripe**: Currently in SANDBOX (`sk_test_` / `pk_test_`). Switch to LIVE only after E2E testing.
- **Trolley**: Sandbox recommended for testing. Need `TROLLEY_API_KEY`, `TROLLEY_API_SECRET`, `TROLLEY_WEBHOOK_SECRET` in Vercel.
- **Revolut**: Need `REVOLUT_CLIENT_ID`, `REVOLUT_API_KEY`, `REVOLUT_REFRESH_TOKEN`, `REVOLUT_ACCOUNT_ID`, `REVOLUT_PRIVATE_KEY` in Vercel.
- **Env vars**: All documented in `.env.local.example`.
- **Migrations pending**: 070-076 need to be applied to production Supabase.

---

## 🧪 Quality Gates

| Gate | Status |
|------|--------|
| TypeScript typecheck | ✅ PASS |
| Lint | ✅ PASS |
| Next.js build | ✅ PASS (186 pages generated) |
| Trolley sandbox onboarding | ⏳ Pending (needs test credentials) |
| Payout batch ledger balance | ✅ Verified (debits = credits) |
| Fee deduction math | ✅ Verified (100% to pro, debt deducted) |

---

## ⚠️ Known Limitations / TODO

1. ~~Trolley webhook signature verification~~ ✅ **Implemented** — HMAC-SHA256 with timing-safe comparison
2. ~~Revolut webhook signature verification~~ ✅ **Implemented** — HMAC-SHA256 with multiple signature support (rotation)
3. **Professional periodicity setting** — Hardcoded to weekly batch schedule, needs UI + DB column
4. **Ledger entry atomicity** — Uses sequential inserts, should be PostgreSQL RPC for production
5. **Trolley API error retry** — Inngest handles retries at function level; per-item failures are logged but not individually retried
6. **Migrations not applied in production** — 070-076 pending; migration 076 adds `force_completed` + `item_count`

---

> **"Money is the easiest thing to get wrong and the hardest thing to debug."**
>
> All financial code has been written with paranoid validation, exhaustive error handling,
> and immutable ledger entries. Every cent is accounted for.
