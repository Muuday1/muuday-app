# Muuday App — Deep Code Review & Diagnosis Report

**Generated:** 2026-04-29
**Scope:** Full codebase (web + mobile)
**Rules:** Read-only audit. No code was modified.

> **Post-Audit Cleanup — 2026-04-29**
>
> The following issues from this report have been addressed in cleanup passes:
> - **HIGH-1 Mobile app unbuildable** → Fixed. Mobile `tsc --noEmit` passes cleanly.
> - **HIGH-1 Heavy Server Components without Suspense** → Partially mitigated. Console errors removed.
> - **HIGH-2 `force-dynamic`** → Still present; requires `unstable_cache` migration.
> - **MEDIUM-1 FormData type errors** → Fixed. TypeScript compiles with zero errors.
> - **MEDIUM-1 `createAdminClient()` in payment routes** → Documented with security comments + Sentry. Migration to RPC function tracked.
> - **MEDIUM-2 Missing role check** → Fixed. `profissional` role guard added to `/api/v1/professionals/me`.
> - **MEDIUM-3 Missing CSRF** → Fixed. `validateApiCsrf()` added to 15 critical API v1 routes.
> - **MEDIUM-4 Missing Zod validation** → Fixed. `professionalSchema`/`professionalDraftSchema` added.
> - **MEDIUM-5 Admin route lacks validation** → Fixed. `professionalStatusSchema` added.
> - **MEDIUM-6 Calendar callback redirect validation** → Fixed. Whitelist-based `safeRedirectPath` replaces permissive prefix check.
> - **MEDIUM-2 Unbounded queries** → Fixed. `.limit()` added to all high-risk queries.
> - **MEDIUM-3 `console.error` in hot paths** → Fixed. Replaced with `Sentry.captureException()`.
> - **MEDIUM-4 Middleware SESSION_CACHE unbounded** → Fixed. LRU eviction by `lastAccessedAt` added.
> - **MEDIUM-1 Hydration mismatch on legal pages** → Fixed. Static dates replace dynamic `new Date()`.
> - **HIGH-1 Missing `alt` attributes** → Verified. All images already have `alt` text.
> - **UX MEDIUM-1 `suppressHydrationWarning`** → Fixed. Removed from legal pages.
> - **LOW-2 Empty catch blocks** → Fixed. Critical API routes and booking payment prep now log to Sentry.
> - **LOW-2 Heavy Third-Party Scripts Without Preconnect** → Fixed. Added `<link rel="preconnect">` + `<link rel="dns-prefetch">` for PostHog, Vercel Insights, and Sentry ingestion origins in `app/layout.tsx`.
> - **LOW-1 Inconsistent Error Page Coverage** → Partially fixed. Added `loading.tsx` + `error.tsx` to `app/(app)/admin/planos/` and `app/(app)/onboarding-profissional/`.
> - **MEDIUM-1 `middleware.ts` missing at root** → Fixed. `proxy.ts` was incorrectly named; renamed back to `middleware.ts` so Next.js actually executes it. Restores CSP nonces, CORS, mobile API key validation, session caching, and role-based redirects.
>
> - **MEDIUM-2 TypeScript target outdated** → Fixed. Upgraded to `ES2022`.
> - **MEDIUM-3 `any[]` in agenda/financeiro pages** → Fixed. Added explicit `AgendaBooking` and `PaymentRow` interfaces; extracted magic-number constants.
> - **MEDIUM-3 `console.error` in lib/ services** → Fixed. Replaced 20 occurrences across `chat-service.ts`, `dispute-service.ts`, `email-action-service.ts` with `Sentry.captureException()`.
>
> - **Pre-existing test failure in availability-engine.test.ts** → Fixed. Added `now?: Date` parameter to `generateRecurringSlotStarts` and `generateRecurrenceSlots` to eliminate date-dependent test flakiness. All 1052 tests now pass.
> - **2.2 Availability logic duplication** → Fixed. Extracted `extractProfessionalTimezone()` and `loadProfessionalSettings()` (Pass 16), then `parseBookingSlot()` (Pass 17). All duplicated `fromZonedTime` + NaN + window check patterns are now centralized. Offer and reschedule paths now delegate min-notice + max-window to `validateSlotAvailability` instead of checking manually.
> - **`any` in app/ directory** → Fixed. Zero TypeScript `any` types remain in `app/` (verified with regex search). `lib/auth/layout-session.ts` `user: any` also fixed.
> - **console.error in lib/ services** → Fixed (Pass 17). Replaced 18 `console.error` calls in booking, availability, auth, blog, and action modules with `Sentry.captureException`.
> - **Unbounded queries** → Fixed (Pass 17). Added `.limit(500)` to blog comments and `.limit(200)` to internal conflict detection.
> - **`force-dynamic`** → Fixed (Pass 18). Removed redundant `export const dynamic = 'force-dynamic'` from `agenda/page.tsx` and `dashboard/page.tsx` — both pages are already dynamic via `createClient()` + `redirect()`.
> - **`any` types in lib/ (excl. tests)** → Fixed (Pass 18). Replaced all 10 remaining `: any` annotations with explicit types. Removed 2 unnecessary `as any` casts in admin actions.
> - **console.error in admin modules** → Fixed (Pass 18). Replaced 25 `console.error` calls in `lib/admin/admin-service.ts` and `lib/actions/admin.ts` with `Sentry.captureException`.
>
> Remaining open issues: god files (2.3), DB transactions (2.8 — fallback paths fully instrumented, true fix requires RPC migration), Supabase typed clients (2.5), `any` types in test files, mega-components.

