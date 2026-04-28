# NEXT_STEPS.md — Consolidated Source of Truth

**Last updated:** 2026-04-27
**Status:** Living document — update after every major change
**Scope:** Every pending task, decision, and dependency across Muuday

> **Rule:** This file is the single source of truth for what comes next. If a task is not here, it is not officially tracked. When you complete a task, move it to the "Recently Closed" section and update the source document(s) it came from.

---

## How to Use This Document

1. **Work top-down.** P0 items are true blockers — they prevent later work or create operational risk.
2. **Check dependencies.** Each item lists what must be true before it can start.
3. **Reference source docs.** Every item links back to its canonical spec/roadmap/backlog for full detail.
4. **Update in batch.** When you close items, update this file, `docs/handover/next-steps.md`, and `docs/project/project-status.md` together.

---

## P0 — Critical Blockers (Do First)

These items prevent Wave 3 opening, create compliance risk, or block multiple downstream tracks.

### P0.1 Secrets Rotation
- **What:** Rotate ALL production secrets (register shows last rotation 2025-10-01; all are now overdue).
- **Why:** Daily `secrets-rotation-reminder.yml` workflow is failing. Overdue secrets are a Sev-1 security risk.
- **Source:** `docs/engineering/runbooks/secrets-rotation-register.json`, `docs/engineering/runbooks/secrets-rotation-runbook.md`
- **Owner:** Founder/Operator
- **Acceptance:**
  - [ ] All 27 secrets in register updated with `last_rotated_at: 2026-04-27` (or actual rotation date)
  - [ ] `next_due_at` recalculated per cadence
  - [ ] `secrets-rotation-reminder.yml` passes for 3 consecutive days
  - [ ] Smoke checks pass after each rotated secret (auth, booking, cron, email, cache)

### P0.2 E2E Payment Validation (Wave 3 Gate)
- **What:** End-to-end sandbox validation of the full payment chain: Stripe pay-in → ledger → Revolut settlement → Trolley payout.
- **Why:** Wave 3 (real-money) is explicitly blocked until this passes. 891 unit tests exist but no E2E sandbox run has been completed.
- **Source:** `docs/project/payments-engine/IMPLEMENTATION-STATUS.md`, `docs/handover/next-steps.md`
- **Owner:** Backend + Founder
- **Dependencies:** P0.1 (secrets current), P0.3 (migration 081 applied)
- **Acceptance:**
  - [ ] Trolley sandbox onboarding: PayPal recipient creation + KYC flow works end-to-end
  - [ ] Stripe sandbox pay-in → ledger → payout flow verified with real sandbox transactions
  - [ ] Revolut reconciliation cron runs without errors in sandbox
  - [ ] Payout batch creation, processing, and notification flows verified
  - [ ] Dispute-after-payout scenario tested: debt created, deducted from next payout
  - [ ] Refund flow tested: Stripe refund + ledger entries + balance update

### P0.3 Apply Migration 081 to Production
- **What:** `professional_subscriptions` table + Stripe subscription lifecycle.
- **Why:** Required for professional billing (Wave 3). Already implemented in code; pending operator execution.
- **Source:** `docs/project/payments-engine/IMPLEMENTATION-STATUS.md`
- **Owner:** Backend (runbook ready) → Operator (execution)
- **Status:** Runbook created at `scripts/ops/apply-migration-081-production.md`. Code verified: manager, webhook handler, admin page, Inngest functions all implemented.
- **Acceptance:**
  - [ ] Migration 081 applied to production Supabase (operator: follow runbook)
  - [ ] Stripe subscription webhook handlers tested
  - [ ] Admin subscriptions page loads real data

