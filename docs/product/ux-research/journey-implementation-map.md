# Muuday Journey Implementation Map

**Document type:** Operational change request map  
**Derived from:** `journey-audit-and-recommendations.md`  
**Purpose:** Exact specification of what must change, where, and in what order  
**Date:** 2026-04-19  
**Scope:** No code changes yet — this is the blueprint for changes  

---

## How to Read This Map

Each change item has:
- **ID:** Unique reference code
- **Current State:** What exists today
- **Target State:** What should exist
- **Location:** File paths, routes, components affected
- **Change Type:** Doc / Design / Frontend / Backend / Full-stack / Architecture
- **Priority:** P0 (blocker), P1 (needed for Wave 3), P2 (stabilization)
- **Effort:** S (hours), M (days), L (weeks), XL (sprints)
- **Dependencies:** What must be done first
- **Owner:** Suggested discipline
- **Acceptance Criteria:** How to know it's done

---

## 1. Auth & Onboarding Cluster

### AUTH-01: Public Booking Intent Handoff

| Field | Value |
|-------|-------|
| **ID** | AUTH-01 |
| **Journey** | Search & Booking → User Onboarding |
| **Current State** | Unauthenticated user clicks "Book" → full page redirect to `/cadastro?redirect=/agendar/[id]` |
| **Target State** | Inline modal overlay (`PublicBookingAuthModal`) preserves booking context without page navigation |
| **Location** | `components/auth/PublicBookingAuthModal.tsx`, `app/(app)/profissional/[id]/page.tsx`, `components/search/SearchBookingCtas.tsx`, `components/booking/MobileBookingStickyCta.tsx` |
| **Change Type** | Frontend + Design |
| **Priority** | **P0** |
| **Effort** | M (2-3 days) |
| **Dependencies** | None — component already exists but is not wired |
| **Owner** | Frontend + Product Design |

**Detailed Changes Required:**

1. **Activate `PublicBookingAuthModal`**
   - File: `components/auth/PublicBookingAuthModal.tsx`
   - Today: Component exists but is likely a stub or unused
   - Change: Wire it to all booking CTAs in public contexts
   - Props needed: `professionalId`, `preferredSlot?`, `serviceType?`, `onAuthSuccess: () => void`

2. **Preserve context in URL state**
   - When modal opens, encode booking intent in URL hash or query:
     `/profissional/[id]?intent=book&slot=2026-04-20T10:00:00Z`
   - This allows recovery if user refreshes or shares link

3. **Modal flow design**
   ```
   Step 1: "Book your session with [Professional Name]"
           ├── "Create account to continue" (primary)
           ├── "I already have an account" (secondary)
           └── "Continue browsing" (tertiary, dismiss)
   
   Step 2a (signup): Inline signup form (simplified, no role selection — assume user)
   Step 2b (login): Inline login form
   
   Step 3: On success, modal closes, parent page refreshes auth state,
           CTA transforms to "Continue booking →" which navigates to `/agendar/[id]`
   ```

4. **Mobile behavior**
   - On mobile: use bottom sheet instead of centered modal
   - Same flow, adapted for thumb reachability

**Acceptance Criteria:**
- [ ] Anonymous user can click "Book" on any public profile without leaving the page
- [ ] Selected slot/service is preserved through auth flow
- [ ] Post-auth, user lands on `/agendar/[id]` with context intact
- [ ] Conversion rate from "Book click" to "booking form open" is measurable and ≥ baseline
- [ ] Fallback to full-page redirect works if JS fails or modal errors

---

### AUTH-02: Post-Login Destination Logic Hardening

| Field | Value |
|-------|-------|
| **ID** | AUTH-02 |
| **Journey** | Auth → Role Workspace |
| **Current State** | `resolvePostLoginDestination(role)` exists but does not preserve booking intent from OAuth flows |
| **Target State** | OAuth callback and password login both preserve `next` param with booking context whitelist |
| **Location** | `lib/auth/post-login-destination.ts`, `app/auth/callback/route.ts`, `app/(auth)/login/page.tsx` |
| **Change Type** | Backend + Frontend |
| **Priority** | **P0** |
| **Effort** | S (1 day) |
| **Dependencies** | AUTH-01 |
| **Owner** | Frontend |

**Detailed Changes Required:**

1. **Expand `ALLOWED_NEXT_PATHS` whitelist**
   - Add `/agendar/*`, `/solicitar/*`, `/profissional/*` to the safe redirect list
   - Ensure path validation rejects external URLs and admin paths for non-admin users

2. **Propagate `next` through OAuth**
   - In `SocialAuthButtons.tsx`, encode `next` into OAuth state parameter
   - In `/auth/callback`, decode state and redirect to safe `next` if present

3. **Booking context in `next` param**
   - Support structured `next` values: `/agendar/[id]?slot=...`
   - Validate that `[id]` is a valid UUID before redirect

**Acceptance Criteria:**
- [ ] OAuth login with booking intent redirects to booking form, not generic dashboard
- [ ] Password login with `?next=/agendar/xxx` works correctly
- [ ] Invalid/malicious `next` params are sanitized to safe default

---

### AUTH-03: User Onboarding Completion Flow

| Field | Value |
|-------|-------|
| **ID** | AUTH-03 |
| **Journey** | User Onboarding |
| **Current State** | User signs up → `/completar-conta` → `/buscar`. No guidance, no progressive disclosure. |
| **Target State** | Context-aware onboarding: if user came from booking intent, guide them back to booking instead of dumping them on search |
| **Location** | `app/(auth)/completar-conta/page.tsx`, `lib/actions/complete-account.ts` |
| **Change Type** | Frontend + Backend |
| **Priority** | **P1** |
| **Effort** | S (1-2 days) |
| **Dependencies** | AUTH-01, AUTH-02 |
| **Owner** | Frontend |

**Detailed Changes Required:**