---

## Executive Summary

| Category | Critical | High | Medium | Low | Info |
|----------|----------|------|--------|-----|------|
| Build / Type Safety | 0 | 1 | 2 | 0 | 1 |
| Security | 0 | 0 | 6 | 2 | 3 |
| Performance | 0 | 2 | 4 | 3 | 2 |
| Code Quality | 0 | 1 | 4 | 5 | 3 |
| UX / Accessibility | 0 | 1 | 3 | 4 | 2 |
| App Structure / Consistency | 0 | 0 | 3 | 4 | 3 |
| Mobile App | 0 | 2 | 1 | 0 | 0 |
| **TOTAL** | **0** | **7** | **23** | **18** | **14** |

**Verdict:** The codebase is structurally sound with good security hygiene (webhooks verified, CSP nonces, rate limiting, no hardcoded secrets). However, it has **significant TypeScript/build issues**, **performance anti-patterns in data fetching**, **a completely broken mobile app**, and **notable UX/accessibility gaps**.

---

## 1. Build & Type Safety Issues

### 🔴 HIGH-1: Mobile App Is Completely Unbuildable
**Files:** `mobile/app/**/*.tsx`, `mobile/components/**/*.tsx`, `mobile/hooks/**/*.ts`
**Count:** 32+ TypeScript errors

The mobile app (React Native / Expo) has **systematically broken module resolution**. Every page references modules that do not exist in the mobile tree:

- `@/hooks/useBookings` → **missing**
- `@/hooks/useSearchProfessionals` → **missing**
- `@/components/professional/ProfessionalCard` → **missing**
- `@/components/AuthProvider` → **missing**
- `@/lib/query-client` → **missing**
- `@/lib/api` → **missing**
- `@/lib/booking/slots` → **missing**
- `@/hooks/useAvailability` → **missing**
- `@/hooks/useCreateBooking` → **missing**

**Impact:** The mobile app cannot compile and appears to be in a abandoned/stub state. It imports from paths that only exist in the Next.js web app.

**Fix:** Either remove the mobile directory from the build, create a proper mobile monorepo with shared packages, or restore the missing mobile-specific modules.

---

### 🟡 MEDIUM-1: FormData Type Errors in API Routes
**Files:**
- `app/api/professional/credentials/upload/route.ts:104,127,128`
- `app/api/professional/profile-media/upload/route.ts:60`

**Error:** `Property 'get' does not exist on type 'FormData'`

**Root Cause:** The TypeScript `lib` in `tsconfig.json` includes `dom.iterable` but the Node.js `FormData` global (from `undici` in Node 18+) does not have full DOM `FormData` typings. The code works at runtime but fails typecheck.

**Fix:** Cast `formData` to `FormData & { get(name: string): FormDataEntryValue | null }` or use a typed helper.

---

### 🟡 MEDIUM-2: TypeScript Target Is Outdated
**File:** `tsconfig.json:29`

`"target": "ES2017"` with Next.js 16 and Node 20 is conservative. This prevents using modern JS features and may bloat bundles with unnecessary transpilation.

**Recommendation:** Upgrade to `"target": "ES2022"` or `"ESNext"`.

---