### P0.4 Tier Limit Code-Doc Consistency
- **What:** `lib/tier-config.ts` fallback for Basic `bookingWindowDays` was 60 (now fixed to 30). Verify no other code/docs drift on tier limits.
- **Why:** Part 1 spec, migration 045, tier-config.ts, and CODEX instructions now all agree. Need to verify runtime behavior matches.
- **Source:** `docs/spec/source-of-truth/part1-foundations-search-tiers.md`, `lib/tier-config.ts`
- **Owner:** Backend
- **Acceptance:**
  - [x] `plan_configs` defaults match canonical matrix (Basic: 1/1/3/1/30; Pro: 3/3/4/3/90; Premium: 3/5/5/6/180). Code falls back to `lib/tier-config.ts` when DB rows are missing.
  - [x] Admin Plan Configs API loads correct defaults via `loadPlanConfigMap()`
  - [x] Write path rejects exceeding service limits (`lib/professional/professional-services-service.ts` enforces `services_limit` via `loadPlanConfigMap`)
  - [x] Tags/focus_areas limit enforced (`professional-profile-service.ts` and onboarding save API)
  - [x] Booking window days limit enforced at runtime (`request-booking-service.ts` and `slot-validation.ts` use `professional_settings.max_booking_window_days`, clamped in onboarding save API)
  - [x] Specialty limit enforced at onboarding save (`app/api/professional/onboarding/save/route.ts` clamps `professionals.subcategories` to `tierLimits.specialties`)
  - [ ] Service options per service limit — feature not yet exposed in professional-facing UI. Config reserved; TODO comments added in `lib/tier-config.ts` and `lib/plan-config.ts`

### P0.5 Documentation Contradictions Closed
- **What:** Verify no remaining doc contradictions after this cleanup.
- **Why:** The 2026-04-24 audit identified 13 backend-complete systems that docs understated. After this cleanup, a final sweep is needed.
- **Source:** `docs/DOC-AUDIT-REPORT-2026-04-24.md`
- **Owner:** Any contributor
- **Acceptance:**
  - [x] `journey-coverage-matrix.md` accurately reflects backend-complete systems (verified 2026-04-27)
  - [x] No file references Stripe Connect for payouts except in archived/historical context — `docs/legal/terms/2026-04-v3/3_Termos_Financeiros.txt` updated to Stripe UK → Revolut → Trolley; remaining references are all explicitly marked ARCHIVED or describe evaluated-and-rejected options
  - [x] No file claims Next.js 14 or React 18 as current (only archive files and accurate React 19 API references)
  - [x] Tier limits are identical across part1, CODEX, onboarding plan, tier-config.ts, and migration 045
  - [x] `database-and-migrations.md` updated with migrations 070-081 and new runtime entities
  - [x] `docs/product/journeys/professional-workspace-journey.md` Basic booking window fixed (60 → 30 days)

---

## P1 — Wave 3 Readiness (Pre-Launch)

These items must be complete before Wave 3 (real-money) opens. Ordered by dependency.

### P1.1 Compliance & Legal Freeze
- **What:** Final legal review of sensitive-category disclaimers, checkout acknowledgements, terms alignment, and cross-border service positioning.
- **Why:** Blocks high-risk category launch. Explicitly listed as open in `open-validations.md`.
- **Source:** `docs/spec/consolidated/open-validations.md`, `docs/legal/terms/`, `docs/project/mobile-app/12-legal-review-package.md`
- **Owner:** Founder + Legal
- **Dependencies:** P0.5
- **Acceptance:**
  - [ ] Lawyer confirms UK jurisdiction terms are enforceable
  - [ ] Sensitive category disclaimer copy approved
  - [ ] Checkout acknowledgement text frozen
  - [ ] Terms, privacy policy, and cookie policy versioned and deployed
  - [ ] `docs/legal/terms/` updated with approved v3 text

### P1.2 Professional Operations UX Polish
- **What:** Calendar/scheduling ergonomics, onboarding tracker copy consistency, PT-BR cleanup on lower-traffic surfaces.
- **Why:** Current in-progress work. Must be stable before Wave 3 opens.
- **Source:** `docs/handover/next-steps.md`, `docs/product/journeys/professional-workspace-journey.md`
- **Owner:** Frontend
- **Acceptance:**
  - [ ] `/disponibilidade` calendar UX tested with 5+ real professionals (requires human testing with 5+ professionals)
  - [x] Onboarding tracker modal has zero blocking optional fetches on open (verified: optional fetch runs after `setLoadingContext(false)`, wrapped in try/catch, non-blocking by design)
  - [x] PT-BR cleanup complete on admin/finance surfaces (page titles, table headers, status badges, filter buttons, empty states, pagination)
  - [x] No mojibake or English labels in member-facing pages (verified no mojibake; fixed: Dashboard→Painel, Rating→Avaliações, Email→E-mail, Bio→Biografia, Sessao→Sessão/Sessão de Vídeo)

