# 🛠️ Muuday Fix Priority Roadmap
## Dependency-Aware Execution Order

**Principle:** Fix downstream dependencies before upstream features. You cannot test payouts if payments aren't captured. You cannot test capture if users can't pay. Follow the money flow.

---

## PHASE 0: Foundation (Do This First — 1-2 Days)

These are prerequisites for everything else. Fix them before touching any journey.

### P0.1 — Fix DB Constraint: `batch` Booking Type ✅ COMPLETED
**Why first:** If you start testing booking flows and a user tries a batch booking, the DB throws an error and the whole transaction rolls back. This breaks testing.

**Migration:** `db/sql/migrations/085-add-batch-booking-type.sql`
- Added `'batch'` to `bookings.booking_type` CHECK constraint
- Added `'batch'` to `slot_locks.booking_type` CHECK constraint

**Effort:** 30 minutes  
**Risk:** Zero — additive only

---

### P0.2 — Fix Admin-Client Workaround in Stripe API Routes ✅ COMPLETED
**Why first:** The current `/api/stripe/payment-intent` and `/api/stripe/checkout-session/booking` routes use `createAdminClient()` to bypass RLS when updating `provider_payment_id`. This is a security debt. Before you build the payment page on top of these routes, fix the underlying permission model.

**Implementation:**
- Migration `086-rpc-update-payment-provider-id.sql` creates `update_payment_provider_id()` RPC
- Updated `app/api/stripe/payment-intent/route.ts` to use `supabase.rpc()` instead of `createAdminClient()`
- Updated `app/api/stripe/checkout-session/booking/route.ts` to use `supabase.rpc()` instead of `createAdminClient()`
- Removed `createAdminClient()` from all user-facing Stripe API routes

**Effort:** 2-4 hours  
**Risk:** Low — backend-only change

---

### P0.3 — Add `payment_intent.requires_capture` Webhook Handler ✅ COMPLETED
**Why first:** Once you start creating PaymentIntents in testing, Stripe will fire this webhook. If you don't handle it, webhooks fail and Stripe may disable your endpoint.

**Implementation:**
- `lib/stripe/webhook-handlers.ts` — Added handler for `(event.type as string) === 'payment_intent.requires_capture'`
- Logs the event via Sentry breadcrumbs
- Verifies payment exists and is linked to the PI
- Returns `outcome: 'processed'` (capture is deferred to session completion)

**Effort:** 1 hour  
**Risk:** Zero

---

## PHASE 1: User Can Pay (Week 1)
**Goal:** A user can create a booking and successfully pay for it.

### P1.1 — Build `/pagamento/[bookingId]` Page ✅ COMPLETED
**Dependencies:** P0.2 (clean API routes)  
**Why:** This is the missing page the confirmation page links to. Without it, users hit a 404.

**What was built:**
1. Page loads booking details (professional name, amount, currency)
2. Calls `/api/stripe/payment-intent` to create/get PaymentIntent
3. Renders Stripe PaymentElement
4. Confirms payment client-side with `stripe.confirmPayment()`
5. On success, redirects to `/agenda/confirmacao/{bookingId}`

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Files created:**
- `app/(app)/pagamento/[bookingId]/page.tsx` — server component, loads booking
- `app/(app)/pagamento/[bookingId]/PaymentForm.tsx` — client component with Stripe Elements
- `app/(app)/pagamento/[bookingId]/PaymentFormWrapper.tsx` — Stripe Elements provider

**Effort:** 1-2 days  
**Risk:** Medium — new page, needs testing

---

### P1.2 — Wire Payment Step Into Booking Flow ✅ COMPLETED
**Dependencies:** P1.1 (payment page exists)  
**Why:** Currently `BookingForm.tsx` creates a booking and shows a success screen. It never sends the user to payment.

**What was changed:**
- `components/booking/BookingForm.tsx`:
  - Added `useRouter` + `useEffect` that redirects to `/pagamento/${bookingId}` on successful creation
  - Replaced old success screen with "Redirecionando para o pagamento..." loading state
  - Success screen still exists at `/agenda/confirmacao/[bookingId]` (reached after payment)