### 🟢 INFO-1: Build/Lint Could Not Run in Environment
The npm PowerShell execution policy blocked `npm run build` and `npm run lint`. TypeScript typecheck (`tsc --noEmit`) was run directly and returned ~40 errors. A local dev machine should verify `npm run build` passes after fixes.

---

## 2. Security Findings

### 🟡 MEDIUM-1: `createAdminClient()` in User-Facing Payment Routes
**Files:**
- `app/api/v1/payments/payment-intent/route.ts:172`
- `app/api/stripe/payment-intent/route.ts:195`
- `app/api/stripe/checkout-session/booking/route.ts:178`

These routes authenticate the user via RLS, perform authorization checks, but then use `createAdminClient()` to mutate payment rows. While authorization checks are present, any bug in those checks would expose payment data to modification. The AGENTS.md explicitly discourages this pattern in user-facing code.

**Fix:** Migrate payment state updates to RLS-allowed operations (database functions/triggers) or edge functions.

---

### 🟡 MEDIUM-2: Missing Role Check in Professional Profile Creation
**File:** `app/api/v1/professionals/me/route.ts:33-47`

Any authenticated user (including `usuario` role) can POST to `/api/v1/professionals/me` and create a professional profile. No role validation ensures the caller is a `profissional`.

**Fix:** Add a role check or gate this behind the onboarding flow.

---

### 🟡 MEDIUM-3: Missing CSRF Origin Validation on Most API Routes
**Files:** Most `/api/v1/*` POST/PATCH/PUT/DELETE routes

Only calendar sync routes call `validateCsrfOrigin()`. The extensive `/api/v1/*` surface does not apply origin/referer validation. While cookie-based auth + CORS provides baseline protection, same-origin cross-site requests could potentially invoke state-changing operations.

**Fix:** Add CSRF origin validation to critical state-changing `/api/v1/*` routes, or migrate mutations to Server Actions (which have built-in CSRF tokens).

---

### 🟡 MEDIUM-4: Missing Zod Validation in Professional Profile Endpoints
**File:** `app/api/v1/professionals/me/route.ts`

Body fields are coerced with `String()` / `Number()` instead of validated with Zod. This allows unexpected values (e.g., `sessionPriceBrl: -100`, `yearsExperience: Infinity`) to reach the database.

**Fix:** Add a Zod schema with sensible bounds.

---

### 🟡 MEDIUM-5: Admin Route Lacks Input Validation
**File:** `app/api/v1/admin/professionals/[id]/status/route.ts:39-41`

```ts
const { status, note } = body as { status: string; note?: string }
```

The `status` string is passed directly to the service layer without validation.

**Fix:** Add Zod schema validating `status` against an allowed enum.

---

### 🟡 MEDIUM-6: Calendar Callback Redirect Path Validation Is Weak
**File:** `app/api/professional/calendar/callback/[provider]/route.ts:22-25`

```ts
function safeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  return path
}
```

This allows any same-origin path. If the OAuth state signing is ever compromised, this becomes an open redirect.

**Fix:** Whitelist `redirectPath` to known safe paths.

---

### 🟢 LOW-1: `dangerouslySetInnerHTML` with Static Content
**File:** `app/ajuda/a/[slug]/page.tsx:62`

Content is sourced from `lib/help-data.ts` (hardcoded static HTML). Risk is low, but if ever changed to CMS-driven content, it becomes a stored XSS vector.

**Fix:** Add a comment warning or sanitize if moving to CMS.

---

### 🟢 LOW-2: Mobile API Key Validation Skips When Not Configured
**File:** `lib/api/mobile-api-key.ts:12-17`

If `MOBILE_API_KEY` is not set, validation is skipped entirely. Ensure production always has this configured.

---

### 🟢 INFO-1: No Hardcoded Secrets Found
Searches for API keys, tokens, and passwords returned only environment variable references. Good hygiene.

### 🟢 INFO-2: Webhook Security Is Correct
- Stripe webhooks verify signatures (`stripe.webhooks.constructEvent`)
- Trolley webhook verifies HMAC-SHA256 with `timingSafeEqual`
- Revolut webhook verifies JWT signature with `timingSafeEqual`
- Supabase DB webhook uses constant-time secret comparison

### 🟢 INFO-3: Cookie Settings Are Secure
`secure`, `sameSite: 'lax'`, `httpOnly` are all set correctly.

---

## 3. Performance Issues

