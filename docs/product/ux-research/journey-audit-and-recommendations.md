# Muuday Journey Audit & UX Recommendations

**Document type:** Strategic UX Research & Journey Architecture Review  
**Scope:** All user, professional, shared, admin, and system journeys  
**Status:** Complete audit — no code changes  
**Date:** 2026-04-19  
**Auditor perspective:** Senior UX Researcher + Principal Product Designer  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Audit Methodology](#2-audit-methodology)
3. [Journey Inventory](#3-journey-inventory)
4. [Interdependency Map](#4-interdependency-map)
5. [Inconsistencies & Friction Points](#5-inconsistencies--friction-points)
6. [Recommendations](#6-recommendations)
7. [Prioritized Improvement Roadmap](#7-prioritized-improvement-roadmap)
8. [Appendices](#8-appendices)

---

## 1. Executive Summary

Muuday is a managed marketplace connecting users with professionals via video sessions. The product has **13 officially documented journeys**, **91 catalogued journeys in the UX Blueprint**, and **~35+ implicit code-level flows** spanning auth, discovery, booking, payments, professional operations, admin, trust & safety, and session execution.

### Key Finding
> **The product suffers from a "documentation-to-implementation gap" and "journey fragmentation."** Several critical handoffs between journeys are underspecified, creating inconsistency in user experience, state management, and operational trust.

### Top 5 Strategic Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **Dual-gate confusion** — Professional onboarding has two gates (public listing vs. first booking) but the UX does not make this distinction legible to professionals. | Critical | Churn, support tickets, trust erosion |
| 2 | **Auth/booking handoff inconsistency** — The spec demands a signup/login *modal* on public booking intent; the implementation uses a *page redirect*. This breaks flow continuity and increases abandonment. | Critical | Conversion loss |
| 3 | **Session management is split across three documents** — Session management, video execution, and trust/compliance each describe pieces of the same post-booking lifecycle without a unified source of truth. | High | Operational errors, dev misalignment |
| 4 | **No persona foundation** — Despite 91 journeys mapped, there are zero documented user or professional personas. Journey quality cannot be validated without archetypes. | High | Design decisions lack anchor |
| 5 | ~~Admin case queue is conceptual but not journey-mapped~~ — **RESOLVED** — `operator-case-resolution.md` now documents the full case lifecycle. | — | — |

### Recommendation at a Glance

**Short term (0-4 weeks):** Fix auth/booking handoff, consolidate session journey docs, introduce persona scaffolding.  
**Medium term (1-3 months):** Redesign professional onboarding legibility, build admin case journey, implement notification/inbox lifecycle.  
**Long term (3-6 months):** Full journey test coverage, provider-agnostic session abstraction, compliance disclaimer versioning.

---

## 2. Audit Methodology

This audit followed the **UX Researcher & Designer** skill protocol:

1. **Document archaeology** — All `docs/product/journeys/`, `docs/spec/`, `docs/handover/`, and blueprint artifacts were reviewed.
2. **Code-to-journey mapping** — Every route (`app/**/page.tsx`, `app/**/route.ts`), server action (`lib/actions/*`), and domain module (`lib/booking/`, `lib/professional/`, `lib/calendar/`) was traced to its parent journey.
3. **Interdependency tracing** — Cross-journey handoffs (e.g., onboarding → booking → session → review → trust) were mapped for state consistency.
4. **Gap analysis** — Each journey was scored against: entry clarity, happy path definition, edge case coverage, state machine alignment, and UX continuity.
5. **Heuristic evaluation** — Nielsen's 10 heuristics + marketplace-specific criteria (trust-first, bilateral clarity, risk-aware friction, recovery-first UX).

### Data Sources

| Source | Coverage |
|--------|----------|
| `docs/product/journeys/*.md` (8 files) | Official journey docs |
| `artifacts/onedrive-import-2026-04-01/ux-blueprint.html` | 91 journeys with benchmarks |
| `docs/spec/source-of-truth/part1..part5` | Canonical specification |
| `docs/spec/consolidated/*` | Coverage matrix, master spec, execution plan |
| `app/**` (35 pages, 14 layouts, 37 API routes) | Implementation reality |
| `lib/actions/*`, `lib/booking/*`, `lib/professional/*` | Business logic flows |
| `checkly/tests/*` | E2E journey validation |

---

## 3. Journey Inventory

### 3.1 Official Documented Journeys (8)

| ID | Journey | File | Status | Completeness Score* |
|----|---------|------|--------|---------------------|
| J01 | User Onboarding | `user-onboarding.md` | In Progress | 6/10 |
| J02 | Professional Onboarding | `professional-onboarding.md` | In Progress | 7/10 |
| J03 | Search & Booking | `search-booking.md` | In Progress | 7/10 |
| J04 | Session Management | `session-management.md` | In Progress | 5/10 |
| J05 | Video Session Execution | `video-session-execution.md` | Planned | 4/10 |
| J06 | Payments, Billing & Revenue | `payments-billing-revenue.md` | In Progress | 5/10 |
| J07 | Admin Operations | `admin-operations.md` | In Progress | 5/10 |
| J08 | Trust, Safety & Compliance | `trust-safety-compliance.md` | Planned/In Progress | 4/10 |

\* *Completeness scored on: actors, entry points, happy path, edge cases, state machine, exit criteria, metrics, and known gaps.*

### 3.2 UX Blueprint Journeys (91)

The blueprint (`ux-blueprint.html`) catalogs journeys at a granular screen level:

**User Journeys (44)**
Discovery: landing, waitlist, signup, login, email verification, password reset, onboarding/preferences, browse categories, search, filters, sort, no-results, view profile, watch intro video, review credentials/trust, save/shortlist, compare, pre-booking message.  
Booking: first session booking, recurring booking, payment flow, payment success/failure, reschedule, cancel.  
Post-session: pre-session reminders, join video, in-session interaction, session end, leave review, report issue, rebook same/other professional.  
Lifecycle: messaging inbox, notification center, user dashboard, session history, saved professionals, payment methods, account settings, notification settings, delete account, request refund/dispute, contact support.

**Professional Journeys (38)**
Discovery/apply: landing exploration, apply to join, create account, verify email, submit credentials, identity verification, approval/rejection flow.  
Setup: complete profile, add bio/specialization/languages/pricing/intro video/documents, set availability, configure timezone, recurring availability, block times.  
Operations: accept/decline booking, reschedule, dashboard, session preparation, join session, messaging, session completed, receive review.  
Financial: earnings dashboard, payout setup/history, tax/payment info.  
Lifecycle: notification center, profile edits, availability updates, pause/vacation mode, support, report issue, delete/deactivate.

**Shared Journeys (9)**
Trust & verification flow, review lifecycle, booking lifecycle end-to-end, session lifecycle end-to-end, notification lifecycle, refund/dispute lifecycle, messaging lifecycle, waitlist-to-active user lifecycle, professional application-to-approved provider lifecycle.

**Edge Cases (12)**
No professionals available, professional unavailable after booking, user no-show, professional no-show, failed payment, expired payment method, session connection issue, reschedule conflict, account blocked/flagged, refund denied, review moderation, invalid verification submission.

**State Variants (8)**
Search results, inbox, notifications, calendar, dashboard, saved list, payments, reviews — each with empty/loading/skeleton/success/error states.

### 3.3 Implicit Code-Level Flows (35+ pages → ~50 micro-journeys)

Every page and API route represents a micro-journey. Key implicit flows not explicitly documented:

| Micro-Journey | Location | Why It Matters |
|--------------|----------|---------------|
| OAuth callback resolution | `/auth/callback` | Determines post-login destination; has 4+ branches |
| Post-login destination resolution | `lib/auth/post-login-destination.ts` | Critical handoff between auth and role workspace |
| Slot lock acquisition/release | `lib/booking/slot-locks.ts` | Race-condition prevention; invisible to users but impacts booking confidence |
| Calendar sync OAuth dance | `/api/professional/calendar/*` | 4 providers × 3 operations = 12 micro-flows |
| Onboarding modal context hydration | `/api/professional/onboarding/modal-context` | Performance-critical; impacts perceived onboarding speed |
| Public visibility recomputation | `/api/professional/recompute-visibility` | Invisible system journey that affects search results |
| Booking reminder/timeout cron | `/api/cron/*` | System journeys with user-facing consequences |

---

## 4. Interdependency Map

### 4.1 The Five Journey Clusters

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MUUDAY JOURNEY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   CLUSTER A  │───→│   CLUSTER B  │───→│   CLUSTER C  │                  │
│  │  DISCOVERY   │    │   BOOKING    │    │   SESSION    │                  │
│  │              │    │              │    │              │                  │
│  │ • Landing    │    │ • Direct     │    │ • Join       │                  │
│  │ • Search     │    │ • Request    │    │ • Execute    │                  │
│  │ • Profile    │    │ • Recurring  │    │ • No-show    │                  │
│  │ • Filters    │    │ • Reschedule │    │ • Dispute    │                  │
│  │ • Favorites  │    │ • Cancel     │    │ • Review     │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         ↑                   ↑                   ↑                           │
│         │                   │                   │                           │
│  ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐                    │
│  │  CLUSTER D  │     │  CLUSTER E  │     │  CLUSTER F  │                    │
│  │    AUTH     │     │   ONBOARD   │     │   SYSTEM    │                    │
│  │             │     │             │     │             │                    │
│  │ • Signup    │     │ • User      │     │ • Payments  │                    │
│  │ • Login     │     │ • Pro 8-stg │     │ • Payouts   │                    │
│  │ • OAuth     │     │ • Admin rev │     │ • Notifications                    │
│  │ • Complete  │     │ • Go-live   │     │ • Cron jobs │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLUSTER G — ADMIN OPS                       │   │
│  │  • Review queue • Case management • Moderation • Finance exceptions │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Critical Handoff Points

| # | From | To | Handoff Mechanism | Risk Level |
|---|------|-----|-------------------|------------|
| H1 | Auth (signup) | User Onboarding | `resolvePostLoginDestination(role)` | Medium |
| H2 | Auth (signup) | Pro Onboarding | `/dashboard?openOnboarding=1` | **High** |
| H3 | Public Search | Booking | Signup-first redirect (not modal) | **High** |
| H4 | Booking | Payments | Legacy `payments` insert with rollback | **High** |
| H5 | Pro Onboarding | Admin Review | `submit-review` → `/admin/revisao/[id]` | Medium |
| H6 | Admin Review | Pro Dashboard | Email + dashboard alert | Medium |
| H7 | Booking Confirmed | Session Execution | `/sessao/[bookingId]` 20-min window | Medium |
| H8 | Session End | Review | `/avaliar/[bookingId]` prompt | Low |
| H9 | Review | Trust/Moderation | `is_visible=false` until admin approve | Medium |
| H10 | Any | Notification | Inngest enqueue + DB insert | Medium |
| H11 | Booking | Calendar Sync | `enqueueBookingCalendarSync` async | Low |
| H12 | Pro Settings | Public Visibility | `recompute-visibility` async | Medium |

---

## 5. Inconsistencies & Friction Points

### 5.1 Critical (Fix Immediately)

#### C1: The "Signup-First Redirect" vs. "Signup Modal" Gap

**Where:** `search-booking.md` Gap #4, `user-onboarding.md` Rule #2, `part2-onboarding-booking-lifecycle.md` Section 0.3  
**What:** The canonical spec explicitly states: *"If a visitor tries to book from public search/profile flow, open sign-up/login modal"* with *"primary action: sign up, secondary action: login."*  
**Reality:** The implementation routes unauthenticated visitors to `/cadastro` as a full page redirect with `redirect` param context.  
**Impact:** Flow abandonment increases because context (selected professional, date, slot) is harder to preserve across a full page navigation than a modal overlay. The user loses visual continuity and the "scent" of their original intent.  
**UX Principle Violated:** Nielsen #3 (User control and freedom), Nielsen #1 (Visibility of system status).

**Evidence:**
- Spec: "Public booking intent must be signup-first with login as secondary action path"
- Code: `PublicBookingAuthModal` component exists but blueprint notes "modal UX still pending"
- Checkly test: `search-booking-journey.spec.js` tests login → booking but not anonymous → booking handoff

**Recommendation:** Implement the `PublicBookingAuthModal` as an inline overlay that preserves booking context (professional ID, selected slot, service type) in URL state. Only fall back to full-page redirect if JavaScript is disabled.

---

#### C2: Professional Onboarding "Dual-Gate" Is Invisible to Users

**Where:** `professional-onboarding.md`, `lib/professional/onboarding-gates.ts`, dashboard tracker  
**What:** The platform distinguishes between (a) being publicly listed and (b) being able to accept first booking. The professional sees a single checklist tracker.  
**Reality:** When approved, the professional sees "Approved" but may still be blocked from first booking if payout/KYC is incomplete. There is no visual distinction in the tracker between "live" and "bookable."  
**Impact:** Professionals believe they are ready to receive clients but are not. Support tickets, confusion, churn.  
**UX Principle Violated:** Nielsen #1 (Visibility of system status), Trust-first principle.

**Evidence:**
- `professional-onboarding.md`: "Public listing eligibility is not equal to first-booking acceptance eligibility"
- `lib/professional/onboarding-gates.ts`: `evaluateFirstBookingEligibility` checks separate conditions
- Dashboard tracker: Single progress bar; no dual-state visualization

**Recommendation:** Redesign the tracker to show **two parallel lanes**:
- Lane 1: "Profile Live" (visibility to clients) — stages C1-C8 + admin review
- Lane 2: "Ready to Accept Bookings" (operational readiness) — payout, KYC, billing card
Use color/states: green = complete, amber = in progress, gray = locked until Lane 1 is done.

---

#### C3: Session Management Is Fragmented Across Three Documents

**Where:** `session-management.md`, `video-session-execution.md`, `trust-safety-compliance.md`  
**What:** The post-booking lifecycle (confirm → remind → join → execute → complete → review → dispute) is split across three journey documents with no single owner.  
**Reality:** Session Management covers "post-booking lifecycle" but excludes video execution specifics. Video Session Execution covers Agora specifics but not no-show/dispute handoffs. Trust & Safety covers disputes but not session context.  
**Impact:** Developers building the `/sessao/[bookingId]` page must read three documents and infer handoffs. No canonical state diagram exists for the full session lifecycle.  
**UX Principle Violated:** Consistency and standards (Nielsen #4).

**Recommendation:** Create a **unified Session Lifecycle Journey** that owns the entire post-booking experience end-to-end. Deprecate the three fragmented docs or reduce them to implementation appendices.

---

### 5.2 High (Fix Before Wave 3)

#### H1: No User or Professional Personas Exist

**Where:** Entire docs/ tree  
**What:** Despite 91 journeys mapped, there are zero documented personas. The blueprint uses generic "user" and "professional" labels.  
**Impact:** Design decisions lack behavioral anchors. The booking form cannot be optimized without knowing if the primary user is a "anxious first-timer" or a "busy repeat booker." The professional onboarding cannot be streamlined without knowing if the primary professional is a "side-gig newcomer" or a "established practice migrator."  
**Evidence:**
- Explore agent finding: "Não há documentos dedicados a 'Personas' ou 'User Personas' em docs/"
- `ux-blueprint.html`: All journeys are actor-agnostic

**Recommendation:** Create **4 foundational personas** based on analytics and professional onboarding data:
1. **Ana (The Seeker)** — First-time user, anxious, price-sensitive, needs trust signals
2. **Bruno (The Regular)** — Repeat user, efficiency-focused, uses favorites and recurring
3. **Carla (The Side Professional)** — Part-time professional, limited tech proficiency, needs guidance
4. **Diego (The Practice Migrator)** — Established professional, feature-demanding, expects control

Each persona should include: goals, frustrations, tech proficiency, device preference, and which journeys they touch most.

---

#### H2: Admin Case Queue Has No Journey Documentation

**Where:** `admin-operations.md`, `part4-admin-ops-notifications-trust.md` Section 3  
**What:** The case queue system is described architecturally (case entity, statuses, types) but there is no end-to-end journey for an *operator* handling a case.  
**Reality:** An admin operator logging into `/admin` has no documented flow for: receiving a case, reviewing evidence, making a decision, communicating the outcome, and closing the loop.  
**Impact:** When Wave 4 admin/trust work begins, there will be no UX reference for the operator experience. The system will be built backend-first, resulting in a scattered UI.  
**Recommendation:** Document the **Operator Case Resolution Journey**:
1. Case arrives → notification + queue entry
2. Triage → priority assignment + context gathering
3. Investigation → linked bookings, payments, session logs, previous cases
4. Decision → structured decision form + evidence attachment
5. Communication → outbound message to user/professional
6. Closure → case status update + audit log
7. Escalation → transfer to senior ops with full context preserved

---

#### H3: Notification/Inbox Lifecycle Is a Ghost Journey

**Where:** `part4-admin-ops-notifications-trust.md`, `app/(app)/mensagens/page.tsx`  
**What:** Notifications are mentioned in architecture but have no dedicated journey document. The in-app inbox (`/mensagens`) is a placeholder.  
**Reality:** Critical user events (booking confirmed, session reminder, reschedule proposal, review approved) have no defined notification journey. Email is handled via Resend templates, but in-app notification architecture is undocumented.  
**Impact:** Users miss critical updates. Professionals do not know when bookings arrive. The platform feels "dead" between booking and session.  
**Recommendation:** Create the **Notification & Inbox Journey** defining:
- Trigger events per actor
- Channel selection rules (in-app vs email vs push — MVP: in-app + email)
- Delivery cadence and timezone handling
- Read/unread state synchronization
- Notification actionability (deep links to relevant screens)
- Inbox grouping and archiving

---

#### H4: Professional Calendar/Availability UX Has Known Friction

**Where:** `current-state.md` "Active gaps" #1, `/disponibilidade`, `/configuracoes-agendamento`  
**What:** The project explicitly acknowledges: *"Professional operations UX still needs refinement, especially around calendar and scheduling experience."*  
**Reality:** Availability is set in `/disponibilidade`, but booking rules are in `/configuracoes-agendamento`. Calendar sync is in a modal that was removed from onboarding. The professional must visit 3+ screens to configure their schedule fully.  
**Impact:** Onboarding dropout at C7 (availability). Professionals misconfigure availability, leading to double-bookings or empty calendars.  
**Recommendation:** Consolidate availability configuration into a **single Scheduling Workspace** with tabs:
- Weekly Hours (quick set)
- Exceptions (block specific dates)
- Calendar Sync (Google/Outlook/Apple)
- Booking Rules (notice, buffer, window)
- Preview (see how users will see available slots)

---

### 5.3 Medium (Fix During Stabilization)

#### M1: Recurring Booking Journey Is Underdocumented

**Where:** `search-booking.md` Gaps #3, `part2-onboarding-booking-lifecycle.md`  
**What:** Recurring booking exists in code but its journey document is thin. Edge cases (pause, change within 7-day window, auto-renew, batch limits) are not journey-mapped.  
**Recommendation:** Expand the Search & Booking journey with a dedicated **Recurring Booking Sub-Journey** visualizing: setup → reservation → modification → cancellation → completion.

#### M2: Review Moderation Journey Is Invisible to Users

**Where:** `trust-safety-compliance.md`, `/avaliar/[bookingId]`  
**What:** Reviews are submitted with `is_visible=false` and await admin moderation. The user receives no feedback about this state.  
**Recommendation:** Add a **Review Status Journey**: submitted → under review → published / rejected (with reason) → editable. Surface status to the reviewer in their profile/history.

#### M3: Edge Case Recovery Paths Are Not Journey-Mapped

**Where:** `ux-blueprint.html` Edge Cases (12)  
**What:** Edge cases are listed but lack recovery paths. For example, "Failed Payment" has no documented retry or alternative payment flow.  
**Recommendation:** For each edge case, define: detection → user communication → recovery action → fallback → operational alert.

#### M4: Currency/Timezone Context Is Fragile Across Journeys

**Where:** Multiple files reference timezone/currency rules  
**What:** Timezone handling is described in 5+ documents with slightly different phrasing. Currency conversion is in search, booking, and payment contexts.  
**Recommendation:** Create a **Global Context Journey** that defines how country, timezone, currency, and language propagate across all journeys. Make it the single source of truth.

---

## 6. Recommendations

### 6.1 Journey Consolidation (Structural)

**Merge 3 → 1:** `session-management.md` + `video-session-execution.md` + `trust-safety-compliance.md` (session-related parts) → `session-lifecycle.md`

**Merge operational fragments:** Create `notification-inbox-lifecycle.md` from scattered references in Part 4.

**Create missing journeys:**
- `operator-case-resolution.md` (admin)
- `review-moderation-lifecycle.md` (trust)
- `global-context-propagation.md` (cross-cutting)
- `recurring-booking-journey.md` (booking)

### 6.2 UX Improvements (Experience-Level)

#### R1: Trust-First Booking Handoff

**Problem:** Anonymous users who click "Book" lose context.  
**Solution:** Implement inline auth modal with context preservation:
```
[User clicks Book on /profissional/[id]]
    ↓
[Modal opens: "Continue to book with Dr. Silva"]
    ├── Primary: "Create account" (pre-filled with selected slot)
    ├── Secondary: "I already have an account" (login)
    └── Tertiary: "Continue without booking" (close, save intent)
    ↓
[Post-auth: redirect to /agendar/[id] with slot pre-selected]
```

#### R2: Dual-Gate Professional Tracker

**Problem:** Professionals cannot distinguish "live" from "bookable."  
**Solution:** Redesign tracker with two lanes (visual mockup concept):

```
┌─────────────────────────────────────────────┐
│  YOUR PROGRESS                              │
├────────────────────────┬────────────────────┤
│  PROFILE LIVE          │  READY TO BOOK     │
│  [================] 8/8 │  [====>    ] 2/4   │
│  ✅ Account            │  ✅ Plan selected  │
│  ✅ Identity           │  ⏳ Billing card    │
│  ✅ Photo              │  ⏳ Payout method   │
│  ✅ Terms              │  ⬜ KYC verified   │
│  ✅ Services           │                    │
│  ✅ Plan               │  Why? Users can see│
│  ✅ Availability       │  you, but you can't│
│  ✅ Submitted          │  accept bookings   │
│  ✅ Approved           │  until this is done│
└────────────────────────┴────────────────────┘
```

#### R3: Unified Scheduling Workspace

**Problem:** Professional schedule configuration is scattered.  
**Solution:** Single-page workspace with tabs and live preview.

#### R4: Session Lifecycle State Visualization

**Problem:** Users and professionals cannot see where they are in the post-booking lifecycle.  
**Solution:** Add a **booking timeline** to both user and professional agendas:

```
Booking #1234 Timeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Booked — Apr 15, 10:00 AM
🟢 Confirmed — Apr 15, 10:05 AM (auto)
⏳ Reminder — Apr 16, 9:00 AM (scheduled)
⬜ Join session — Apr 16, 10:00 AM
⬜ Session complete
⬜ Review window opens
```

### 6.3 Research Recommendations

| Research Initiative | Method | Timeline | Owner |
|---------------------|--------|----------|-------|
| Persona foundation | Analytics + 8-12 interviews | 2 weeks | UX Research |
| Professional onboarding usability test | Moderated remote, 5-8 professionals | 1 week | UX Research |
| Anonymous booking flow A/B test | Modal vs redirect | 2 weeks | Product + Eng |
| Admin operator shadowing | Contextual inquiry, 3 sessions | 1 week | UX Research |
| First-booking blocker analysis | Cohort analysis + funnel | 1 week | Data + Product |

---

## 7. Prioritized Improvement Roadmap

### Phase 1: Foundation (Weeks 1-2)

| # | Initiative | Effort | Impact | Owner |
|---|-----------|--------|--------|-------|
| 1.1 | Fix auth/booking handoff (modal implementation) | Medium | Critical | Frontend |
| 1.2 | Document 4 foundational personas | Low | High | UX Research |
| 1.3 | Consolidate session lifecycle docs | Low | High | Product |
| 1.4 | Create notification/inbox journey doc | Low | Medium | Product |

### Phase 2: Professional Experience (Weeks 3-6)

| # | Initiative | Effort | Impact | Owner |
|---|-----------|--------|--------|-------|
| 2.1 | Redesign onboarding tracker with dual-gate visualization | Medium | Critical | Design + Frontend |
| 2.2 | Build unified scheduling workspace | High | High | Design + Frontend |
| 2.3 | Add booking timeline to agendas | Medium | High | Frontend |
| 2.4 | Professional onboarding usability tests | Low | High | UX Research |

### Phase 3: Operational Readiness (Weeks 7-10)

| # | Initiative | Effort | Impact | Owner |
|---|-----------|--------|--------|-------|
| 3.1 | Document operator case resolution journey | Low | Medium | Product |
| 3.2 | Implement review status visibility | Low | Medium | Frontend |
| 3.3 | Map all 12 edge cases with recovery paths | Low | Medium | Product |
| 3.4 | Create global context propagation spec | Low | Medium | Product |

### Phase 4: Validation (Weeks 11-12)

| # | Initiative | Effort | Impact | Owner |
|---|-----------|--------|--------|-------|
| 4.1 | E2E journey test coverage for all critical paths | High | High | QA + Eng |
| 4.2 | A/B test: auth modal vs redirect | Low | High | Product |
| 4.3 | First-booking conversion cohort analysis | Low | High | Data |
| 4.4 | Journey documentation audit (ensure all docs match implementation) | Medium | Medium | Product |

---

## 8. Appendices

### Appendix A: Journey Completeness Scorecard

| Journey | Actors | Entry Points | Happy Path | Edge Cases | State Machine | Exit Criteria | Metrics | Gaps Documented | Score |
|---------|--------|--------------|------------|------------|---------------|---------------|---------|-----------------|-------|
| User Onboarding | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ✅ | 6/10 |
| Pro Onboarding | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ | 7/10 |
| Search & Booking | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | 7/10 |
| Session Mgmt | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | 5/10 |
| Video Execution | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ | 4/10 |
| Payments | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | 5/10 |
| Admin Ops | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ | 5/10 |
| Trust & Safety | ✅ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | 4/10 |

*Legend: ✅ Complete, ⚠️ Partial, ❌ Missing*

### Appendix B: Cross-Journey State Consistency Check

| State | Auth | Onboarding | Booking | Session | Payments | Trust | Consistent? |
|-------|------|------------|---------|---------|----------|-------|-------------|
| User logged in | ✅ | N/A | ✅ | ✅ | N/A | N/A | Yes |
| Pro approved | N/A | ✅ | ✅ | N/A | N/A | N/A | Yes |
| Pro first-booking enabled | N/A | ✅ | ✅ | N/A | N/A | N/A | **No** — UX doesn't surface distinction |
| Booking confirmed | N/A | N/A | ✅ | ✅ | ✅ | N/A | Yes |
| Booking completed | N/A | N/A | ✅ | ✅ | ✅ | ✅ | Yes |
| Review visible | N/A | N/A | N/A | N/A | N/A | ✅ | **No** — user not informed of moderation state |
| Payment captured | N/A | N/A | ✅ | N/A | ✅ | N/A | Yes |
| Payout eligible | N/A | N/A | N/A | N/A | ✅ | N/A | **No** — not surfaced to professional |

### Appendix C: Missing Journey Documents (Recommended)

1. `session-lifecycle.md` — Unified post-booking experience
2. `notification-inbox-lifecycle.md` — Cross-cutting notification architecture
3. `operator-case-resolution.md` — Admin operator end-to-end case handling
4. `recurring-booking-journey.md` — Recurring-specific flows and edge cases
5. `review-moderation-lifecycle.md` — Review submit → moderate → publish/reject
6. `global-context-propagation.md` — Timezone/currency/language rules across all journeys
7. `personas.md` — User and professional archetypes
8. `edge-case-recovery-playbook.md` — All 12 edge cases with recovery paths

### Appendix D: Heuristic Evaluation Summary

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | 5/10 | Dual-gate invisible; review status invisible; payout status invisible |
| Match between system and real world | 7/10 | Good taxonomy and language; timezone handling is strong |
| User control and freedom | 6/10 | Auth modal missing; cancel/reschedule exist but not always discoverable |
| Consistency and standards | 5/10 | Session docs fragmented; calendar config scattered |
| Error prevention | 7/10 | Slot locks, validation, and state machines are solid |
| Recognition rather than recall | 6/10 | Favorites exist; but no "rebook with one click" optimization |
| Flexibility and efficiency of use | 5/10 | No power-user shortcuts; professionals lack batch operations |
| Aesthetic and minimalist design | 7/10 | Clean UI; good component reuse |
| Help users recognize, diagnose, recover from errors | 6/10 | Good error messages; but edge case recovery paths are thin |
| Help and documentation | 5/10 | Ajuda page exists; but contextual help is sparse |

**Overall Heuristic Score: 5.9/10** — Solid foundations with critical gaps in visibility, consistency, and operational UX.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | UX Research Audit | Initial comprehensive audit |

**Next review date:** 2026-05-17 (4 weeks) or after Phase 1 completion, whichever comes first.

**Related documents:**
- `docs/product/journeys/*.md` (all 8 official journeys)
- `docs/spec/consolidated/master-spec.md`
- `docs/spec/consolidated/journey-coverage-matrix.md`
- `artifacts/onedrive-import-2026-04-01/ux-blueprint.html`


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
