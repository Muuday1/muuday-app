# Muuday Implementation Roadmap — AI Agent Guide

**Document type:** Master implementation checklist for AI coding agents  
**Last updated:** 2026-04-24  
**Scope:** Every UX recommendation from journey documentation → working code  
**Target reader:** Kimi Code CLI (or any AI coding agent) implementing changes  
**Rule: UPDATE THIS FILE after every completed task. Mark items as ✅ done, 🔄 in-progress, or ⏳ pending.**

> ⚠️ **CRITICAL BACKEND STATUS WARNING (2026-04-24):**
> Many items below are marked `🔄 Backend complete — needs UI polish/verification` because the database, API, server actions, and RLS policies are fully built. **Do NOT rebuild these backends.** Focus on frontend consumption, UX hardening, or feature-flag enablement. When in doubt, check `lib/actions/`, `app/api/v1/`, and `db/sql/migrations/` before creating new tables or APIs.
>
> For a full list of backend-complete systems, see `docs/DOC-AUDIT-REPORT-2026-04-24.md`.

---

## 🚨 How to Use This Document (CRITICAL)

### For the Implementing Agent

1. **Read this file FIRST** before touching any code. It tells you what to do, in what order, and where the detailed specs live.
2. **Work phase by phase.** Do NOT jump around. Complete Phase 1 before starting Phase 2.
3. **After completing any task:**
   - Mark it ✅ or 🔄 in this file
   - Update the corresponding journey document's status to "Implemented"
   - Run the project's test/lint commands
4. **Before starting a complex change:** Read the referenced journey document's Frame-by-Frame section for exact UX specs.
5. **Never implement without referencing the spec.** Each journey doc has precise frame-by-frame descriptions of target states.
6. **Check backend existence first.** Search `lib/actions/`, `app/api/v1/`, and `db/sql/migrations/` for the feature you're about to build. If it exists, consume it — don't rebuild it.

### Document Structure

```
Phase N: [Name]
├── Cluster: [Area]
│   ├── Change ID: [ID from implementation map]
│   ├── Priority: P0 / P1 / P2
│   ├── Source: [journey-doc.md] → [section]
│   ├── What to change: [brief description]
│   ├── Files affected: [list]
│   ├── Acceptance criteria: [how to verify]
│   └── Status: ⏳ / 🔄 / ✅
```

---

## 📋 Master Checklist

### Phase 0: Foundation & Audit (Do First)

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 0.1 | Audit all timezone displays in codebase | `global-context-propagation.md` §6 | Search for `toLocaleString`, `formatInTimeZone`, `Intl.DateTimeFormat` | 🔄 (Ongoing maintenance — middleware handles most) |
| 0.2 | Audit all currency displays | `global-context-propagation.md` §6 | Search for `formatPrice`, `formatCurrency`, price formatting | 🔄 (Ongoing maintenance) |
| 0.3 | Verify no `console.log` in user-facing code | AGENTS.md security | Search codebase | 🔄 (Run `npm run lint` catches many) |
| 0.4 | Run full test suite and record baseline | — | `npm test`, `npm run test:e2e` | ✅ (CI runs on every push) |
| 0.5 | Verify build passes | — | `npm run build` | ✅ (CI gate) |

---

### Phase 1: Auth & User Onboarding (Week 1)

**Cluster:** AUTH — Critical conversion path

#### AUTH-01: Public Booking Intent Handoff ⭐ P0
- **Source:** `journey-implementation-map.md` §AUTH-01 + `search-booking.md` + `user-onboarding.md`
- **What:** When logged-out user clicks "Agendar" on public profile, show inline auth modal (not redirect to `/cadastro`)
- **Current:** `components/auth/AuthOverlay.tsx` exists. Verify it preserves booking context through auth.
- **Target:** `AuthOverlay` modal preserves context, returns user to booking after login
- **Files:**
  - `components/search/SearchBookingCtas.tsx`
  - `components/booking/MobileBookingStickyCta.tsx`
  - `components/auth/AuthOverlay.tsx` (verify it accepts `onSuccess` callback)
  - `app/(app)/profissional/[id]/page.tsx`
- **Acceptance:**
  - [ ] Desktop: AuthOverlay modal opens on "Agendar" click
  - [ ] Mobile: Same modal (not redirect)
  - [ ] After login/signup: user returns to same profile with booking form visible
  - [ ] URL query params (date, time, type) preserved through auth
  - [ ] PostHog event `booking_intent_auth_modal_shown` fired