### 🔴 HIGH-1: Heavy Server Components Without Suspense Boundaries
**Files:**
- `app/(app)/agenda/page.tsx` — **1,099 lines**, fetches 10+ queries, renders entire UI inline
- `app/(app)/dashboard/page.tsx` — **516 lines**, fetches 14 parallel queries but renders heavy inline JSX
- `app/(app)/profissional/[id]/page.tsx` — likely similar pattern

These pages are **mega-components** that do data fetching AND full UI rendering. They violate the Next.js App Router best practice of keeping Server Components lean and delegating UI to Client Components or nested Server Components.

**Impact:**
- Long TTFB (Time to First Byte) because the entire HTML is blocked on all queries + JSX rendering
- No incremental streaming (no `<Suspense>` around data-dependent sections)
- Hard to maintain and test

**Fix:** Extract UI sections into separate components. Wrap independent data sections in `<Suspense>`.

---

### 🔴 HIGH-2: `dynamic = 'force-dynamic'` on Heavily-Accessed Pages
**Files:**
- `app/(app)/agenda/page.tsx`
- `app/(app)/dashboard/page.tsx`

These are the most frequently accessed pages for professionals. `force-dynamic` disables all static optimization and caching. Every request re-executes all database queries.

**Impact:** High database load, poor scalability.

**Fix:** Remove `force-dynamic` where possible. Use `revalidate` or `unstable_cache` for data that doesn't change per request. Move user-specific mutations to client-side with optimistic UI.

---

### 🟡 MEDIUM-1: Sequential Awaits in Many Pages
**Files:** 38 `page.tsx` files have sequential `await` patterns

Examples found:
- `app/(app)/agenda/page.tsx`: profile query -> professional query -> expire query -> booking queries (not all parallelized)
- Many pages fetch profile, then fetch data dependent on profile sequentially

**Fix:** Use `Promise.all()` for independent queries. The dashboard page actually does this well — apply that pattern to agenda and other heavy pages.

---

### 🟡 MEDIUM-2: Unbounded `.select()` Without `.limit()`
**Files:** 75 files in `lib/` use `.select()`
**Files with `.limit()`:** Only 45 `.limit()` calls across 29 files

Many queries select without limits. While some use `count: 'exact, head: true`, others return full rows without bounding.

**High-risk files (no limit seen):**
- `lib/chat/chat-service.ts`
- `lib/notifications/notification-service.ts`
- `lib/disputes/dispute-service.ts`
- `lib/email/email-action-service.ts`
- `lib/professional/professional-profile-service.ts`

**Impact:** As tables grow, these queries will return increasingly large payloads, causing memory pressure and slow responses.

**Fix:** Add `.limit()` to all unbounded user-facing queries. Per AGENTS.md: user-facing lists 20-50, internal lookups 100-200.

---

### 🟡 MEDIUM-3: `console.error` in Production Hot Paths
**Files:**
- `app/(app)/agenda/page.tsx:190, 256-264` — 4 console.error calls on every agenda load
- `app/(app)/dashboard/page.tsx:228-247` — 11 console.error calls on every dashboard load

These log on every request even in production, adding I/O overhead and potentially leaking internal error details.

**Fix:** Use a structured logger (like Sentry) that respects log levels, or remove console logging from Server Components.

---

### 🟡 MEDIUM-4: Middleware Session Cache Grows Unbounded
**File:** `lib/supabase/middleware.ts:50-90`

The `SESSION_CACHE` Map has a `MAX_CACHE_SIZE` of 1000, but the cleanup only runs when the size exceeds 1000 and only removes expired entries. In high-traffic scenarios, this could retain memory for active entries indefinitely.

**Impact:** Potential memory leak in long-running processes (though Vercel functions are ephemeral, this matters for dev server and self-hosted scenarios).

**Fix:** Consider an LRU eviction policy instead of just expiry-based cleanup.

---

### 🟢 LOW-1: No Image Optimization for Some Assets
**File:** `lib/sanity/image-url.ts` uses Sanity's image URL builder but `next/image` is not used for Sanity images. The `next.config.js` only whitelists Supabase, Google, Unsplash, and ui-avatars.

**Fix:** Add Sanity CDN to `images.remotePatterns` and use `next/image` for Sanity images.

---

### 🟢 LOW-2: Heavy Third-Party Scripts Without Preconnect
**File:** `app/layout.tsx`