### P1.3 Landing Page Redesign Completion
- **What:** Stakeholder-approved landing page matching Wise.com richness (images, animations, blue accent, all 8 categories).
- **Why:** `LANDING-WISE-GAP-LIST.md` documents 10 gaps. Current landing is "flat minimal" vs target.
- **Source:** `docs/product/design-system/review/LANDING-WISE-GAP-LIST.md`, `docs/product/design-system/review/WISE-REFACTOR-GAPS.md`
- **Owner:** Frontend + Designer
- **Acceptance:**
  - [ ] Hero section has real illustration (not placeholder)
  - [ ] All 8 categories visible
  - [ ] Framer Motion animations added
  - [ ] Mobile/tablet/desktop responsive refinement
  - [ ] Blue accent color integrated
  - [ ] Stakeholder sign-off

### P1.4 Design System Alignment
- **What:** Fix token/component inconsistencies identified in `REVIEW-FINDINGS.md`.
- **Why:** Inconsistencies between `tokens.md`, `components.md`, and `frames/*.md` cause implementation drift.
- **Source:** `docs/product/design-system/review/REVIEW-FINDINGS.md`
- **Owner:** Design Engineer
- **Acceptance:**
  - [ ] Neutral color hex values identical in tokens.md and components.md
  - [ ] Typography scale aligned (13px sm, 20px lg, 30px 2xl)
  - [ ] Avatar sizes consistent (principles.md vs components.md)
  - [ ] Badge/Toast use semantic tokens, not hardcoded hexes
  - [ ] `handoff.md` references only existing tokens
  - [ ] Primary-500 contrast failure fixed (elevate to primary-600 on white)
  - [ ] Dark mode token system drafted (`dark:` variants)

### P1.5 Auth & Booking Handoff (AUTH-01)
- **What:** When logged-out user clicks "Agendar", show inline auth modal preserving booking context.
- **Why:** Critical conversion path. Backend ready; needs UI verification/hardening.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 1, `docs/product/journeys/search-booking.md`
- **Owner:** Frontend
- **Acceptance:**
  - [x] Desktop: AuthOverlay modal opens on "Agendar" click (SearchBookingCtas in search results and professional profile)
  - [x] Mobile: Same modal (not redirect) (ProfileAvailabilityBookingSection reuses SearchBookingCtas on all viewports; MobileBookingStickyCta is unused dead code)
  - [x] After login/signup: user returns to same profile with booking form visible (LoginForm `redirectPath` prop passes bookHref/messageHref; signup link preserves redirect)
  - [x] URL query params (date, time, type) preserved through auth (bookHrefWithSelection includes data/hora params; /agendar/[id] server redirect also preserves params)
  - [x] PostHog event `booking_intent_auth_modal_shown` fired (added in SearchBookingCtas and MobileBookingStickyCta)

### P1.6 Recurring Booking UX Completion (BOOK-02)
- **What:** Full recurring booking UX: calendar preview, .ics export, management modal, cancel scope.
- **Why:** Backend complete (recurrence engine, slot locks). Frontend incomplete.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 4, `docs/product/journeys/recurring-booking-journey.md`
- **Owner:** Frontend
- **Acceptance:**
  - [x] User can select recurring type (weekly, biweekly, monthly, custom)
  - [x] Calendar preview shows all generated sessions
  - [x] Conflict warnings displayed before checkout
  - [x] .ics export available on confirmation
  - [x] Management modal allows cancel scope (this only / all future / entire series)
  - [x] Recurring package card visible in agenda