- **Status:** 🔄 Backend ready — verify/enhance UI flow

#### AUTH-02: Post-Login Destination Logic Hardening ⭐ P0
- **Source:** `journey-implementation-map.md` §AUTH-02
- **What:** Fix `auth/callback` route to route professionals to `/dashboard`, users to `/buscar` or intended destination
- **Files:**
  - `app/auth/callback/route.ts`
  - `lib/auth/post-login-redirect.ts` (create if missing)
- **Acceptance:**
  - [ ] Pro logs in → `/dashboard`
  - [ ] User logs in → `/buscar` or `next` param
  - [ ] OAuth callback respects `next` parameter safely (whitelist validation)
  - [ ] After modal auth: redirect to original page, not hardcoded route
- **Status:** ✅ Implemented — `app/auth/callback/route.ts` handles role-based routing with `ALLOWED_NEXT_PATHS` whitelist

#### AUTH-03: User Onboarding Completion Flow ⭐ P1
- **Source:** `journey-implementation-map.md` §AUTH-03 + `user-onboarding.md`
- **What:** Ensure user onboarding collects country/timezone/currency early; validate completion before booking
- **Files:**
  - `app/(app)/completar-perfil/page.tsx` (or similar)
  - `lib/actions/user-profile.ts`
- **Acceptance:**
  - [ ] User must set country + timezone + currency before first booking
  - [ ] Missing profile fields block booking with clear "Complete your profile" CTA
  - [ ] Onboarding completion triggers `user_onboarding_completed` event
- **Status:** ✅ Implemented — profile completion flow exists with country/timezone/currency

---

### Phase 2: Professional Onboarding & Dual-Gate (Week 1-2)

**Cluster:** PRO — Professional activation

#### PRO-01: Dual-Gate Tracker Redesign ⭐ P0
- **Source:** `journey-implementation-map.md` §PRO-01 + `professional-workspace-journey.md` §C1 + `professional-onboarding.md`
- **What:** Make the two-gate system (Profile Live vs Ready to Book) visible in the tracker UI
- **Current:** Dashboard tracker modal shows onboarding stages. Gate evaluation exists in `lib/professional/onboarding-gates.ts`.
- **Target:** Two-lane tracker: Gate 1 (Perfil Público) + Gate 2 (Pronto para Agendar)
- **Files:**
  - `components/dashboard/ProfessionalOnboardingCard.tsx`
  - `components/dashboard/OnboardingTrackerModal.tsx`
  - `lib/professional/workspace-health.ts`
  - `app/(app)/dashboard/page.tsx`
- **Acceptance:**
  - [ ] Dashboard shows two lanes: "Perfil Público" and "Pronto para Agendar"
  - [ ] Each lane has checklist items with ✓/○ status
  - [ ] Gate 1 checklist: identity, services, terms, plan, payout
  - [ ] Gate 2 checklist: availability set, confirmation mode, first-booking-eligible
  - [ ] `first_booking_enabled` is prominently displayed with explanation
  - [ ] `first_booking_gate_note` shown if gate is blocked
- **Status:** ✅ Implemented — dual-gate logic operational in `lib/professional/onboarding-gates.ts`, tracker modal renders gate states

#### PRO-02: Onboarding Stage C4 (Terms) UX Hardening ⭐ P1
- **Source:** `journey-implementation-map.md` §PRO-02
- **What:** Improve terms acceptance: scroll progress, acceptance timestamp, version tracking
- **Files:**
  - `components/dashboard/terms-modal.tsx`
  - `lib/actions/professional-onboarding.ts`
- **Acceptance:**
  - [ ] Terms modal shows scroll progress ("80% lido")
  - [ ] Accept button disabled until scrolled to end
  - [ ] Acceptance timestamp + terms version stored in DB
  - [ ] Admin can see which version each pro accepted
- **Status:** 🔄 Partial — terms acceptance exists; scroll progress and version tracking may need enhancement

#### PRO-03: Onboarding C6 (Plan Selection) Context Preservation ⭐ P1
- **Source:** `journey-implementation-map.md` §PRO-03
- **What:** Preserve onboarding context if pro leaves during Stripe checkout
- **Files:**
  - `components/dashboard/plan-selection-stage.tsx`
  - `app/api/stripe/checkout/session/route.ts`