1. **Pass `intent` through account completion**
   - If user arrived via booking modal, store `bookingIntent` in session or URL
   - On completion, check for intent and redirect accordingly

2. **UI adaptation**
   - Show contextual message on `/completar-conta`: 
     "Almost there! Complete your profile to book with [Professional Name]."
   - Instead of generic "Get started" CTA, show "Continue booking →"

**Acceptance Criteria:**
- [ ] User who signed up to book sees contextual messaging, not generic onboarding
- [ ] Post-completion redirect respects original booking intent

---

## 2. Professional Onboarding Cluster

### PRO-01: Dual-Gate Tracker Redesign

| Field | Value |
|-------|-------|
| **ID** | PRO-01 |
| **Journey** | Professional Onboarding |
| **Current State** | Single progress bar (C1-C8). "Approved" status implies readiness. Payout/KYC gate is invisible. |
| **Target State** | Two-lane tracker: Lane 1 "Profile Live" (C1-C8 + review), Lane 2 "Ready to Accept Bookings" (plan, billing card, payout, KYC) |
| **Location** | `components/dashboard/OnboardingTrackerModal.tsx` (2181 lines — refactor needed), `app/(app)/dashboard/page.tsx`, `lib/professional/onboarding-tracker-state.ts` |
| **Change Type** | Design + Frontend + Backend (state model) |
| **Priority** | **P0** |
| **Effort** | L (1.5-2 weeks) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend + Backend |

**Detailed Changes Required:**

1. **State model extension**
   - File: `lib/professional/onboarding-gates.ts`
   - Today: `evaluateFirstBookingEligibility()` returns boolean
   - Change: Return structured object:
     ```typescript
     {
       publicListingEligible: boolean,
       firstBookingEligible: boolean,
       lane1Complete: boolean,
       lane2Steps: [
         { id: 'plan_selected', complete: boolean },
         { id: 'billing_card', complete: boolean },
         { id: 'payout_method', complete: boolean },
         { id: 'kyc_verified', complete: boolean }
       ]
     }
     ```

2. **Tracker UI redesign**
   - File: `components/dashboard/OnboardingTrackerModal.tsx`
   - Split into two visually distinct lanes:
     ```
     ┌─────────────────────────────┬─────────────────────────────┐
     │  LANE 1: PROFILE LIVE       │  LANE 2: READY TO BOOK      │
     │  [████████] 100%            │  [███░░░░░] 40%             │
     │                             │                             │
     │  ✅ Account created         │  ✅ Plan selected           │
     │  ✅ Identity verified       │  ⏳ Add billing card        │
     │  ✅ Photo uploaded          │  ⏳ Set payout method       │
     │  ✅ Terms accepted          │  ⬜ Complete KYC            │
     │  ✅ Services added          │                             │
     │  ✅ Plan chosen             │  Why? Users can see your    │
     │  ✅ Availability set        │  profile, but you can't     │
     │  ✅ Submitted for review    │  accept bookings until      │
     │  ✅ Approved by Muuday      │  these steps are done.      │
     └─────────────────────────────┴─────────────────────────────┘
     ```

3. **Dashboard banner adaptation**
   - File: `app/(app)/dashboard/page.tsx`
   - Today: Shows generic "Complete your profile" banner
   - Change: Context-aware banner:
     - If Lane 1 incomplete: "Complete your profile to go live"
     - If Lane 1 complete but Lane 2 incomplete: "You're live! Finish setup to start accepting bookings"
     - If both complete: "You're fully set up. Manage your bookings in Calendar."

4. **Gate enforcement messaging**
   - When professional views their public profile and tries "Test booking" or preview:
     - If not first-booking eligible: show inline banner explaining why

**Acceptance Criteria:**
- [ ] Professional can clearly see distinction between "live" and "bookable"
- [ ] Each Lane 2 step has direct CTA to complete it
- [ ] Dashboard banner adapts to dual-gate state
- [ ] Tracker modal loads without performance regression (maintain critical/optional split)
- [ ] E2E test covers: approved but not first-booking-eligible professional sees correct state

---

### PRO-02: Onboarding Stage C4 (Terms) UX Hardening

| Field | Value |
|-------|-------|
| **ID** | PRO-02 |
| **Journey** | Professional Onboarding — Terms Acceptance |
| **Current State** | Scroll-to-end pattern exists but may not have progress indicator or estimated read time |
| **Target State** | Transparent terms acceptance with progress, estimated time, and explicit acknowledgment of key clauses |
| **Location** | `components/dashboard/terms-modal.tsx` |
| **Change Type** | Design + Frontend |
| **Priority** | **P2** |
| **Effort** | S (1-2 days) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend |

**Detailed Changes Required:**

1. **Add reading progress bar**
   - Visual indicator of scroll position through terms document

2. **Estimated read time**
   - "This takes about 3 minutes to read"

3. **Key clause highlights**
   - Collapsible summary of 3-5 most important clauses before full text
   - "By continuing, you acknowledge: (1) commission structure, (2) cancellation policy, (3) code of conduct"

4. **Accessibility**
   - Ensure terms modal is keyboard-navigable and screen-reader friendly
   - Focus trap within modal

**Acceptance Criteria:**
- [ ] Scroll progress is visible
- [ ] Estimated read time displayed
- [ ] Key clauses summarized before full text
- [ ] Cannot submit without scrolling to end

---

### PRO-03: Onboarding C6 (Plan Selection) Context Preservation

| Field | Value |
|-------|-------|
| **ID** | PRO-03 |
| **Journey** | Professional Onboarding — Plan & Billing |
| **Current State** | Stripe checkout opens in new redirect. On return, user lands on `/dashboard?openOnboarding=1&planCheckout=success`. If cancelled, modal may not reflect state cleanly. |
| **Target State** | Seamless return from Stripe with clear success/failure state inside tracker. Auto-advance to C7 on success. |
| **Location** | `/api/stripe/checkout-session`, `app/(app)/dashboard/page.tsx`, `components/dashboard/OnboardingTrackerModal.tsx` |
| **Change Type** | Frontend + Backend |
| **Priority** | **P1** |
| **Effort** | M (2-3 days) |
| **Dependencies** | PRO-01 |
| **Owner** | Frontend + Backend |

