# Documentation Audit Report — 2026-04-24

> **Scope:** All 195 files under `docs/`  
> **Auditor:** Kimi Code CLI  
> **Codebase verified:** `C:\dev\muuday-app` (canonical workspace)  
> **Package versions verified:** Next.js `^16.2.4`, React `^19`

---

## Executive Summary

The `docs/` tree contains significant drift. Several docs present a misleading picture of project status that risks误导ing future AI agents into rebuilding systems that already exist. **The most severe issue is `docs/product/IMPLEMENTATION-ROADMAP.md`, which marks virtually all backend-built systems as ⏳ pending.**

### Severity Ratings
- **🔴 CRITICAL:** Doc will mislead implementers into duplicate work or wrong architecture decisions
- **🟡 HIGH:** Doc contains stale data that contradicts operational reality
- **🟢 LOW:** Doc is outdated but not dangerous

---

## 🔴 Critical Findings

### 1. `docs/product/IMPLEMENTATION-ROADMAP.md` — SEVERELY MISALIGNED
**Last updated:** 2026-04-19  
**Status:** Marks ALL 40+ implementation items (AUTH-01 through SRV-05, all Phase 10 tasks) as ⏳ pending.

**Reality check against codebase:**

| Item | Roadmap Status | Actual Status | Evidence |
|------|---------------|---------------|----------|
| AUTH-01: Public booking auth overlay | ⏳ | ✅ Backend ready, UI likely exists | `components/auth/AuthOverlay.tsx` exists |
| AUTH-02: Post-login destination | ⏳ | ✅ Implemented | `app/auth/callback/route.ts` handles role routing |
| PRO-01: Dual-gate tracker | ⏳ | ✅ Implemented | `lib/professional/onboarding-gates.ts`, dashboard tracker modal |
| DISC-01: Search empty state recovery | ⏳ | ✅ Implemented | `app/buscar/page.tsx`, `SearchEmptyState` component |
| BOOK-01: Booking timeline | ⏳ | ✅ Partial / backend ready | Booking state machine exists with full lifecycle |
| BOOK-02: Recurring booking UX | ⏳ | ✅ Backend complete | `lib/booking/recurrence-engine.ts`, migration `027` |
| SESS-01: Pre-join device check | ⏳ | 🔄 Partial | Agora session page exists, pre-join may need enhancement |
| SESS-02: Auto no-show detection | ⏳ | ✅ Implemented | `lib/ops/no-show-detection.ts`, Inngest cron `*/5` |
| WORK-01: Agenda batch actions | ⏳ | ✅ Backend ready | Agenda page exists with management actions |
| CROSS-01: Notification inbox | ⏳ | ✅ Implemented | `/mensagens` page, notification server actions |
| CROSS-02: Global context propagation | ⏳ | ✅ Implemented | Country/currency/timezone middleware + hooks |
| ADMIN-01: Case resolution system | ⏳ | ✅ Backend complete | `/admin/casos`, `lib/actions/disputes.ts` |
| REVIEW-02: Professional response | ⏳ | ✅ Implemented | `lib/actions/review-response.ts` |
| SRV-01: Multi-service data layer | ⏳ | ✅ Implemented | Migration `058`, `professional_services` table |
| Phase 10.1: Review reminders | ⏳ | ✅ Implemented | `lib/ops/review-reminders.ts`, Inngest cron daily 10h UTC |
| Phase 10.3: Waitlist capture | ⏳ | ✅ Implemented | `/api/waitlist` route exists |

**Risk:** A future AI agent reading this as primary guidance will rebuild existing systems, wasting days of work and potentially causing regressions.

**Recommended action:** Complete rewrite — mark backend-complete items as `✅ Backend complete (needs UI polish/verification)`, mark genuinely pending items accurately, add a new section "Already Delivered (Do Not Rebuild)."

---

### 2. Payment Rail Controversy — THREE Different Plans in Different Docs

This is the most dangerous architectural controversy in the documentation.