- **Acceptance:**
  - [ ] Stripe checkout URL includes `professional_id` and `onboarding_stage`
  - [ ] Webhook updates pro status on successful payment
  - [ ] Pro returning from Stripe lands back at correct onboarding stage
- **Status:** ⏳ Blocked on Wave 3 — Stripe checkout not yet active. Onboarding plan selection UI exists.

---

### Phase 3: Search & Discovery (Week 2-3)

**Cluster:** DISC — User acquisition

#### DISC-01: Search Results Empty State Recovery ⭐ P0
- **Source:** `journey-implementation-map.md` §DISC-01 + `search-recovery-journey.md` §C1
- **What:** Transform dead-end empty state into recovery experience
- **Files:**
  - `app/buscar/page.tsx`
  - `components/search/SearchEmptyState.tsx` (create)
  - `lib/search/filter-impact.ts` (create)
  - `lib/taxonomy/adjacent-categories.ts` (create)
- **Acceptance:**
  - [ ] Empty state shows which filter is most restrictive ("Without price filter: 12 results")
  - [ ] Adjacent category suggestions shown ("Try Coach instead of Psicologia")
  - [ ] "Limpar filtros" button present
  - [ ] Waitlist capture form for zero results (optional, P1)
- **Status:** ✅ Implemented — search page with empty state, filter clearing, and waitlist capture exists

#### DISC-02: Profile Trust Signal Consolidation ⭐ P1
- **Source:** `journey-implementation-map.md` §DISC-02 + `search-booking.md`
- **What:** Add badges, verified status, next availability to search cards
- **Files:**
  - `app/buscar/page.tsx`
  - `components/search/SearchResultCard.tsx` (refactor from inline)
  - `lib/search/next-availability.ts` (create)
- **Acceptance:**
  - [ ] Cards show "Verificado" badge for approved pros
  - [ ] Cards show "Popular" if >10 bookings
  - [ ] Cards show "Novo" if <5 bookings
  - [ ] Cards show next available slot: "Próximo: Seg, 10:00" or "Sem vagas"
  - [ ] Heart/favorite toggle on cards (logged-in only)
- **Status:** 🔄 Partial — verified status and favorites exist. Next availability and dynamic badges may need enhancement.

#### DISC-03: Search Autocomplete & Query Assistance ⭐ P1
- **Source:** `search-recovery-journey.md` §C2 + §3.1
- **What:** Add autocomplete, trending searches, did-you-mean
- **Files:**
  - `components/search/SearchAutocomplete.tsx` (create)
  - `components/search/SearchQueryBar.tsx`
  - `lib/taxonomy/synonyms.ts` (create)
  - `lib/search/trending.ts` (create)
- **Acceptance:**
  - [ ] Autocomplete dropdown with trending searches
  - [ ] Recent searches for logged-in users
  - [ ] Minimum 2 chars before search triggers
  - [ ] Submit on Enter, not blur
  - [ ] Clear (X) button in search input
- **Status:** ⏳ Not implemented — search uses basic query input without autocomplete

---

### Phase 4: Booking Experience (Week 3-4)

**Cluster:** BOOK — Core transaction

#### BOOK-01: Booking Timeline Visualization ⭐ P1
- **Source:** `journey-implementation-map.md` §BOOK-01 + `search-booking.md`
- **What:** Show booking status timeline to user after booking
- **Files:**
  - `components/booking/BookingStatusTimeline.tsx` (create)
  - `app/(app)/agenda/page.tsx`
  - `components/booking/BookingActions.tsx`
- **Acceptance:**
  - [ ] Timeline shows: Booking Placed → Payment Confirmed → Pro Confirmed → Session Ready
  - [ ] Current step highlighted
  - [ ] Completed steps checked
  - [ ] Estimated times shown for future steps
- **Status:** 🔄 Partial — booking status and actions exist. Visual timeline component may need creation.

#### BOOK-02: Recurring Booking UX Completion ⭐ P1
- **Source:** `journey-implementation-map.md` §BOOK-02 + `recurring-booking-journey.md`
- **What:** Full recurring booking experience: setup, management, cancellation scope
- **Files:**
  - `components/booking/BookingForm.tsx`
  - `components/agenda/RecurringPackageCard.tsx` (create)
  - `components/agenda/RecurringManagementModal.tsx` (create)
  - `components/booking/CancelScopeModal.tsx` (create)
  - `lib/calendar/ics-generator.ts` (create)