PostHog, Sentry, Vercel Analytics, and Speed Insights are loaded. No `<link rel="preconnect">` or `<link rel="dns-prefetch">` for their origins.

**Fix:** Add preconnect hints for known third-party origins.

---

### 🟢 LOW-3: Large Inline IIFE in Landing/Animation Components
**Files:** `components/landing/*.tsx`

Multiple landing page components contain complex animations with heavy JSX. These are loaded for all users even though only anonymous visitors see the landing page.

**Fix:** Consider dynamic imports (`next/dynamic`) for heavy landing components.

---

### 🟢 INFO-1: Good Parallel Query Pattern in Dashboard
**File:** `app/(app)/dashboard/page.tsx:132-226`

This page correctly uses `Promise.all()` for 14 independent queries. This is the canonical pattern to replicate.

### 🟢 INFO-2: Proper Use of `count: 'exact', head: true`
**File:** `app/(app)/dashboard/page.tsx`

Count queries use `head: true` to avoid fetching full rows. Good practice.

---

## 4. Code Quality Issues

### 🔴 HIGH-1: Excessive Use of `any` Types
**Count:** 377 occurrences in `lib/**/*.ts`, 80 occurrences in `app/**/*.tsx`

**Notable high-density files:**
- `app/(app)/agenda/page.tsx` — 24 `any` occurrences
- `app/(app)/financeiro/page.tsx` — 16 `any` occurrences
- `app/(app)/admin/casos/page.tsx` — 6 `any` occurrences
- `lib/payments/subscription/manager.test.ts` — 23 `any` occurrences
- `lib/payments/refund/engine.test.ts` — 24 `any` occurrences
- `lib/payments/debt/monitor.test.ts` — 20 `any` occurrences

**Impact:** `any` defeats TypeScript's type safety. It propagates silently, making refactors dangerous and bugs harder to catch.

**Fix:** Replace `any` with `unknown`, proper interfaces, or generated Supabase types. Start with the web app (`app/` directory) as the highest user-facing impact.

---

### 🟡 MEDIUM-1: IIFE in JSX for Complex Rendering
**File:** `app/(app)/agenda/page.tsx:845-982`

```tsx
{(() => {
  const { recurringGroups, oneOffBookings } = groupRecurringBookings(upcomingVisible)
  // ... 130 lines of JSX logic
})()}
```

IIFEs inside JSX are an anti-pattern. They prevent React from properly reconciling the subtree and make the code harder to read and test.

**Fix:** Extract to a separate component.

---

### 🟡 MEDIUM-2: Magic Numbers Everywhere
**Files:** Throughout `app/(app)/agenda/page.tsx` and `app/(app)/dashboard/page.tsx`

Examples:
- `60 * 60 * 1000` (ms in an hour) — repeated inline
- `24` (hours) — used without context
- `7 * 24 * 60 * 60 * 1000` (7 days in ms) — repeated inline
- `50` bookings limit, `20` past bookings limit, `30` request bookings limit

**Fix:** Extract to named constants.

---

### 🟡 MEDIUM-3: `Record<string, any>` as Pseudo-Types
**File:** `app/(app)/agenda/page.tsx:69, 110, 121, etc.`

Functions use `Record<string, any>` instead of proper typing:
```ts
function getConfirmationDeadline(booking: Record<string, any>): Date | null
function bookingModeMeta(booking: Record<string, any>) 
function groupRecurringBookings(bookings: any[])
```

**Fix:** Use generated Supabase types or explicit interfaces.

---

### 🟡 MEDIUM-4: Nested Ternary Anti-Pattern
**File:** `app/(app)/agenda/page.tsx:381-388`

```tsx
const rawConnectionStatus = String(calendarIntegrationResult.data?.connection_status || 'disconnected')
calendarIntegrationStatus =
  rawConnectionStatus === 'connected'
    ? 'connected'
    : rawConnectionStatus === 'pending'
      ? 'pending'
      : rawConnectionStatus === 'error'
        ? 'error'
        : 'disconnected'
```

This is 4-level nested ternary. Hard to read and maintain.

**Fix:** Use a lookup map or switch statement.

---

### 🟢 LOW-1: Console Logging in Production Code
**Count:** 344 `console.log|warn|error` occurrences in `.ts/.tsx` files

While some are in scripts/ops (acceptable), many are in `lib/` and `app/` runtime code. Examples:
- `lib/chat/chat-service.ts:34,51`
- `lib/disputes/dispute-service.ts:50,66,239,391,426,486,621,690`
- `lib/email/email-action-service.ts:63,69,95,108,121,143,150,665`

