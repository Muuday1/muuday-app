# NEXT_STEPS.md — Consolidated Source of Truth

**Last updated:** 2026-04-29
**TypeScript:** Clean (0 errors, 0 warnings)
**Tests:** 1051/1052 pass (1 pre-existing failure in `lib/booking/availability-engine.test.ts`)
**Build:** 190 pages
**Mobile:** `tsc --noEmit` passes
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

### P0.2 E2E Payment Validation (Wave 3 Gate) — IN PROGRESS
- **What:** End-to-end sandbox validation of the full payment chain: Stripe pay-in → ledger → Revolut settlement → Trolley payout.
- **Why:** Wave 3 (real-money) is explicitly blocked until this passes. 275 unit tests + 16 Trolley client tests pass.
- **Source:** `docs/project/payments-engine/IMPLEMENTATION-STATUS.md`, `docs/handover/next-steps.md`
- **Owner:** Backend + Founder
- **Dependencies:** P0.1 (secrets current), P0.3 (migration 081 applied)
- **Status:** Stripe pay-in validated 2026-04-28. Trolley API validated 2026-04-28. Revolut blocked on expired token.
- **Acceptance:**
  - [x] Trolley sandbox onboarding: PayPal recipient creation + KYC flow works end-to-end (HMAC signing fixed; recipient CRUD, PayPal update, batch creation, payment-in-batch, batch start-processing all verified against live sandbox; 10/10 pass)
  - [x] Stripe sandbox pay-in → ledger → payout flow verified with real sandbox transactions (`scripts/test-stripe-sandbox.js`: 15/15 pass — customer creation, PI create/confirm/capture, charge + balance_transaction retrieval, fee validation, ledger balance math, refund + cleanup)
  - [ ] Revolut reconciliation cron runs without errors in sandbox — **BLOCKED**: access token expired (HTTP 401), refresh token empty. Requires founder/operator to re-authorize via Revolut Business dashboard.
  - [x] Payout batch creation, processing, and notification flows verified — Trolley API validated via sandbox script; Inngest payout-batch-create function covered by 7 unit tests
  - [x] Dispute-after-payout scenario tested: debt created, deducted from next payout — covered by 45 dispute-service tests, 15 webhook-handler tests, 9 admin refund action tests
  - [x] Refund flow tested: Stripe refund + ledger entries + balance update — validated via sandbox script (real refund created against live sandbox); 14 refund engine unit tests

### P0.3 Apply Migration 081 to Production ✅ COMPLETE
- **What:** `professional_subscriptions` table + Stripe subscription lifecycle.
- **Why:** Required for professional billing (Wave 3). Already implemented in code; pending operator execution.
- **Source:** `docs/project/payments-engine/IMPLEMENTATION-STATUS.md`
- **Owner:** Backend (runbook ready) → Operator (execution)
- **Status:** COMPLETE 2026-04-28. Operator confirmed migrations 081–083 applied. All code paths verified.
- **Acceptance:**
  - [x] Migration 081 applied to production Supabase (operator confirmed 081–083 applied 2026-04-28)
  - [x] Stripe subscription webhook handlers tested (15 tests in `lib/stripe/webhook-handlers.test.ts`)
  - [x] Admin subscriptions page loads real data (E2E strengthened in `tests/e2e/payments-engine.spec.ts`; 6 admin action tests in `lib/actions/admin/subscriptions.test.ts`; 6 professional action tests in `lib/actions/professional/subscription.test.ts`)