- **Acceptance:**
  - [ ] Booking form shows calendar preview of all generated dates
  - [ ] Conflicts highlighted in red before submit
  - [ ] Success screen lists all session dates with .ics export
  - [ ] Agenda groups recurring sessions by package
  - [ ] Recurring management modal: pause, cancel series, modify future
  - [ ] Cancel action shows scope selector (this session vs all future)
- **Status:** 🔄 Backend complete — recurrence engine, migrations, and server actions exist. Frontend UX (calendar preview, .ics export, management modal) may need enhancement.

#### BOOK-03: Request Booking Proposal UX ⭐ P1
- **Source:** `journey-implementation-map.md` §BOOK-03
- **What:** Improve request booking flow (/solicitar)
- **Files:**
  - `app/(app)/solicitar/[id]/page.tsx`
  - `components/booking/RequestBookingActions.tsx`
- **Acceptance:**
  - [ ] User can describe needs clearly
  - [ ] Pro can offer multiple time slots
  - [ ] Proposal expiration visible to both parties
  - [ ] Notifications on proposal accept/decline
- **Status:** ✅ Implemented — `/solicitar/[id]` page exists with proposal flow, request-booking server actions, and notifications

---

### Phase 5: Session Lifecycle (Week 4-5)

**Cluster:** SESS — Session execution

#### SESS-01: Pre-Join Device Check ⭐ P1
- **Source:** `session-lifecycle.md` §C1 + §SESS-02
- **What:** Add device check before joining video session
- **Files:**
  - `app/(app)/sessao/[id]/page.tsx`
  - `components/session/PreJoinCheck.tsx` (create)
- **Acceptance:**
  - [ ] Mic test: record and playback audio
  - [ ] Camera test: show video preview
  - [ ] Network test: latency indicator
  - [ ] "Tudo certo" → enable join button
  - [ ] "Problemas detectados" → troubleshooting tips
- **Status:** 🔄 Partial — Agora session page exists with token validation. Pre-join device check component may need creation/enhancement.

#### SESS-02: Auto No-Show Detection ⭐ P1
- **Source:** `session-lifecycle.md` §H1
- **What:** Automatic no-show marking when neither party joins within T+15min
- **Files:**
  - `lib/ops/no-show-detection.ts`
  - `inngest/functions/session-cleanup.ts`
  - `app/api/cron/session-no-show/route.ts`
- **Acceptance:**
  - [ ] Cron runs every 15 min checking sessions past start time
  - [ ] If user joined but pro didn't: mark pro no-show, auto-refund
  - [ ] If pro joined but user didn't: mark user no-show
  - [ ] If neither joined: mark both no-show after 15 min
  - [ ] Notifications sent to both parties
- **Status:** ✅ Implemented — `lib/ops/no-show-detection.ts` with Inngest cron `*/5`, notifications, and tiered refund policy

#### SESS-03: Review Flow Enhancement ⭐ P1
- **Source:** `session-lifecycle.md` §H2 + `review-moderation-lifecycle.md`
- **What:** Improve review submission and add moderation status tracking
- **Files:**
  - `app/(app)/avaliar/[bookingId]/page.tsx`
  - `components/booking/ReviewForm.tsx`
  - `app/(app)/perfil/page.tsx` (add "My Reviews" tab)
- **Acceptance:**
  - [ ] Review form has structured dimensions (punctuality, expertise, communication)
  - [ ] Guided prompt questions (collapsible)
  - [ ] Private feedback to Muuday field
  - [ ] Consent checkbox required
  - [ ] Success state shows moderation status tracker
  - [ ] "My Reviews" tab in profile shows all submitted reviews with status
- **Status:** 🔄 Partial — review submission exists at `/avaliar/[bookingId]`. Structured dimensions, guided prompts, and "My Reviews" tab may need enhancement.

---

### Phase 6: Professional Workspace (Week 5-6)

**Cluster:** WORK — Pro retention

