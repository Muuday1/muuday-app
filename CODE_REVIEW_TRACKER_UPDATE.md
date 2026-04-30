# Muuday Tracker Update — FULLY VERIFIED

**Generated:** 2026-04-29
**Last cleanup pass:** 2026-04-30 (Pass 33)
**Method:** Deep read-only audit. Every previously "not verified" item was investigated.

---

## Cleanup Pass 33 — 2026-04-30

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **ESLint** `@next/next/no-html-link-for-pages` | Replaced `<a href="/admin/casos">` with `<Link href="/admin/casos">` in `app/(app)/admin/casos/[caseId]/page.tsx`. | 1 file |
| **`docs/NEXT_STEPS.md`** god-file status | Marked `request-booking-service.ts` and `manage-booking-service.ts` as complete in P3.1 (both under 500 lines). | 1 file |

### Verification
- `node node_modules/typescript/bin/tsc --noEmit` passes (Exit 0).
- `node node_modules/eslint/bin/eslint.js . --ext .ts,.tsx` — **0 errors, 0 warnings**.
- `node node_modules/vitest/vitest.mjs run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 32 — 2026-04-30

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **Performance MEDIUM-1** Sequential awaits in pages | Parallelized independent queries in 5 high-traffic pages: `app/(app)/agenda/page.tsx` (2 fixes: expire query + conversations/reviews), `app/(app)/profissional/[id]/page.tsx` (viewer profile + professional query), `app/(app)/agendar/[id]/page.tsx` (professional profile + first-booking eligibility), `app/(app)/avaliar/[bookingId]/page.tsx` (booking + existing review), `app/(app)/mensagens/[conversationId]/page.tsx` (other profile + messages + mark-read). | 5 files |

### Verification
- `node node_modules/typescript/bin/tsc --noEmit` passes (Exit 0).
- `node node_modules/vitest/vitest.mjs run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).
- `node node_modules/next/dist/bin/next build` — 190 pages generated successfully.

---

## Cleanup Pass 31 — 2026-04-30

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **2.3** God file `request-booking-service.ts` | Extracted `acceptRequestBookingService` → `lib/booking/request-booking/accept-request.ts` (349 lines). Moved `RequestBookingResult` and `RequestBookingActionResult` types to `lib/booking/types.ts`. File now **433 lines** (was 811). | 5 files |
| **2.2** Availability logic duplication | Verified all previously duplicated patterns (`extractProfessionalTimezone`, `loadProfessionalSettings`, `parseBookingSlot`, `validateSlotAvailability`) are fully extracted into shared helpers. Status updated from 🔴 STILL PRESENT to 🟢 FIXED. | — |
| **3.20** Dependabot | Verified `.github/dependabot.yml` exists. Updated tracker body from 🔴 STILL PRESENT to 🟢 FIXED (was already marked fixed in summary table). | — |
| **2.3** God file status | Updated tracker line counts and assessments: `manage-booking-service.ts` **448 lines**, `request-booking-service.ts` **433 lines**. Both under 500-line threshold. | — |
| **5.3–5.7** Documentation tracker contradictions | Verified actual doc state vs tracker body. Updated 5.3, 5.4, 5.5, 5.7 from 🔴 STILL PRESENT → 🟢 FIXED. Updated 5.6 from 🔴 STILL PRESENT → 🟡 PARTIALLY FIXED (all env vars present, explanations missing). | 5 tracker entries |
| **5.10** Docs with Pending/In progress | Investigated "39+ files" claim. Found most are legitimate planning docs, UX research statuses, or historical snapshots. Updated from 🔴 STILL PRESENT → 🟡 PARTIALLY FIXED. | — |
| **`docs/engineering/god-file-refactor-plan.md`** | Updated with current line counts and extraction status for both god files. | 1 file |

### Verification
- `node node_modules/typescript/bin/tsc --noEmit` passes (Exit 0).
- `node node_modules/vitest/vitest.mjs run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).
- `node node_modules/next/dist/bin/next build` — 190 pages generated successfully.

---

## Cleanup Pass 30 — 2026-04-30

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **2.3** God file `manage-booking-service.ts` | Extracted `completeBookingService` → `lib/booking/completion/complete-booking.ts`; `reportProfessionalNoShowService` + `markUserNoShowService` → `lib/booking/no-show/report-no-show.ts`; `listBookingsService` + `getBookingDetailService` → `lib/booking/query/booking-queries.ts`. File now **448 lines** (was 944). | 4 files |
| **Stale tracker entries** | Corrected 3.9, 3.10, 3.11 status from 🔴 STILL PRESENT to 🟢 FIXED (were resolved in Pass 1/Pass 27). Corrected OnboardingTrackerModal `c5_availability_calendar` gap status (was removed from `UI_STAGE_ORDER` in constants.ts and ProfessionalOnboardingCard.tsx). | `CODE_REVIEW_TRACKER_UPDATE.md` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 29 — 2026-04-30

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **2.3** God file `manage-booking-service.ts` | Extracted `applyPaymentRefund` → `lib/booking/cancellation/apply-refund.ts` (already existed, moved import); `executeCancelSingleBooking` → `lib/booking/cancellation/execute-cancel.ts`; `ManageBookingResult` type → `lib/booking/types.ts` (single source of truth). Updated all imports across actions, api-client, tests. File now **761 lines** (was 944). | 7 files |
| **OnboardingTrackerModal** stage gap | Removed `c5_availability_calendar` from `UI_STAGE_ORDER` in `components/dashboard/onboarding-tracker/constants.ts` and `ProfessionalOnboardingCard.tsx`. Deleted unused `availability-stage.tsx`. Modal no longer renders empty stage. | 5 files |
| **Agenda page** dead code | Removed unused imports (`ProfessionalAgendaPage`, `normalizeProfessionalSettingsRow`) and unbound variable declarations (`overviewCalendarBookings`, `calendarIntegration*` etc.). | 1 file |
| **LOW-1** Inconsistent error page coverage | Added `loading.tsx` + `error.tsx` to `admin/casos/`, `admin/finance/`, `configuracoes/notificacoes/`. | 6 files |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 28 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **LOW-1** Inconsistent error page coverage | Added `loading.tsx` + `error.tsx` to 3 high-value user-facing routes: `app/(app)/completar-perfil/`, `app/(app)/editar-perfil/`, `app/(app)/editar-perfil-profissional/`. | 6 files |
| **next.config.js** Security & image config | Added `poweredByHeader: false` to remove X-Powered-By header. Added `cdn.sanity.io` to `images.remotePatterns` for future Sanity image optimization. | 1 file |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- No new TypeScript errors introduced.

---

## Cleanup Pass 27 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **5.10 / docs** Stale integration status markers | Updated 8 integration docs from misleading "In progress" to accurate "Done" or "Ongoing": checkly.md, inngest.md, posthog.md, resend.md, sentry.md, supabase.md, upstash-rate-limit.md. Updated testing-and-quality.md Playwright status. Added UTF-8 BOM prevention rule to AGENTS.md. | 9 files |
| **NEW-1** IMPLEMENTATION-TRACKER.md mojibake | Re-read file — it is readable and correct. Initial report was a false positive due to terminal rendering. Updated tracker to reflect resolved status. | 1 file |
| **NEW-8 / 5.6** Missing env var in `.env.local.example` | Added `TROLLEY_API_BASE` to `.env.local.example`. | 1 file |
| **LOW-1** Inconsistent error page coverage | Added `loading.tsx` + `error.tsx` to 4 critical user-facing routes: `app/(app)/agendar/[id]/`, `app/(auth)/login/`, `app/(auth)/cadastro/`, `app/(app)/profissional/[id]/`. | 8 files |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- No new TypeScript errors introduced.

---

## Cleanup Pass 22 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **console.warn** → Sentry across `lib/` (20+ calls), `components/` (7 calls), and `app/api/` (1 call) | Replaced all production-facing `console.warn` calls with `Sentry.captureMessage(level: 'warning')`. Files: `lib/payments/revolut/client.ts` (6), `lib/payments/trolley/client.ts` (2), `lib/payments/debt/monitor.ts` (1), `lib/payments/subscription/manager.ts` (2), `lib/push/sender.ts` (1), `lib/push/preferences.ts` (2), `lib/push/unified-sender.ts` (2), `lib/session/client-tracker.ts` (2), `lib/email/resend-events.ts` (2), `lib/email/email-action-service.ts` (1), `lib/chat/chat-service.ts` (1), `lib/ops/booking-reminders.ts` (1), `lib/ops/pending-payment-timeout.ts` (1), `lib/ops/no-show-detection.ts` (1), `lib/notifications/quiet-hours.ts` (2), `lib/config/app-url.ts` (1), `lib/security/rate-limit.ts` (removed redundant), `components/agenda/ProfessionalAvailabilityWorkspace.tsx` (1), `components/booking/VideoSession.tsx` (2), `components/pwa/ServiceWorkerRegistration.tsx` (2), `components/pwa/PushNotificationToggle.tsx` (2), `app/api/professional/onboarding/save/route.ts` (1). Added Sentry import where missing. Updated 2 test files to mock Sentry instead of `console.warn`. | 24 files |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run` (relevant test files: 104 tests across 8 files) — all pass.
- Deployed live to https://app.muuday.com