**Fix:** Replace with a structured logger or remove non-error logs.

---

### 🟢 LOW-2: Empty Catch Blocks
**Files:** Multiple

```ts
// app/api/professional/credentials/upload/route.ts:167
catch {
  return NextResponse.json({ error: 'Erro inesperado no upload.' }, { status: 500 })
}
```

While this returns a generic error, the caught error is not logged to Sentry or any observability tool.

**Fix:** Log unexpected errors to Sentry before returning generic messages.

---

### 🟢 LOW-3: `@ts-ignore` in Service Worker
**File:** `public/sw.js:16,30,35,45,75,88,103,107`

8 `@ts-ignore` comments in the service worker. These suppress legitimate type errors.

**Fix:** Either add proper typings for the service worker scope or migrate to a TypeScript service worker.

---

### 🟢 LOW-4: Inconsistent File Naming
The codebase mixes conventions:
- `kebab-case`: `app/(app)/editar-perfil/page.tsx`
- `camelCase`: `app/(app)/completar-perfil/page.tsx`
- `PascalCase`: components are mostly PascalCase (good)

Some directories use kebab-case, others camelCase. This is mostly consistent but a few outliers exist.

---

### 🟢 LOW-5: Inline Styles in Root Layout
**File:** `app/layout.tsx:72`