#### WORK-01: Agenda Batch Actions & Exception Management ⭐ P1
- **Source:** `professional-workspace-journey.md` §H2 + §H3
- **What:** Batch confirm/reject + calendar exception management
- **Files:**
  - `components/agenda/ProfessionalAgendaPage.tsx`
  - `components/agenda/ExceptionManager.tsx` (create)
  - `lib/actions/agenda.ts`
- **Acceptance:**
  - [ ] Inbox checkboxes for batch select
  - [ ] "Aceitar selecionados" / "Recusar selecionados" buttons
  - [ ] Click calendar date → add exception modal
  - [ ] Exceptions list shows upcoming blocked dates
- **Status:** 🔄 Backend complete — availability exceptions API exists (`lib/actions/availability-exceptions.ts`), calendar renders exceptions. Batch actions and exception manager UI may need enhancement.

#### WORK-02: Dashboard Analytics Cards ⭐ P1
- **Source:** `professional-workspace-journey.md` §H1
- **What:** Add earnings sparkline, booking trend, recent activity
- **Files:**
  - `app/(app)/dashboard/page.tsx`
  - `components/dashboard/EarningsChart.tsx` (create)
  - `components/dashboard/BookingTrendChart.tsx` (create)
  - `components/dashboard/ActivityFeed.tsx` (create)
- **Acceptance:**
  - [ ] Earnings card shows week-over-week change percentage
  - [ ] Sparkline chart of last 30 days earnings
  - [ ] Booking trend mini-chart
  - [ ] Recent activity feed: new bookings, reviews, payments
- **Status:** ⏳ Blocked on Wave 3 — real earnings data requires payment processing

#### WORK-03: Financial Overview Page ⭐ P1
- **Source:** `professional-workspace-journey.md` §Phase 5
- **What:** Build `/financeiro` with transactions, payout status, fees
- **Files:**
  - `app/(app)/financeiro/page.tsx`
  - `components/finance/TransactionList.tsx` (create)
  - `components/finance/PayoutStatus.tsx` (create)
- **Acceptance:**
  - [ ] Monthly earnings chart
  - [ ] Transaction list with fee breakdown
  - [ ] Payout schedule and status
  - [ ] Export to CSV
- **Status:** ⏳ Blocked on Wave 3 — real transaction data requires payment processing. Skeleton page may exist.

---

### Phase 7: Notifications & Inbox (Week 6-7)

**Cluster:** CROSS — Cross-cutting

#### CROSS-01: Functional Notification Inbox ⭐ P0
- **Source:** `journey-implementation-map.md` §CROSS-01 + `notification-inbox-lifecycle.md` §C1
- **What:** Build working `/mensagens` page with real notifications
- **Files:**
  - `app/(app)/mensagens/page.tsx`
  - `components/notifications/NotificationInbox.tsx`
  - `lib/notifications/dispatch.ts`
  - `lib/notifications/render.ts`
- **Acceptance:**
  - [ ] Inbox shows notifications grouped by entity (booking, request, system)
  - [ ] Unread/read/archived states
  - [ ] Realtime badge count in header
  - [ ] Click notification → deep link to relevant page
  - [ ] Mark all as read
- **Status:** ✅ Implemented — `/mensagens` page exists with notification inbox, unread count badge, mark-as-read, and deep linking

#### CROSS-02: Global Context Propagation ⭐ P1
- **Source:** `journey-implementation-map.md` §CROSS-02 + `global-context-propagation.md`
- **What:** Standardize country/timezone/currency/language display everywhere
- **Files:**
  - `lib/timezone/display.ts`
  - `components/ui/DualTimezoneDisplay.tsx`
- **Acceptance:**
  - [ ] Every time display shows user timezone
  - [ ] Cross-timezone bookings show both timezones or toggle
  - [ ] Currency conversion uses live rates with "≈" indicator
  - [ ] Unified settings page for context preferences
- **Status:** ✅ Implemented — country/currency/timezone middleware, hooks, and display utilities exist across booking/agenda/session/profile pages

#### CROSS-03: Edge Case Recovery UI ⭐ P1
- **Source:** `journey-implementation-map.md` §CROSS-03 + `edge-case-recovery-playbook.md`
- **What:** Implement recovery flows for top edge cases
- **Files:**
  - Multiple — see playbook for per-case specs
- **Acceptance (top 5):**
  - [ ] No-show report flow with evidence upload
  - [ ] Failed payment retry with alternative methods
  - [ ] Reschedule conflict with alternative suggestions
  - [ ] Account suspension appeal form
  - [ ] Review rejection with edit/resubmit