### P1.7 Professional Financial Overview Page (WORK-03)
- **What:** Build `/financeiro` with transactions, payout status, fees, and subscription management.
- **Why:** Backend complete (ledger, payouts, subscriptions). Page is a placeholder.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 6, `docs/product/journeys/financial-overview-journey.md`
- **Owner:** Frontend
- **Acceptance:**
  - [x] Transaction list with filterable table
  - [x] Payout status card (next payout, pending amount)
  - [x] Subscription status with Stripe Customer Portal link
  - [x] Earnings analytics (sparkline, trend)
  - [x] Responsive layout

### P1.8 Notification Preferences & Inbox (CROSS-03)
- **What:** Notification preferences page and in-app inbox placeholder replacement.
- **Why:** `notification-inbox-lifecycle.md` specifies full taxonomy. Currently email-only with inbox placeholder.
- **Source:** `docs/product/journeys/notification-inbox-lifecycle.md`
- **Owner:** Frontend + Backend
- **Acceptance:**
  - [ ] Notification preferences page (`/configuracoes/notificacoes`) with channel toggles
  - [ ] In-app inbox list view with unread indicators
  - [ ] Deep links from notifications to relevant pages
  - [ ] Quiet hours configuration

### P1.9 Operator Case Resolution System (ADMIN-01)
- **What:** Case queue, detail view, decision system for disputes, refunds, and trust flags.
- **Why:** Backend complete (cases table, evidence, timeline). Admin UI minimal.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 8, `docs/product/journeys/operator-case-resolution.md`
- **Owner:** Frontend
- **Acceptance:**
  - [x] Case queue page with filtering, sorting, SLA indicators
  - [x] Case detail view with evidence panel, timeline, message thread
   - [x] Decision form with approval/rejection/reason capture
  - [x] Auto-creation from disputed bookings, no-shows, and trust flags

### P1.10 Review Moderation Queue Enhancement (REVIEW-01)
- **What:** Structured moderation UI with rejection reasons, batch approve/reject, auto-flags.
- **Why:** Reviews are live but moderation workflow is minimal.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 9
- **Owner:** Frontend + Backend
- **Acceptance:**
  - [x] Admin review queue with status filters (Pending, Approved, Rejected, Flagged, All)
  - [x] Batch approve/reject actions with checkbox selection
  - [x] Rejection reason selection (6 structured reasons) + custom admin notes
  - [x] Auto-flag rules: profanity filter, conflicts_with_outcome (no-show + high rating), suspected_fake (new account + generic text)
  - [x] Migration 083: `moderation_status`, `rejection_reason`, `moderated_by`, `moderated_at`, `admin_notes`, `flag_reasons` on `reviews`
  - [x] Dedicated `/admin/avaliacoes` page with stats cards, sort options, reviewer/professional/booking context
  - [x] 14 new unit tests in `lib/admin/admin-service.test.ts` (964 total)

---

## P2 — Scale & Expansion (Post-Wave-3)

These tracks can start in parallel with Wave 3 but are not launch blockers.

### P2.1 Mobile App API-First Refactor Completion
- **What:** Complete remaining Server Action extractions to `/api/v1/*` routes. Sprints 3–5 are done; backlog items from Sprint 2 remain.
- **Why:** Mobile app depends on a complete, stable API surface.
- **Source:** `docs/project/mobile-app/03-api-first-refactor-plan.md`, `docs/project/mobile-app/08-master-backlog.md`
- **Owner:** Backend
- **Acceptance:**
  - [ ] `POST /api/v1/bookings` functional with bearer token
  - [ ] `POST/GET /api/v1/conversations/{id}/messages` functional
  - [ ] `GET /api/v1/notifications` functional
  - [ ] Web components migrated from Server Actions to `fetch()` for booking/chat/notifications
  - [ ] OpenAPI schema + contract tests in CI
  - [ ] `Cache-Control` + `ETag` on list endpoints

### P2.2 Mobile App Development (Sprints 4–6)
- **What:** Expo React Native app with auth, search, booking, video, and professional workspace.
- **Why:** Strategic initiative. Blocked on P2.1.
- **Source:** `docs/project/mobile-app/04-mobile-app-requirements.md`, `docs/project/mobile-app/06-implementation-roadmap.md`
- **Owner:** Mobile engineers
- **Dependencies:** P2.1
- **Acceptance:**
  - [ ] Expo project initialized with TypeScript, Expo Router, NativeWind, TanStack Query
  - [ ] Supabase Auth with password + Google OAuth
  - [ ] Search professionals with infinite scroll
  - [ ] Booking flow (one-off) with Stripe PaymentSheet
  - [ ] Push notifications (Expo Push Service)
  - [ ] Professional dashboard + calendar management
  - [ ] Agora video session integration
  - [ ] Deep links (`muuday://`) configured