**Detailed Changes Required:**

1. **Stripe return state handling**
   - On `planCheckout=success`: auto-advance tracker to C7, show confetti/success toast
   - On `planCheckout=cancelled`: show inline "You can complete this later" with retry CTA
   - On `planCheckout=error`: show error with support contact

2. **Test mode transparency**
   - If `PLAN_PRICING_ALLOW_FALLBACK=true`, show "Test mode" badge clearly
   - Prevent confusion between test and real billing

**Acceptance Criteria:**
- [ ] Successful Stripe return auto-advances tracker
- [ ] Cancelled checkout shows graceful recovery message
- [ ] Error state provides clear next action

---

## 3. Discovery & Search Cluster

### DISC-01: Search Results Empty State Recovery

| Field | Value |
|-------|-------|
| **ID** | DISC-01 |
| **Journey** | Search & Discovery |
| **Current State** | No-results page exists but may not have guided recovery actions |
| **Target State** | Rich empty state with: suggested relaxations, adjacent categories, "notify me when available" option |
| **Location** | `app/buscar/page.tsx`, `components/search/` |
| **Change Type** | Design + Frontend |
| **Priority** | **P1** |
| **Effort** | M (3-4 days) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend |

**Detailed Changes Required:**

1. **Analyze failed search**
   - Detect which filters caused zero results
   - Suggest removing least-important filters first

2. **Show adjacent professionals**
   - "No psychologists in Lisbon? Here are 3 in Porto or online."

3. **Waitlist/notify option**
   - "Get notified when a [category] professional becomes available in [location]"
   - Store in `waitlist` table or similar

4. **Visual design**
   - Illustration + empathetic copy
   - "We couldn't find exactly that — let's adjust your search"

**Acceptance Criteria:**
- [ ] No-results state suggests at least 2 recovery paths
- [ ] Suggested relaxations are data-driven (based on available inventory)
- [ ] Notify-me option captures intent and stores it

---

### DISC-02: Profile Trust Signal Consolidation

| Field | Value |
|-------|-------|
| **ID** | DISC-02 |
| **Journey** | Search & Booking — Profile Trust |
| **Current State** | Trust signals (credentials, badges, reviews, tier) are displayed but may lack hierarchy or progressive disclosure |
| **Target State** | Clear trust hierarchy: verification status → credentials → reviews → tier. Sensitive categories get prominent disclaimer. |
| **Location** | `app/(app)/profissional/[id]/page.tsx`, `components/professional/` |
| **Change Type** | Design + Frontend |
| **Priority** | **P1** |
| **Effort** | M (3-4 days) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend |

**Detailed Changes Required:**

1. **Trust signal hierarchy**
   ```
   Priority 1 (always visible): Identity verified, credentials checked
   Priority 2 (collapsed): Review summary, response rate, completed sessions
   Priority 3 (expandable): Full credentials, tier details, platform tenure
   ```

2. **Sensitive category banner**
   - For health/legal categories: prominent but non-intrusive banner
   - "This professional is verified by Muuday. Always consult licensed practitioners for regulated advice."

3. **Video intro prominence**
   - If professional has intro video (tier-dependent), show play button in profile header
   - Autoplay on hover (desktop) or tap-to-play (mobile)

**Acceptance Criteria:**
- [ ] Trust signals have visual hierarchy
- [ ] Sensitive categories show disclaimer above the fold
- [ ] Video intro is discoverable

---

### DISC-03: Compare Professionals Feature

| Field | Value |
|-------|-------|
| **ID** | DISC-03 |
| **Journey** | Search & Discovery |
| **Current State** | Users can save favorites but cannot compare side-by-side |
| **Target State** | Compare up to 3 professionals in a modal or dedicated page |
| **Location** | `app/(app)/favoritos/page.tsx`, `components/favorites/` |
| **Change Type** | Design + Frontend + Backend |
| **Priority** | **P2** |
| **Effort** | L (1-2 weeks) |
| **Dependencies** | None |
| **Owner** | Product Design + Full-stack |

**Detailed Changes Required:**

1. **Compare selection UI**
   - In favorites list or search results: checkbox to "Compare"
   - Floating bar: "Compare 2 professionals" → opens comparison view

2. **Comparison dimensions**
   - Price, rating, response time, availability next 7 days, credentials, languages, specialties

3. **Quick book from comparison**
   - "Book with [Name]" CTA per professional in comparison view

**Acceptance Criteria:**
- [ ] User can select 2-3 professionals to compare
- [ ] Comparison shows relevant dimensions side-by-side
- [ ] Direct booking CTA from comparison view

---

## 4. Booking Cluster

### BOOK-01: Booking Timeline Visualization

| Field | Value |
|-------|-------|
| **ID** | BOOK-01 |
| **Journey** | Booking Lifecycle (User + Professional) |
| **Current State** | Bookings are listed in `/agenda` but lifecycle progression is not visualized |
| **Target State** | Every booking shows a timeline of its lifecycle: booked → confirmed → reminded → session → completed → review window |
| **Location** | `app/(app)/agenda/page.tsx`, `components/agenda/`, `components/booking/BookingActions.tsx` |
| **Change Type** | Design + Frontend |
| **Priority** | **P1** |
| **Effort** | M (4-5 days) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend |

**Detailed Changes Required:**

1. **Timeline component**
   - Reusable `BookingTimeline` component
   - States: `booked`, `confirmed`, `reminder_sent`, `session_joinable`, `in_progress`, `completed`, `reviewable`, `reviewed`, `closed`