- **Status:** 🔄 Partial — no-show detection automated, reschedule exists, review moderation exists. Some edge case UIs may need enhancement.

---

### Phase 8: Admin & Operations (Week 7-8)

**Cluster:** ADMIN — Platform operations

#### ADMIN-01: Operator Case Resolution System ⭐ P1
- **Source:** `journey-implementation-map.md` §ADMIN-01 + `operator-case-resolution.md`
- **What:** Build case queue, detail view, decision system
- **Files:**
  - `app/(app)/admin/casos/page.tsx`
  - `app/(app)/admin/casos/[caseId]/page.tsx`
  - `components/admin/CaseQueueClient.tsx`
  - `components/admin/CaseDetailClient.tsx`
  - `db/sql/migrations/082-case-resolution-enhancement.sql`
  - `lib/disputes/dispute-service.ts`
- **Acceptance:**
  - [x] Cases table with filters, sorting, SLA tracking
  - [x] Case detail with evidence tabs
  - [x] Structured decision form per case type
  - [x] Auto-collect booking/session/payment evidence
  - [x] Communication templates for decisions
  - [x] Auto-creation from no-show detection
- **Status:** ✅ Implemented — Migration 082 adds priority/assignment/SLA. Queue and detail pages built. Evidence auto-collected. No-show detection auto-creates cases. 950/89 tests.

#### ADMIN-02: Admin Navigation Alignment ⭐ P2
- **Source:** `journey-implementation-map.md` §ADMIN-02
- **What:** Unify admin nav, add case queue link
- **Files:**
  - `components/admin/AdminDashboard.tsx`
  - `app/(app)/admin/layout.tsx`
- **Acceptance:**
  - [ ] Consistent nav across all admin pages
  - [ ] Case queue accessible from main admin
  - [ ] Notification center for admin actions
- **Status:** 🔄 Partial — admin layout exists. Consistency and case queue prominence may need polish.

---

### Phase 9: Review Moderation System (Week 8-9)

**Cluster:** REVIEW — Trust signals

#### REVIEW-01: Admin Moderation Queue Enhancement ⭐ P1
- **Source:** `review-moderation-lifecycle.md` §C3 + §H1
- **What:** Structured moderation UI with rejection reasons, batch actions, auto-flags
- **Files:**
  - `app/(app)/admin/avaliacoes/page.tsx`
  - `components/admin/ReviewModerationClient.tsx`
  - `lib/admin/admin-service.ts` (list/moderate/batch functions)
  - `lib/actions/admin.ts` (server actions)
  - `db/sql/migrations/083-review-moderation-enhancement.sql`
- **Acceptance:**
  - [x] Review cards with reviewer history, pro context, booking context
  - [x] Reject requires reason selection (6 structured reasons) + custom admin note
  - [x] Batch approve/reject with checkbox selection
  - [x] Auto-flags: profanity, conflicts_with_outcome, suspected_fake
  - [x] Status filters (Pending, Approved, Rejected, Flagged, All) + sort options
- **Status:** ✅ Implemented — migration 083, `/admin/avaliacoes` page, 14 new tests

#### REVIEW-02: Professional Response to Reviews ⭐ P1
- **Source:** `review-moderation-lifecycle.md` §C2
- **What:** Allow pros to respond to published reviews
- **Files:**
  - `components/dashboard/ProfessionalReviews.tsx`
  - `app/(app)/dashboard/page.tsx` (add Reviews tab)
  - `lib/actions/reviews.ts`
- **Acceptance:**
  - [ ] Pro sees all reviews in dashboard tab
  - [ ] Respond button on each review
  - [ ] Response templates (positive/negative)
  - [ ] Response goes through moderation
  - [ ] Response shown on public profile
- **Status:** ✅ Implemented — `lib/actions/review-response.ts` exists with validation, rate limiting, and `professional_response` column

---

### Phase 10: Polish & Validation (Week 9-10)

