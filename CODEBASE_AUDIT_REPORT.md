# 🔬 Muuday App — Comprehensive Codebase Audit Report
**Date:** 2026-05-01  
**Scope:** Full end-to-end journey analysis (Auth → Booking → Payment → Session → Payout → Messaging → Notifications)  
**Methodology:** Deep static analysis of Next.js app, Supabase schema, API routes, components, Inngest functions, and third-party integrations (Stripe, Trolley, Agora, Resend).

---

## 📋 Executive Summary

| Area | Status | Verdict |
|------|--------|---------|
| Authentication & Registration | 🟢 Functional | Solid, well-secured |
| User Finds Professional | 🟢 Functional | Search + profile pages work |
| Booking & Scheduling | 🟢 Mostly Functional | One critical schema mismatch |
| User Payment for Session | 🔴 **BROKEN** | Missing payment page + no Stripe capture |
| Professional Subscription | 🟡 Partial | Backend complete, UI trigger unclear |
| Professional Payout Onboarding | 🟡 Partial | Trolley integrated, KYC UX gap |
| Money Flow (User → Pro) | 🔴 **BROKEN** | Two fatal gaps prevent all revenue |
| Video Session Execution | 🟢 Functional | Agora integration works well |
| Messaging (Chat) | 🟢 Functional | Production-ready, minor gaps |
| Alerts & Notifications | 🟢 Mostly Functional | In-app + push work, some wiring gaps |

### 🔴 Two Fatal Issues
1. **Payments are NEVER captured** — Stripe PaymentIntents use `capture_method: 'manual'` but no code ever calls `stripe.paymentIntents.capture()`. Money stays as an authorization and auto-expires after ~7 days.
2. **`pending_balance` is NEVER moved to `available_balance`** — Even if capture worked, professionals could never receive payouts because no code transitions balances.

**Until these two gaps are fixed, ZERO revenue will flow through the platform.**

---

## 🛡️ Journey 1: Authentication & Registration

### User Registration (`usuario`)
| Step | Status | Details |
|------|--------|---------|
| Signup page `/cadastro` | ✅ Works | Multi-step form with password strength |
| Email confirmation | ✅ Enforced | Required before login |
| Social auth | ✅ Works | Google, Facebook, Apple (users only) |
| Welcome email | ✅ Sent | Via Resend |
| Post-login redirect | ✅ Correct | `/buscar-auth` or safe path |

### Professional Registration (`profissional`)
| Step | Status | Details |
|------|--------|---------|
| Signup page `/cadastro?role=profissional` | ✅ Works | Extensive multi-step form |
| Qualifications/terms collection | ✅ Works | 4 mandatory terms, scroll-to-accept |
| Post-signup redirect | ✅ Works | `/cadastro/profissional-em-analise` |
| Admin review queue | ⚠️ Unverified | `professional_applications` table exists but auto-population from signup metadata is not verified in code |
| Complete account `/completar-conta` | ✅ Works | Country/timezone/currency collection |
| Complete profile `/completar-perfil` | ⚠️ Gap | Does NOT pre-populate from signup metadata (qualifications, title, headline, target audiences may be orphaned) |
| Dashboard onboarding tracker | ✅ Works | 9 stages, 4 gates, progress cards |

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1.1 | 🟡 Medium | Professional signup metadata (qualifications, terms, etc.) stored in `user_metadata` but `/completar-perfil` does not read it | `components/auth/CompleteProfileForm.tsx` |
| 1.2 | 🟡 Medium | No server-side auth check on `/completar-perfil` page | `app/(app)/completar-perfil/page.tsx` |
| 1.3 | 🟡 Medium | Social auth users selecting "professional" bypass the extensive qualification/terms flow | `app/auth/callback/route.ts` |
| 1.4 | 🟢 Low | Professional stays logged in after signup (unlike users who are signed out) — may cause auth confusion | `components/auth/SignupForm.tsx` |

---

## 🔍 Journey 2: User Finds a Professional

| Step | Status | Details |
|------|--------|---------|
| Search `/buscar` | ✅ Works | PostgreSQL trigram fuzzy search, filters, sorting, pagination |
| Professional profile `/profissional/[id]` | ✅ Works | UUID + slug support, SEO-friendly, reviews, services, recommendations |
| Currency conversion | ✅ Works | Real-time exchange rates from Supabase |
| Visibility gating | ✅ Works | `is_publicly_visible` + computed fallback |

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 2.1 | 🟡 Medium | Search pagination loads all candidates in-memory; API uses cursor but page doesn't | `app/buscar/page.tsx` |