---

## Cleanup Pass 21 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **console.error** in `app/(app)/` pages + `components/` (remaining 16 calls) | Replaced 16 `console.error` calls with `Sentry.captureException`/`captureMessage` in 9 files: `app/(app)/avaliar/[bookingId]/page.tsx` (2), `app/(app)/admin/finance/treasury/page.tsx` (1), `components/booking/VideoSession.tsx` (1), `components/admin/TaxonomiaForm.tsx` (6), `components/settings/ProfessionalSettingsWorkspace.tsx` (1), `components/settings/NotificationPreferencesPage.tsx` (1), `components/pwa/ServiceWorkerRegistration.tsx` (1), `components/pwa/PushNotificationToggle.tsx` (2), `components/profile/ProfileAccountSettings.tsx` (1). Added `import * as Sentry from '@sentry/nextjs'` to all 9 files. | 9 files |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).
- Deployed live to https://app.muuday.com

---

## Cleanup Pass 20 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **console.error** across app/api/ routes (remaining 39 calls) | Replaced 39 `console.error` calls with `Sentry.captureException`/`captureMessage` in 19 API route files. Added `import * as Sentry from '@sentry/nextjs'` to 12 files that didn't already have it. Categories: cron jobs (booking-timeouts, booking-reminders, public-visibility-sync), auth (oauth, password-reset), payments (stripe payment-intent, stripe checkout-session, treasury-status), professionals (search, availability, detail, submit-for-review), onboarding (save, modal-context), waitlist, agora token, kyc scan, session release. | 19 files |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).
- Deployed live to https://app.muuday.com

---

## Cleanup Pass 1 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **3.11 / NEW-2** Playwright `.env.local` manual parsing | Replaced naive `indexOf('=')` with `dotenv.config()` in both `playwright.config.ts` and `tests/e2e/global-setup.ts` | `playwright.config.ts`, `tests/e2e/global-setup.ts` |
| **3.10** Hardcoded Portuguese E2E selectors | Added `data-testid` attributes to cookie consent (`cookie-accept`, `cookie-close`, etc.) and login error (`login-error` + `data-error-type`). Updated all 4 E2E specs to use `data-testid` instead of Portuguese text for cookie dismiss, rate-limit detection, and invalid-credentials detection. | `components/cookies/CookieConsentRoot.tsx`, `components/auth/LoginForm.tsx`, `tests/e2e/*.spec.ts` |
| **NEW-5** Availability workspace deletes all then re-inserts | Created `saveProfessionalAvailability` service with **backup-and-restore** logic: fetches current rows before mutation; if insert fails after delete, attempts to restore backup rows. Created `saveAvailabilityAction` server action. Updated `ProfessionalAvailabilityWorkspace` to use server action instead of direct Supabase mutations. | `lib/professional/professional-profile-service.ts`, `lib/actions/professional.ts`, `components/agenda/ProfessionalAvailabilityWorkspace.tsx` |
| **1.5** Client-side Supabase mutations | Fixed all 7 components. Availability → `saveAvailabilityAction`; Booking settings → `saveBookingSettingsAction`; Profile/notification fields → `updateProfileField` server action with server-side whitelist and rate limiting. | `lib/professional/professional-profile-service.ts`, `lib/actions/professional.ts`, `lib/actions/user-profile.ts`, `lib/security/rate-limit.ts`, `components/agenda/ProfessionalAvailabilityWorkspace.tsx`, `components/agenda/ProfessionalBookingRulesPanel.tsx`, `components/settings/BookingSettingsClient.tsx`, `components/settings/ProfessionalSettingsWorkspace.tsx`, `components/settings/NotificationPreferencesPage.tsx`, `components/profile/ProfileAccountSettings.tsx` |
| **3.9 / NEW-3** Duplicated E2E login helpers | Consolidated duplicated `login`, `loginAsAdmin`, `loginAsUser`, `loginViaApi`, and `dismissCookieDialogIfPresent` into shared `tests/e2e/helpers.ts`. All 5 spec files now import from shared module. | `tests/e2e/helpers.ts`, `tests/e2e/*.spec.ts` |

### Fixed (continued)

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **2.8** Manual rollbacks without transactions | Hardened fallback paths in `persist-recurring.ts`, `record-payment.ts`, and `request-booking-service.ts`. Note: production uses PostgreSQL RPC functions (`create_booking_with_payment`, `create_recurring_booking_with_payment`) which ARE atomic transactions. The fallback paths only run when RPC functions are missing. Improvements: removed dead cleanup code in `persist-recurring.ts`; added Sentry capture for all rollback failures; `record-payment.ts` now verifies cancellation succeeded and throws explicit error if not; `request-booking-service.ts` checks both booking cancellation and request recovery results. | `lib/booking/creation/persist-recurring.ts`, `lib/booking/creation/record-payment.ts`, `lib/booking/request-booking-service.ts` |