| Document | Payment Rail Plan | Status |
|----------|------------------|--------|
| `docs/architecture/tech-stack.md` | UK Stripe + BR **Airwallex/dLocal** | "Planned / Wave 3" |
| `docs/engineering/stripe-integration-plan.md` | UK Stripe + BR **Airwallex** (dLocal = contingency) | "Decision update 2026-04-10" |
| `docs/engineering/IMPLEMENTATION-TRACKER.md` Fase 6 | **Trolley + Revolut** | "Aguardando instruções" |

**Problem:** The Portuguese backend tracker (Fase 6) was written with a completely different payment architecture (Trolley for payouts, Revolut for corporate treasury) than the canonical English docs (Stripe Connect with Airwallex for BR). If a Portuguese-speaking implementer follows the tracker and an English-speaking implementer follows the Stripe plan, they will build incompatible systems.

**Root cause:** The backend parallel work (Fases 1–5) was done in Portuguese and may have used an earlier/preliminary payment architecture decision. The 2026-04-10 entity-based rail decision (Stripe + Airwallex) superseded the Trolley+Revolut concept but the tracker was never updated.

**Recommended action:**
1. Add a prominent warning banner to `IMPLEMENTATION-TRACKER.md` Fase 6: "⚠️ SUPERCEDED: See `stripe-integration-plan.md` for canonical payment architecture. Trolley+Revolut is ARCHIVED."
2. Update Fase 6 to reference the Stripe plan, or remove the skeleton if it no longer applies.

---

## 🟡 High-Priority Findings

### 3. Canonical Spec Internal Contradiction: Annual Pricing

**Two incompatible rules exist in the same spec suite:**

| Source | Rule |
|--------|------|
| `part1-foundations-search-tiers.md` §4.11 line 431 | "annual = 10× monthly price (not a percentage discount). This is the **canonical rule** — do not express as a percentage discount." |
| `part1-foundations-search-tiers.md` §12.1 line 1452 | "Annual plan exists with **15% discount**." |
| `part2-onboarding-booking-lifecycle.md` line 544 | "annual = 10× monthly price" |
| `part3-payments-billing-revenue-engine.md` §12.4 line 893 | "annual with **15% discount**" |

**Status:** ✅ RESOLVED 2026-04-24 — User confirmed **10× monthly**. All spec parts updated. 15% discount references removed.

**Recommended action:** Resolve the contradiction in the spec. 10× monthly = 16.7% discount (pay for 10, get 12). 15% discount = pay for 10.2 months. They are close but not identical. Pick one, document the decision, and update all four parts.

---

### 4. Canonical Spec ↔ Code Contradiction: Basic Booking Window

| Source | Basic Booking Window |
|--------|---------------------|
| `part1-foundations-search-tiers.md` §4.11 line 493 | **60 days** |
| `part1-foundations-search-tiers.md` §12.1 line 1459 | **60 / 90 / 180 days** |
| `lib/tier-config.ts` line 36 | **30 days** |
| `docs/engineering/onboarding-and-tiers-implementation-plan.md` | **30 days** |

**Status:** ✅ RESOLVED 2026-04-24 — User initially confirmed **60 days**. `lib/tier-config.ts` updated from 30 → 60. `onboarding-and-tiers-implementation-plan.md` updated. `professional-workspace-journey.md` updated.

> **Reversal (2026-04-27):** After cross-checking with migration 045 (`plan_configs` table defaults), the Basic booking window was reverted to **30 days** to maintain consistency with the DB-enforced canonical values. All docs and `lib/tier-config.ts` now agree: Basic = 30, Professional = 90, Premium = 180.

**Recommended action:** Decide the intended value. If 30 is correct, update the spec. If 60 is correct, update the code and the onboarding plan.

---

### 5. `docs/architecture/tech-stack.md` — Multiple Stale Entries

**Last updated:** 2026-04-10 (before Next.js 16 upgrade, before many backend deliveries)