---

## 📅 Journey 3: Booking a Session

### User Booking Flow
| Step | Status | Details |
|------|--------|---------|
| Booking page `/agendar/[id]` | ✅ Works | Calendar picker, timezone toggle, conflict checking |
| Availability engine | ✅ Works | Rules + exceptions + external calendar blocking |
| Slot locking | ✅ Works | 10-min TTL prevents race conditions |
| Recurring bookings | ✅ Works | Parent/child model with cancellation scopes |
| Request/negotiation flow | ✅ Works | Open → offered → accepted/declined |
| Atomic creation | ✅ Works | `createBookingWithPaymentAtomic` with rollback |

### Professional Availability Management
| Step | Status | Details |
|------|--------|---------|
| Availability editor `/disponibilidade` | ✅ Works | Weekly schedule, copy-day, buffer settings |
| External calendar sync | ✅ Partial | OAuth connect + enqueue exists; instant webhook push not found |
| Settings `/configuracoes-agendamento` | ✅ Works | Confirmation mode, cancellation policy, notice periods |

### Booking Lifecycle
| Step | Status | Details |
|------|--------|---------|
| Auto-accept | ✅ Works | Immediate `confirmed` status |
| Manual confirmation | ✅ Works | 24h SLA deadline, professional confirms via dashboard |
| Rescheduling | ✅ Works | Client-only, ≥24h notice, slot re-validation |
| Cancellation | ✅ Works | Time-based refund rules + Stripe refund + ledger entries |
| Timeout automation | ✅ Works | Cron auto-cancels expired pending-confirmation bookings |
| Reminders | ✅ Works | 24h, 1h, 10m before session via Inngest cron |

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 3.1 | 🔴 **Critical** | `batch` booking type supported in code but **rejected by DB constraint** | `bookings` table constraint |
| 3.2 | 🟡 Medium | Payment capture on completion — `complete-booking.ts` only updates status, does NOT capture Stripe PI | `lib/booking/completion/complete-booking.ts` |
| 3.3 | 🟡 Medium | No-show status exists but fee handling is minimal | `lib/booking/types.ts` |
| 3.4 | 🟡 Medium | Rescheduling recurring parents explicitly blocked | `lib/booking/reschedule.ts` |
| 3.5 | 🟡 Medium | Agenda confirmation page hardcodes `userTimezone = 'America/Sao_Paulo'` | `app/(app)/agenda/confirmacao/[bookingId]/page.tsx` |
| 3.6 | 🟢 Low | No waitlist/notify-when-available | N/A |
| 3.7 | 🟢 Low | No recurring break patterns (only date-level exceptions) | N/A |

---

## 💳 Journey 4: User Pays for a Session

### What's Implemented
| Component | Status | Details |
|-----------|--------|---------|
| Stripe PaymentIntent API | ✅ Backend exists | `POST /api/stripe/payment-intent` |
| Stripe Checkout Session | ✅ Backend exists | `POST /api/stripe/checkout-session/booking` |
| Payment record creation | ✅ Works | `payments` table inserted with `status: 'requires_payment'` |
| Webhook handlers | ✅ Implemented | `payment_intent.succeeded`, `payment_failed`, `charge.refunded`, etc. |
| Ledger entries on capture | ✅ Implemented | Double-entry journal created |

### What's Broken
| Component | Status | Details |
|-----------|--------|---------|
| **Payment page `/pagamento/[bookingId]`** | 🔴 **MISSING** | Confirmation page links to it but the route does NOT exist |
| **Stripe Elements frontend** | 🔴 **MISSING** | No React component uses `@stripe/stripe-js` or Stripe Elements |
| **Payment capture** | 🔴 **MISSING** | `capture_method: 'manual'` but **no code calls `.capture()`** |
| **Payment UI in BookingForm** | 🔴 **DISCONNECTED** | BookingForm creates booking but never initiates payment |