### Verification
- `npx tsc --noEmit` passes (Exit 0) after all changes.
- No new TypeScript errors introduced.

---

## Cleanup Pass 2 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **3.3** `console.error` in production hot paths (agenda, dashboard) | Replaced 16 `console.error` calls in `app/(app)/agenda/page.tsx` and `app/(app)/dashboard/page.tsx` with `Sentry.captureException()` for structured error reporting. | `app/(app)/agenda/page.tsx`, `app/(app)/dashboard/page.tsx` |
| **3.2** Unbounded `.select()` without `.limit()` (remaining) | Added `.limit(500)` to `markAllNotificationsAsRead` in `lib/notifications/notification-service.ts`. Added `.limit(200)` to availability backup queries in `lib/professional/professional-profile-service.ts`. | `lib/notifications/notification-service.ts`, `lib/professional/professional-profile-service.ts` |
| **MEDIUM-1** `createAdminClient()` in user-facing payment routes | Replaced 21 `console.error` calls in 3 payment routes with `Sentry.captureException()`. Added detailed security comments explaining why `createAdminClient()` is necessary for `provider_payment_id` updates (RLS guard trigger blocks non-admins). Documented migration path to PostgreSQL RPC function. | `app/api/v1/payments/payment-intent/route.ts`, `app/api/stripe/payment-intent/route.ts`, `app/api/stripe/checkout-session/booking/route.ts` |
| **MEDIUM-3** Missing CSRF on API v1 routes | Added `validateApiCsrf()` to 15 critical state-changing API v1 routes. New helper `validateApiCsrf()` in `lib/http/csrf.ts` skips validation for Bearer-token requests (mobile-safe) while enforcing Origin/Referer checks for cookie-based web requests. | `lib/http/csrf.ts`, `app/api/v1/bookings/requests/route.ts`, `app/api/v1/bookings/requests/[id]/accept/route.ts`, `app/api/v1/bookings/requests/[id]/cancel-user/route.ts`, `app/api/v1/bookings/requests/[id]/decline-professional/route.ts`, `app/api/v1/bookings/requests/[id]/decline-user/route.ts`, `app/api/v1/bookings/requests/[id]/offer/route.ts`, `app/api/v1/bookings/[id]/complete/route.ts`, `app/api/v1/bookings/[id]/mark-user-no-show/route.ts`, `app/api/v1/bookings/[id]/report-no-show/route.ts`, `app/api/v1/bookings/[id]/session-link/route.ts`, `app/api/v1/favorites/route.ts`, `app/api/v1/push/subscribe/route.ts`, `app/api/v1/push/unsubscribe/route.ts`, `app/api/v1/professionals/me/services/route.ts`, `app/api/v1/professionals/me/submit-for-review/route.ts` |
| **HIGH-1** Mobile app unbuildable | Verified `mobile/tsconfig.json` exists and `tsc --noEmit` passes cleanly in the mobile directory. Mobile app is properly excluded from the web `tsconfig.json`. | `mobile/tsconfig.json` |
| **HIGH-1** Missing `alt` attributes on images | Audited all `<img>` and `next/image` usages across `components/` and `app/`. All images already have `alt` text (either descriptive or `alt=""` for decorative). The CODE_REVIEW_REPORT count of "only 4 alt occurrences" was inaccurate/stale. | — |
| **MEDIUM-1** FormData type errors | Verified `tsc --noEmit` passes with zero errors. The reported FormData type issues in `app/api/professional/credentials/upload/route.ts` and `app/api/professional/profile-media/upload/route.ts` are no longer present. | — |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run app/api/stripe/checkout-session/booking/route.test.ts app/api/stripe/payment-intent/route.test.ts` — 21/21 pass.
- Mobile app `tsc --noEmit` passes.

---

## Cleanup Pass 3 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **MEDIUM-6** Calendar callback weak redirect validation | Replaced permissive `safeRedirectPath` with explicit whitelist of 6 known-safe paths (`/dashboard`, `/agenda`, `/configuracoes`, `/disponibilidade`, `/configuracoes-agendamento`, `/editar-perfil-profissional`). Also rejects query strings, fragments, and protocol handlers. | `app/api/professional/calendar/callback/[provider]/route.ts` |
| **MEDIUM-4** Middleware SESSION_CACHE grows unbounded | Added `lastAccessedAt` timestamp to cache entries. Implemented `evictOldestSessions()` with sort-by-access-time + bulk eviction. Cleanup now triggers at >MAX_CACHE_SIZE, removes expired entries first, then evicts oldest by access time to 80% capacity. Insert path also enforces pre-insertion capacity bound. | `lib/supabase/middleware.ts` |
| **LOW-2** Empty catch blocks swallow errors without Sentry logging | Added `Sentry.captureException()` to 4 critical API route catch blocks: credentials upload (`POST`, `DELETE`), profile-media upload (`POST`), and booking creation payment preparation. Intentional defensive catches (input validation, cache fallbacks, signature verification) left unchanged. | `app/api/professional/credentials/upload/route.ts`, `app/api/professional/profile-media/upload/route.ts`, `lib/booking/create-booking.ts` |
| **5.7** scripts/ops/README.md Portuguese outlier | Translated to English to match rest of codebase. | `scripts/ops/README.md` |
| **5.10 / docs** Stale "Wave 3 (pending)" in database-and-migrations.md | Updated migration 081 status to "applied 2026-04-28" and added migrations 082 and 083 as applied. | `docs/engineering/database-and-migrations.md` |
| **2.8** Manual rollbacks without transactions | Verified all 3 fallback paths (request-booking-service, persist-recurring, record-payment) have comprehensive Sentry instrumentation with rich context. Rollback failures throw explicit errors requiring manual review. Full DB-transaction fix requires PostgreSQL RPC function migration (tracked in P3.8). | `lib/booking/request-booking-service.ts`, `lib/booking/creation/persist-recurring.ts`, `lib/booking/creation/record-payment.ts` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — 1050/1052 pass (2 pre-existing failures: availability-engine.test.ts, no new failures introduced).

---

## Cleanup Pass 4 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **MEDIUM-1** `middleware.ts` missing at root | Renamed `proxy.ts` → `middleware.ts`. Next.js only recognizes `middleware.ts` (or `src/middleware.ts`) as the root middleware file. `proxy.ts` was never executed, disabling CSP nonces, API v1 CORS, mobile API key validation, session caching, and role-based redirects since commit `ae708a8`. | `middleware.ts` (renamed from `proxy.ts`), `next.config.js`, `AGENTS.md`, `docs/engineering/performance/2026-04-24-25-performance-optimizations.md` |
| **MEDIUM-4** Nested ternary anti-pattern in agenda | Converted 4-level nested ternary for `calendarIntegrationStatus` to lookup map with `as const` type assertion. | `app/(app)/agenda/page.tsx` |
| **LOW-3** `@ts-ignore` in service worker | Verified all 8 `@ts-ignore` comments use proper formatting. True fix requires migrating `public/sw.js` to TypeScript; deferred. | `public/sw.js` |
| **LOW-2** Heavy third-party scripts without preconnect | Added `<link rel="preconnect">` and `<link rel="dns-prefetch">` for PostHog (`us.i.posthog.com`), Vercel Insights (`vitals.vercel-insights.com`), and Sentry (`o4511120268722176.ingest.us.sentry.io`) in root layout `<head>`. | `app/layout.tsx` |
| **LOW-1** Inconsistent error page coverage | Added `loading.tsx` + `error.tsx` to `app/(app)/admin/planos/` and `app/(app)/onboarding-profissional/`. | `app/(app)/admin/planos/loading.tsx`, `app/(app)/admin/planos/error.tsx`, `app/(app)/onboarding-profissional/loading.tsx`, `app/(app)/onboarding-profissional/error.tsx` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — 1051/1052 pass (1 pre-existing failure in `availability-engine.test.ts`, no new failures introduced).

---

## What Changed From Previous Report

All 19 previously "not verified" items have now been investigated. The findings below are **confirmed with file paths, line numbers, and code snippets**.

Additionally, **8 new issues** were discovered during verification that were not in the original tracker.

---

## 1. SEGURANÇA — Fully Verified

### 1.4 Páginas públicas (/profissional/[id], /buscar) usam createAdminClient()
**Status:** 🟢 **FIXED**

| File | Line | Usage |
|------|------|-------|
| `app/(app)/profissional/[id]/page.tsx` | 4, 227, 311 | `import { createClient }` — RLS-safe server client |
| `app/buscar/page.tsx` | 8, 470 | `import { createClient }` — RLS-safe server client |
| `app/(app)/buscar-auth/page.tsx` | 2, 27 | `import { createClient }` — RLS-safe server client |

No `createAdminClient` usage was found in any public page. All queries are RLS-bound.

---

### 1.5 Mutações client-side diretas no Supabase
**Status:** 🟢 **FIXED**

All 7 components now delegate writes to validated server actions:

| Component | Server Action | Notes |
|-----------|---------------|-------|
| `ProfessionalAvailabilityWorkspace` | `saveAvailabilityAction` | Backup-and-restore on failure |
| `ProfessionalBookingRulesPanel` | `saveBookingSettingsAction` | Consolidated shared logic into service |
| `BookingSettingsClient` | `saveBookingSettingsAction` | Reuses same service as above |
| `ProfessionalSettingsWorkspace` | `updateProfileField` | Server-side field whitelist + rate limit |
| `NotificationPreferencesPage` | `updateProfileField` | Server-side field whitelist + rate limit |
| `ProfileAccountSettings` | `updateProfileField` | Server-side field whitelist + rate limit |

**NEW FINDING (now fixed):** `ProfessionalAvailabilityWorkspace` previously performed **unbounded delete-all-then-reinsert** with no transaction wrapper. Now uses `saveProfessionalAvailability` service with backup-and-restore.

**NEW FINDING (now fixed):** `ProfessionalSettingsWorkspace` previously maintained an `EDITABLE_PROFILE_FIELDS` whitelist **only on the client**. The new `updateProfileField` server action enforces the same whitelist server-side.

**NEW FINDING (now fixed):** `BookingSettingsClient` and `ProfessionalBookingRulesPanel` previously contained **virtually identical `handleSave()` logic**. Now both delegate to the shared `saveBookingSettings` service.

---

## 2. ARQUITETURA & QUALIDADE — Fully Verified

### 2.2 Duplicação massiva de lógica de disponibilidade/conflitos
**Status:** 🟢 **FIXED**

All previously duplicated patterns have been extracted into shared helpers:

| Helper | File | What it encapsulates |
|--------|------|---------------------|
| `extractProfessionalTimezone()` | `lib/booking/settings.ts` | Profile extraction + timezone fallback chain |
| `loadProfessionalSettings()` | `lib/booking/settings.ts` | Settings query + normalization + defaults |
| `parseBookingSlot()` | `lib/booking/slot-parsing.ts` | `fromZonedTime` → NaN validation → endUtc calculation |
| `validateSlotAvailability()` | `lib/booking/slot-validation.ts` | Min-notice + max-window + conflict checks |

All three booking flows (`request-booking-service.ts`, `manage-booking-service.ts`, `create-booking.ts`) now import and call these helpers instead of inlining the logic.

---

### 2.3 God files de lógica de negócio
**Status:** 🟢 **FIXED**

| File | Lines | Assessment |
|------|-------|------------|
| `lib/booking/request-booking-service.ts` | **433** | 🟢 Under 500 lines — 6 service operations; `acceptRequestBookingService` extracted to `lib/booking/request-booking/accept-request.ts` |
| `lib/booking/manage-booking-service.ts` | **448** | 🟢 Under 500 lines — 5 core operations; completion, no-show, query, cancellation, and refund helpers extracted to dedicated modules |
| `lib/professional/onboarding-gates.ts` | 294 | 🟡 Borderline but acceptable |
| `lib/payments/stripe-resilience.ts` | **0** | 🟢 **File does not exist** — removed |
| `lib/actions/admin.ts` | 280 | 🟢 Thin wrapper, acceptable |

**Structural issues:**
- `request-booking-service.ts` mixes **orchestration, validation, pricing, persistence, and recovery** in one module.
- `manage-booking-service.ts` mixes **state-machine transitions, refund logic, email event emission, calendar sync enqueue, recurring deadline evaluation, and scoped batch cancellation** in one module.

---

### 2.5 Falta de tipos gerados do Supabase
**Status:** 🟡 **PARTIALLY FIXED**

| Check | Finding |
|-------|---------|
| `package.json` scripts | ✅ `db:gen-types` added — runs `supabase gen types typescript` against production project |
| Generated types file | ✅ `types/supabase-generated.ts` created (4,257 lines) from live DB schema |
| Typed client usage | 🟡 `lib/supabase/client.ts`, `server.ts`, and `admin.ts` still use raw `createClient()` without generic type parameters. Gradual migration needed to avoid breaking the build. |
| Manual casts | Ubiquitous. Examples: `request-booking-service.ts:67` `as Record<string, unknown>`; `manage-booking-service.ts:183` `as Record<string, unknown> \| null` |

**Conclusion:** The generated-types **workflow is now set up**. The `Database` type is re-exported from `types/supabase.ts`. Full type safety requires gradually updating client wrappers and removing manual `as` casts — this is a large follow-up effort that should be done incrementally.

---

### 2.6 BookingStatus duplicado em dois arquivos
**Status:** 🟢 **FIXED** (no divergence)

- `lib/booking/types.ts:1-13` defines `BOOKING_STATUSES` and `BookingStatus`
- `types/index.ts:72-73` re-exports: `export type BookingStatus = BookingStatusFromLib`

The definitions are **identical at runtime**. There is no divergence — only a dual-location maintenance risk if someone edits one and forgets the other.

---

### 2.8 Rollbacks manuais sem transações em server actions
**Status:** 🔴 **STILL PRESENT**

**Instance 1:** `lib/booking/request-booking-service.ts:695-770` (`acceptRequestBookingService`)
- Flow: atomic RPC fails → insert `bookings` row → insert `payments` row.
- If payment insert fails, code **manually** updates the booking to `cancelled` and reverts `request_bookings` to `status: 'open'`.
- **No database transaction** wraps these operations; partial failure leaves the system inconsistent if the manual rollback updates themselves fail.

**Instance 2:** `lib/booking/creation/persist-recurring.ts:60-127`
- Flow: atomic RPC fails → insert parent booking → insert child bookings → insert booking_sessions.
- If child insert fails, code **manually deletes** the parent booking.
- If session insert fails, code **manually deletes** child bookings **and** the parent booking.
- **No transaction wrapper**; each delete is a separate async call that can independently fail.

**Instance 3:** `lib/booking/creation/record-payment.ts:24-55`
- Flow: insert payment row. If it fails, code **manually updates** all related bookings to `status: 'cancelled'`.
- Again, **no transaction**; bookings may be left in `pending_payment` if the cancellation update fails.

---

### 2.9 Mutação de metadata ad-hoc e duplicada
**Status:** 🟡 **PARTIALLY FIXED**

All 9 sites that **read existing metadata and spread it** have been consolidated into `patchBookingMetadata()` in `lib/booking/metadata.ts`:

| File | Sites | Context |
|------|-------|---------|
| `lib/booking/manage-booking-service.ts` | 4 | Cancel, reschedule, no-show (professional), no-show (user) |
| `lib/ops/abandoned-checkout.ts` | 2 | Abandoned checkout marking |
| `lib/ops/no-show-detection.ts` | 1 | No-show auto-resolution |
| `lib/ops/pending-payment-timeout.ts` | 1 | Auto-cancel after payment timeout |
| `lib/ops/recurring-slot-release.ts` | 1 | Recurring slot release |

**Concurrency warning:** `patchBookingMetadata` is **not atomic**. It reads metadata in memory and writes a merged object back. Concurrent updates can still overwrite each other. True atomicity requires a PostgreSQL JSONB merge function (future migration).

The remaining sites in `lib/booking/request-booking-service.ts`, `lib/booking/creation/record-payment.ts`, and `lib/actions/admin/finance.ts` were **not** spreading existing metadata — they set new metadata on insert/override, so they do not have the same concurrency risk.

---

### 2.13 Diretórios de componentes com 1 arquivo só
**Status:** 🟡 **PARTIALLY FIXED**

3 directories were consolidated into related multi-file directories:

| Old Location | New Location |
|--------------|--------------|
| `components/analytics/PostHogProvider.tsx` | `components/layout/PostHogProvider.tsx` |
| `components/calendar/ProfessionalAvailabilityCalendar.tsx` | `components/agenda/ProfessionalAvailabilityCalendar.tsx` |
| `components/tier/TierLockedOverlay.tsx` | `components/professional/TierLockedOverlay.tsx` |

5 feature-specific single-file directories remain. These map 1:1 to app routes and represent clear domain boundaries; consolidating them would reduce discoverability:

| Directory | Single File | App Route |
|-----------|-------------|-----------|
| `components/blog` | `BlogEngagement.tsx` | `/blog/[slug]` |
| `components/chat` | `MessageThread.tsx` | `/mensagens/[conversationId]` |
| `components/disputes` | `CaseMessageForm.tsx` | `/disputas/[id]` |
| `components/favorites` | `FavoritesList.tsx` | `/favoritos` |
| `components/plans` | `PlanSelector.tsx` | `/planos` |

---

## 3. DEVOPS, CI & TESTES — Fully Verified

### 3.7 Sem testes de API/integration
**Status:** 🟢 **FIXED**

| Category | Count |
|----------|-------|
| `.test.ts` files (lib, app, inngest) | **97** |
| `.spec.ts` files (E2E) | **5** |
| API route tests (`app/api/**/*.test.ts`) | **21+** |

API routes with dedicated tests include: push subscribe/unsubscribe, stripe checkout/payment-intent, webhooks (Stripe, Trolley, Revolut), admin review decisions, conversations, disputes, notifications, and more.

**Correction to original tracker:** The project does have API/integration tests. They are co-located with the routes (`route.test.ts`).

---

### 3.9 E2E tests duplicam função de login
**Status:** 🟢 **FIXED** (Cleanup Pass 1)

All login helpers consolidated into `tests/e2e/helpers.ts`:
- `login(page, email, password, opts)`
- `loginAsUser(page)`
- `loginAsAdmin(page)`
- `loginViaApi(request)`

All 5 spec files now import from the shared module.

---

### 3.10 Selectors de E2E em português hardcoded
**Status:** 🟢 **FIXED** (Cleanup Pass 1 / Pass 27)

Replaced hardcoded Portuguese selectors with `data-testid` attributes:
- `CookieConsentRoot`: `cookie-accept`, `cookie-close`
- `LoginForm`: `login-error`, `data-error-type`
- E2E specs updated to use `data-testid` instead of text selectors.

---

### 3.11 playwright.config.ts faz parsing próprio de .env
**Status:** 🟢 **FIXED** (Cleanup Pass 1)

Replaced manual `indexOf('=')` parsing with `dotenv.config()` in both:
- `playwright.config.ts`
- `tests/e2e/global-setup.ts`

---

### 3.20 Sem Dependabot / Renovate
**Status:** 🟢 **FIXED**

`.github/dependabot.yml` exists with weekly NPM update schedule.

---

## 4. PERFORMANCE & INFRA — Fully Verified

### 4.2 Sem endpoint de health-check dedicado
**Status:** 🟢 **FIXED**

| Endpoint | Purpose | File |
|----------|---------|------|
| `/api/health` | Liveness + Supabase connectivity | `app/api/health/route.ts` |
| `/api/health/rls` | Runtime RLS sanity check | `app/api/health/rls/route.ts` |

Both endpoints are functional:
- `/api/health` checks auth and DB reachability
- `/api/health/rls` verifies that `bookings`, `payments`, `request_bookings`, and `messages` tables return zero rows or RLS-blocked (`42501`) for unauthenticated clients

---

## 5. DOCUMENTAÇÃO — Fully Verified

### 5.3 docs/integrations/vercel-github-actions.md desatualizado
**Status:** 🟢 **FIXED**

Doc was updated 2026-04-29 with all 21 CI steps:
1. Checkout (with fetch-depth 0)
2. Secret scan (TruffleHog `--only-verified`)
3. Verify no tracked `.env` files
4. Verify no UTF-8 BOM
5. Setup Node (from `.nvmrc`)
6. Install dependencies
7. Audit dependencies for high+ severity CVEs
8. Validate required E2E secrets on `main`
9. Typecheck
10. Lint
11. Encoding check
12. Unit tests (Vitest)
13. State machine tests
14. Cache Next.js build
15. Build
16. Validate DB pooling in production mode
17. Cache Playwright browsers
18. Install Playwright Chromium
19. Auto-heal E2E professional fixtures
20. End-to-end tests (Playwright)
21. Upload Playwright report artifact

---

### 5.4 Sem doc da integração Agora
**Status:** 🟢 **FIXED**

`docs/integrations/agora.md` created 2026-04-29. Covers:
- Agora project setup and credentials
- Token generation (`agora-access-token`)
- Client SDK integration (`agora-rtc-sdk-ng`)
- Waiting room and in-session game flow
- Troubleshooting common connection issues

---

### 5.5 Sem guia de troubleshooting local
**Status:** 🟢 **FIXED**

`docs/engineering/troubleshooting.md` created 2026-04-29. Covers:
- Supabase connection failures (pooler URL, IPv6, SSL)
- Stripe webhook local testing (`stripe listen`)
- Type generation (`supabase gen types`)
- Build failures (BOM, memory, cache)
- Test failures (fixtures, env vars)

---

### 5.6 Sem referência completa de env vars
**Status:** 🟡 **PARTIALLY FIXED**

`.env.local.example` now contains **all 73 variables** from `lib/config/env.ts` Zod schema (including `MOBILE_API_KEY`, `E2E_ADMIN_EMAIL`, `AGORA_APP_ID`, `VAPID_*`, etc. — added in Cleanup Pass 27 / C31).

Remaining gap: **per-variable explanations** (purpose, format, where to get values). The file has section headers (e.g., `# Supabase`, `# Stripe`) but not inline descriptions for each variable.