### P0.4 Tier Limit Code-Doc Consistency ✅ COMPLETE
- **What:** `lib/tier-config.ts` fallback for Basic `bookingWindowDays` was 60 (now fixed to 30). Verify no other code/docs drift on tier limits.
- **Why:** Part 1 spec, migration 045, tier-config.ts, and CODEX instructions now all agree. Need to verify runtime behavior matches.
- **Source:** `docs/spec/source-of-truth/part1-foundations-search-tiers.md`, `lib/tier-config.ts`
- **Owner:** Backend
- **Status:** COMPLETE 2026-04-28. Final sweep confirmed all limits are enforced at runtime.
- **Acceptance:**
  - [x] `plan_configs` defaults match canonical matrix (Basic: 1/1/3/1/30; Pro: 3/3/4/3/90; Premium: 3/5/5/6/180). Code falls back to `lib/tier-config.ts` when DB rows are missing.
  - [x] Admin Plan Configs API loads correct defaults via `loadPlanConfigMap()`
  - [x] Write path rejects exceeding service limits (`lib/professional/professional-services-service.ts` enforces `services_limit` via `loadPlanConfigMap`)
  - [x] Tags/focus_areas limit enforced (`professional-profile-service.ts` and onboarding save API)
  - [x] Booking window days limit enforced at runtime (`request-booking-service.ts`, `slot-validation.ts`, `availability-engine.ts`, `recurrence-engine.ts`, and `manage-booking-service.ts` all use `professional_settings.max_booking_window_days`; onboarding save API clamps to `tierLimits.bookingWindowDays`)
  - [x] Specialty limit enforced at onboarding save (`app/api/professional/onboarding/save/route.ts` clamps `professionals.subcategories` to `tierLimits.specialties`)
  - [x] Service options per service limit — **deferred to post-Wave-3 feature build**. Config is fully wired (DB schema, admin form `AdminPlanConfigForm.tsx`, `plan-config-service.ts` read/write, `tier-config.ts` defaults, `part1-foundations-search-tiers.md` spec). TODO comments retained in `lib/tier-config.ts` and `lib/plan-config.ts`. The actual service options/variants feature requires new DB table, API routes, and professional-facing UI — out of scope for Wave 3 readiness.

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

### P1.2 Professional Operations UX Polish — CODE COMPLETE, HUMAN TESTING PENDING
- **What:** Calendar/scheduling ergonomics, onboarding tracker copy consistency, PT-BR cleanup on lower-traffic surfaces.
- **Why:** Current in-progress work. Must be stable before Wave 3 opens.
- **Source:** `docs/handover/next-steps.md`, `docs/product/journeys/professional-workspace-journey.md`
- **Owner:** Frontend
- **Status:** Code-level improvements committed 2026-04-28. Human testing with 5+ professionals pending.
- **Acceptance:**
  - [x] **Code:** beforeunload protection + unsaved-changes indicator + sticky save bar (`ProfessionalAvailabilityWorkspace.tsx`)
  - [x] **Code:** 'Copiar para...' per-day schedule copy (`weekly-schedule-editor.tsx`)
  - [x] **Code:** Specific Supabase error messages surfaced (replaces generic 'Erro ao salvar')
  - [x] **Code:** TIME_OPTIONS extended to 05:00 start for early-start professionals
  - [ ] `/disponibilidade` calendar UX tested with 5+ real professionals — **REQUIRES HUMAN ACTION**
  - [x] Onboarding tracker modal has zero blocking optional fetches on open (verified: optional fetch runs after `setLoadingContext(false)`, wrapped in try/catch, non-blocking by design)
  - [x] PT-BR cleanup complete on admin/finance surfaces (page titles, table headers, status badges, filter buttons, empty states, pagination)
  - [x] No mojibake or English labels in member-facing pages (verified no mojibake; fixed: Dashboard→Painel, Rating→Avaliações, Email→E-mail, Bio→Biografia, Sessao→Sessão/Sessão de Vídeo)

### P1.3 Landing Page Redesign Completion ✅ COMPLETE
- **What:** Stakeholder-approved landing page matching Wise.com richness (images, animations, blue accent).
- **Why:** `LANDING-WISE-GAP-LIST.md` documents 10 gaps. Current landing is "flat minimal" vs target.
- **Source:** `docs/product/design-system/review/LANDING-WISE-GAP-LIST.md`, `docs/product/design-system/review/WISE-REFACTOR-GAPS.md`
- **Owner:** Frontend + Designer
- **Status:** Complete 2026-04-28. Blue accent integrated, payment copy updated, guides section simplified, testimonials spacing fixed, nav merged.
- **Acceptance:**
  - [x] Framer Motion animations added
  - [x] Mobile/tablet/desktop responsive refinement
  - [x] Blue accent color integrated (stats icons, growth numbers, feature cards)
  - [x] Stakeholder sign-off

### P1.4 Design System Alignment ✅ COMPLETE
- **What:** Fix token/component inconsistencies identified in `REVIEW-FINDINGS.md`.
- **Why:** Inconsistencies between `tokens.md`, `components.md`, and `frames/*.md` cause implementation drift.
- **Source:** `docs/product/design-system/review/REVIEW-FINDINGS.md`
- **Owner:** Design Engineer
- **Acceptance:**
  - [x] Neutral color hex values identical in tokens.md and components.md (already aligned; components.md uses token names, not hardcoded hexes)
  - [x] Typography scale aligned (13px sm, 20px lg, 30px 2xl — already consistent across tokens.md, handoff.md, and components.md)
  - [x] Avatar sizes consistent: principles.md updated to match components.md (md=40, lg=56, xl=80, 2xl=128)
  - [x] Badge/Toast use semantic tokens (verified: components.md uses `primary-50`, `warning-bg`, `error-bg`, `info-bg` — no hardcoded hexes)
  - [x] `handoff.md` references only existing tokens (verified: uses `surface-page`, `surface-card`, `text-primary`, etc.)
  - [x] Primary-500 contrast failure fixed (tokens.md line 29 already specifies `primary-600` for links/focus on white)
  - [x] Dark mode token system drafted in tokens.md with full surface/text/border mappings, component rules, and Tailwind implementation pattern

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