### The Fatal Flow Gap
```
User creates booking → booking status: pending_payment
  ↓
User sees confirmation page with "Pagar agora" button
  ↓
Button links to /pagamento/{bookingId} → 404 NOT FOUND ❌
  ↓
Even if they could pay, Stripe PI is confirmed but NOT captured ❌
  ↓
Funds auto-expire after ~7 days. Muuday receives $0.
```

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 4.1 | 🔴 **Critical** | Missing `/pagamento/[bookingId]` page — dead link on confirmation | `app/(app)/agenda/confirmacao/[bookingId]/page.tsx` |
| 4.2 | 🔴 **Critical** | No Stripe `.capture()` call anywhere in production code | Entire codebase |
| 4.3 | 🔴 **Critical** | No Stripe Elements/PaymentElement React component | Entire codebase |
| 4.4 | 🟡 Medium | `payment_intent.requires_capture` webhook not handled | `lib/stripe/webhook-handlers.ts` |
| 4.5 | 🟡 Medium | Admin client workaround in user-facing API routes (security debt) | `app/api/stripe/payment-intent/route.ts` |
| 4.6 | 🟡 Medium | Request-booking flow bypasses Stripe entirely (`provider: 'legacy'`, auto-marked `captured`) | `lib/booking/request-booking/accept-request.ts` |

---

## 🎥 Journey 5: Video Session Execution

| Component | Status | Details |
|-----------|--------|---------|
| Waiting room `/sessao/[id]` | ✅ Works | Countdown, pre-session checklist, mini-game |
| Video call (Agora) | ✅ Works | 1:1 WebRTC, token-based auth, provider-agnostic adapter pattern |
| Camera/mic toggles | ✅ Works | Mute/unmute, camera on/off |
| In-session chat | ✅ Works | Text chat alongside video |
| Session status tracking | ✅ Works | `waiting` → `in_progress` → `ended` |
| Screen sharing | ❌ Not implemented | No screen sharing UI or API calls |
| Recording | ❌ Not implemented | No Agora cloud recording integration |
| Token refresh | ⚠️ 2h expiry | Could cut off long sessions |
| Auto-completion | ❌ Manual only | Professional must click "Marcar como concluído" |

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 5.1 | 🟡 Medium | `startPublishing` is a no-op (TODO comment) — dynamic track republish may fail | `lib/session/adapters/agora.ts` |
| 5.2 | 🟡 Medium | Session end doesn't auto-clear status if user closes browser | `lib/session/session-service.ts` |
| 5.3 | 🟡 Medium | No background job to finalize `actual_ended_at` when both parties leave | N/A |
| 5.4 | 🟢 Low | No screen sharing or recording | N/A |

---

## 💰 Journey 6: Professional Receives Money

### Phase A: Professional Subscription (Paying Muuday)
| Component | Status | Details |
|-----------|--------|---------|
| Stripe subscription backend | ✅ Complete | `professional_subscriptions` table, webhooks, cron jobs, retries |
| Subscription UI `/financeiro` | ✅ Works | Status card, trial info, "Gerenciar pagamento" button |
| Stripe Billing Portal | ✅ Works | Professionals can update payment methods |
| Admin dashboard | ✅ Works | `/admin/finance/subscriptions` paginated table |
| Self-start subscription flow | ⚠️ Unclear | `createProfessionalSubscription()` appears designed for admin trigger, not self-service |
| Plan/tier page `/planos` | ✅ Works | One-time checkout for Basic/Pro/Premium tiers |
| **Confusion** | ⚠️ Significant | Two separate payment systems: tier plans (one-time) vs mandatory monthly subscription (R$ 299). Relationship is unclear to users. |

### Phase B: Professional Payout Onboarding (Receiving Money)
| Component | Status | Details |
|-----------|--------|---------|
| Trolley API client | ✅ Complete | HMAC-signed, full CRUD for recipients/batches/payments |
| Recipient creation | ✅ Works | `createProfessionalTrolleyRecipient()` — idempotent |
| KYC status sync | ✅ Works | Webhook + polling, maps Trolley status to local `kyc_status` |
| Professional UI `/financeiro` | ✅ Works | Balance grid, payout history, periodicity selector |
| Payout periodicity | ✅ Works | Weekly/biweekly/monthly |
| Onboarding tracker | ✅ Works | Payout receipt stage with subscription + payout + validation cards |