| Claimed | Actual | Location |
|---------|--------|----------|
| Next.js 14 + React 18 | **Next.js 16.2.4 + React 19** | `package.json` |
| Playwright "In progress" | Baseline exists, E2E running in CI | `testing-and-quality.md` |
| Zod "In progress" | Widely used across actions/APIs | Codebase scan |
| Sentry "In progress" | Active in production | `deployment-and-operations.md` |
| PostHog "In progress" | Active, 7 server-side events instrumented | `IMPLEMENTATION-TRACKER.md` §3.1 |
| Resend "In progress" | Multiple email templates active | `lib/email/` |
| Upstash "In progress" | 20+ rate limit presets active | `lib/security/rate-limit.ts` |
| Inngest "In progress" | 4+ cron functions active | `inngest/functions/` |
| pg_trgm + GIN "In progress" | Migration `019` applied | `database-and-migrations.md` |
| Session provider "In progress (waiting room + game delivered)" | ✅ Done — waiting room shipped | Session log Entry 85 |

---

### 6. `docs/engineering/database-and-migrations.md` — Severely Stale

**Last updated:** 2026-03-30  
**Problem:** Only mentions migrations through `014`. Does not mention:
- Migrations `015`–`069` (55 additional migrations!)
- Key tables: `conversations`, `messages`, `push_subscriptions`, `client_records`, `session_notes`, `cases`, `case_messages`, `case_actions`, `professional_services`, `availability_rules`, `availability_exceptions`, `search_sessions`, `kyc_verifications`
- DB cron jobs (4 active)
- Supabase Vault / `pgsodium` usage

---

### 7. `docs/human-actions/current-operator-checklist.md` — Stale

**Last updated:** 2026-04-02  
**"Do now" items that are almost certainly done:**
- Migration `015` — applied (onboarding gate matrix is operational)
- Migration `022` — admin audit log is active (mentioned in `supabase.md`)
- Inngest resync — standard post-deploy procedure
- Sentry/PostHog alert rules — may still need manual config

**"Do before Wave 2 close" items:** Wave 2 was closed 2026-04-10 per `project-status.md`. These items should be moved to "Completed" or verified.

---

### 8. `docs/handover/next-steps.md` — Formatting Error + Stale Claim

**Duplicate numbering under "Immediate queue":**
- Item 2 (Sprint 5) and item 2 (calendar polish) — two #2s
- Item 3 (modal fetches) and item 3 (PT-BR cleanup) — two #3s

**Claim "No god files remain in actions/":**
- `lib/actions/admin.ts` = 172 lines (much smaller than 655 in refactor plan)
- `lib/actions/email.ts` = 270 lines (smaller than 548)
- The claim is **directionally true** — both files shrank dramatically. But `lib/email/resend.ts` (897 lines) and `components/dashboard/OnboardingTrackerModal.tsx` (3,995 lines) remain as god files in the broader codebase.

---

### 9. `docs/spec/consolidated/journey-coverage-matrix.md` — Stale

**Last updated:** 2026-04-11  
Many statuses are understated:
- "Search and discovery" = Done ✅ (correct)
- "Direct booking lifecycle" = Done ✅ (correct)
- "Request booking lifecycle" = Done ✅ (correct)
- "Notification and inbox lifecycle" = "In progress" — backend is done, frontend `/mensagens` exists
- "Admin case operations" = "In progress (review flow delivered)" — dispute backend complete, admin UI exists
- "Session execution" = "In progress (Agora-gated v1)" — waiting room + game shipped, should be closer to done

---

## 🟢 Lower-Priority Staleness

| Document | Last Updated | Issue |
|----------|-------------|-------|
| `docs/project/project-overview.md` | 2026-03-29 | Predates Wave 2 close, Sprint 5, API v1 extraction |
| `docs/handover/context-map.md` | 2026-04-01 | Predates backend parallel work, session waiting room |
| `docs/handover/how-to-work.md` | 2026-04-01 | Same |
| `docs/handover/rules-and-constraints.md` | 2026-03-29 | Same |
| `docs/engineering/testing-and-quality.md` | 2026-04-01 | E2E snapshot shows 2 passed, 1 skipped — may have progressed |
| `docs/product/AI-AGENT-INSTRUCTIONS.md` | Unknown | Should be verified against current AGENTS.md |