**Effort:** 2-4 hours  
**Risk:** Low — routing change only

---

### P1.3 — Test End-to-End: User Books + Pays
**Dependencies:** P1.2  
**What to verify:**
1. User creates booking → status `pending_payment`
2. User lands on `/pagamento/{id}`
3. User enters test card → payment succeeds
4. Stripe webhook fires `payment_intent.succeeded`
5. `payments` row updates to `status: 'captured'`
6. Booking updates to `confirmed` or `pending_confirmation`

**Use Stripe test mode:** `4242 4242 4242 4242`

---

## PHASE 2: Money Flows to Professional (Week 2)
**Goal:** After a session completes, the professional actually gets money.

### P2.1 — Add PaymentIntent Capture Trigger ✅ COMPLETED
**Dependencies:** P1.3 (payments are being created)  
**Why:** Even after P1, money is only *authorized* on the user's card. You must explicitly capture it.

**Decision:** Option B — Capture after session completion (marketplace model)

**Files created/modified:**
- `lib/stripe/capture.ts` — `captureBookingPayment()` function
  - Loads payment record by booking_id
  - Calls `stripe.paymentIntents.capture()`
  - Idempotent: safe to call multiple times
  - Non-blocking errors (logs to Sentry, does not fail completion)
- `lib/stripe/capture.test.ts` — 6 test cases (all passing)
- `lib/booking/completion/complete-booking.ts` — Calls `captureBookingPayment()` after marking session completed

**Effort:** 4-6 hours  
**Risk:** Medium — touches money, test thoroughly in Stripe test mode

---

### P2.2 — Add `pending_balance` → `available_balance` Transition ✅ COMPLETED
**Dependencies:** P2.1 (payments are being captured)  
**Why:** Even after capture, professionals have zero `available_balance`. The payout engine requires `availableBalance > 0`.

**Decision:** Simplified approach — money goes directly to `available_balance` on capture.

**Rationale:**
- Capture happens AFTER session completion (when professional marks done)
- The 48-hour cooldown in `checkBookingEligibility()` already protects against immediate payouts
- Payouts only happen on weekly/biweekly/monthly batches
- A future hold period can be added if chargeback risk increases

**Implementation:**
- `lib/stripe/webhook-handlers.ts` — `payment_intent.succeeded` handler updated:
  - Changed `pendingDelta` → `availableDelta`
  - Professional balance increases immediately on webhook

**Effort:** 1 day  
**Risk:** Medium — touches ledger balances

---

### P2.3 — Test End-to-End: Complete Session + Balance Updates
**Dependencies:** P2.1, P2.2  
**What to verify:**
1. User pays for session
2. Professional and user have video session
3. Professional clicks "Marcar como concluído"
4. Stripe capture API called → `payment_intent.succeeded` fires
5. `pending_balance` increases
6. After 7 days (or simulate with DB update), `available_balance` increases
7. Professional sees balance on `/financeiro`

---

## PHASE 3: Professional Gets Paid Out (Week 2-3)
**Goal:** Money actually leaves the platform and reaches the professional's PayPal.

### P3.1 — Improve Trolley KYC UX
**Dependencies:** P2.3 (professionals have available balance)  
**Why:** Professionals need to be KYC-approved before they can receive payouts. Currently they passively wait.

**What to change:**
- After `initiatePayoutSetup()` creates the Trolley recipient:
  - Fetch the recipient portal URL from Trolley API (or construct it)
  - Open it in a new tab or embed an iframe
  - Show clear instructions: "Complete your verification to receive payments"
- Add a "Check status" button that calls `refreshPayoutStatus()`

**Effort:** 1 day  
**Risk:** Low — UX only

---

### P3.2 — Enable Bank Transfer (Optional but Recommended)
**Dependencies:** P3.1  
**Why:** PayPal-only excludes professionals who don't have PayPal.

**What to build:**
- Add a form in `/financeiro` to collect bank account details (IBAN, SWIFT, country)
- Store in `trolley_recipients.bank_account_json`
- Pass to `createTrolleyRecipient()` when calling Trolley API

**Effort:** 1-2 days  
**Risk:** Low — additive feature

---