### Phase C: Payout Execution
| Component | Status | Details |
|-----------|--------|---------|
| Eligibility engine | ✅ Well-built | 48h cooldown, completed booking, captured payment, no disputes, KYC approved |
| Batch creation (Inngest) | ✅ Complete | Weekly cron, treasury check, atomic ledger entries |
| Trolley batch submission | ✅ Complete | Creates batch + payments, updates statuses |
| Webhook processing | ✅ Complete | Status sync, notifications, analytics |
| Double-entry ledger | ✅ Complete | Chart of accounts, atomic RPC, balance tracking |
| Revolut treasury | ✅ Complete | OAuth, balance checks, reconciliation |

### The Two Fatal Gaps
**Gap 1: No Payment Capture**
- PaymentIntents are created with `capture_method: 'manual'`
- User confirms payment → PI status: `requires_capture`
- **No code calls `stripe.paymentIntents.capture()`**
- `payment_intent.succeeded` never fires
- Webhook handler for "captured" never runs
- `pending_balance` is never increased

**Gap 2: No pending → available Balance Transition**
- Even if capture worked, `pending_balance` would increase
- **No code ever moves `pending_balance` → `available_balance`**
- Eligibility engine requires `availableBalance > 0`
- No professional ever qualifies for payout
- Payout batch creation scans find zero eligible professionals

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 6.1 | 🔴 **Critical** | No `stripe.paymentIntents.capture()` call | Entire codebase |
| 6.2 | 🔴 **Critical** | No `pending_balance` → `available_balance` transition | Entire codebase |
| 6.3 | 🟡 Medium | Trolley KYC is passive — no redirect to Trolley portal for immediate KYC completion | `components/finance/PayoutStatusCard.tsx` |
| 6.4 | 🟡 Medium | PayPal-only payouts — bank transfer in schema but not in UI | `trolley_recipients.payout_method` |
| 6.5 | 🟡 Medium | Subscription vs Plan confusion — professionals may not understand they pay both | `/planos` + `/financeiro` |
| 6.6 | 🟢 Low | `billing_card_on_file` sync duplicated in cron + webhooks | `lib/stripe/cron-jobs.ts` |

---

## 💬 Journey 7: Messaging (User ↔ Professional)

| Component | Status | Details |
|-----------|--------|---------|
| Conversation auto-creation | ✅ Works | DB trigger on booking `confirmed` status |
| Conversation list `/mensagens` | ✅ Works | Last message preview, unread badges, timestamps |
| Message thread `/mensagens/[id]` | ✅ Works | Optimistic UI, realtime delivery, auto-scroll |
| Supabase Realtime | ✅ Works | Replaces polling, live message delivery |
| Read receipts | ✅ Works | `last_read_at` timestamp, unread count |
| Push notifications | ✅ Works | Web push sent on new message |
| API routes | ✅ Works | CRUD + read, rate limited, CSRF protected |
| RLS policies | ✅ Works | Participants-only access |
| Dispute messaging | ✅ Works | Separate admin-mediated channel |

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 7.1 | 🟡 Medium | No in-app notification for chat messages (push-only) | `lib/chat/chat-service.ts` |
| 7.2 | 🟢 Low | No message edit/delete UI despite schema support | `messages.edited_at`, `messages.is_deleted` |
| 7.3 | 🟢 Low | No file/attachment support | N/A |
| 7.4 | 🟢 Low | No typing indicators | N/A |
| 7.5 | 🟢 Low | Dispute chat has no realtime (full page reload) | `components/disputes/CaseMessageForm.tsx` |

---

## 🔔 Journey 8: Alerts & Notifications

| Component | Status | Details |
|-----------|--------|---------|
| In-app notifications `/notificacoes` | ✅ Works | Tabs, grouped by date, mark read, real-time badge |
| Email notifications | ✅ Backend complete | 20+ Resend templates, action services |
| Push notifications (web) | ✅ Works | VAPID, retry logic, auto-cleanup |
| Push notifications (native) | ⚠️ Dormant | Expo path built but never called |
| Notification preferences | ✅ Works | Quiet hours, per-category channels |
| Booking reminders | ✅ Works | 24h, 1h, 10m via Inngest cron |
| Payout notifications | ✅ Works | Email + in-app on submitted/completed/failed |
| No-show notifications | ✅ Works | Auto-detect + push + in-app + dispute case creation |
| Real-time delivery | ⚠️ Missing debounce | `router.refresh()` on every change, no rate limit |