### P2.3 International Expansion Implementation
- **What:** Market detection middleware, Sanity CMS, locale routing (`/br/`, `/mx/`), content localisation.
- **Why:** Docs complete; implementation not started.
- **Source:** `docs/project/international-expansion/02-implementation-plan.md`, `docs/project/international-expansion/08-market-routing-implementation.md`
- **Owner:** Frontend + Backend
- **Acceptance:**
  - [ ] Market detection middleware (cookie → URL → Accept-Language → IP)
  - [ ] `profiles.language` and `professionals.market_code` used everywhere
  - [ ] Sanity CMS schemas created and guides migrated
  - [ ] `next-intl` installed with `pt-BR.json` and `en.json`
  - [ ] Locale routing `/br/` and `/mx/` functional
  - [ ] Search isolated by `market_code`
  - [ ] Landing pages for MX and PT with localised content

### P2.4 AI OCR for KYC
- **What:** AWS Textract / Google Document AI integration for professional document verification.
- **Why:** Scaling professional onboarding. Structure ready; SDKs pending.
- **Source:** `docs/project/mobile-app/08-master-backlog.md` Sprint 2.6
- **Owner:** Backend
- **Acceptance:**
  - [ ] AWS Textract or Google Document AI SDK installed
  - [ ] `POST /api/v1/kyc/scan` returns real OCR data
  - [ ] Admin dashboard shows OCR score and pre-filled fields
  - [ ] Scoring algorithm validates document authenticity

### P2.5 Search Scaling Evaluation
- **What:** Evaluate if Postgres `pg_trgm + GIN` remains sufficient or if Typesense/Meilisearch migration is needed.
- **Why:** Decision made to keep Postgres-first until >2k active professionals or p95 latency >500ms.
- **Source:** `docs/human-actions/decision-backlog.md`
- **Owner:** Backend
- **Acceptance:**
  - [ ] Performance benchmark with realistic query load
  - [ ] p95 latency measured for top 10 query patterns
  - [ ] Decision documented: keep Postgres vs migrate

---

## P3 — Polish & Optimization (Ongoing)

These are important but not blocking. Pick up opportunistically.

### P3.1 God File Refactoring
- **What:** Break down remaining god files (>500 lines).
- **Why:** Maintainability. `OnboardingTrackerModal.tsx` (3,995 lines) is the worst offender.
- **Source:** `docs/engineering/god-file-refactor-plan.md`
- **Owner:** Backend / Frontend
- **Acceptance:**
  - [ ] `components/dashboard/OnboardingTrackerModal.tsx` → extracted into `components/dashboard/onboarding/` directory
  - [ ] `lib/actions/request-booking.ts` (861 lines) → extract validation, eligibility, state-machine logic
  - [ ] `lib/email/resend.ts` (897 lines) → split by domain (booking, professional, user, marketing, review)
  - [ ] `components/booking/BookingForm.tsx` (1,151 lines) → step components extracted

### P3.2 Design System Missing Components
- **What:** Add specs for DatePicker, Calendar, SegmentedControl, Chip, Banner, Timeline.
- **Why:** Referenced in multiple journeys but not formally specified.
- **Source:** `docs/product/design-system/review/REVIEW-FINDINGS.md`
- **Owner:** Product Designer
- **Acceptance:**
  - [ ] Component specs added to `components.md`
  - [ ] Frame specs for missing recurring management, settings, and admin case screens
  - [ ] Generic error/empty/loading frame specs (404, 500, offline, skeleton)

### P3.3 Accessibility Audit
- **What:** Full WCAG 2.1 AA audit.
- **Why:** Required for launch quality and legal compliance.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 10.7
- **Owner:** Frontend
- **Acceptance:**
  - [ ] Keyboard navigation works for all critical flows
  - [ ] Screen reader labels on all interactive elements
  - [ ] Color contrast passes AA on all text
  - [ ] Focus indicators visible on all focusable elements