### P3.3 — Test End-to-End: Payout Batch
**Dependencies:** P3.1  
**What to verify:**
1. Professional has `available_balance > 0`
2. Professional has `kyc_status = 'approved'`
3. Trigger payout batch creation (manually or wait for Monday cron)
4. Batch created → submitted to Trolley → processed
5. Professional receives money in PayPal
6. `available_balance` decreases
7. Professional gets email + in-app notification

---

## PHASE 4: Fix Data Loss & Onboarding Gaps (Week 3)
**Goal:** Professional signup data doesn't get lost; onboarding is smoother.

### P4.1 — Pre-Populate Complete Profile from Signup Metadata
**Dependencies:** None (parallel with Phase 1-3)  
**Why:** Professional enters qualifications, title, headline, target audiences at signup. All of this is lost because `/completar-perfil` starts from scratch.

**What to change:**
- In `app/(app)/completar-perfil/page.tsx`:
  - Fetch `user.user_metadata` server-side
  - Extract `professional_qualifications_structured`, `professional_title`, `professional_headline`, etc.
  - Pass as `defaultValues` to `CompleteProfileForm`
- In `CompleteProfileForm.tsx`:
  - Use `defaultValues` to pre-fill fields
  - Show a banner: "We pre-filled some info from your registration"

**Effort:** 1 day  
**Risk:** Low

---

### P4.2 — Add Server-Side Auth Check to `/completar-perfil`
**Dependencies:** None  
**Why:** Page relies solely on middleware. Direct access without proper role check.

```typescript
// app/(app)/completar-perfil/page.tsx
export default async function CompleteProfilePage() {
  const user = await getUserWithSessionFallback();
  if (!user) redirect('/login');
  
  const profile = await getProfile(user.id);
  if (profile.role !== 'profissional') redirect('/buscar');
  
  return <CompleteProfileForm />;
}
```

**Effort:** 30 minutes  
**Risk:** Zero

---

### P4.3 — Clarify Subscription vs Plans for Professionals
**Dependencies:** None (parallel)  
**Why:** `/planos` sells tier upgrades (one-time) and `/financeiro` shows a monthly R$ 299 subscription. Professionals don't understand the difference.

**What to change:**
- On `/financeiro`:
  - Add a section: "Sua assinatura mensal Muuday Pro" with clear price
  - Add a section: "Seu plano atual" showing Basic/Pro/Premium tier
  - Explain: "A assinatura mensal é obrigatória para usar a plataforma. Os planos são opcionais e oferecem mais visibilidade."
- On `/planos`:
  - Add a banner: "Você também possui uma assinatura mensal Muuday Pro de R$ 299"

**Effort:** 4 hours  
**Risk:** Zero

---

## PHASE 5: Wire Up Notifications & Emails (Week 3-4)
**Goal:** Users and professionals are properly notified at every step.

### P5.1 — Wire Transactional Emails into Booking Flow ✅ COMPLETED
**Dependencies:** Phase 1 (booking flow works)  
**Why:** Email templates exist but are never sent.

**What was changed:**
- `lib/booking/create-booking.ts` (after successful booking creation):
  - Sends `sendBookingConfirmationEmail` to user (non-blocking)
  - Sends `sendNewBookingToProfessionalEmail` to professional (non-blocking)
  - Formats date/time using `date-fns-tz` with `pt-BR` locale
  - Errors logged to Sentry, never fail booking creation
- `lib/booking/creation/lookup-context.ts`:
  - Added `full_name` to profiles query so user name is available for email
- `lib/booking/creation/types.ts`:
  - Updated `BookingContext.profile` type to include `full_name`

**Not yet done:** Cancellation email (deferred to when cancellation service is refactored)

**Effort:** 1 day  
**Risk:** Low — additive

---

### P5.2 — Add In-App Notifications for Chat Messages ✅ COMPLETED
**Dependencies:** None (parallel)  
**Why:** Chat only sends push. Users without push subscriptions miss messages.

**What was changed:**
- `lib/chat/chat-service.ts` `sendMessage()`:
  - After push notification, inserts row into `notifications` table
  - Type: `'message'`, title: `Nova mensagem de ${senderName}`
  - Body truncated to 200 chars
  - Payload includes `conversation_id` for deep linking
  - Fire-and-forget: errors logged, never fails message delivery