### Issues Found
| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 8.1 | 🟡 Medium | Realtime listeners not debounced — refresh storm risk | `NotificationRealtimeListener.tsx`, `NotificationBell.tsx` |
| 8.2 | 🟡 Medium | Transactional emails (booking confirmation, cancellation) defined but NOT auto-triggered in booking flow | `lib/email/templates/booking.ts` |
| 8.3 | 🟡 Medium | `sendUnifiedPush` (native mobile) implemented but never called | `lib/push/unified-sender.ts` |
| 8.4 | 🟡 Medium | Chat messages lack in-app notifications | `lib/chat/chat-service.ts` |
| 8.5 | 🟡 Medium | Push subscription toggle uses legacy `/api/push/subscribe` instead of v1 | `PushNotificationToggle.tsx` |
| 8.6 | 🟢 Low | Resend automation events may fire even when user opted out | Inngest functions |
| 8.7 | 🟢 Low | Missing RLS policies on `notifications` table | Schema |

---

## 📊 Severity Summary

### 🔴 Critical (Revenue-Blocking)
| # | Issue | Journey |
|---|-------|---------|
| C1 | Missing `/pagamento/[bookingId]` page — users cannot pay | 4 |
| C2 | No Stripe Elements frontend — no way to collect card details | 4 |
| C3 | No `stripe.paymentIntents.capture()` call — money never collected | 4, 6 |
| C4 | No `pending_balance` → `available_balance` transition — pros never get paid | 6 |
| C5 | `batch` booking type in code but rejected by DB constraint | 3 |

### 🟡 Medium (Significant Impact)
| # | Issue | Journey |
|---|-------|---------|
| M1 | Professional signup metadata not used by complete-profile flow | 1 |
| M2 | No server-side auth on `/completar-perfil` | 1 |
| M3 | Social auth professionals bypass qualification flow | 1 |
| M4 | Payment capture not triggered on booking completion | 3 |
| M5 | No-show fee handling minimal | 3 |
| M6 | Agenda confirmation hardcodes Sao Paulo timezone | 3 |
| M7 | Trolley KYC is passive (no portal redirect) | 6 |
| M8 | PayPal-only payouts (bank transfer not in UI) | 6 |
| M9 | Subscription vs Plan confusion for professionals | 6 |
| M10 | Realtime notification listeners not debounced | 8 |
| M11 | Transactional emails not auto-triggered in booking flow | 8 |
| M12 | Native push (`sendUnifiedPush`) never called | 8 |
| M13 | Chat lacks in-app notifications | 7, 8 |
| M14 | No `payment_intent.requires_capture` webhook handler | 4 |
| M15 | Admin client workaround in user-facing Stripe API routes | 4 |

### 🟢 Low (Polish/Enhancement)
| # | Issue | Journey |
|---|-------|---------|
| L1 | Professional stays logged in after signup (UX inconsistency) | 1 |
| L2 | Search pagination loads all candidates | 2 |
| L3 | Rescheduling recurring parents blocked | 3 |
| L4 | No waitlist/notify-when-available | 3 |
| L5 | No recurring break patterns | 3 |
| L6 | Buffer time not visually shown | 3 |
| L7 | No booking edit (notes/session purpose) | 3 |
| L8 | No screen sharing or recording | 5 |
| L9 | Agora token 2h expiry | 5 |
| L10 | `startPublishing` is no-op | 5 |
| L11 | No message edit/delete UI | 7 |
| L12 | No file attachments in chat | 7 |
| L13 | No typing indicators | 7 |
| L14 | Dispute chat no realtime | 7 |
| L15 | `billing_card_on_file` sync duplicated | 6 |
| L16 | Resend events may ignore opt-out | 8 |
| L17 | Missing RLS on `notifications` table | 8 |

---

## ✅ Architecture Strengths (Preserve These)

1. **Security-first auth** — Rate limiting, CSP nonces, CSRF validation, secure cookies, no session fallback
2. **RLS-hardened database** — Most tables properly secured, admin client used sparingly
3. **Double-entry ledger** — Proper chart of accounts, atomic transactions, balance tracking
4. **Slot-locking for bookings** — Prevents race conditions elegantly
5. **Provider-agnostic session adapter** — Clean abstraction around Agora
6. **Feature flags** — PostHog controls rollout safely
7. **Webhook idempotency** — Stripe + Trolley events deduplicated with retry logic
8. **Treasury reconciliation** — Revolut balance checks before payouts
9. **Cancellation policy engine** — Time-based refund rules with automatic Stripe refunds
10. **Inngest background jobs** — Well-organized cron + event-driven architecture