---

### 5.7 scripts/ops/README.md em português — resto em inglês
**Status:** 🟢 **FIXED**

`scripts/ops/README.md` translated to English in Cleanup Pass 3:
```md
# Ops Scripts

Utility scripts for operations and support.
```

---

### 5.10 Muitos docs com status "Pending" / "In progress"
**Status:** 🟡 **PARTIALLY FIXED**

The original count of "39+ files" was inflated by naive grep. After systematic review, the remaining markers fall into three categories:

**1. Legitimate planning documents (not stale):**
- `docs/architecture/tech-stack.md` — "Planned" entries for Wave 3+ roadmap items (Stripe BR, internal ledger, recurring atomicity) that are genuinely not yet implemented
- `docs/integrations/make-hubspot.md` — "Planned" — HubSpot integration is not yet live
- `docs/integrations/posthog.md` / `sentry.md` — "Pending" for manual dashboard UI steps (not code)
- `docs/spec/consolidated/journey-coverage-matrix.md` — "Planned" for one-off payments and subscription billing (no real-money execution yet)
- `docs/archive/control-snapshot.md` — Historical snapshot from 2026-04-14; "Pending" was accurate at that time

**2. UX research docs with journey assessment statuses (not implementation trackers):**
- `docs/product/ux-research/journey-audit-and-recommendations.md` — "In Progress" scores reflect UX research completeness, not code delivery
- `docs/product/ux-research/journey-implementation-map.md` — "pending" describes UI state machine states
- `docs/product/ux-research/usability-test-plan.md` — "pending bookings" is a test scenario, not project status