| # | Task | Source | Status |
|---|------|--------|--------|
| 10.1 | Add review reminder notifications (24h after session) | `review-moderation-lifecycle.md` §H3 | ✅ Implemented — `lib/ops/review-reminders.ts`, Inngest daily cron at 10h UTC |
| 10.2 | Add search analytics logging | `search-recovery-journey.md` §Phase 5 | ✅ Implemented — `search_sessions` table (migration `065`), server-side tracking |
| 10.3 | Waitlist capture + cron | `search-recovery-journey.md` §4.1 | ✅ Implemented — `/api/waitlist` route with CORS |
| 10.4 | Recurring renewal notifications | `recurring-booking-journey.md` §H3 | 🔄 Partial — notification infrastructure ready; recurring-specific renewal triggers may need hookup |
| 10.5 | Notification preferences page | `notification-inbox-lifecycle.md` §H1 | ⏳ Not implemented |
| 10.6 | E2E tests for P0 flows | — | 🔄 In progress — 2 passed, 1 skipped (manual confirmation fixture) |
| 10.7 | Accessibility audit | — | ⏳ Not started |
| 10.8 | Performance audit (Core Web Vitals) | — | ⏳ Not started |

---

### Phase 11: Multi-Service Booking Experience (Week 10-12)

**Cluster:** SRV — Multi-service support

> ⚠️ **Backend is fully built for this phase.** Do NOT create new tables or APIs. Focus on frontend consumption and UI polish.

#### SRV-01: Multi-Service Data Layer ⭐ P1
- **Source:** `search-booking.md` §7 + `profile-edit-journey.md` §Phase 4
- **What:** Enable professionals to create and manage multiple services with independent pricing/duration
- **Files:**
  - `db/sql/migrations/058-wave4-multi-service-booking.sql` (already applied)
  - `lib/actions/professional-services.ts`
  - `lib/tier-config.ts` (tier-based service limits already enforced)
- **Acceptance:**
  - [ ] `professional_services` supports `display_order`
  - [ ] Pro can create up to N services based on tier (Basic=1, Pro=3, Premium=5)
  - [ ] Each service has: name, description, duration, price, recurring flag, active flag
  - [ ] Deactivating a service hides it from profile but preserves history
  - [ ] Price changes trigger admin re-review; name/description changes publish immediately
- **Status:** ✅ Implemented — migration `058`, `professional_services` table, CRUD server actions, RLS, rate limiting all exist

#### SRV-02: Professional Profile Tabs ⭐ P1
- **Source:** `search-booking.md` §Frame 2 + §Frame 3
- **What:** Redesign profile page with Bio/Services/Reviews tabs; Bio is default landing
- **Files:**
  - `app/(app)/profissional/[id]/page.tsx`
  - `components/professional/ProfileBioTab.tsx`
  - `components/professional/ProfileServicesTab.tsx`
  - `components/professional/ProfileReviewsTab.tsx`
  - `components/professional/ProfessionalServicesList.tsx`
- **Acceptance:**
  - [ ] Default tab is Bio when coming from search
  - [ ] Services tab shows expandable service cards with details
  - [ ] Reviews tab shows all reviews (moved from bottom of page)
  - [ ] "Escolher e ver horários" CTA per service links to booking
  - [ ] Deep-link `/profissional/[id]?tab=servicos` opens Services tab
  - [ ] Sticky bottom CTA: "Ver serviços e agendar" with starting price
- **Status:** 🔄 Partial — profile page exists. Tabbed layout and multi-service display may need enhancement.

#### SRV-03: Multi-Step Booking Wizard ⭐ P1
- **Source:** `search-booking.md` §Frame 4-8
- **What:** Convert single-page booking form into 3-step wizard: Slot → Personal Info → Checkout
- **Files:**
  - `components/booking/BookingWizard.tsx` (create — parent container)
  - `components/booking/BookingSlotStep.tsx` (create — Step 1)
  - `components/booking/BookingPersonalInfoStep.tsx` (create — Step 2)
  - `components/booking/BookingCheckoutStep.tsx` (create — Step 3)
  - `components/booking/BookingSuccessScreen.tsx` (modify)
- **Acceptance:**
  - [ ] Step 1: Service card pinned at top + calendar + time slots + booking type toggle
  - [ ] Step 2: Pre-filled personal info (name, location) + session purpose with guided prompts
  - [ ] Step 3: Price breakdown (Subtotal + Platform fee + Tax - Discount = Grand Total)
  - [ ] Payment processing transition screen
  - [ ] Success screen with branded confirmation + "Ver minha agenda" CTA
  - [ ] Back navigation between steps preserves selections
  - [ ] URL updates per step (`/agendar/[id]?step=1&servico=...`)
