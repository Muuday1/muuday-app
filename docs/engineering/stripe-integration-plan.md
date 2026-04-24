# Stripe Integration Plan

Last updated: 2026-04-10

Source: `docs/spec/source-of-truth/part3-payments-billing-revenue-engine.md`

## Decision update (2026-04-24) - canonical payments routing

This file applies to the **Stripe UK pay-in rail** only. Payouts are handled by Trolley, not Stripe Connect.

Canonical routing rule:
1. **Customer pay-in**: Stripe UK for ALL customers (regardless of professional country).
2. **Treasury/Settlement**: Revolut Business account receives Stripe payouts.
3. **Professional payout**: Trolley (mass payouts, KYC, tax forms). NOT Stripe Connect.
4. **BR contingency**: Airwallex or dLocal as fallback if Trolley fails for BR corridor.
5. **Ledger**: Internal double-entry ledger tracks every movement (Stripe Receivable → Cash → Professional Payable).

### Wave 3 implementation lock (operational)

1. Stripe webhooks handled in UK rail:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payout.paid`
2. Settlement ownership:
   - Stripe settles to Revolut Business account (configured in Stripe Dashboard).
   - Revolut balance is snapshotted every 15 minutes via Inngest.
   - Treasury sufficiency formula ensures balance ≥ pending payouts + safety buffer.
3. Payout lifecycle:
   - Weekly eligibility scan (Mondays 8am UTC) creates `payout_batches`.
   - Treasury check verifies Revolut balance before Trolley submission.
   - Trolley processes payouts to professional bank accounts.
   - Ledger entries track every debit/credit.
4. Failover policy:
   - If Trolley fails for BR corridor, activate Airwallex/dLocal contingency.
   - If Revolut balance insufficient, batch status → `insufficient_funds` (blocked, not partial).

## Background Job Resilience Foundation â€” Implemented (code level)

Delivered in repository (pending migration apply in production):

- Migration: `db/sql/migrations/023-wave3-stripe-job-resilience-foundation.sql`
  - `stripe_webhook_events` (idempotent webhook inbox with retry metadata)
  - `stripe_payment_retry_queue`
  - `stripe_subscription_check_queue`
  - `stripe_job_runs`
- Webhook route now verifies signature and persists/enqueues:
  - `app/api/webhooks/stripe/route.ts`
- Inngest workers added:
  - `process-stripe-webhook-inbox`
  - `stripe-weekly-payout-eligibility-scan`
  - `stripe-subscription-renewal-checks`
  - `stripe-failed-payment-retries`

Important boundary: this foundation is orchestration-only. It does not yet execute real payout transfers or full Stripe billing lifecycle mutations.

## Legacy UK->BR Stripe-only note (historical, superseded by entity-based rail decision)

All questions answered by Stripe. Summary:

| Question | Answer |
|----------|--------|
| UK platform â†’ BR Express accounts | **Supported** |
| Separate Charges and Transfers | **Supported** (UK + BR both listed) |
| BR payout currency | **BRL** â€” charges settle in GBP on platform, transfers settle in BRL on connected account |
| Payout timing for BR accounts | **Automatic daily only** â€” cannot be set to manual or weekly. Use Balance Settings API for minimum balances. |
| PayPal for UK platform | **Supported** |
| Fallback needed? | **No** â€” corridor is fully supported |

### Critical constraint: BR daily automatic payouts

The Part 3 spec defines "weekly payout cycle" (Section 2.4, 11.1). **This conflicts with Stripe's Brazil requirement of automatic daily payouts.**

**Adapted architecture:**
- Platform still controls WHEN to create the Transfer (48h after session + eligibility check + BRL 100 minimum).
- Once the Transfer is created to the connected account, Stripe pays out daily automatically.
- The "weekly batch" becomes a "weekly transfer eligibility scan" â€” the app decides when to move money from platform to connected account, but once moved, Stripe pays out daily.
- This is functionally equivalent: professional doesn't get money until the app creates the Transfer. The daily payout just means the connected account balance drains daily instead of weekly.
- **No product behavior change** â€” professional still sees "payout eligible after 48h" and money arrives after the weekly scan transfers it.

### Currency flow (confirmed)

```
Customer (any currency) â†’ PaymentIntent â†’ Platform account (settles GBP)
                                              â†“
                                     Transfer (app-controlled timing)
                                              â†“
                              Connected account (settles BRL, auto daily payout)