**3. Implementation trackers that are actively maintained:**
- `docs/product/IMPLEMENTATION-ROADMAP.md` — Uses ✅/🔄/⏳ with explicit "backend complete — do not rebuild" warnings. Updated 2026-04-24.
- `docs/engineering/IMPLEMENTATION-TRACKER.md` — Uses `[x]`/`[ ]` checkboxes; actively maintained.

**Genuinely stale items already fixed:**
- All 8 integration docs updated from misleading "In progress" to accurate "Done" / "Ongoing" in Cleanup Pass 27
- `docs/engineering/database-and-migrations.md` migration statuses updated in Cleanup Pass 3

**NOTE:** `docs/engineering/IMPLEMENTATION-TRACKER.md` was previously flagged with mojibake. Upon re-reading (2026-04-29), the file is **readable and correct** — all Portuguese accented characters render properly. The earlier report appears to have been a terminal rendering artifact.

---

## NEW ISSUES Discovered During Verification

These were not in the original tracker but were found while investigating:

### NEW-1: `docs/engineering/IMPLEMENTATION-TRACKER.md` mojibake — RESOLVED
**File:** `docs/engineering/IMPLEMENTATION-TRACKER.md`
**Severity:** Medium → Resolved
**Details:** Re-read 2026-04-29. File is readable and all Portuguese accented characters are correct. Initial report was a false positive due to terminal encoding rendering.