---

## 🗺️ Recommended Fix Roadmap

### Phase 1: Fix Revenue (Week 1-2) — **MUST DO BEFORE LAUNCH**
1. **Build `/pagamento/[bookingId]` page**
   - Load booking details
   - Initialize Stripe Elements (PaymentElement or CardElement)
   - Call `/api/stripe/payment-intent` to create PI
   - Confirm payment client-side
   - Redirect to confirmation on success

2. **Add Stripe Elements dependency**
   - `npm install @stripe/stripe-js @stripe/react-stripe-js`
   - Create `StripeElementsProvider` wrapper
   - Build `PaymentForm` component

3. **Add PaymentIntent capture**
   - Create `lib/stripe/capture.ts` with `captureBookingPayment()`
   - Call it in `completeBookingService` AFTER professional marks session complete
   - OR handle `payment_intent.requires_capture` webhook and capture immediately (if business wants capture at booking time)

4. **Add pending → available balance transition**
   - Option A: In `payout.paid` Stripe webhook, move balance after Stripe settles
   - Option B: Create cron job that transitions after `captured_at + HOLD_PERIOD` (e.g., 7 days)
   - Update `lib/stripe/webhook-handlers.ts` or create `lib/payments/balance-release.ts`

5. **Fix DB constraint for `batch` booking type**
   - Migration to add `'batch'` to `bookings.booking_type` CHECK constraint

### Phase 2: Connect Missing Wires (Week 3)
6. **Wire transactional emails into booking flow**
   - Call `sendBookingConfirmationEmail` from booking creation API
   - Call `sendBookingCancelledEmail` from cancellation service

7. **Add in-app notifications for chat messages**
   - In `lib/chat/chat-service.ts` `sendMessage()`, insert `notifications` row

8. **Add debounce to notification realtime listeners**
   - 750ms debounce + max 1 refresh per 5s

9. **Pre-populate complete-profile from signup metadata**
   - Read `user_metadata.professional_qualifications_structured`, etc.
   - Pass to `CompleteProfileForm` as default values

### Phase 3: Professional Experience (Week 4)
10. **Clarify subscription vs plans**
    - Merge or clearly explain relationship on `/financeiro`
    - Add self-start subscription flow if missing

11. **Improve Trolley KYC UX**
    - After `initiatePayoutSetup()`, redirect to Trolley recipient portal URL
    - Add active polling for KYC status

12. **Enable bank transfer payouts**
    - Add UI for bank account collection
    - Pass to Trolley `createRecipient` with bank details

### Phase 4: Polish (Ongoing)
13. Screen sharing and recording
14. Message edit/delete
15. File attachments in chat
16. Typing indicators
17. Recurring break patterns
18. Waitlist/notify-when-available

---

## 📝 Appendix: File Reference Map

| Concern | Key Files |
|---------|-----------|
| Auth | `app/(auth)/cadastro/page.tsx`, `components/auth/SignupForm.tsx`, `lib/supabase/server.ts`, `app/auth/callback/route.ts` |
| Booking | `app/(app)/agendar/[id]/page.tsx`, `components/booking/BookingForm.tsx`, `lib/booking/creation/`, `lib/booking/state-machine.ts` |
| Payments (User) | `app/api/stripe/payment-intent/route.ts`, `app/api/stripe/checkout-session/booking/route.ts`, `lib/stripe/webhook-handlers.ts` |
| Payments (Pro Subscription) | `lib/payments/subscription/manager.ts`, `app/(app)/financeiro/page.tsx`, `lib/actions/professional/subscription.ts` |
| Payouts | `lib/payments/trolley/`, `inngest/functions/payout-batch-create.ts`, `lib/payments/eligibility/engine.ts` |
| Session | `app/(app)/sessao/[id]/page.tsx`, `lib/session/`, `lib/session/adapters/agora.ts` |
| Chat | `app/(app)/mensagens/`, `components/chat/MessageThread.tsx`, `lib/chat/chat-service.ts` |
| Notifications | `app/(app)/notificacoes/`, `lib/notifications/`, `lib/email/`, `lib/push/` |
| Ledger | `lib/payments/ledger/`, `db/sql/migrations/070-*.sql`, `db/sql/migrations/079-*.sql` |

---

*Report generated by automated codebase analysis. All findings based on static code inspection as of 2026-05-01.*