```

---

## Rule-by-rule Stripe compatibility assessment

Each rule from Part 3 is classified as:
- **Works** â€” Stripe supports natively, standard implementation
- **Works with config** â€” Stripe supports but needs specific setup/configuration
- **Confirmed** â€” Previously "Needs Stripe validation", now confirmed working
- **Needs alternative** â€” Stripe alone does not solve this; custom code or third-party required

---

### 1. Platform entity and funds flow

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 2.1 | UK platform entity, Brazil professionals, global customers | **Needs Stripe validation** | Cross-border Connect UKâ†’BR is not guaranteed self-serve. Must send validation packet to Stripe. |
| 2.2 | Muuday charges customer, repasses to professional later | **Works** | Standard marketplace model with Separate Charges and Transfers. |
| 2.3 | Charge at booking time (not auth/hold) | **Works** | `PaymentIntent` with `capture_method: 'automatic'` (default). |
| 2.6 | Separate Charges and Transfers | **Works** | `stripe.paymentIntents.create()` on platform, then `stripe.transfers.create()` later. |
| 2.7 | Express-style connected accounts | **Works with config** | Use `type: 'express'` in `stripe.accounts.create()`. Hosted onboarding via Account Links. |

**Action items:**
- [x] Send validation packet to Stripe â€” **CONFIRMED 2026-04-01**. Corridor supported. No fallback needed.
- [x] UK platform â†’ BR Express accounts â€” **Confirmed**
- [x] BR payout currency BRL â€” **Confirmed**
- [x] No volume/corridor restrictions reported
- [ ] Request appropriate capabilities for connected accounts during onboarding

---

### 2. Payout rules

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 2.4 | Payout eligible 48h after session end | **Works with config** | Don't transfer until 48h. Custom logic in app, not Stripe-native. Transfer created by Inngest cron job. |
| 2.4 | Weekly payout cycle | **Adapted** | BR accounts have mandatory daily auto-payout. App controls Transfer timing (weekly scan), not payout schedule. Once transferred, Stripe pays out daily. Functionally equivalent. |
| 2.4 | Minimum payout BRL 100 equivalent | **Needs custom code** | Stripe has no native minimum payout threshold. App must accumulate and only create transfer when threshold is met. |
| 2.4 | Rollover if minimum not met | **Needs custom code** | Track accumulated eligible amount in internal ledger. Transfer only when >= BRL 100 equiv. |
| 11.6 | Payout failure: 7-day fix window, then block new bookings | **Needs custom code** | Listen to `payout.failed` webhook. App enforces the grace period and booking block. |

**Action items:**
- [ ] Build `payout_eligibility` table: `(booking_id, session_end_utc, eligible_at_utc, amount, status)`
- [ ] Build weekly Inngest cron: scan eligible payouts, accumulate per professional, create transfer if >= threshold
- [ ] Listen to `payout.failed` webhook â†’ trigger grace period logic

---

### 3. Customer charging and checkout

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 2.9 | Customer fee: 8% + processing cost, shown as single total | **Works** | Calculate total server-side. Pass to `PaymentIntent.amount`. Customer never sees breakdown. |
| 2.11 | Payment methods: Cards, Apple Pay, Google Pay, Link, PayPal | **Works with config** | Use Stripe Elements (Payment Element) â€” supports all these out of the box. PayPal requires Stripe PayPal integration (available in some regions). |
| 2.18 | Save payment method with opt-in | **Works** | `setup_future_usage: 'off_session'` on PaymentIntent when customer opts in. |
| 2.18 | No surprise off-session charges in MVP | **Works** | Simply don't charge saved methods off-session. Only use for faster checkout. |
| 6.1 | Customer sees only final total, no fee breakdown | **Works** | UI-only rule. Don't display breakdown. |
| 8.1 | Saved methods for faster checkout, not off-session charge | **Works** | Use `PaymentMethod` attached to `Customer`. Present as default in future checkout. |

**Action items:**
- [ ] Use Stripe Payment Element (not Card Element) for maximum method coverage
- [ ] Confirm PayPal availability for UK platform entity
- [ ] Server-side fee calculation: `total = base_price * 1.08 + stripe_processing_estimate`

---

### 4. Booking-specific payment flows

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 5.1 | One-off booking: charge upfront, transfer after 48h post-session | **Works** | Standard `PaymentIntent` â†’ delayed `Transfer`. |
| 5.2 | Manual-accept: charge upfront, refund if professional declines/expires | **Works** | Create `PaymentIntent`. If booking expires after 48h, create `Refund`. |
| 5.3 | Request booking: payment link for specific proposal, expires in 24h | **Works with config** | Create `PaymentIntent` with `metadata.proposal_id`. Expire via app logic (cancel PI if unpaid after 24h). |
| 5.4 | Monthly recurring: customer pays cycle upfront, payout per-session | **Needs custom code** | Stripe Billing can handle the recurring charge. But session-level payout release is 100% custom app logic. Stripe has no concept of "pay per session within a subscription cycle." |

**Action items:**
- [ ] One-off: `PaymentIntent` â†’ webhook `payment_intent.succeeded` â†’ confirm booking â†’ schedule transfer after session+48h
- [ ] Manual-accept timeout: Inngest job at 48h â†’ if not accepted â†’ `stripe.refunds.create()`
- [ ] Request booking: `PaymentIntent` with 24h expiry â†’ `payment_intent.canceled` if not paid
- [ ] Monthly: Use `Stripe Billing Subscription` for the customer-facing charge cycle. Build internal `session_payout_tracker` for per-session release logic.

---

### 5. Cancellation and refund rules

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 2.5 | Hybrid cancellation: Muuday keeps a share in retained scenarios | **Needs custom code** | Stripe refunds are full or partial. App calculates the correct partial refund amount based on cancellation policy. |
| 2.10 | Refunds go back to original payment method | **Works** | Default Stripe behavior. `stripe.refunds.create({ payment_intent })`. |
| 2.10 | No platform wallet/credit in MVP | **Works** | Don't build wallet. Just use Stripe refunds. |
| 2.17 | Only admin executes manual refunds/adjustments | **Works** | Restrict refund API calls to admin server actions. |
| 9.3A | Cancellation before transfer: simple refund | **Works** | `stripe.refunds.create()` â€” no transfer reversal needed. |
| 9.3B | Cancellation after transfer: reverse transfer + refund | **Works with config** | `stripe.transfers.createReversal()` then `stripe.refunds.create()`. Must handle partial amounts. |
| 9.5 | Monthly partial refund: admin-only, per unused session | **Needs custom code** | Calculate refund amount from session-level accounting. Stripe just processes the refund amount. |
| 9.6 | Professional debt after refund: recover from future payouts, then card | **Needs custom code** | Track debt in ledger. Deduct from next transfer. If no payouts pending, charge card via `PaymentIntent` off-session (if card saved). |

**Action items:**
- [ ] Build cancellation fee calculator (policy rules â†’ refund amount)
- [ ] Build transfer reversal logic for post-transfer cancellations
- [ ] Build professional debt tracker in internal ledger

---

### 6. Disputes

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 10.1 | Both customer and professional can open disputes, 48h window | **Needs custom code** | Stripe disputes are card-issuer disputes (chargebacks). In-app disputes are a separate system. Muuday's 48h dispute window is internal, not Stripe's. |
| 10.2 | Evidence hierarchy for disputes | **Needs custom code** | For Stripe chargebacks: submit evidence via `stripe.disputes.update()`. For internal disputes: build case queue (Wave 4). |
| 10.4 | Session data captured for disputes | **Needs custom code** | Join/presence logs, messages, timestamps â€” all app-side. Stripe only knows about the payment. |
| 10.5 | Admin case/ticket system for disputes | **Needs custom code** | Build in Wave 4. Stripe has no built-in case queue. |

**Important distinction:**
- **Stripe disputes** = chargebacks initiated by the card issuer. You respond with evidence. Stripe handles the flow.
- **Muuday disputes** = in-app complaints. You handle the resolution and optionally refund. Stripe is not involved unless you issue a refund.

**Action items:**
- [ ] Build internal dispute system (Wave 4 scope, not Wave 3)
- [ ] For Wave 3: handle Stripe chargebacks via `charge.dispute.created` webhook
- [ ] Freeze payouts for disputed bookings (hold transfer until resolution)

---

### 7. Professional subscription billing

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 2.8 | 3-month free trial, then card-on-file monthly billing | **Works** | Stripe Billing with `trial_period_days: 90` or `trial_end` timestamp. |
| 2.8 | 7-day grace on payment failure, then block | **Works with config** | Stripe has built-in `past_due` status + configurable retry. App listens to `invoice.payment_failed` and enforces booking block after 7 days. |
| 12.1 | Basic / Professional / Premium tiers | **Works** | Create 3 Stripe Products with monthly + annual Prices each. |
| 12.4 | Upgrade immediate, downgrade next cycle | **Works** | `stripe.subscriptions.update()` with `proration_behavior: 'create_prorations'` for upgrade, `billing_cycle_anchor: 'unchanged'` + schedule for downgrade. |
| 12.5 | Pause profile = pause billing | **Works with config** | `stripe.subscriptions.update({ pause_collection: { behavior: 'void' } })`. Resume when profile unpauses. |
| 12.5 | Cancel = end of current cycle + block new bookings | **Works** | `stripe.subscriptions.update({ cancel_at_period_end: true })`. |
| 6.5 | Annual pricing = 10× monthly | **Works** | Create annual Price with 10× monthly amount baked in (customer pays for 10 months, gets 12). |
| 2.20 | Recover professional debt from payouts, then card | **Needs custom code** | Stripe doesn't auto-deduct debt from Connect transfers. App must track debt and offset from next transfer amount. |

**Action items:**
- [ ] Create Stripe Products: `muuday-basic`, `muuday-professional`, `muuday-premium`
- [ ] Create Prices: monthly + annual for each product (6 total)
- [ ] Build subscription lifecycle: create â†’ trial â†’ active â†’ past_due â†’ canceled
- [ ] Listen to webhooks: `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