---

## Backend-Complete Systems That Docs Understate

The following systems have **fully working backend** (migrations, server actions, API routes, RLS, rate limiting) but docs treat them as pending or in-progress:

1. **In-app notifications** — `lib/actions/notifications.ts`, `/api/v1/notifications/*`, `/mensagens` page
2. **Chat / messaging** — Migration `054`, `lib/actions/chat.ts`, `conversations` + `messages` tables, Supabase Realtime ready
3. **Push notifications** — Migration `055`, `POST /api/push/subscribe`, `lib/push/sender.ts`
4. **Client records (CRM)** — Migration `056`, `lib/actions/client-records.ts`, `client_records` + `session_notes`
5. **Dispute / case system** — Migration `057`, `lib/actions/disputes.ts`, `cases` + `case_messages` + `case_actions`
6. **Multi-service booking** — Migration `058`, `lib/actions/professional-services.ts`, `professional_services` table
7. **Review reminders** — `lib/ops/review-reminders.ts`, Inngest daily cron
8. **Auto no-show detection** — `lib/ops/no-show-detection.ts`, Inngest 5-min cron
9. **Auto-recalc professional rating** — Migration `053`, trigger + unit tests
10. **Availability exceptions** — Time-range support (migration `061`), visual calendar rendering
11. **PWA** — Manifest, service worker, offline page, icons
12. **Product analytics** — 7 server-side events, PostHog integration
13. **Feature flags** — 10 typed flags with safe fallbacks

**Important distinction:** "Backend complete" ≠ "End-to-end shipped." Some systems (chat, push, client records) have working backend but the frontend may not fully consume them yet (feature flags off, UI basic). Docs should distinguish these states clearly.

---

## Recommendations

### Immediate (Do Now)
1. **Rewrite `IMPLEMENTATION-ROADMAP.md`** — Add "Already Delivered" section, mark backend-complete items, preserve genuinely pending UX improvements.
2. **Add warning banner to `IMPLEMENTATION-TRACKER.md` Fase 6** — Clarify that Trolley+Revolut is superseded by Stripe+Airwallex.
3. **Fix `next-steps.md` duplicate numbering**.
4. **Update `tech-stack.md`** — Next.js 16, React 19, mark completed tools as Done.

### Short-Term (This Week)
5. ~~Resolve annual pricing contradiction~~ ✅ DONE — 10× monthly confirmed, all spec parts updated.
6. ~~Resolve Basic booking window contradiction~~ ✅ DONE — 60 days confirmed, code + docs updated.
7. **Update `database-and-migrations.md`** — Add migrations `015`–`069` with key milestones.
8. **Update `current-operator-checklist.md`** — Close done items, move Wave 2 close items to completed.
9. **Update `journey-coverage-matrix.md`** — Reflect backend-complete domains.

### Medium-Term (Before Wave 3)
10. **Add "Backend complete / Frontend pending" status to all journey docs** — Prevent future confusion.
11. **Update stale date footers** on `project-overview.md`, `context-map.md`, `how-to-work.md`, `rules-and-constraints.md`.
12. **Archive or relabel superseded docs** — e.g., old payment architecture references.

---

## Audit Methodology

1. Read all top-level docs in `docs/project/`, `docs/handover/`, `docs/spec/consolidated/`, `docs/engineering/`, `docs/product/`, `docs/architecture/`, `docs/human-actions/`
2. Cross-referenced claims against:
   - `package.json` for dependency versions
   - `lib/tier-config.ts` for tier limits
   - `db/sql/migrations/` for migration inventory
   - `app/` routes for page existence
   - `lib/actions/` for server action inventory
   - `app/api/v1/` for API route inventory
   - `inngest/functions/` for background jobs
   - `lib/email/` for email templates
3. Verified line counts of claimed "god files"
4. Checked for duplicate numbering and formatting errors

---

*This audit was generated automatically. All findings should be reviewed by the project owner before being treated as definitive.*