```tsx
className={`... bg-[#f6f8fb] ...`}
```

Using arbitrary Tailwind values in the root layout makes theming harder.

**Fix:** Use CSS variables or theme tokens.

---

### 🟢 INFO-1: No Hydration Mismatch Warnings Found
No `hydrat` related issues found in the codebase (other than 3 legal pages with `suppressHydrationWarning`).

### 🟢 INFO-2: Good Use of `use client` Extraction
**File:** `app/offline/ReloadButton.tsx`

Browser APIs are correctly extracted to a `'use client'` component. Good pattern.

### 🟢 INFO-3: Dead Code Not Significant
No large blocks of commented-out code were found in key files.

---

## 5. UX / Accessibility Issues

### 🔴 HIGH-1: Missing `alt` Attributes on Images
**Count:** Only 4 `alt=` occurrences across all components
**Files:**
- `components/admin/AdminProfessionalIdentityBadge.tsx`
- `components/dashboard/onboarding-tracker/stages/identity-stage.tsx`
- `components/landing/LandingPage.tsx` (2 occurrences)

**Impact:** Screen readers cannot describe images. This is an WCAG 2.1 violation.

**Fix:** Audit all `<img>` and `next/image` usage. Add descriptive `alt` text.

---

### 🟡 MEDIUM-1: `suppressHydrationWarning` on Legal Pages
**Files:**
- `app/termos-de-uso/page.tsx`
- `app/privacidade/page.tsx`
- `app/politica-de-cookies/page.tsx`

These pages suppress hydration warnings. This usually indicates a mismatch between server-rendered HTML and client hydration (often caused by dates, timestamps, or client-only content).

**Fix:** Identify the root cause of the hydration mismatch and fix it, rather than suppressing the warning.

---

### 🟡 MEDIUM-2: Low `aria-*` Coverage
**Count:** 118 `aria-` occurrences across 37 component files

While some interactive components have ARIA attributes, many form components, buttons, and navigation elements lack proper ARIA labeling.

**Fix:** Audit forms and interactive components for `aria-label`, `aria-describedby`, `role`, and focus management.

---

### 🟡 MEDIUM-3: No Focus Management in Modals/Drawers
**Files:** `components/search/MobileFiltersDrawer.tsx`, `components/auth/AuthOverlay.tsx`

No visible focus trap or focus restoration logic in modal/drawer components.

**Fix:** Implement focus trapping and `aria-modal` for all modals.

---

### 🟢 LOW-1: Inconsistent Error Page Coverage
**Stats:**
- 63 `page.tsx` files
- 14 `layout.tsx` files
- 22 `loading.tsx` files
- 23 `error.tsx` files

Not all routes have `loading.tsx` or `error.tsx`. For example:
- `app/(app)/configuracoes/notificacoes` — no loading, no error
- `app/(app)/admin/planos` — no loading, no error
- `app/(app)/onboarding-profissional` — no loading, no error

**Fix:** Add missing `loading.tsx` and `error.tsx` to all user-facing routes for better UX during slow loads and errors.

---

### 🟢 LOW-2: Form Submit Buttons Without Loading States
**File:** `app/(app)/layout.tsx:94-102`

The logout button is a plain `<button type="submit">` inside a form. No loading state or disabled state during submission.

**Fix:** Add `aria-busy` and visual loading state to async form actions.

---

### 🟢 LOW-3: No Skip Navigation Link
There is no "Skip to main content" link for keyboard users.

**Fix:** Add a visually hidden skip link as the first focusable element.

---

### 🟢 LOW-4: Color Contrast Risk
**File:** `app/(app)/layout.tsx:73-76`

The brand color `#9FE870` on white may not meet WCAG AA contrast requirements for small text.

**Fix:** Run a contrast audit on the brand palette.

---

### 🟢 INFO-1: Good Mobile Navigation
**File:** `app/(app)/layout.tsx`

The app has both desktop sidebar and mobile bottom navigation. Good responsive UX.

### 🟢 INFO-2: PWA Support
Service worker registration and install prompt are present.

---

## 6. App Structure & Consistency Issues

### 🟡 MEDIUM-1: Missing `middleware.ts` at Root
**Expected:** `middleware.ts` at project root
**Found:** `lib/supabase/middleware.ts` only

Next.js App Router expects `middleware.ts` at the root (or `src/middleware.ts`). If the middleware is imported elsewhere but not at the root, it may not run for all routes.

**Fix:** Verify that `lib/supabase/middleware.ts` is actually being invoked as Next.js middleware. If not, create a root `middleware.ts` that re-exports it.

---

### 🟡 MEDIUM-2: Route Group Inconsistency
**Issue:** `app/(app)` contains both authenticated and public pages.

- `app/(app)/buscar-auth/page.tsx` — public search for logged-in users
- `app/(app)/onboarding-profissional/page.tsx` — no layout wrapper for onboarding?

The `(app)` group is overloaded. It contains:
- Professional workspace (dashboard, agenda, financeiro)
- User flows (favoritos, mensagens, perfil)
- Admin (admin/*)
- Mixed auth pages

**Fix:** Consider splitting into `(professional)`, `(user)`, and `(admin)` route groups for clearer separation.

---

### 🟡 MEDIUM-3: Public Pages Mixed with App Pages
**Public marketing pages:** `app/blog/`, `app/guias/`, `app/sobre/`, `app/recursos/`
**These use:** Root layout with PostHog, analytics, etc.

But `app/registrar-profissional/` and `app/buscar/` are also public yet outside `(app)` and `(auth)`. This is slightly inconsistent.

---

### 🟢 LOW-1: `next.config.ts` Missing
**Found:** `next.config.js` (JS)
**Expected:** `next.config.ts` (TS) for a TypeScript project

Minor inconsistency.

---

### 🟢 LOW-2: Duplicate Query Logic
**Files:**
- `app/(app)/agenda/page.tsx` and `app/(app)/dashboard/page.tsx`

Both fetch upcoming bookings, professional settings, and availability rules with nearly identical queries.

**Fix:** Extract common queries to shared server actions or data functions.

---

### 🟢 LOW-3: Missing `not-found.tsx` in Some Subroutes
While `app/not-found.tsx` exists, some subroutes don't have local `not-found.tsx` files.

---

### 🟢 INFO-1: Good Error Boundary Coverage
23 `error.tsx` files across the app. Good pattern.

### 🟢 INFO-2: Good Loading State Coverage
22 `loading.tsx` files. Most major routes are covered.

### 🟢 INFO-3: Instrumentation Present
`instrumentation.ts` is present for env validation startup. Good.

---

## 7. Mobile App Issues

### 🔴 HIGH-1: Mobile App Cannot Compile
As detailed in Section 1, the mobile app has 32+ TypeScript errors from missing modules.

### 🔴 HIGH-2: Mobile App Imports from Web-Only Paths
The mobile app uses `@/` path aliases that resolve to the web app directories (e.g., `@/lib/api`, `@/hooks/useBookings`). These modules don't exist in the mobile tree.

**Impact:** The mobile app is non-functional.

**Fix:** The mobile directory needs to either:
1. Be removed if abandoned
2. Have its own `tsconfig.json` with proper path mapping
3. Have all missing modules created

---

### 🟡 MEDIUM-1: Mobile App Has No Tests
No test files found in the `mobile/` directory.

---

## 8. Specific File Deep Dives

### `app/(app)/agenda/page.tsx` — Mega-Component Anti-Pattern
**Lines:** 1,099
**Issues:**
- 24 `any` types
- Inline IIFE for rendering
- 10+ database queries
- 4 `console.error` calls
- `force-dynamic`
- No Suspense boundaries around data-dependent sections
- Mixes data fetching, business logic, and presentation

**Recommendation:** Split into:
- `AgendaDataLoader` (server, fetches data)
- `AgendaOverview` (server/client, renders overview)
- `AgendaRequests` (server/client, renders requests)
- `AgendaHistory` (server/client, renders history)

---

### `app/(app)/dashboard/page.tsx` — Better But Still Heavy
**Lines:** 516
**Good:** Uses `Promise.all` for 14 queries
**Bad:**
- 4 `any` types
- 11 `console.error` calls
- `force-dynamic`
- Inline alert rendering logic
- Heavy JSX inline

**Recommendation:** Extract card components and alert components.

---

### `lib/supabase/middleware.ts` — Complex but Generally Sound
**Lines:** 295
**Good:**
- Session caching for performance
- Proper cookie handling
- Role-based routing
- Sentry integration for fallback role sampling

**Concerns:**
- Protected paths are hardcoded (lines 102-117) — easy to forget when adding new routes
- `SESSION_CACHE` cleanup is not LRU
- `hashCookies` is a simple string hash, collision-prone for large user bases

---

### `lib/config/env.ts` — Robust
**Good:**
- Comprehensive Zod schema
- Cross-field validation (DB URLs)
- CI vs production vs dev behavior differentiation
- No secrets in `NEXT_PUBLIC_*`

---

### `next.config.js` — Good Security Headers
**Good:**
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS
- Permissions-Policy for camera/mic
- Image optimization configured

**Missing:**
- Sanity CDN not in `remotePatterns`
- No `poweredByHeader: false`

---

## 9. Recommended Action Plan

### Immediate (This Week)
1. **Fix mobile app or remove it** — 32+ TS errors make it unbuildable
2. **Fix FormData type errors** — 4 errors blocking typecheck
3. **Add `.limit()` to all unbounded queries** — Start with `lib/chat`, `lib/notifications`, `lib/disputes`
4. **Replace `console.error` in Server Components** with Sentry or remove
5. **Fix hydration mismatch** on legal pages instead of suppressing

### Short Term (Next 2 Weeks)
6. **Extract mega-components** — Split `agenda/page.tsx` and `dashboard/page.tsx` into smaller components
7. **Add CSRF validation** to critical `/api/v1/*` routes
8. **Add Zod schemas** to `professionals/me` and admin status endpoints
9. **Add `alt` text** to all images
10. **Remove `force-dynamic`** from dashboard/agenda where possible, add caching
11. **Fix `any` types** in `app/` directory (80 occurrences)

### Medium Term (Next Month)
12. **Refactor middleware** — Use route config arrays or pattern matching instead of hardcoded paths
13. **Add missing `loading.tsx` and `error.tsx`** to all subroutes
14. **Audit `createAdminClient()` usage** in user-facing routes
15. **Add focus management** to modals and drawers
16. **Add skip navigation link**
17. **Improve `SESSION_CACHE`** with LRU eviction

### Long Term (Next Quarter)
18. **Generate Supabase types** and replace `Record<string, any>` with proper types
19. **Add structured logging** and remove runtime `console.*` calls
20. **Create shared data layer** to deduplicate queries between dashboard and agenda
21. **Performance audit with Lighthouse/Web Vitals** in production
22. **Accessibility audit** with axe-core or Lighthouse

---

## Appendix: File Inventory

| Metric | Count |
|--------|-------|
| `page.tsx` files | 63 |
| `layout.tsx` files | 14 |
| `loading.tsx` files | 22 |
| `error.tsx` files | 23 |
| `not-found.tsx` files | 1 (root) |
| `any` in `app/` | 80 |
| `any` in `lib/` | 377 |
| `console.*` in source | 344 |
| `@ts-ignore` in source | 8 (all in `public/sw.js`) |
| `useEffect` in components | 90 across 40 files |
| `Promise.all` in pages | 25 across 18 files |
| Sequential awaits in pages | 38 files |
| `.select()` without `.limit()` | ~30+ high-risk queries |

---

*End of Report*