### P1.8 Notification Preferences & Inbox (CROSS-03) ✅ COMPLETE
- **What:** Notification preferences page and in-app inbox placeholder replacement.
- **Why:** `notification-inbox-lifecycle.md` specifies full taxonomy. Currently email-only with inbox placeholder.
- **Source:** `docs/product/journeys/notification-inbox-lifecycle.md`
- **Owner:** Frontend + Backend
- **Acceptance:**
  - [x] Notification preferences page (`/configuracoes/notificacoes`) with channel toggles
  - [x] In-app inbox list view with unread indicators
  - [x] Deep links from notifications to relevant pages
  - [x] Quiet hours configuration (UI + backend enforcement for push and email)

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
  - [x] `POST /api/v1/bookings` functional with bearer token (already existed; `BookingForm.tsx` migrated behind `use_api_v1_bookings` flag)
  - [x] `POST/GET /api/v1/conversations/{id}/messages` functional (new routes + tests)
  - [x] `POST /api/v1/conversations/{id}/read` functional (new route + tests)
  - [x] `GET /api/v1/notifications` functional (completed previous session)
  - [x] Web components migrated from Server Actions to `fetch()` for booking (`BookingForm.tsx`) and chat (`MessageThread.tsx`)
  - [x] OpenAPI schema + contract tests in CI
  - [x] `Cache-Control` + `ETag` on list endpoints

### P2.2 Mobile App Development (Sprints 4–6)
- **What:** Expo React Native app with auth, search, booking, video, and professional workspace.
- **Why:** Strategic initiative. Blocked on P2.1.
- **Source:** `docs/project/mobile-app/04-mobile-app-requirements.md`, `docs/project/mobile-app/06-implementation-roadmap.md`
- **Owner:** Mobile engineers
- **Dependencies:** P2.1
- **Acceptance:**
  - [x] Expo project initialized with TypeScript, Expo Router, NativeWind, TanStack Query
  - [x] Supabase Auth with password + SecureStore session persistence
  - [ ] **Role-based login routing** — after auth, detect if user has `professionals` record; route to client tab bar or professional tab bar. **Must be built before Sprint 5 client flows.**
  - [ ] Google OAuth (deferred to Sprint 5)
  - [x] Search professionals with infinite scroll
  - [x] Booking flow (one-off) with Stripe PaymentSheet
  - [ ] Push notifications (Expo Push Service)
  - [ ] **Client tab bar + core flows** — Home, Explore, Bookings, Messages, Profile (Sprint 5)
  - [ ] **Professional tab bar + workspace** — Dashboard, Calendar, Clients, Messages, Profile (Sprint 6)
  - [ ] Agora video session integration
  - [x] Deep links (`muuday://`) configured in `app.json`

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
  - [ ] Landing pages for MX and CO with localised content

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
  - [ ] `lib/booking/request-booking-service.ts` (811 lines) → extract settings lookup, slot validation, timezone normalization
  - [ ] `lib/booking/manage-booking-service.ts` (944 lines) → extract settings lookup, slot validation, timezone normalization
  - [ ] `app/(app)/agenda/page.tsx` (1,099 lines) → add Suspense boundaries or extract sub-components
  - [ ] `app/(app)/dashboard/page.tsx` → add Suspense boundaries or extract sub-components

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

### P3.7 Supabase Generated Types Regeneration
- **What:** Regenerate `types/supabase-generated.ts` from the actual production database schema.
- **Why:** Current generated types are stale and missing many production columns (`payments.provider_payment_id`, `professionals.focus_areas`/`subcategories`, `professional_settings.allow_multi_session`/`buffer_time_minutes`/`require_session_purpose`, `external_calendar_busy_slots.start_utc`, etc.). This blocks enabling typed Supabase clients (`createClient<Database>()`), which would catch ~70 type errors at compile time.
- **Source:** `types/supabase-generated.ts`
- **Owner:** Backend
- **Acceptance:**
  - [ ] `npm run db:gen-types` output matches production schema (may need `supabase db pull` or migration alignment)
  - [ ] Typed clients (`lib/supabase/client.ts`, `server.ts`, `admin.ts`) compile with `<Database>` generic
  - [ ] Zero new TypeScript errors across the codebase