- **Status:** 🔄 Partial — booking form exists. Multi-step wizard experience may need creation.

#### SRV-04: Service-Aware Booking Backend ⭐ P1
- **Source:** `search-booking.md` §7
- **What:** Update `createBooking` and related actions to use `service_id`
- **Files:**
  - `lib/actions/booking.ts`
  - `lib/booking/recurrence-engine.ts`
  - `lib/booking/batch-booking.ts`
  - `app/(app)/agendar/[id]/page.tsx`
- **Acceptance:**
  - [ ] `createBooking` requires `serviceId` and validates it
  - [ ] Price calculation uses `service.price_brl`, not `professional.session_price_brl`
  - [ ] Duration uses `service.duration_minutes`
  - [ ] Recurring booking verifies `service.enable_recurring = true`
  - [ ] Booking records include `service_id` FK
  - [ ] Agenda displays service name per session
- **Status:** ✅ Implemented — `bookings.service_id` FK exists (migration `058`), booking logic uses service data, backward compatible

#### SRV-05: Professional Service Manager ⭐ P1
- **Source:** `professional-workspace-journey.md` §Frame 1.5
- **What:** Add service CRUD to pro dashboard
- **Files:**
  - `components/dashboard/ProfessionalServicesManager.tsx`
  - `components/dashboard/ServiceEditorModal.tsx`
  - `app/(app)/dashboard/page.tsx`
- **Acceptance:**
  - [ ] Dashboard shows list of services with edit/disable buttons
  - [ ] Pro can add new service (up to tier limit)
  - [ ] Pro can edit service name, description, duration, price, recurring flag
  - [ ] Pro can deactivate/reactivate services
  - [ ] Drag-to-reorder or numeric ordering
  - [ ] Service-level analytics: bookings count, earnings, conversion
- **Status:** 🔄 Partial — service CRUD exists in onboarding and settings. Dedicated dashboard manager and analytics may need enhancement.

---

## 📁 Source Document Index

When implementing any change, read the referenced document first:

| Change Area | Primary Doc | Secondary Docs |
|-------------|-------------|----------------|
| Auth & Onboarding | `user-onboarding.md` | `journey-implementation-map.md` §AUTH |
| Pro Onboarding | `professional-onboarding.md` | `professional-workspace-journey.md` §1.2 |
| Search & Discovery | `search-booking.md` | `search-recovery-journey.md` |
| Booking Flow | `search-booking.md` | `recurring-booking-journey.md`, `professional-workspace-journey.md` |
| Session Execution | `session-lifecycle.md` | `session-management.md` |
| Post-Session | `session-lifecycle.md` | `review-moderation-lifecycle.md` |
| Pro Workspace | `professional-workspace-journey.md` | `session-management.md`, `financial-overview-journey.md` |
| Profile & Settings | `profile-edit-journey.md` | `settings-preferences-journey.md` |
| Admin Ops | `operator-case-resolution.md` | `admin-operations.md` |
| Notifications | `notification-inbox-lifecycle.md` | — |
| Global Context | `global-context-propagation.md` | — |
| Edge Cases | `edge-case-recovery-playbook.md` | — |

---

## 🔄 Update Rules

**After completing ANY task:**

1. Find the task in this file by its Change ID (e.g., AUTH-01)
2. Change `Status: ⏳` → `Status: ✅` or `Status: 🔄`
3. Check off all acceptance criteria checkboxes
4. Update the corresponding journey document:
   - Add "**Implementation Status:** ✅ Complete" at top
   - Add "**Implemented on:** [date]"
   - Add "**Implemented by:** Kimi Code" if desired
5. Run project tests before moving to next task
6. Commit changes with descriptive message referencing Change ID

**If a task is partially done:**
- Status: `🔄`
- Add note: "Progress: [what's done] / Remaining: [what's left]"

---

## 🎯 Success Criteria for This Roadmap

This roadmap is complete when:
- [ ] All P0 items are ✅
- [ ] All P1 items in Phases 1-7 are ✅ or 🔄 (backend complete with known frontend gaps)
- [ ] Every journey document in `docs/product/journeys/` has accurate "Implementation Status"
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] No new lint errors (`npm run lint`)
- [ ] E2E critical paths pass (`npm run test:e2e`)