2. **Integration in agenda**
   - Expandable card: click booking to see timeline
   - Upcoming booking shows next milestone prominently

3. **Action prompts from timeline**
   - If next state is "confirm": show "Accept booking" CTA (pro)
   - If next state is "join session": show "Join now" CTA with countdown
   - If next state is "leave review": show "Rate your session" CTA

4. **Professional agenda adaptation**
   - Same timeline, but with professional-oriented actions
   - Show "Session link" input when state is `session_joinable`

**Acceptance Criteria:**
- [ ] Timeline visible for every booking detail view
- [ ] Next action is clear and actionable
- [ ] Past bookings show complete timeline
- [ ] Works on mobile agenda view

---

### BOOK-02: Recurring Booking Sub-Journey Documentation

| Field | Value |
|-------|-------|
| **ID** | BOOK-02 |
| **Journey** | Recurring Booking |
| **Current State** | Recurring booking works in code but is not journey-documented. Edge cases (pause, change window, auto-renew) are underspecified in UX. |
| **Target State** | Dedicated recurring booking journey document + UI hardening for management |
| **Location** | New: `docs/product/journeys/recurring-booking.md`; Existing: `components/booking/BookingForm.tsx`, `app/(app)/agenda/page.tsx` |
| **Change Type** | Doc + Design + Frontend |
| **Priority** | **P1** |
| **Effort** | L (1 week doc + 1 week UI) |
| **Dependencies** | BOOK-01 |
| **Owner** | Product + Frontend |

**Detailed Changes Required:**

1. **Document the journey**
   - Setup: frequency, duration, end condition (date or occurrences)
   - Management: view all occurrences, pause, cancel individual vs series
   - Modification: change time (within 7-day window), change professional (not allowed)
   - Billing: charge per occurrence or upfront? (clarify with Wave 3)

2. **UI hardening**
   - In agenda: group recurring bookings visually ("Weekly with Dr. Silva")
   - Show next 3 occurrences + "View all" expand
   - Cancellation: ask "Cancel this session only" or "Cancel all future sessions"

**Acceptance Criteria:**
- [ ] Recurring booking journey documented
- [ ] Agenda groups recurring bookings visually
- [ ] Cancellation scope is explicit (single vs series)

---

### BOOK-03: Request Booking Proposal UX

| Field | Value |
|-------|-------|
| **ID** | BOOK-03 |
| **Journey** | Request Booking |
| **Current State** | Request booking works but proposal flow may lack urgency and clarity |
| **Target State** | Clear proposal UX with countdown, calendar integration, and explicit accept/decline |
| **Location** | `components/booking/RequestBookingForm.tsx`, `components/booking/RequestBookingActions.tsx`, `app/(app)/agenda/page.tsx` |
| **Change Type** | Design + Frontend |
| **Priority** | **P1** |
| **Effort** | M (3-4 days) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend |

**Detailed Changes Required:**

1. **Professional proposal UI**
   - When proposing alternative time: calendar picker with user's original request shown for reference
   - "Original request: Apr 20, 10:00 AM" vs "Your proposal: Apr 21, 2:00 PM"
   - 24-hour expiration countdown visible

2. **User proposal reception**
   - Clear notification: "[Professional] proposed a new time"
   - Side-by-side comparison: requested vs proposed
   - One-tap accept or decline with reason

3. **Expiration handling**
   - Auto-decline message when proposal expires
   - Suggest re-requesting or booking directly

**Acceptance Criteria:**
- [ ] Professional sees original request when proposing alternative
- [ ] User sees side-by-side comparison
- [ ] Expiration countdown is visible to both parties
- [ ] Expired proposals are handled gracefully

---

## 5. Session & Post-Booking Cluster

### SESS-01: Unified Session Lifecycle Document

| Field | Value |
|-------|-------|
| **ID** | SESS-01 |
| **Journey** | Session Lifecycle (post-booking end-to-end) |
| **Current State** | Fragmented across `session-management.md`, `video-session-execution.md`, and `trust-safety-compliance.md` |
| **Target State** | Single canonical document: `session-lifecycle.md` |
| **Location** | New: `docs/product/journeys/session-lifecycle.md`; Deprecate old docs or make them appendices |
| **Change Type** | Documentation |
| **Priority** | **P0** |
| **Effort** | M (3-4 days) |
| **Dependencies** | None |
| **Owner** | Product + UX Research |

**Detailed Changes Required:**

1. **Merge and reconcile**
   - Combine all three existing docs into one
   - Resolve any contradictions (e.g., no-show thresholds, dispute windows)

2. **Structure the unified journey**
   ```
   Phase 1: Pre-Session (confirm → remind → prepare)
   Phase 2: Session Window (join → waiting room → active → end)
   Phase 3: Post-Session (complete → review window → review submitted)
   Phase 4: Exception (no-show → dispute → resolution)
   ```

3. **State diagram**
   - Visual state machine showing all transitions
   - Include both internal states and UI states

4. **Appendices**
   - Agora-specific implementation notes
   - Provider-agnostic abstraction contract
   - Evidence/logging requirements for disputes

**Acceptance Criteria:**
- [ ] Single document covers entire session lifecycle
- [ ] No contradictions with canonical spec
- [ ] State diagram included
- [ ] Old docs updated to point to new canonical doc

---

### SESS-02: Session Join Experience

| Field | Value |
|-------|-------|
| **ID** | SESS-02 |
| **Journey** | Video Session Execution |
| **Current State** | `/sessao/[bookingId]` validates window (20 min before to 4h after) and renders `VideoSession`. Limited pre-join UX. |
| **Target State** | Rich pre-join experience: device check, waiting room, countdown, professional/user readiness indicators |
| **Location** | `app/(app)/sessao/[bookingId]/page.tsx`, `components/booking/VideoSession.tsx`, `/api/agora/token` |
| **Change Type** | Design + Frontend + Backend |
| **Priority** | **P1** |
| **Effort** | L (1.5-2 weeks) |
| **Dependencies** | SESS-01 |
| **Owner** | Product Design + Full-stack |