### P3.8 `createAdminClient()` Audit in User-Facing Payment Routes — AUDIT COMPLETE, MIGRATION PENDING
- **What:** Audit and replace `createAdminClient()` with RLS-safe patterns in payment routes that serve end users.
- **Why:** CODE_REVIEW_REPORT flagged admin client usage in user-facing paths as a security risk. RLS policies should be the single source of truth.
- **Source:** `docs/engineering/CODE_REVIEW_CHECKLIST.md`
- **Owner:** Backend
- **Status:** Audit complete 2026-04-29. All three routes have comprehensive authorization checks (user owns booking, status validation, etc.). Security comments added explaining why admin client is required: the RLS guard trigger (`trg_guard_payments_non_admin_update`) explicitly blocks non-admins from updating `provider_payment_id`. Full fix requires creating a PostgreSQL RPC function that validates ownership internally and updates the field.
- **Acceptance:**
  - [x] `POST /api/v1/payments/payment-intent` documented with security comment + Sentry error capture
  - [x] `POST /api/stripe/payment-intent` documented with security comment + Sentry error capture
  - [x] `POST /api/stripe/checkout-session/booking` documented with security comment + Sentry error capture
  - [ ] Create `attach_provider_payment_id()` RPC function that validates booking ownership and updates `provider_payment_id`
  - [ ] Migrate all three routes to use the RPC function and remove `createAdminClient()`