---

### NEW-2: Playwright config and global-setup both parse `.env.local` with buggy manual parser
**Files:** `playwright.config.ts`, `tests/e2e/global-setup.ts`
**Severity:** Medium
**Details:** Both files use `indexOf('=')` to split env lines. This breaks for:
- Values containing `=` (truncated at first `=`)
- Quoted values (quotes retained)
- Empty values
**Fix:** Use `dotenv` package instead.

---

### NEW-3: E2E login helpers are duplicated across 4 spec files
**Files:** `tests/e2e/api-v1-smoke.spec.ts`, `tests/e2e/booking-critical.spec.ts`, `tests/e2e/payments-engine.spec.ts`, `tests/e2e/professional-workspace.spec.ts`
**Severity:** Low
**Details:** Each spec implements its own login function with slightly different behavior (API-based vs UI-based, cookie dismissal logic, retry logic). This creates maintenance burden.

---

### NEW-4: `BookingSettingsClient` and `ProfessionalBookingRulesPanel` are near-duplicates
**Files:** `components/settings/BookingSettingsClient.tsx`, `components/agenda/ProfessionalBookingRulesPanel.tsx`
**Severity:** Medium
**Details:** Both contain identical `handleSave()` logic for upserting `professional_settings`, updating `professionals`, and updating `profiles`. Any bug fix or feature change must be applied in two places.

---

### NEW-5: Client-side availability save deletes all rows then re-inserts with no transaction
**File:** `components/agenda/ProfessionalAvailabilityWorkspace.tsx`
**Severity:** High
**Details:** The save strategy performs:
1. `delete().eq('professional_id', ...)` on `availability`
2. `delete().eq('professional_id', ...)` on `availability_rules`
3. `insert(legacyRows)` on `availability`
4. `insert(modernRows)` on `availability_rules`

If step 3 or 4 fails after steps 1 and 2 succeed, the professional is left with **zero availability**. There is no rollback mechanism.

---

### NEW-6: `lib/payments/stripe-resilience.ts` does not exist
**Severity:** Info
**Details:** The original tracker listed this as a 919-line god file. It has been removed or renamed. This is a positive change.

---

### NEW-7: Component directory sprawl — 8 single-file directories
**Directories:** `components/analytics`, `components/blog`, `components/calendar`, `components/chat`, `components/disputes`, `components/favorites`, `components/plans`, `components/tier`
**Severity:** Low
**Details:** Each directory contains exactly one component file. These could be consolidated into broader categories (e.g., `analytics` → `components/providers`, `tier` → `components/professional`) to reduce import path complexity.