**Detailed Changes Required:**

1. **Pre-join screen (outside Agora)**
   - Show countdown: "Session starts in 12 minutes"
   - Device check: camera, microphone, speaker test
   - Connection test: ping/latency indicator
   - "I'm ready" button (optional readiness signal)

2. **Waiting room**
   - If user joins early: "Waiting for [Professional]. You'll join automatically when they arrive."
   - If professional joins first: mirror message for professional

3. **Readiness indicators**
   - "Dr. Silva is ready and waiting" vs "Dr. Silva hasn't joined yet"
   - Reduce anxiety about being in the wrong place

4. **Join window clarity**
   - If outside window: clear message with next steps
     - Too early: "Come back at [time]. We'll send a reminder."
     - Too late: "This session has ended. [Reschedule / Contact support]"

**Acceptance Criteria:**
- [ ] Pre-join screen with device check
- [ ] Waiting room with readiness indicators
- [ ] Clear messaging when outside join window
- [ ] Mobile-optimized session join

---

### SESS-03: Review Moderation Visibility

| Field | Value |
|-------|-------|
| **ID** | SESS-03 |
| **Journey** | Review Lifecycle |
| **Current State** | Reviews submitted with `is_visible=false`. User not informed of moderation state. |
| **Target State** | User sees review status: submitted → under review → published / rejected (with reason) |
| **Location** | `app/(app)/avaliar/[bookingId]/page.tsx`, `app/(app)/perfil/page.tsx`, `lib/actions/admin.ts` |
| **Change Type** | Frontend + Backend |
| **Priority** | **P1** |
| **Effort** | M (3-4 days) |
| **Dependencies** | SESS-01 |
| **Owner** | Frontend + Backend |

**Detailed Changes Required:**

1. **Review status model**
   - Extend review row with `moderation_status`: `pending`, `approved`, `rejected`
   - If rejected: store `moderation_reason` (generic categories: "inappropriate language", "missing context", "suspected fake")

2. **User-facing status**
   - In profile → "My Reviews" section (new or existing)
   - Show status badge per review
   - If rejected: show reason and option to edit/resubmit

3. **Notification**
   - When review is approved: "Your review for [Professional] is now live"
   - When rejected: "Your review needs adjustment: [reason]"

**Acceptance Criteria:**
- [ ] User can see status of their submitted reviews
- [ ] Rejected reviews include reason and edit path
- [ ] Notifications sent on status change

---

## 6. Professional Workspace Cluster

### WORK-01: Unified Scheduling Workspace

| Field | Value |
|-------|-------|
| **ID** | WORK-01 |
| **Journey** | Professional Availability & Calendar Management |
| **Current State** | Scattered across `/disponibilidade`, `/configuracoes-agendamento`, and calendar sync modal. |
| **Target State** | Single `/disponibilidade` page with tabs: Weekly Hours, Exceptions, Calendar Sync, Booking Rules, Preview |
| **Location** | `app/(app)/disponibilidade/page.tsx`, `components/settings/BookingSettingsClient.tsx`, `components/calendar/` |
| **Change Type** | Design + Frontend + Backend |
| **Priority** | **P0** |
| **Effort** | L (2 weeks) |
| **Dependencies** | None |
| **Owner** | Product Design + Full-stack |

**Detailed Changes Required:**

1. **Tab structure**
   ```
   /disponibilidade
   ├── Weekly Hours (quick set, copy-paste patterns)
   ├── Exceptions (block specific dates, holidays, vacation)
   ├── Calendar Sync (Google/Outlook/Apple OAuth + status)
   ├── Booking Rules (notice, buffer, window, cancellation policy)
   └── Preview (see how users will see your availability)
   ```

2. **Weekly Hours tab**
   - Visual week grid (Mon-Sun)
   - Click to add time block
   - Drag to resize
   - Copy day pattern to other days
   - "I'm unavailable" toggle per day

3. **Exceptions tab**
   - Calendar-like view for blocking dates
   - "Vacation mode" toggle with date range
   - Import holidays by country

4. **Calendar Sync tab**
   - OAuth connection status per provider
   - Last sync time
   - Conflict preview: "Your Google Calendar has 3 events this week that block availability"
   - Manual sync trigger

5. **Booking Rules tab**
   - Move content from `/configuracoes-agendamento` here
   - Visual preview: "With these rules, your earliest bookable slot is [date]"

6. **Preview tab**
   - Simulate user view: "A user in [timezone] sees these slots available"
   - Timezone toggle for preview

7. **Deprecate or redirect old routes**
   - `/configuracoes-agendamento` → redirect to `/disponibilidade?tab=rules`
   - Ensure no broken bookmarks

**Acceptance Criteria:**
- [ ] All scheduling config in one page with tabs
- [ ] Weekly hours support click-to-add and drag-to-resize
- [ ] Calendar sync shows status and conflicts
- [ ] Preview shows user-facing availability
- [ ] Old `/configuracoes-agendamento` redirects gracefully

---

### WORK-02: Professional Dashboard Quick Actions

| Field | Value |
|-------|-------|
| **ID** | WORK-02 |
| **Journey** | Professional Dashboard |
| **Current State** | Dashboard shows metrics and onboarding tracker. Quick actions are text links. |
| **Target State** | Context-aware quick actions based on dashboard state: pending confirmations, unread requests, upcoming sessions |
| **Location** | `app/(app)/dashboard/page.tsx`, `components/dashboard/` |
| **Change Type** | Design + Frontend |
| **Priority** | **P1** |
| **Effort** | S (2-3 days) |
| **Dependencies** | None |
| **Owner** | Product Design + Frontend |

**Detailed Changes Required:**