### P3.4 Performance Audit (Core Web Vitals)
- **What:** LCP, INP, CLS audit and optimization.
- **Why:** SEO and user experience.
- **Source:** `docs/product/IMPLEMENTATION-ROADMAP.md` Phase 10.8
- **Owner:** Frontend
- **Acceptance:**
  - [ ] LCP < 2.5s on mobile for landing, search, and profile pages
  - [ ] CLS < 0.1 on all pages
  - [ ] INP < 200ms on interactive elements

### P3.5 Dark Mode
- **What:** Systematic dark mode token system and component variants.
- **Why:** User preference and modern UX expectation.
- **Source:** `docs/product/design-system/review/REVIEW-FINDINGS.md`
- **Owner:** Frontend
- **Acceptance:**
  - [ ] `dark:` variants for all surface, text, and border tokens
  - [ ] Component library supports dark mode
  - [ ] User toggle + system preference detection

### P3.6 Edge Case Recovery UI
- **What:** Implement recovery flows for top 12 edge cases documented in playbook.
- **Why:** Reduces support burden and improves trust.
- **Source:** `docs/product/ux-research/edge-case-recovery-playbook.md`
- **Owner:** Frontend
- **Acceptance:**
  - [ ] No-show report flow (user and professional)
  - [ ] Failed payment retry
  - [ ] Reschedule conflict resolution
  - [ ] Account suspension appeal
  - [ ] Review rejection recovery

### P3.7 Analytics & Observability Hardening
- **What:** Complete PostHog funnel dashboards, Sentry alert rules, Checkly synthetic coverage.
- **Why:** Monitoring currently incomplete.
- **Source:** `docs/integrations/posthog.md`, `docs/integrations/sentry.md`, `docs/integrations/checkly.md`
- **Owner:** Ops/Frontend
- **Acceptance:**
  - [ ] PostHog funnels for signup, booking, payout
  - [ ] Sentry alert rules for error rate, payment flow, auth failures
  - [ ] Checkly browser checks for core journeys (auth, search, booking, agenda)

---

## Human Decisions Still Required

These cannot be resolved by engineering alone.

| # | Decision | Owner | Deadline | Blocking |
|---|----------|-------|----------|----------|
| H1 | Tax/accounting operating model | Finance/Accounting | Before Wave 3 exit | Ledger reconciliation and finance ops |
| H2 | Payout-sensitive data storage model (Trolley-only vs local encrypted) | Founder + Engineering + Compliance | Before Wave 3 start | Vault/encryption scope |
| H3 | Refund/dispute authority matrix | Operations lead | Before Wave 4 start | Case queue safe operations |
| H4 | Legal/compliance text freeze | Legal/Compliance + Founder | Before Wave 5 exit | Sensitive-category launch |
| H5 | Data retention/legal-hold final approval | Legal/Compliance + Ops | Before Wave 4 exit | Lifecycle automation |
| H6 | Domain cutover plan (`muuday-app.vercel.app` → `muuday.com`) | Product + Ops | Before public launch | DNS and auth drift |
| H7 | Regional expansion policy (MX, PT, etc.) | Strategy + Legal | Post-Wave 3 | Expansion execution |
| H8 | Professional verification depth by category | Trust/Safety | Post-Wave 3 | Credential checks |

---

## Recently Closed (2026-04-27 Documentation Cleanup)