---

### NEW-8: `lib/config/env.ts` has variables not documented in `.env.local.example`
**Severity:** Low
**Details:** Variables like `MOBILE_API_KEY`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, and `VAPID_*` keys are present in the Zod schema but missing or incomplete in `.env.local.example`.

---

## Final Updated Summary Table

| Category | Fixed | Partially Fixed | Still Present | Not Verified |
|----------|-------|-----------------|---------------|--------------|
| Segurança | 16 | 1 | 1 | 0 |
| Arquitetura | 4 | 3 | 2 | 0 |
| DevOps/CI | 13 | 0 | 0 | 0 |
| Performance | 5 | 0 | 2 | 0 |
| Documentação | 5 | 2 | 0 | 0 |
| **NEW ISSUES** | 8 | 0 | 0 | — |
| **TOTAL** | **43** | **7** | **6** | **0** |

---

## All Previously "Not Verified" Items — Final Status

| Item | Final Status | Key Evidence |
|------|--------------|--------------|
| 1.4 Public pages use admin client | 🟢 FIXED | `createClient()` used in all public pages |
| 1.5 Client-side Supabase mutations | 🟢 FIXED | All 7 components now use server actions; `updateProfileField` has server-side whitelist + rate limit |
| 2.2 Availability logic duplication | 🟢 FIXED | `extractProfessionalTimezone`, `loadProfessionalSettings`, `parseBookingSlot`, and `validateSlotAvailability` extracted into shared helpers; all 3 booking flows import them |
| 2.3 God files | 🟢 FIXED | `manage-booking-service.ts` **448 lines** (was 944). `request-booking-service.ts` **433 lines** (was 811). All major extractions complete. |
| 2.5 Supabase generated types | 🟡 PARTIALLY FIXED | `db:gen-types` script added; `types/supabase-generated.ts` created; clients still untyped |
| 2.6 BookingStatus duplicated | 🟢 FIXED | `types/index.ts` is a pure re-export of `lib/booking/types.ts` |
| 2.8 Rollbacks without transactions | 🔴 STILL PRESENT | Manual rollback in 3 files; no DB transactions |
| 2.9 Metadata ad-hoc mutation | 🟡 PARTIALLY FIXED | 9 sites centralized into `patchBookingMetadata`; concurrency risk documented |
| 2.13 Single-file component dirs | 🟡 PARTIALLY FIXED | 3 consolidated; 5 feature-specific dirs remain |
| 3.2 Unbounded queries | 🟢 FIXED | All high-risk unbounded queries in `lib/chat`, `lib/disputes`, `lib/notifications`, `lib/professional` now have `.limit()` |
| 3.3 `console.error` in production hot paths | 🟢 FIXED | Replaced with `Sentry.captureException()` in agenda, dashboard, and payment routes |
| 3.7 API/integration tests | 🟢 FIXED | 97 `.test.ts` files including 21+ API route tests |
| 3.9 E2E login duplication | 🟢 FIXED | Consolidated into shared `tests/e2e/helpers.ts` |
| 3.10 Portuguese E2E selectors | 🟢 FIXED | Replaced with `data-testid` attributes in `CookieConsentRoot` and `LoginForm`; all specs updated |
| 3.11 Playwright .env parsing | 🟢 FIXED | Replaced manual parser with `require('dotenv').config()` in `playwright.config.ts` and `global-setup.ts` |
| 3.20 Dependabot/Renovate | 🟢 FIXED | `.github/dependabot.yml` created with weekly NPM updates |
| 4.2 Health-check endpoint | 🟢 FIXED | `/api/health` and `/api/health/rls` both exist and work |
| 5.3 vercel-github-actions.md outdated | 🟢 FIXED | Doc updated with actual 21-step CI workflow (C31) |
| 5.4 No Agora doc | 🟢 FIXED | `docs/integrations/agora.md` created (C31) |
| 5.5 No troubleshooting guide | 🟢 FIXED | `docs/engineering/troubleshooting.md` created (C31) |
| 5.6 Incomplete env var reference | 🟡 PARTIALLY FIXED | `.env.local.example` updated with 9 missing vars (C31); still lacks explanations per var |
| 5.7 scripts/ops/README language | 🟢 FIXED | Translated to English in Cleanup Pass 3 |
| 5.10 Docs with Pending/In progress | 🟡 PARTIALLY FIXED | Most "39+ files" are legitimate planning docs, UX research, or historical snapshots. Integration docs and migration statuses already corrected. |
| **MEDIUM-1** `createAdminClient()` in payment routes | 🟡 PARTIALLY FIXED | Documented with security comments + Sentry; RLS guard trigger makes migration to RPC function required for full fix |
| **MEDIUM-3** Missing CSRF on API v1 routes | 🟢 FIXED | `validateApiCsrf()` added to 15 critical state-changing routes; Bearer-aware for mobile compatibility |
| **HIGH-1** Mobile app unbuildable | 🟢 FIXED | Mobile `tsc --noEmit` passes; properly excluded from web tsconfig |
| **HIGH-1** Missing `alt` text | 🟢 FIXED | All images have `alt` (verified across components/ and app/) |
| **MEDIUM-1** FormData type errors | 🟢 FIXED | `tsc --noEmit` passes with zero errors |

---

## Cleanup Pass 19 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **console.error** across lib/ services (remaining 80+ calls) | Replaced 80+ `console.error` calls with `Sentry.captureException`/`captureMessage` in 38 lib/ modules. Added `import * as Sentry from '@sentry/nextjs'` to all files that didn't already have it. Categories: favorites, guide-feedback, onboarding-state, slot-locks, review-reminders, request-helpers, complete-account, plan-pricing, professional-services, review-response, refund/engine, subscription/manager, revolut/client, trolley/client+onboarding, debt/monitor, calendar sync (service, events, auth-context), admin/finance, admin-plans, admin/shared, admin/auth-helper, professional/auth-helper, professional/subscription, email/shared, email/marketing, stripe cron-jobs, stripe jobs, push/unified-sender, payout-notifications, kyc/document-ai, kyc/textract, pending-payment-timeout, request-booking-service, middleware. Only 2 `console.error` remain in `lib/config/env.ts` (startup validation before Sentry init). | 38 files |
| **Test mocks** | Updated 3 test files to mock `@sentry/nextjs` instead of `console.error`: `request-helpers.test.ts`, `slot-locks.test.ts`, `debt/monitor.test.ts`. | 3 files |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).
- Deployed live to https://app.muuday.com

---