1. **Action cards**
   - If pending confirmations > 0: prominent card "3 bookings need your confirmation" → CTA to `/agenda?filter=pending`
   - If upcoming session < 24h: "Session with [User] in 4 hours" → CTA "Prepare / Join"
   - If open requests > 0: "2 clients requested custom times" → CTA to review requests

2. **Earnings snapshot**
   - "You've earned $X this week. Next payout: [date]."
   - CTA to `/financeiro`

3. **Workspace health**
   - Convert `buildProfessionalWorkspaceAlerts` alerts into actionable cards
   - Not just "Your bio is incomplete" but "Add 50+ words to your bio to improve search ranking → Edit profile"

**Acceptance Criteria:**
- [ ] Dashboard shows context-aware action cards
- [ ] Each card has single primary action
- [ ] Empty states handled gracefully

---

### WORK-03: Earnings & Payout Visibility

| Field | Value |
|-------|-------|
| **ID** | WORK-03 |
| **Journey** | Professional Financial |
| **Current State** | `/financeiro` shows basic metrics. Payout eligibility and status are not visible. |
| **Target State** | Professional sees: earned, pending, available for payout, next payout date, payout history, and eligibility blockers |
| **Location** | `app/(app)/financeiro/page.tsx`, `lib/stripe/` |
| **Change Type** | Design + Frontend + Backend |
| **Priority** | **P1** |
| **Effort** | M (4-5 days) |
| **Dependencies** | Wave 3 readiness (real payouts) |
| **Owner** | Product Design + Full-stack |

**Detailed Changes Required:**

1. **Earnings breakdown**
   - Total earned | Pending (sessions not yet completed) | Available (eligible for payout)
   - Per-booking detail: gross amount, platform fee, net amount, status

2. **Payout status**
   - "Next payout: $X on [date]" or "You need $Y more to reach minimum threshold"
   - Payout method on file (last 4 digits)
   - Payout history table

3. **Eligibility blockers**
   - If payout blocked: clear explanation with CTA to resolve
     - "Complete KYC to receive payouts →"
     - "Add payout method →"

**Acceptance Criteria:**
- [ ] Earnings breakdown is clear and accurate
- [ ] Payout status and history visible
- [ ] Blockers explained with resolution CTAs

---

## 7. Admin & Operations Cluster

### ADMIN-01: Operator Case Resolution Journey

| Field | Value |
|-------|-------|
| **ID** | ADMIN-01 |
| **Journey** | Admin Operations |
| **Current State** | Case queue is described architecturally but has no end-to-end operator journey |
| **Target State** | Documented operator journey: receive → triage → investigate → decide → communicate → close |
| **Location** | New: `docs/product/journeys/operator-case-resolution.md`; UI: `app/(app)/admin/` |
| **Change Type** | Documentation + Design + Frontend + Backend |
| **Priority** | **P1** |
| **Effort** | L (2-3 weeks) |
| **Dependencies** | Wave 4 readiness |
| **Owner** | Product + Full-stack |

**Detailed Changes Required:**

1. **Document the journey** (first)
   - Define each phase with entry/exit criteria
   - Define SLAs per case type
   - Define escalation rules

2. **Case queue UI**
   - `/admin/operacoes` (new route or expand `/admin`)
   - Filterable queue: by type, priority, status, assignee
   - Sort: oldest first, priority, recently updated

3. **Case detail view**
   - Left panel: case summary, status, priority, assignee
   - Center: linked entities (booking, payment, user, professional) with quick-nav
   - Right: timeline of events, internal notes, communication history

4. **Decision workflow**
   - Structured decision form per case type
   - Required evidence attachment
   - Pre-filled communication templates
   - "Request more info from user/professional" action

5. **Audit trail**
   - Every action logged with timestamp, actor, before/after state
   - Exportable for compliance

**Acceptance Criteria:**
- [ ] Operator case journey documented
- [ ] Queue UI lists cases with filters
- [ ] Case detail shows full context and linked entities
- [ ] Decisions are structured and auditable

---

### ADMIN-02: Admin Navigation Alignment

| Field | Value |
|-------|-------|
| **ID** | ADMIN-02 |
| **Journey** | Admin Operations |
| **Current State** | Admin nav has 8 domains (Dashboard, Operations, Professionals, Users, Finance, Catalog, Growth, Settings) but only Dashboard, Planos, Revisao, Taxonomia are implemented |
| **Target State** | Implement or stub remaining domains; consolidate what's live into the 8-domain structure |
| **Location** | `app/(app)/admin/`, `components/admin/` |
| **Change Type** | Frontend |
| **Priority** | **P2** |
| **Effort** | M (1 week) |
| **Dependencies** | ADMIN-01 |
| **Owner** | Frontend |

**Detailed Changes Required:**

1. **Map existing screens to 8 domains**
   - Dashboard → Dashboard ✓
   - Planos → Catalog (or Finance? clarify with product)
   - Revisao → Professionals ✓
   - Taxonomia → Catalog ✓
   - Missing: Operations (case queue), Users, Finance, Growth, Settings

2. **Stub pages for missing domains**
   - Create placeholder pages with "Coming in Wave X" message
   - Ensure navigation structure is complete so operators learn the IA early

3. **Clarify Planos placement**
   - Plan config is currently `/admin/planos`
   - Is this Catalog (taxonomy + plans) or Finance (pricing)?
   - Recommendation: Move to Catalog subdomain

**Acceptance Criteria:**
- [ ] All 8 admin domains have routes
- [ ] Existing screens mapped correctly
- [ ] Missing domains show helpful placeholder

---

## 8. Cross-Cutting Changes

### CROSS-01: Notification & Inbox Lifecycle