### 8. Currency, FX, and international pricing

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 2.12 | Base currency BRL for professional catalog | **Works** | Store prices in BRL internally. |
| 2.12 | Customer pays in local currency | **Needs custom code** | Stripe charges in the currency you specify. But FX conversion is YOUR responsibility. Stripe does not auto-convert displayed prices. |
| 7.1 | BRL base, localized display | **Needs custom code** | App must: (1) store base price in BRL, (2) convert to customer currency using exchange rates, (3) charge Stripe in customer currency. |
| 7.4 | Ledger stores base, display, and payout amounts | **Needs custom code** | Internal ledger must record all three currency layers per transaction. |
| 7.5 | Consistent currency throughout funnel | **Needs custom code** | UI rule: once customer picks currency, show that everywhere. Lock conversion rate at checkout. |

**Critical FX decision:**

| Option | Pros | Cons |
|--------|------|------|
| **A. Stripe Adaptive Pricing** | Stripe handles FX automatically, shows local prices | Only works with Stripe Checkout (hosted page), not Elements. Less control over rates. |
| **B. App-managed FX** | Full control over rates and margins. Works with any UI. | Must maintain exchange rate table. Risk of stale rates. Must handle FX margin. |
| **C. Charge everything in BRL** | Simplest. No FX complexity. | Bad UX for international customers. Card issuer does FX with worse rates. |