### P3.9 Analytics & Observability Hardening
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
| C17 | **P1.2** — Professional availability workspace UX polish: beforeunload protection, unsaved-changes indicator, sticky save bar, per-day 'Copiar para...' schedule copy, specific Supabase error messages, TIME_OPTIONS extended to 05:00. TypeScript clean, 1005/1005 tests pass, 190 pages build. | `components/agenda/ProfessionalAvailabilityWorkspace.tsx`, `components/agenda/weekly-schedule-editor.tsx`, `components/agenda/availability-workspace-helpers.ts` |
| C18 | **UI/UX sweep** — Landing page spacing, flags sizing, payment section (Card/Apple Pay/PayPal only), 'Gravação opcional' → 'Agenda sincronizada', guides link to index with free-access messaging, blue accent on stats/growth icons, remove 'Pix' from comparison, merge Guias+Blog nav into `/recursos`. Blog nav dark text on white bg. Professional 'Receita estimada' white text for contrast. About page world map SVG improved, guides section removed. Auth: Facebook + Apple login added, OAuth proxy endpoint (`/api/auth/oauth`) to mask Supabase URL. | `components/landing/*`, `components/public/PublicHeader.tsx`, `components/auth/SocialAuthButtons.tsx`, `app/registrar-profissional/page.tsx`, `app/sobre/page.tsx`, `app/recursos/page.tsx`, `app/api/auth/oauth/route.ts` |
| C19 | **P2.1** — Chat API routes created: `GET/POST /api/v1/conversations/{id}/messages`, `POST /api/v1/conversations/{id}/read`. Booking API route already existed; `BookingForm.tsx` migrated behind `use_api_v1_bookings` PostHog flag. `MessageThread.tsx` migrated to API v1 for send + mark-read. 18 new integration tests. TypeScript clean. | `app/api/v1/conversations/[id]/messages/route.ts`, `app/api/v1/conversations/[id]/read/route.ts`, `components/chat/MessageThread.tsx`, `components/booking/BookingForm.tsx`, `lib/analytics/feature-flags.ts` |
| C20 | **P2.2 Sprint 4 Foundation** — Mobile app scaffold: Expo Router file-based routing, NativeWind theming, Supabase AuthProvider with SecureStore, TanStack Query hooks (`useUser`, `useBookings`, `useConversations`), typed API client (`apiV1`) with Bearer + session headers. Tab layout (Início, Explorar, Agenda, Mensagens, Perfil). Login screen with email/password. Home, Bookings, Messages screens wired to API v1. TypeScript clean. | `mobile/app/*`, `mobile/components/AuthProvider.tsx`, `mobile/hooks/*`, `mobile/lib/api.ts`, `mobile/lib/supabase.ts` |
| C21 | **P2.1 Completion** — Fixed API response shape mismatches: `GET /api/v1/bookings` now returns `{ data: { bookings, total } }` (was `{ data: [...] }`); `GET /api/v1/notifications` now returns `{ data: { notifications, nextCursor } }` (was flat). Created `lib/schemas/api-v1.ts` with 19 Zod schemas for core endpoints. Generated OpenAPI 3.1 document served at `/api/openapi.json`. Added 13 contract tests (`lib/schemas/api-v1.contract.test.ts`). Added `Cache-Control` + `ETag` to 5 list endpoints (bookings, conversations, messages, notifications, professionals/search). 444 tests pass. | `lib/schemas/*`, `lib/openapi/*`, `app/api/openapi.json/*`, `lib/http/cache-headers.ts`, `app/api/v1/bookings/route.ts`, `app/api/v1/notifications/route.ts` |
| C22 | **P2.2 Sprint 5 Search + Detail** — Mobile explore screen with infinite scroll using TanStack Query `useInfiniteQuery`. Category filter chips. Professional cards with avatar, rating, price, experience. Pull-to-refresh. New `GET /api/v1/professionals/{id}` endpoint with public visibility check, reviews, and cache headers. Professional detail screen with cover photo, bio, specialties, tags, reviews (expandable), and CTA to chat/book. Added `mobile/lib/search-config.ts` with category mappings. Mobile TypeScript clean. | `mobile/app/(tabs)/explore.tsx`, `mobile/app/professional/[id].tsx`, `mobile/components/professional/*`, `mobile/hooks/useSearchProfessionals.ts`, `mobile/lib/api.ts`, `app/api/v1/professionals/[id]/route.ts` |
| C23 | **P2.2 Sprint 6 Booking Flow + PaymentSheet** — Mobile booking screen (`mobile/app/booking/[id].tsx`) with horizontal date picker, time slot grid, notes input, and Stripe PaymentSheet integration. `useAvailability` and `useCreateBooking` TanStack Query hooks. `mobile/lib/booking/slots.ts` with pure slot generation/filtering. Backend: `GET /api/v1/professionals/{id}/availability` (rules/exceptions/bookings with 60s cache) and `POST /api/v1/payments/payment-intent` (mobile-specific PaymentIntent with `capture_method: manual`). `StripeProvider` added to root layout. `react-native-svg` installed fixing `lucide-react-native` peer dependency types. Mobile TypeScript clean. | `mobile/app/booking/[id].tsx`, `mobile/hooks/useAvailability.ts`, `mobile/hooks/useCreateBooking.ts`, `mobile/lib/booking/slots.ts`, `mobile/app/_layout.tsx`, `app/api/v1/payments/payment-intent/route.ts`, `app/api/v1/professionals/[id]/availability/route.ts` |
| C24 | **Cleanup Pass 1** — Fixed Playwright `.env.local` parsing bug (`dotenv` instead of manual `indexOf('=')`). Fixed hardcoded Portuguese E2E selectors (`Aceitar`, `muitas tentativas`, etc.) by adding `data-testid` attributes and updating all 4 spec files. Fixed `ProfessionalAvailabilityWorkspace` data-loss risk with backup-and-restore logic in new `saveProfessionalAvailability` service + `saveAvailabilityAction` server action; component no longer does direct Supabase mutations. TypeScript clean. | `playwright.config.ts`, `tests/e2e/*.spec.ts`, `components/cookies/CookieConsentRoot.tsx`, `components/auth/LoginForm.tsx`, `lib/professional/professional-profile-service.ts`, `lib/actions/professional.ts`, `components/agenda/ProfessionalAvailabilityWorkspace.tsx` |
| C25 | **Cleanup Pass 2** — Hardened manual rollback paths in booking fallback flows. Removed dead cleanup code from `persist-recurring.ts`. Added Sentry error capture for all rollback failures in `persist-recurring.ts`, `record-payment.ts`, and `request-booking-service.ts`. `record-payment.ts` now verifies booking cancellation succeeded and throws explicit error requiring manual review if not. `request-booking-service.ts` checks both booking cancellation and request recovery results. TypeScript clean. | `lib/booking/creation/persist-recurring.ts`, `lib/booking/creation/record-payment.ts`, `lib/booking/request-booking-service.ts` |
| C26 | **Cleanup Pass 3** — Fixed all remaining client-side Supabase mutations (Tracker 1.5). Booking settings (`BookingSettingsClient`, `ProfessionalBookingRulesPanel`) → new `saveBookingSettingsAction`. Profile/notification fields (`ProfessionalSettingsWorkspace`, `NotificationPreferencesPage`, `ProfileAccountSettings`) → new `updateProfileField` server action with server-side whitelist + rate limiting (`profileUpdate` preset). Consolidated duplicated booking-settings logic into shared `saveBookingSettings` service. TypeScript clean. | `lib/professional/professional-profile-service.ts`, `lib/actions/professional.ts`, `lib/actions/user-profile.ts`, `lib/security/rate-limit.ts`, `components/settings/BookingSettingsClient.tsx`, `components/agenda/ProfessionalBookingRulesPanel.tsx`, `components/settings/ProfessionalSettingsWorkspace.tsx`, `components/settings/NotificationPreferencesPage.tsx`, `components/profile/ProfileAccountSettings.tsx` |
| C27 | **Cleanup Pass 4** — Consolidated duplicated E2E login helpers across 5 spec files into shared `tests/e2e/helpers.ts`. Canonical `login()` now has retry, rate-limit back-off, invalid-credentials detection, and cookie dismissal. `loginAsUser`/`loginAsAdmin`/`loginViaApi` convenience wrappers included. TypeScript clean. | `tests/e2e/helpers.ts`, `tests/e2e/professional-workspace.spec.ts`, `tests/e2e/booking-critical.spec.ts`, `tests/e2e/payments-engine.spec.ts`, `tests/e2e/wave2-onboarding-gates.spec.ts`, `tests/e2e/api-v1-smoke.spec.ts` |
| C28 | **Cleanup Pass 5** — Centralized 9 booking metadata mutation sites into `patchBookingMetadata()` helper (`lib/booking/metadata.ts`). Manages concurrency risk with strong JSDoc warning; true atomicity requires future PostgreSQL JSONB merge function. TypeScript clean. | `lib/booking/metadata.ts`, `lib/booking/manage-booking-service.ts`, `lib/ops/abandoned-checkout.ts`, `lib/ops/no-show-detection.ts`, `lib/ops/pending-payment-timeout.ts`, `lib/ops/recurring-slot-release.ts` |
| C29 | **Cleanup Pass 6** — Set up Supabase generated-types workflow. Added `npm run db:gen-types` script; generated `types/supabase-generated.ts` (4,257 lines) from production DB schema; re-exported `Database` type from `types/supabase.ts`. Existing clients left untyped to avoid breaking the build; gradual migration tracked. | `package.json`, `types/supabase.ts`, `types/supabase-generated.ts` |
| C30 | **Cleanup Pass 7** — Wired typed Supabase clients (`lib/supabase/client.ts`, `server.ts`, `admin.ts`) with `createClient<Database>(...)`. Added `.github/dependabot.yml` for automated dependency updates (daily npm, weekly GitHub Actions). | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `.github/dependabot.yml` |
| C31 | **Documentation gaps closed** — Updated `vercel-github-actions.md` with actual 21-step CI workflow. Created `docs/integrations/agora.md` (architecture, config, usage flow). Created `docs/engineering/troubleshooting.md` (build/runtime/E2E/DB common issues). Updated `.env.local.example` with 9 missing vars (`REVOLUT_CLIENT_ID`, `REVOLUT_REFRESH_TOKEN`, `REVOLUT_PRIVATE_KEY`, `SENTRY_ORG`, `SENTRY_PROJECT`, `AWS_REGION`, `GOOGLE_DOCUMENT_AI_LOCATION`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`). | `docs/integrations/vercel-github-actions.md`, `docs/integrations/agora.md`, `docs/engineering/troubleshooting.md`, `.env.local.example` |
| C32 | **Security hardening (API input validation + role checks)** — Added `profissional` role guard (403) to `POST/PATCH /api/v1/professionals/me`. Added Zod `professionalSchema`/`professionalDraftSchema` validation to body fields. Added Zod `professionalStatusSchema` validation to `PATCH /api/v1/admin/professionals/[id]/status`. TypeScript clean; 1051/1052 tests pass (1 pre-existing failure in `availability-engine.test.ts`). | `app/api/v1/professionals/me/route.ts`, `app/api/v1/admin/professionals/[id]/status/route.ts` |
| C33 | **Unbounded query limits + hydration fixes** — Added `.limit(200)` to conversation/participant/profile queries in `lib/chat/chat-service.ts`. Added `.limit(500)` to case message/action queries in `lib/disputes/dispute-service.ts`. Fixed hydration mismatch on legal pages (`termos-de-uso`, `privacidade`, `politica-de-cookies`) by replacing dynamic `new Date().toLocaleDateString('pt-BR')` with static date strings. | `lib/chat/chat-service.ts`, `lib/disputes/dispute-service.ts`, `app/termos-de-uso/page.tsx`, `app/privacidade/page.tsx`, `app/politica-de-cookies/page.tsx` |
| C34 | **Typed Supabase clients attempt + revert** — Enabled `createClient<Database>()` on all three Supabase clients. Reverted due to 70+ TypeScript errors from stale generated types (`types/supabase-generated.ts` missing `provider_payment_id`, `focus_areas`, `subcategories`, `allow_multi_session`, `buffer_time_minutes`, `require_session_purpose`, `start_utc`, etc.). Gradual migration deferred until schema is regenerated from actual production DB. | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `types/supabase-generated.ts` |
| C35 | **Cleanup Pass 8 — Server Component console.error → Sentry** — Replaced 16 `console.error` calls in `app/(app)/agenda/page.tsx` and `app/(app)/dashboard/page.tsx` with `Sentry.captureException()`. Replaced 21 `console.error` calls in 3 payment routes (`api/v1/payments/payment-intent`, `api/stripe/payment-intent`, `api/stripe/checkout-session/booking`) with `Sentry.captureException()`. Added security comments on `createAdminClient()` usage in payment routes explaining RLS guard trigger justification and RPC migration path. | `app/(app)/agenda/page.tsx`, `app/(app)/dashboard/page.tsx`, `app/api/v1/payments/payment-intent/route.ts`, `app/api/stripe/payment-intent/route.ts`, `app/api/stripe/checkout-session/booking/route.ts` |
| C36 | **Cleanup Pass 9 — Remaining unbounded query limits** — Added `.limit(500)` to `markAllNotificationsAsRead` in `lib/notifications/notification-service.ts`. Added `.limit(200)` to availability backup queries in `lib/professional/professional-profile-service.ts`. | `lib/notifications/notification-service.ts`, `lib/professional/professional-profile-service.ts` |
| C37 | **Cleanup Pass 10 — CSRF validation on critical API v1 routes** — Added `validateApiCsrf()` helper to `lib/http/csrf.ts` (Bearer-aware: skips validation for mobile Bearer tokens). Applied to 15 state-changing API v1 routes: bookings (requests, accept, offer, cancel, decline, complete, no-show, report, session-link), favorites, push (subscribe/unsubscribe), professional services, submit-for-review. | `lib/http/csrf.ts`, `app/api/v1/bookings/requests/route.ts`, `app/api/v1/bookings/requests/[id]/accept/route.ts`, `app/api/v1/bookings/requests/[id]/offer/route.ts`, `app/api/v1/bookings/requests/[id]/cancel-user/route.ts`, `app/api/v1/bookings/requests/[id]/decline-professional/route.ts`, `app/api/v1/bookings/requests/[id]/decline-user/route.ts`, `app/api/v1/bookings/[id]/complete/route.ts`, `app/api/v1/bookings/[id]/mark-user-no-show/route.ts`, `app/api/v1/bookings/[id]/report-no-show/route.ts`, `app/api/v1/bookings/[id]/session-link/route.ts`, `app/api/v1/favorites/route.ts`, `app/api/v1/push/subscribe/route.ts`, `app/api/v1/push/unsubscribe/route.ts`, `app/api/v1/professionals/me/services/route.ts`, `app/api/v1/professionals/me/submit-for-review/route.ts` |
| C38 | **Cleanup Pass 11 — CODE_REVIEW_REPORT verification** — Verified mobile app compiles (`mobile/tsconfig.json` + `tsc --noEmit` passes). Verified all images have `alt` text. Verified FormData type errors are resolved (0 TypeScript errors). Updated `CODE_REVIEW_TRACKER_UPDATE.md` and `CODE_REVIEW_REPORT.md` with post-cleanup status. | `mobile/tsconfig.json`, `CODE_REVIEW_TRACKER_UPDATE.md`, `CODE_REVIEW_REPORT.md` |
| C39 | **Cleanup Pass 12 — Security & stability fixes** — Fixed calendar callback open redirect (MEDIUM-6) with whitelist-based `safeRedirectPath`. Fixed middleware SESSION_CACHE memory leak (MEDIUM-4) with LRU eviction by `lastAccessedAt`. Fixed empty catch blocks (LOW-2) in credentials upload, profile-media upload, and booking payment prep — all now log to Sentry. Fixed `scripts/ops/README.md` Portuguese outlier. Updated `database-and-migrations.md` stale Wave 3 pending status. TypeScript clean; 1050/1052 tests pass (no new failures). | `app/api/professional/calendar/callback/[provider]/route.ts`, `lib/supabase/middleware.ts`, `app/api/professional/credentials/upload/route.ts`, `app/api/professional/profile-media/upload/route.ts`, `lib/booking/create-booking.ts`, `scripts/ops/README.md`, `docs/engineering/database-and-migrations.md` |
| C40 | **Cleanup Pass 13 — Middleware execution + perf + coverage fixes** — Critical: renamed `proxy.ts` → `middleware.ts`; Next.js was not executing root middleware, disabling CSP nonces, CORS, mobile API key validation, session caching, and role redirects since commit `ae708a8`. Added preconnect + dns-prefetch hints for PostHog, Vercel Insights, and Sentry in root layout. Added `loading.tsx` + `error.tsx` to `admin/planos` and `onboarding-profissional`. Converted agenda nested ternary to lookup map. TypeScript clean; 1051/1052 tests pass. | `middleware.ts`, `app/layout.tsx`, `app/(app)/admin/planos/loading.tsx`, `app/(app)/admin/planos/error.tsx`, `app/(app)/onboarding-profissional/loading.tsx`, `app/(app)/onboarding-profissional/error.tsx`, `app/(app)/agenda/page.tsx` |
| C41 | **Cleanup Pass 14 — Type safety + lib/ console.error → Sentry** — Upgraded `tsconfig.json` target to `ES2022`. Added `AgendaBooking` interface to agenda page (replaced 20+ `any`). Added `PaymentRow` type to financeiro page. Made `RecurringPackageCard` recurrence fields optional. Replaced 20 `console.error` calls in `chat-service.ts`, `dispute-service.ts`, `email-action-service.ts` with `Sentry.captureException()`. TypeScript clean; 1051/1052 tests pass. | `tsconfig.json`, `app/(app)/agenda/page.tsx`, `app/(app)/financeiro/page.tsx`, `components/agenda/RecurringPackageCard.tsx`, `lib/chat/chat-service.ts`, `lib/disputes/dispute-service.ts`, `lib/email/email-action-service.ts` |
| C42 | **Cleanup Pass 15 — Fixed date-dependent test flakiness** — `generateRecurringSlotStarts` and `generateRecurrenceSlots` used bare `new Date()` making tests fail depending on current date. Added optional `now?: Date` parameter to both functions; updated tests to pass fixed dates. All 1052/1052 tests now pass. TypeScript clean. | `lib/booking/availability-engine.ts`, `lib/booking/availability-engine.test.ts`, `lib/booking/recurrence-engine.ts`, `lib/booking/recurrence-engine.test.ts` |
| C43 | **Cleanup Pass 16 — Extracted shared booking helpers + auth type fix** — Extracted `extractProfessionalTimezone()` and `loadProfessionalSettings()` from duplicated patterns in `request-booking-service.ts` (3 sites) and `manage-booking-service.ts` (1 site). Replaced `user: any | null` with `user: User | null` in `lib/auth/layout-session.ts`. Updated mock in request-booking-service test. TypeScript clean; 1052/1052 tests pass. | `lib/booking/settings.ts`, `lib/booking/request-booking-service.ts`, `lib/booking/manage-booking-service.ts`, `lib/booking/request-booking-service.test.ts`, `lib/auth/layout-session.ts` |
| C44 | **Cleanup Pass 17 — Extracted `parseBookingSlot` + Sentry instrumentation + query limits** — Created `lib/booking/slot-parsing.ts` with `parseBookingSlot()` helper and `MS_PER_MINUTE`/`MS_PER_HOUR` constants. Replaced 4 duplicated `fromZonedTime` + NaN blocks in request-booking and manage-booking services. Removed redundant manual min-notice/max-window checks from offer/reschedule; delegated to `validateSlotAvailability`. Replaced 18 `console.error` calls with `Sentry.captureException` across 9 files (booking, availability, auth, blog, actions). Added `.limit(500)` to blog comments and `.limit(200)` to conflict detection. Updated test mocks. TypeScript clean; 1052/1052 tests pass. | `lib/booking/slot-parsing.ts`, `lib/booking/request-booking-service.ts`, `lib/booking/manage-booking-service.ts`, `lib/booking/availability-checks.ts`, `lib/booking/external-calendar-conflicts.ts`, `lib/blog/blog-engagement-service.ts`, `lib/auth/layout-session.ts`, `lib/actions/user-profile.ts`, `lib/actions/professional-onboarding.ts`, `lib/actions/review-response.ts`, `lib/booking/availability-checks.test.ts`, `lib/booking/external-calendar-conflicts.test.ts` |

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