| Field | Value |
|-------|-------|
| **ID** | CROSS-01 |
| **Journey** | All (cross-cutting) |
| **Current State** | Notifications mentioned in architecture but no journey doc. `/mensagens` is placeholder. Email templates exist but notification architecture is undocumented. |
| **Target State** | Documented notification lifecycle + functional in-app inbox |
| **Location** | New: `docs/product/journeys/notification-inbox-lifecycle.md`; UI: `app/(app)/mensagens/page.tsx`; Backend: `lib/email/`, `inngest/functions/` |
| **Change Type** | Documentation + Design + Full-stack |
| **Priority** | **P0** |
| **Effort** | L (2-3 weeks) |
| **Dependencies** | SESS-01 |
| **Owner** | Product + Full-stack |

**Detailed Changes Required:**

1. **Document the journey**
   - Trigger events per actor (user, pro, admin)
   - Channel rules: in-app always, email for urgent, push (future)
   - Grouping: by entity (booking-related, profile-related, system)
   - Read/unread state
   - Deep-linking: every notification links to relevant screen

2. **In-app inbox UI**
   - `/mensagens` repurposed from chat placeholder to notification inbox
   - List view: grouped by date, with unread indicator
   - Detail view: full message with action buttons
   - Empty state: "No notifications yet"

3. **Notification types to implement**
   - Booking: created, confirmed, declined, rescheduled, cancelled, reminder
   - Session: joinable, starting soon, completed
   - Review: submitted, approved, rejected
   - Professional: new request, proposal accepted/declined, review received
   - System: onboarding reminder, payout processed, plan renewal

4. **Email parity**
   - Every in-app notification has corresponding email template
   - Unsubscribe/opt-out per notification type (future)

**Acceptance Criteria:**
- [ ] Notification lifecycle documented
- [ ] In-app inbox lists notifications with grouping
- [ ] Each notification is actionable (deep link)
- [ ] Email templates exist for all critical notifications

---

### CROSS-02: Global Context Propagation Spec

| Field | Value |
|-------|-------|
| **ID** | CROSS-02 |
| **Journey** | All (cross-cutting) |
| **Current State** | Timezone, currency, language rules scattered across 5+ documents with slight inconsistencies |
| **Target State** | Single canonical document defining how context propagates across all journeys |
| **Location** | New: `docs/product/journeys/global-context-propagation.md` |
| **Change Type** | Documentation |
| **Priority** | **P1** |
| **Effort** | S (2-3 days) |
| **Dependencies** | None |
| **Owner** | Product |

**Detailed Changes Required:**

1. **Define context dimensions**
   - Country (affects compliance, pricing, payout eligibility)
   - Timezone (affects availability display, reminder timing, session join window)
   - Currency (affects price display, payment processing)
   - Language (affects UI copy, email templates, support routing)

2. **Propagation rules per journey**
   - Auth: capture from device, allow override
   - Search: use user preference or device default
   - Booking: always show in user's timezone + currency
   - Session: UTC canonical, display in both user and pro timezones
   - Payout: use pro's country + currency

3. **Edge cases**
   - User and pro in different timezones: show both
   - Currency unsupported by Stripe: fallback + messaging
   - Daylight saving transitions: explicit handling

**Acceptance Criteria:**
- [ ] Single document defines all context rules
- [ ] No contradictions with existing specs
- [ ] Every journey references this doc for context questions

---

### CROSS-03: Edge Case Recovery Playbook

| Field | Value |
|-------|-------|
| **ID** | CROSS-03 |
| **Journey** | All edge cases |
| **Current State** | 12 edge cases listed in blueprint but no recovery paths documented |
| **Target State** | Every edge case has: detection → user communication → recovery action → fallback → operational alert |
| **Location** | New: `docs/product/ux-research/edge-case-recovery-playbook.md` |
| **Change Type** | Documentation + Design (for error UIs) |
| **Priority** | **P2** |
| **Effort** | M (1 week) |
| **Dependencies** | None |
| **Owner** | Product + UX Research |

**Edge Cases to Document:**

1. No professionals available
2. Professional unavailable after booking
3. User no-show
4. Professional no-show
5. Failed payment
6. Expired payment method
7. Session connection issue
8. Reschedule conflict
9. Account blocked/flagged
10. Refund denied
11. Review moderation
12. Invalid verification submission

**Template per edge case:**
```
## Edge Case: [Name]

### Detection
How the system knows this happened.

### User Communication
What message the user sees, with tone guidance.

### Recovery Action
What the user can do next (CTAs).

### Fallback
What happens if recovery fails.

### Operational Alert
What the ops team sees and should do.

### Related Journeys
Links to parent journeys.
```

**Acceptance Criteria:**
- [ ] All 12 edge cases documented with recovery paths
- [ ] Error UIs designed for critical edge cases
- [ ] Ops team can use playbook for training

---

## 9. Research & Validation Initiatives

### RESEARCH-01: Persona Foundation

| Field | Value |
|-------|-------|
| **ID** | RESEARCH-01 |
| **Output** | `docs/product/ux-research/personas.md` |
| **Method** | Analytics review + 8-12 semi-structured interviews |
| **Timeline** | 2 weeks |
| **Participants** | 4-6 users (mix of first-time and repeat), 4-6 professionals (mix of onboarding stages) |
| **Owner** | UX Research |

**Research Questions:**
1. What motivated you to search for a professional on Muuday?
2. Walk me through your last booking. What was easy? What was hard?
3. How do you decide which professional to book?
4. (For professionals) What made you sign up? Where did you get stuck?
5. What would make you book more often / accept more bookings?

**Deliverables:**
- 4 personas with: demographics, goals, frustrations, tech proficiency, device preference, journey touchpoints
- Journey heatmaps per persona (which journeys they touch, where they drop off)
- Design implications per persona

---

### RESEARCH-02: Professional Onboarding Usability Test