**Recommendation:** Start with **Option B** (app-managed FX) since you already have currency selector and the spec requires full control. Use a free exchange rate API (e.g., exchangerate.host, Open Exchange Rates free tier) via cron refresh.

**Action items:**
- [ ] Build `exchange_rates` table with cron refresh (already planned for Wave 2 close)
- [ ] At checkout: lock rate, calculate customer amount, store both in ledger
- [ ] Charge Stripe in customer's selected currency
- [ ] Transfer to professional in BRL (or professional's base currency)

---

### 9. Monthly/recurring client billing

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 13.1 | Support one-off, one-off+recurring, monthly subscription | **Works with config** | One-off: PaymentIntent. Recurring: Stripe Billing Subscription. Mixed: both. |
| 13.2 | Auto-renew by default | **Works** | Stripe subscriptions auto-renew by default. |
| 13.3 | Customer can disable auto-renew, current cycle continues | **Works** | `cancel_at_period_end: true`. |
| 13.4 | Failed renewal: next cycle not confirmed | **Works** | Stripe marks subscription `past_due`. App blocks session confirmation. |
| 13.5 | Reserved slots release if payment not completed | **Needs custom code** | Stripe has no slot concept. App must release reserved slots when subscription payment fails after deadline. |
| 13.6 | Customer pause for one cycle, professional can accept/refuse | **Needs custom code** | Stripe pause exists but doesn't have accept/refuse. Build as app-level negotiation, then `pause_collection` on Stripe if accepted. |
| 13.7 | Monthly payout: per-session release, not full month | **Needs custom code** | Stripe transfers are amount-based. App must calculate per-session eligible amount and create partial transfers weekly. |
| 13.8 | Professional can change future pricing, customer gets notice | **Needs custom code** | Create new Stripe Price, schedule subscription update for next cycle. Send notification via app. |

**Action items:**
- [ ] Model recurring booking as Stripe Subscription with custom metadata
- [ ] Build session-level payout tracker (decoupled from subscription charge)
- [ ] Build pause negotiation flow (app-side, Stripe pause on acceptance)

---

### 10. Receipts, visibility, and exports

| # | Rule | Stripe status | Notes |
|---|------|--------------|-------|
| 14.1 | Customer sees payments, refunds, receipts | **Works with config** | Stripe generates receipts. Also store in app for in-platform access. Enable `receipt_email` on PaymentIntent. |
| 14.2 | Professional sees net earnings with expandable breakdown | **Needs custom code** | Stripe dashboard shows some info, but professional needs app-side view with Muuday-specific breakdown. |
| 14.3 | Admin sees full picture | **Needs custom code** | Build admin financial dashboard pulling from internal ledger + Stripe API. |
| 14.5 | Export: professional gets CSV of earnings | **Needs custom code** | Query internal ledger, generate CSV. Stripe has no built-in export for connected accounts. |

---

## Summary: what works vs what needs discussion

### Works out of the box (16 rules)
- Separate Charges and Transfers
- Express connected accounts
- Charge at booking time
- Refund to original payment method
- Payment Element (cards, Apple Pay, Google Pay, Link)
- Save payment methods with opt-in
- Professional subscription with trial
- Subscription upgrade/downgrade/pause/cancel
- Annual pricing with discount
- Auto-renew subscriptions
- Customer-facing single total (no breakdown)
- Receipt emails
- Chargeback response flow
- Manual refunds (admin-only)
- Cancellation refunds (pre-transfer)
- Transfer reversals (post-transfer)

### Works but needs custom app code (14 rules)
- 48h delayed payout (app schedules transfers)
- Minimum BRL 100 payout threshold (app accumulates)
- Weekly payout batch (Inngest cron)
- Cancellation fee calculation (policy â†’ amount)
- Professional debt recovery from payouts
- Monthly per-session payout release
- Currency conversion / FX management
- Ledger with 3 currency layers
- Internal dispute system
- Payout failure grace period
- Recurring slot release on payment failure
- Recurring pause negotiation
- Professional earnings dashboard
- Financial data export

### Stripe validation â€” ALL CONFIRMED (2026-04-01)
1. ~~UK platform â†’ Brazil professional payout corridor~~ â€” **Confirmed.** Express accounts in BR supported.
2. ~~PayPal availability~~ â€” **Confirmed.** PayPal available for UK Stripe accounts.
3. ~~Cross-border payout currency~~ â€” **Confirmed.** Transfers settle in BRL for BR connected accounts.

### Adapted rules (1 constraint discovered)
1. **BR accounts have mandatory daily automatic payouts.** Original spec said "weekly payout cycle". Adapted: app controls Transfer timing (weekly eligibility scan), Stripe handles daily payout from connected account balance. No product behavior change for professionals.

### Remaining contingency (1)
1. **If per-session payout within subscription is too complex for MVP:** Simplify to cycle-level payout (pay professional after full month + 48h of last session). Document as V2 improvement.

---

## Implementation sequence

### Phase 1: Foundation (Track A â€” in progress)
1. ~~Send Stripe validation packet~~ â€” **CONFIRMED 2026-04-01**
2. Install Stripe MCP server for Claude Code
3. ~~`npm install stripe`~~ â€” **Done** (v21.0.1)
4. ~~Create Stripe account~~ â€” **Done**. Enable Connect in Dashboard.
5. Create Products/Prices for professional subscriptions (Basic/Professional/Premium Ã— monthly/annual)
6. Database migration: payment tables + internal ledger
7. Webhook endpoint skeleton with signature verification
8. ~~Add env vars to `.env.local`~~ â€” **Done** (test mode keys)

### Phase 2: One-off payments (Week 2-3)
9. Payment Element checkout for one-off bookings
10. Webhook endpoint with signature verification
11. `payment_intent.succeeded` â†’ confirm booking
12. Manual-accept timeout â†’ auto-refund
13. Request-booking payment link with 24h expiry
14. Cancellation refund flow (pre-transfer)

### Phase 3: Transfers and payouts (Week 3-4)
15. Inngest weekly payout cron
16. 48h eligibility check
17. Minimum threshold accumulation
18. Transfer creation
19. Payout failure handling
20. Transfer reversal for post-transfer cancellations
21. Professional debt tracking + offset

### Phase 4: Professional subscriptions (Week 4-5)
22. Subscription creation with 90-day trial
23. Upgrade/downgrade flows
24. Payment failure â†’ grace â†’ block logic
25. Pause/cancel flows
26. Professional billing dashboard

### Phase 5: Recurring client billing (Week 5-6)
27. Stripe Subscription for recurring clients
28. Session-level payout tracker
29. Auto-renew / disable-renew
30. Pause negotiation flow
31. Slot release on payment failure

### Phase 6: Polish (Week 6-7)
32. FX rate locking at checkout
33. Receipt delivery
34. Professional earnings view + export
35. Admin financial dashboard
36. Chargeback evidence submission

---

## Env vars to add

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
# NOTA: Stripe Connect NÃO é usado. Payouts são via Trolley.
```

## Stripe webhooks to listen to

| Event | Action |
|-------|--------|
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Confirm booking, create ledger entry (`createPaymentCapturedEntry`) |
| `payment_intent.payment_failed` | Mark booking payment failed, notify user |
| `charge.refunded` | Update `payments.refunded_amount_minor`, create ledger entry (`createRefundEntry`) |
| `charge.dispute.created` | Freeze payout eligibility, create internal case |
| `charge.dispute.closed` | Release or deduct payout, update ledger |
| `payout.paid` | Stripe settled to Revolut — create ledger entry (`createStripeSettlementEntry`) |
| `payout.failed` | Alert admin, mark settlement as failed |
| `invoice.payment_failed` | Professional sub: start grace, block bookings |
| `customer.subscription.updated` | Sync plan state |
| `customer.subscription.deleted` | Mark plan canceled, enforce block |

> **Nota:** `transfer.*` e `account.updated` foram removidos — não usamos Stripe Connect. Payouts são orquestrados via Trolley.



---

## Revolut Business Integration (Treasury)

### Purpose
Revolut Business serves as the **treasury/settlement account** between Stripe pay-ins and Trolley payouts.

### Flow
1. Stripe UK settles processed charges to the linked Revolut Business account (typically T+7).
2. Inngest captures Revolut balance every 15 minutes (`treasury-balance-snapshot`).
3. Before each payout batch, the system verifies: `Revolut balance ≥ batch total + MINIMUM_TREASURY_BUFFER_MINOR`.
4. If insufficient: batch is blocked with status `insufficient_funds` and admin is alerted.
5. If sufficient: batch proceeds to Trolley submission.

### Env vars
```
REVOLUT_API_KEY=...
REVOLUT_WEBHOOK_SECRET=...
REVOLUT_ACCOUNT_ID=...
```

### Key files
- `lib/payments/revolut/client.ts` — API client
- `inngest/functions/treasury-snapshot.ts` — balance capture
- `app/api/webhooks/revolut/route.ts` — webhook receiver

---

## Trolley Integration (Payout)

### Purpose
Trolley handles **professional onboarding, KYC, and mass payouts**. It replaces Stripe Connect for provider-facing transfers.

### Why Trolley over Stripe Connect
- Profissionais **não precisam criar conta Stripe** (menor fricção de onboarding).
- Melhores taxas para corridors internacionais (UK → BR/MX).
- Tax forms automáticos (W-8BEN, W-9) para compliance IRS.
- Suporte a múltiplos rails (ACH, SEPA, transferência bancária local).

### Flow
1. Profissional completa KYC no Trolley (embed ou redirect).
2. Trolley webhooks (`recipient.created`, `recipient.updated`) sync to `trolley_recipients` table.
3. Weekly eligibility scan creates `payout_batches` + `payout_batch_items`.
4. Treasury check passes → batch submitted to Trolley API.
5. Trolley webhooks (`payment.updated`) sync status back to `payout_batch_items`.
6. Ledger entries created for every payout (`createPayoutEntry`).

### Fee Structure (Muuday absorbs Trolley fees)
| Professional Periodicity | Muuday Fee (deducted from payout) |
|--------------------------|-----------------------------------|
| Weekly | R$ 15,00 |
| Bi-weekly | R$ 10,00 |
| Monthly | R$ 5,00 |

### Env vars
```
TROLLEY_API_KEY=...
TROLLEY_API_SECRET=...
TROLLEY_WEBHOOK_SECRET=...
```

### Key files
- `lib/payments/trolley/client.ts` — API client
- `lib/payments/eligibility/engine.ts` — payout eligibility criteria
- `inngest/functions/payout-batch-create.ts` — weekly batch creation
- `app/api/webhooks/trolley/route.ts` — webhook receiver

---

## Ledger Double-Entry (Internal)

### Chart of Accounts (10 accounts)
| Code | Name | Type |
|------|------|------|
| 1000 | Cash | Asset |
| 1100 | Stripe Receivable | Asset |
| 2000 | Professional Payable | Liability |
| 2100 | Customer Deposits | Liability |
| 4000 | Platform Fee Revenue | Revenue |
| 5000 | Stripe Fee Expense | Expense |
| 5100 | Trolley Fee Expense | Expense |
| 5200 | FX Cost Expense | Expense |
| 3000 | Professional Balance | Equity |
| 3100 | Professional Debt | Equity |

### Transaction Templates
- `createPaymentCapturedEntry()` — Customer pays → Stripe Receivable + Customer Deposits
- `createStripeSettlementEntry()` — Stripe settles → Cash + Stripe Receivable
- `createPayoutEntry()` — Pay professional → Professional Payable + Cash
- `createDisputeEntry()` — Dispute after payout → Professional Debt + Customer Deposits
- `createRefundEntry()` — Refund → Customer Deposits + Stripe Receivable

### Key files
- `lib/payments/ledger/accounts.ts` — chart of accounts
- `lib/payments/ledger/entries.ts` — entry creation + templates
- `lib/payments/ledger/balance.ts` — professional balance management
- `lib/payments/fees/calculator.ts` — fee calculation

---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