| # | Item | Source |
|---|------|--------|
| C1 | Archived 3 historical handover files to `docs/archive/` | `control-snapshot.md`, `2026-04-19-nextjs-14-to-16-upgrade.md`, `2026-04-19-security-ssr-refactor.md` |
| C2 | Updated `dependency-audit-runbook.md` to Next.js 16.2.4 | `package.json` |
| C3 | Fixed `secrets-rotation-register.json` syntax + updated rotation dates | `docs/engineering/runbooks/secrets-rotation-register.json` |
| C4 | Removed `STRIPE_BR_*` references from `secrets-rotation-runbook.md` | UK-only consolidation |
| C5 | Updated `financial-pii-encryption-and-vault.md` to Trolley-centric model | `docs/project/payments-engine/MASTER-PLAN.md` |
| C6 | Aligned tier limits across CODEX, onboarding plan, part1 spec, and code | `lib/tier-config.ts`, migration 045 |
| C7 | Updated `master-spec.md` BR rail provider to RESOLVED (Trolley) | `docs/spec/consolidated/open-validations.md` |
| C8 | Updated `part3-payments` and `part5-video-compliance` with archived notices | `docs/spec/source-of-truth/` |
| C9 | Marked `session-management.md` and `video-session-execution.md` as deprecated | `docs/product/journeys/session-lifecycle.md` |
| C10 | Removed 12 duplicate `figma-export/frames/*.md` files | `docs/product/design-system/frames/*.md` |
| C11 | Updated `docs/README.md`, `context-map.md`, `current-state.md`, `next-steps.md`, `project-status.md` with mobile app and international expansion cross-links | Various |
| C12 | Fixed `lib/tier-config.ts` Basic `bookingWindowDays` from 60 → 30 | Migration 045 |
| C13 | **P0.4** — Fixed `part1-foundations-search-tiers.md` and `part2-onboarding-booking-lifecycle.md` tier limit contradictions; added service limit enforcement to `lib/professional/professional-services-service.ts` | `lib/tier-config.ts`, migration 045 |
| C14 | **P0.5** — Closed remaining doc contradictions: updated legal terms (Stripe Connect → Trolley), updated `database-and-migrations.md` (070-081), fixed `professional-workspace-journey.md` Basic window (60→30), verified journey-coverage-matrix accuracy | DOC-AUDIT-REPORT-2026-04-24 |
| C15 | **P1.2** — PT-BR cleanup on admin/finance surfaces (Ledger→Livro Razão, Payouts→Repasses, Trial→Em teste, Settlements→Liquidações, etc.) and member-facing pages (Dashboard→Painel, Rating→Avaliações, Email→E-mail, Bio→Biografia, Sessao→Sessão de Vídeo). Verified onboarding tracker modal optional fetches are non-blocking. | `app/(app)/admin/finance/*`, `app/(app)/dashboard/page.tsx`, `app/(app)/perfil/page.tsx`, `app/(app)/profissional/[id]/page.tsx`, `app/(app)/sessao/[bookingId]/page.tsx` |
| C16 | **P1.5** — Auth & Booking Handoff: LoginForm gains `redirectPath` prop to preserve booking context through login modal; SearchBookingCtas passes `bookHref`/`messageHref` as redirect and fires PostHog `booking_intent_auth_modal_shown`; signup link preserves redirect parameter. | `components/auth/LoginForm.tsx`, `components/search/SearchBookingCtas.tsx`, `components/booking/MobileBookingStickyCta.tsx` |

---

## Appendix: Source Document Map

| Topic | Canonical Source |
|-------|-----------------|
| Immediate execution queue | `docs/handover/next-steps.md` |
| Project status & waves | `docs/project/project-status.md` |
| AI agent implementation tasks | `docs/product/IMPLEMENTATION-ROADMAP.md` |
| Mobile app backlog | `docs/project/mobile-app/08-master-backlog.md` |
| International expansion plan | `docs/project/international-expansion/00-master-plan.md` |
| Payments engine status | `docs/project/payments-engine/IMPLEMENTATION-STATUS.md` |
| God file refactor plan | `docs/engineering/god-file-refactor-plan.md` |
| Design system gaps | `docs/product/design-system/review/REVIEW-FINDINGS.md` |
| Human decisions | `docs/human-actions/decision-backlog.md` |
| Edge case recovery | `docs/product/ux-research/edge-case-recovery-playbook.md` |
| Journey specs | `docs/product/journeys/*.md` |
| Canonical product spec | `docs/spec/source-of-truth/part1..part5` |

---

> **Document reviewed as part of comprehensive documentation audit:** 2026-04-27.
> If you find a gap, add it here. If you complete a task, move it to "Recently Closed" and update all linked source docs.