| Field | Value |
|-------|-------|
| **ID** | RESEARCH-02 |
| **Method** | Moderated remote usability test |
| **Timeline** | 1 week |
| **Participants** | 5-8 professionals at various onboarding stages |
| **Tasks** | Complete onboarding tracker, set availability, submit for review |
| **Metrics** | Completion rate, time on task, error rate, SUS score |
| **Owner** | UX Research |

---

### RESEARCH-03: Auth Modal A/B Test

| Field | Value |
|-------|-------|
| **ID** | RESEARCH-03 |
| **Method** | A/B test: inline modal (variant) vs full-page redirect (control) |
| **Timeline** | 2 weeks |
| **Metrics** | Booking intent → signup completion rate, signup → booking completion rate |
| **Owner** | Product + Data |

---

## 10. Implementation Priority Matrix

### P0 — Blockers (Do First)

| ID | Change | Effort | Impact | Owner |
|----|--------|--------|--------|-------|
| AUTH-01 | Public booking auth modal | M | Critical | Frontend + Design |
| AUTH-02 | Post-login destination with context | S | Critical | Frontend |
| PRO-01 | Dual-gate tracker redesign | L | Critical | Full-stack + Design |
| SESS-01 | Unified session lifecycle doc | M | Critical | Product |
| CROSS-01 | Notification & inbox lifecycle | L | Critical | Full-stack + Design |

### P1 — Wave 3 Readiness

| ID | Change | Effort | Impact | Owner |
|----|--------|--------|--------|-------|
| AUTH-03 | Context-aware user onboarding | S | High | Frontend |
| PRO-03 | Plan selection return state | M | High | Full-stack |
| BOOK-01 | Booking timeline visualization | M | High | Frontend + Design |
| BOOK-02 | Recurring booking journey + UI | L | High | Product + Frontend |
| BOOK-03 | Request booking proposal UX | M | High | Frontend + Design |
| SESS-02 | Session join experience | L | High | Full-stack + Design |
| SESS-03 | Review moderation visibility | M | High | Full-stack |
| WORK-01 | Unified scheduling workspace | L | Critical | Full-stack + Design |
| WORK-02 | Dashboard quick actions | S | High | Frontend + Design |
| WORK-03 | Earnings & payout visibility | M | High | Full-stack + Design |
| ADMIN-01 | Operator case resolution journey | L | High | Full-stack + Design |
| CROSS-02 | Global context propagation spec | S | High | Product |
| DISC-01 | Search empty state recovery | M | High | Frontend + Design |
| DISC-02 | Profile trust signal consolidation | M | High | Frontend + Design |

### P2 — Stabilization & Polish

| ID | Change | Effort | Impact | Owner |
|----|--------|--------|--------|-------|
| PRO-02 | Terms acceptance UX | S | Medium | Frontend + Design |
| ADMIN-02 | Admin navigation alignment | M | Medium | Frontend |
| CROSS-03 | Edge case recovery playbook | M | Medium | Product + UX Research |
| DISC-03 | Compare professionals | L | Low | Full-stack + Design |
| RESEARCH-01 | Persona foundation | M | High | UX Research |
| RESEARCH-02 | Pro onboarding usability test | S | High | UX Research |
| RESEARCH-03 | Auth modal A/B test | S | High | Product + Data |

---

## 11. Dependency Graph

```
Week 1-2 (Foundation):
├─ AUTH-01 ─┬─→ AUTH-03
│           └─→ RESEARCH-03
├─ AUTH-02 ──→ AUTH-01
├─ SESS-01 ──→ SESS-02, SESS-03, BOOK-01
├─ CROSS-02 ─→ All context-dependent changes
└─ RESEARCH-01 ─→ PRO-01 (persona-informed design)

Week 3-4 (Pro Experience Core):
├─ PRO-01 ─┬─→ PRO-03
│          └─→ WORK-02
├─ WORK-01 ──→ All scheduling-related polish
└─ DISC-01, DISC-02 ─→ Discovery conversion

Week 5-6 (Booking Hardening):
├─ BOOK-01 ──→ BOOK-02
├─ BOOK-03 ──→ CROSS-01 (notifications)
└─ SESS-02 ──→ SESS-03

Week 7-8 (Ops & Trust):
├─ ADMIN-01 ──→ ADMIN-02
├─ CROSS-01 ──→ All notification triggers
└─ CROSS-03 ──→ Edge case UI hardening

Week 9-10 (Validation):
├─ RESEARCH-02 ──→ PRO-01 refinements
├─ RESEARCH-03 ──→ AUTH-01 validation
└─ E2E coverage ──→ All P0 + P1 items
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | UX Research Audit | Initial implementation map |

**Next update:** After Phase 1 completion or 2026-05-17, whichever comes first.


---

## Appendix: New Canonical Journey Documents

The following journey documents were created as part of the audit follow-up to fill gaps identified in the audit:

| Document | Size | Status | Fills Gap |
|----------|------|--------|-----------|
| `docs/product/journeys/session-lifecycle.md` | 31KB | ✅ Complete | Unifies 3 fragmented session docs |
| `docs/product/journeys/notification-inbox-lifecycle.md` | 17KB | ✅ Complete | No prior notification journey doc |
| `docs/product/journeys/recurring-booking-journey.md` | 17KB | ✅ Complete | Recurring was underdocumented |
| `docs/product/journeys/review-moderation-lifecycle.md` | 17KB | ✅ Complete | No prior review journey doc |
| `docs/product/journeys/operator-case-resolution.md` | 15KB | ✅ Complete | Admin case queue was unmapped |
| `docs/product/journeys/global-context-propagation.md` | 10KB | ✅ Complete | Context propagation was scattered |
| `docs/product/ux-research/edge-case-recovery-playbook.md` | 16KB | ✅ Complete | No prior edge case playbook |

### Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | UX Research Audit | Initial implementation map |
| 1.1 | 2026-04-19 | UX Research Audit | Added Appendix with new canonical docs |

**Next update:** After Phase 1 completion or 2026-05-17, whichever comes first.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