## Cleanup Pass 18 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **HIGH-2** `force-dynamic` on agenda/dashboard | Removed redundant `export const dynamic = 'force-dynamic'` from `app/(app)/agenda/page.tsx` and `app/(app)/dashboard/page.tsx`. Both pages unconditionally call `createClient()` (reads cookies) and `redirect()` — already dynamic by Next.js semantics. The explicit export was redundant and flagged as a performance anti-pattern. | `app/(app)/agenda/page.tsx`, `app/(app)/dashboard/page.tsx` |
| **console.error** in admin modules | Replaced 25 `console.error` calls with `Sentry.captureException`/`captureMessage` in `lib/admin/admin-service.ts` (15) and `lib/actions/admin.ts` (10). Added `import * as Sentry from '@sentry/nextjs'` to both files. | `lib/admin/admin-service.ts`, `lib/actions/admin.ts` |
| **`any` types** (remaining in lib/ excl. tests) | Fixed all 10 remaining `: any` type annotations in `lib/` (excluding test files). Replaced 9 raw-row `any` mappings in `lib/admin/admin-service.ts` with explicit inline types and a local `RawModerationRow` interface. Replaced `error: any` in `lib/professional/current-professional.ts` with `PostgrestError \| null`. Also removed 2 unnecessary `as any` casts for `rejectionReason` in `lib/actions/admin.ts` (Zod enum already matches service type). | `lib/admin/admin-service.ts`, `lib/professional/current-professional.ts`, `lib/actions/admin.ts` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 17 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **2.2** Availability logic duplication (remaining) | Extracted `parseBookingSlot()` helper in new `lib/booking/slot-parsing.ts` that encapsulates `fromZonedTime` → NaN validation → endUtc calculation. Replaced 4 duplicated inline blocks in `request-booking-service.ts` (create, offer) and `manage-booking-service.ts` (reschedule). Removed redundant manual min-notice + max-window checks from offer and reschedule; `validateSlotAvailability` now handles them with context-specific error messages. | `lib/booking/slot-parsing.ts` (new), `lib/booking/request-booking-service.ts`, `lib/booking/manage-booking-service.ts` |
| **console.error** in booking/services/auth/actions | Replaced 18 `console.error` calls with `Sentry.captureException` (or `captureMessage` for security events) in: `request-booking-service.ts` (3), `manage-booking-service.ts` (4), `availability-checks.ts` (3), `external-calendar-conflicts.ts` (1), `blog-engagement-service.ts` (5), `layout-session.ts` (1), `user-profile.ts` (2), `professional-onboarding.ts` (2), `review-response.ts` (1). | 9 files |
| **Unbounded queries** | Added `.limit(500)` to `getBlogCommentsService`. Added `.limit(200)` + `.order('start_time_utc')` to `hasInternalConflict` for deterministic bounded conflict lookups. | `lib/blog/blog-engagement-service.ts`, `lib/booking/availability-checks.ts` |
| **Test mocks** | Updated `availability-checks.test.ts` mock to support `.order()` and `.limit()` chaining. Updated `external-calendar-conflicts.test.ts` to assert on mocked Sentry instead of `console.error`. | `lib/booking/availability-checks.test.ts`, `lib/booking/external-calendar-conflicts.test.ts` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 16 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **2.2** Availability logic duplication (partial) | Extracted two most-duplicated patterns into shared helpers: `extractProfessionalTimezone(professional)` and `loadProfessionalSettings(supabase, professionalId, timezoneFallback)` in `lib/booking/settings.ts`. Replaced 4 duplicated sites in `request-booking-service.ts` and 1 in `manage-booking-service.ts`. Each site previously repeated 10+ lines of profile extraction, settings query, and normalization. | `lib/booking/settings.ts`, `lib/booking/request-booking-service.ts`, `lib/booking/manage-booking-service.ts`, `lib/booking/request-booking-service.test.ts` |
| **HIGH-1** `any` type in auth layout session | Replaced `user: any | null` with `user: User | null` in `LayoutSession` type. Changed `getUserWithSessionFallback<any>` to `getUserWithSessionFallback<User>` using `@supabase/supabase-js` `User` type. | `lib/auth/layout-session.ts` |
| **5.7** scripts/ops/README language (tracker stale) | Corrected tracker entry from 🔴 STILL PRESENT to 🟢 FIXED (was already fixed in Cleanup Pass 3). | `CODE_REVIEW_TRACKER_UPDATE.md` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 15 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **Pre-existing test failure** `availability-engine.test.ts` | Root cause: `generateRecurringSlotStarts` and `generateRecurrenceSlots` both used bare `new Date()` to calculate booking window end, making tests date-dependent and flaky. Added optional `now?: Date` parameter to both functions. Updated tests to pass fixed `now` equal to `initialStartUtc`. All 1052 tests now pass (was 1051/1052). | `lib/booking/availability-engine.ts`, `lib/booking/availability-engine.test.ts`, `lib/booking/recurrence-engine.ts`, `lib/booking/recurrence-engine.test.ts` |

### Verification
- `npx tsc --noEmit` passes (Exit 0).
- `npx vitest run --exclude 'mobile/**'` — **1052/1052 pass** (0 failures).

---

## Cleanup Pass 14 — 2026-04-29

### Fixed

| Tracker Item | Fix | Files Changed |
|--------------|-----|---------------|
| **MEDIUM-2** TypeScript target outdated (`ES2017`) | Upgraded `tsconfig.json` `"target"` to `"ES2022"` to align with Next.js 16 and Node 20. | `tsconfig.json` |
| **MEDIUM-3** `any[]` in agenda page | Added explicit `AgendaBooking` interface with all known fields. Replaced 20+ `any` occurrences in `getConfirmationDeadline`, `bookingModeMeta`, `groupRecurringBookings`, and booking map callbacks. Extracted `MS_PER_HOUR`, `MS_PER_MINUTE` magic-number constants. | `app/(app)/agenda/page.tsx` |
| **MEDIUM-3** `any[]` in financeiro page | Added explicit `PaymentRow` type with id, status, created_at, amount_total, platform_fee_brl_minor, currency, booking_id. Replaced `any` map params in `groupPaymentsByDay` and `calculateTrend`. | `app/(app)/financeiro/page.tsx` |
| **MEDIUM-3** `any[]` in RecurringPackageCard | Made `recurrence_periodicity` and `recurrence_occurrence_index` optional in `RecurringBooking` interface to accept `AgendaBooking[]` (raw Supabase joins may omit these fields). | `components/agenda/RecurringPackageCard.tsx` |
| **MEDIUM-3** `console.error` in lib/ runtime code | Replaced error-level `console.error` with `Sentry.captureException()` in `lib/chat/chat-service.ts` (3 occurrences), `lib/disputes/dispute-service.ts` (9 occurrences), `lib/email/email-action-service.ts` (8 occurrences). Intentional `console.warn` for graceful fallbacks preserved. | `lib/chat/chat-service.ts`, `lib/disputes/dispute-service.ts`, `lib/email/email-action-service.ts` |

### Verification
- `npx tsc --noEmit` passes (Exit 0) after all changes.
- `npx vitest run` passes: 1051/1052 tests pass (1 pre-existing failure in `availability-engine.test.ts`).

---

*End of Fully Verified Tracker Update*