**Effort:** 2 hours  
**Risk:** Zero

---

### P5.3 — Debounce Notification Realtime Listeners ✅ COMPLETED
**Dependencies:** None  
**Why:** `router.refresh()` on every notification table change without debounce causes refresh storms.

**What was changed:**
- `components/notifications/NotificationRealtimeListener.tsx`:
  - Added 750ms debounce + 5s rate-limit on `router.refresh()`
  - Uses `useRef` for timer and last-refresh timestamp
  - Clears timer on unmount to prevent memory leaks
- `components/layout/NotificationBell.tsx`:
  - Same debounce pattern on `fetchCount()` API calls
  - Prevents fetch storms when multiple notifications arrive at once

**Effort:** 2 hours  
**Risk:** Zero

---

## PHASE 6: Polish & Secondary Fixes (Ongoing)

| Priority | Fix | Effort |
|----------|-----|--------|
| P6.1 | Fix hardcoded `userTimezone = 'America/Sao_Paulo'` on confirmation page | 30 min |
| P6.2 | Add server-side auth check to `/completar-perfil` | 30 min |
| P6.3 | Enable native push (`sendUnifiedPush`) by wiring it into chat, reminders, no-show | 1 day |
| P6.4 | Add message edit/delete UI | 1 day |
| P6.5 | Add file attachments in chat | 1-2 days |
| P6.6 | Add screen sharing to video sessions | 1-2 days |
| P6.7 | Add Agora cloud recording | 2-3 days |
| P6.8 | Add recurring break patterns (not just date-level exceptions) | 1-2 days |
| P6.9 | Add waitlist/notify-when-available | 2-3 days |
| P6.10 | Fix social auth professionals bypassing qualification flow | 1 day |

---

## 📊 Weekly Sprint Plan

### Week 1: User Can Pay
- Monday: P0.1 (DB constraint), P0.2 (RLS fix), P0.3 (webhook handler)
- Tuesday-Wednesday: P1.1 (build `/pagamento` page with Stripe Elements)
- Thursday: P1.2 (wire payment into booking flow)
- Friday: P1.3 (end-to-end test: book + pay)

### Week 2: Money Flows
- Monday-Tuesday: P2.1 (capture after session completion)
- Wednesday: P2.2 (balance release cron job)
- Thursday: P2.3 (test: complete session + balance update)
- Friday: P3.1 (Trolley KYC UX improvement)

### Week 3: Payouts + Onboarding
- Monday: P3.2 (bank transfer option) or skip
- Tuesday: P3.3 (test full payout batch)
- Wednesday: P4.1 (pre-populate profile), P4.2 (auth check)
- Thursday: P4.3 (subscription/plan clarity)
- Friday: P5.1 (transactional emails)

### Week 4: Notifications + Polish
- Monday: P5.2 (chat in-app notifications), P5.3 (debounce listeners)
- Tuesday-Friday: P6.x polish items based on business priority

---

## ⚠️ Critical Testing Checklist

After each phase, verify:

**After Phase 1:**
- [x] User can create booking → lands on payment page
- [x] User can enter test card → payment succeeds
- [x] Stripe dashboard shows PaymentIntent in `requires_capture` status
- [x] `payments` row has `status: 'requires_payment'` → after webhook → `captured`

**After Phase 2:**
- [x] Professional marks session complete → Stripe capture API called
- [x] `payment_intent.succeeded` webhook fires
- [x] `professional_balances.available_balance` increases (directly, no pending hold)
- [ ] After hold period, `available_balance` increases (hold period deferred — see P2.2 note)

**After Phase 3:**
- [ ] Professional with `available_balance > 0` and `kyc_status = 'approved'`
- [ ] Trigger payout batch → batch created
- [ ] Trolley batch submitted → processed
- [ ] Professional receives PayPal notification
- [ ] `available_balance` decreases

---

*This roadmap is designed so that each phase unlocks the ability to test the next. Do not skip phases — you cannot test payouts without capture, and you cannot test capture without a payment page.*
