# Handover: Security Hardening + SSR Refactor Batch

**Date:** 2026-04-19
**Branch:** `security-hardening-and-ssr-refactor`
**Commit range:** `d3b64b1..HEAD`
**Author:** Kimi Code CLI (automated refactor + security audit)

---

## Executive Summary

This batch contains two major workstreams:
1. **SSR Refactor**: Converted 12 `'use client'` page.tsx files to Server Components (Next.js 14 App Router best practice)
2. **Security Hardening**: Fixed 15+ security issues identified in a comprehensive audit of `app/api/` and `lib/`

**Validation status:**
- ✅ TypeScript: zero errors (`tsc --noEmit`)
- ✅ ESLint: zero warnings/errors
- ✅ Next.js build: success
- ✅ 41 Vitest unit tests: passing
- ✅ Smoke test (production): passing
- ⚠️ E2E tests: not run locally (require staging environment)

**Risk level:** Medium-High due to the SSR refactor surface area. Recommend staging deployment + E2E run before production.

---

## 1. SSR Refactor: `'use client'` → Server Components (12 pages)

### Problem
Twelve page.tsx files in `app/` were marked `'use client'`, forcing full client-side hydration and preventing server-side data fetching, SEO, and reduced JS bundles.

### Pattern Applied
Every page followed the same 3-step pattern:
1. **Page** (async Server Component): loads data via server actions, renders extracted client component
2. **Server Action** (`lib/actions/`): data loading and mutations, runs server-side only
3. **Client Component** (`components/{domain}/`): handles UI state, interactivity, calls mutation actions via `onXxxAction` props

### Pages Converted

| Page | Server Action(s) | Client Component |
|------|-----------------|------------------|
| `app/(auth)/login/page.tsx` | `loadAuthProviders()` | `components/auth/LoginForm.tsx` |
| `app/(auth)/recuperar-senha/page.tsx` | `requestPasswordReset()` | `components/auth/PasswordResetForm.tsx` |
| `app/(auth)/completar-conta/page.tsx` | `loadAccountCompletionData()` | `components/auth/CompleteAccountForm.tsx` |
| `app/(auth)/cadastro/page.tsx` | `loadSignupCatalog()` | `components/auth/SignupForm.tsx` |
| `app/(app)/favoritos/page.tsx` | `loadFavorites()` | `components/favorites/FavoritesList.tsx` |
| `app/(app)/editar-perfil/page.tsx` | `loadProfileData()` | `components/profile/EditProfileForm.tsx` |
| `app/(app)/planos/page.tsx` | `loadPlansData()` | `components/plans/PlansView.tsx` |
| `app/(app)/editar-perfil-profissional/page.tsx` | `loadProfessionalProfile()` | `components/professional/ProfessionalProfileEditForm.tsx` |
| `app/(app)/admin/planos/page.tsx` | `loadAdminPlanData()` | `components/admin/AdminPlanConfigForm.tsx` |
| `app/(app)/admin/taxonomia/page.tsx` | `loadTaxonomyData()` | `components/admin/TaxonomiaForm.tsx` |
| `app/(app)/completar-perfil/page.tsx` | `loadCompletionData()` | `components/professional/CompleteProfileForm.tsx` |
| `app/(app)/admin/page.tsx` | `loadAdminDashboardData()` | `components/admin/AdminDashboard.tsx` |

### New Server Actions Created
- `lib/actions/signup.ts`
- `lib/actions/complete-account.ts`
- `lib/actions/complete-profile.ts`
- `lib/actions/user-profile.ts`
- `lib/actions/favorites.ts`
- `lib/actions/admin.ts`
- `lib/actions/admin-plans.ts`
- `lib/actions/admin-taxonomy.ts`
- `lib/actions/booking.ts`
- `lib/actions/request-booking.ts`
- `lib/actions/manage-booking.ts`
- `lib/actions/email.ts` (refactored)
- `lib/actions/professional.ts`

### New Components Extracted
- `components/auth/LoginForm.tsx`
- `components/auth/PasswordResetForm.tsx`
- `components/auth/CompleteAccountForm.tsx`
- `components/auth/SignupForm.tsx`
- `components/favorites/FavoritesList.tsx`
- `components/profile/EditProfileForm.tsx`
- `components/plans/PlansView.tsx`
- `components/professional/ProfessionalProfileEditForm.tsx`
- `components/admin/AdminPlanConfigForm.tsx`
- `components/admin/TaxonomiaForm.tsx`
- `components/professional/CompleteProfileForm.tsx`
- `components/admin/AdminDashboard.tsx`
- `components/dashboard/onboarding-tracker/`
- `components/settings/*`
- `components/agenda/*`

---

## 2. Security Hardening

### 2.1 IP Extraction Consistency (High)
**Issue:** 5 routes used `split(',')[0]` (first/leftmost IP from `x-forwarded-for`), which is spoofable on Vercel. 14+ routes used `getClientIp` from `lib/http/client-ip.ts` which correctly uses the rightmost IP.

**Impact:** Rate limiting bypass — attacker could spoof `X-Forwarded-For` to rotate their apparent IP and evade limits.

**Fix:** All 5 routes now import and use `getClientIp`:
- `app/api/webhooks/stripe-br/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/webhooks/supabase-db/route.ts`
- `app/api/auth/password-reset/route.ts`
- `app/api/auth/attempt-guard/route.ts`

### 2.2 Credentials Download — IDOR Risk (High)
**Issue:** `app/api/professional/credentials/download/[credentialId]/route.ts` queried credentials by ID only, relying solely on RLS. If RLS were ever misconfigured, any authenticated user could download any credential.

**Fix:** Added explicit ownership check via `getPrimaryProfessionalForUser` + `.eq('professional_id', ...)`.

### 2.3 Raw Error Messages Leaked to Client (Medium)
**Issue:** Multiple API routes returned `error.message` directly to HTTP clients, potentially leaking internal details (table names, URLs, credentials).

**Fix:** Sanitized all error responses to generic, user-safe messages:
- `credentials/upload/route.ts` (5 occurrences)
- `credentials/download/route.ts` (2 occurrences)
- `onboarding/save/route.ts` (outer catch)
- `calendar/connect/[provider]/route.ts` (CalDAV error)
- `profile-media/upload/route.ts` (storage fallback)

### 2.4 JSON Parsing Without Try-Catch (Medium)
**Issue:** `request.json()` without try-catch could cause unhandled exceptions on malformed payloads (DoS vector).

**Fix:**
- `calendar/connect/[provider]/route.ts` — wrapped in try-catch, returns 400
- `onboarding/submit-review/route.ts` — wrapped in try-catch + type validation

### 2.5 Fetch Timeouts — Calendar Providers (Medium)
**Issue:** All external calendar API calls (Google, Outlook, Apple CalDAV) and internal recompute-visibility calls used `fetch` without timeout, risking indefinite hangs and resource exhaustion.

**Fix:** Added `AbortController` with 15s timeout to:
- `lib/calendar/providers/http.ts` (`fetchJson`, `fetchText` — covers Google + Outlook)
- `lib/calendar/providers/google.ts` (DELETE event)
- `lib/calendar/providers/outlook.ts` (DELETE event)
- `lib/calendar/providers/apple-caldav.ts` (PROPFIND, PUT, DELETE)
- `lib/actions/complete-profile.ts` (recompute-visibility trigger, 10s)

### 2.6 Cookie Security (Medium)
**Issue:** `muuday_country` cookie in `middleware.ts` lacked `httpOnly` flag.

**Fix:** Added `httpOnly: true` to the cookie.

### 2.7 Stripe Webhook Error Handling (Medium)
**Issue:** `stripe-br/route.ts` returned HTTP 202 even when Inngest enqueue failed, unlike the UK webhook which returned 500.

**Fix:** Returns 500 with `ok: false` when enqueue fails.

### 2.8 Type Safety — `getPrimaryProfessionalForUser` (Low)
**Issue:** Function returned `Record<string, any>`, propagating `any` through 27 call sites.

**Fix:**
- Made function generic: `getPrimaryProfessionalForUser<T = Record<string, any>>`
- Added `ProfessionalRow` type to `types/index.ts` mirroring the actual DB schema
- Callers can opt into type safety: `getPrimaryProfessionalForUser<ProfessionalRow>(...)`

### 2.9 Booking Validation Unification (Low)
**Issue:** Slot availability validation was duplicated across multiple files.

**Fix:** Extracted `validateSlotAvailability()` into `lib/booking/slot-validation.ts`.

### 2.10 Environment File Cleanup (Low)
**Issue:** 20 `.env.*` files cluttered the project root.

**Fix:** Moved to `env/` subdirectories (`checkly/`, `preview/`, `vercel/`, `production/`). Root keeps only `.env.local` and `.env.local.example`.

---

## 3. Files Modified / Created Summary

### Modified (existing files)
```
app/(app)/admin/page.tsx
app/(app)/admin/planos/page.tsx
app/(app)/admin/taxonomia/page.tsx
app/(app)/completar-perfil/page.tsx
app/(app)/editar-perfil-profissional/page.tsx
app/(app)/editar-perfil/page.tsx
app/(app)/favoritos/page.tsx
app/(app)/planos/page.tsx
app/(auth)/cadastro/page.tsx
app/(auth)/completar-conta/page.tsx
app/(auth)/login/page.tsx
app/(auth)/recuperar-senha/page.tsx
app/api/auth/attempt-guard/route.ts
app/api/auth/password-reset/route.ts
app/api/professional/calendar/connect/[provider]/route.ts
app/api/professional/credentials/download/[credentialId]/route.ts
app/api/professional/credentials/upload/route.ts
app/api/professional/onboarding/save/route.ts
app/api/professional/onboarding/submit-review/route.ts
app/api/professional/profile-media/upload/route.ts
app/api/webhooks/stripe-br/route.ts
app/api/webhooks/stripe/route.ts
app/api/webhooks/supabase-db/route.ts
components/agenda/ProfessionalAvailabilityWorkspace.tsx
components/booking/BookingForm.tsx
components/dashboard/OnboardingTrackerModal.tsx
components/settings/ProfessionalSettingsWorkspace.tsx
lib/actions/admin.ts
lib/actions/booking.ts
lib/actions/email.ts
lib/actions/manage-booking.ts
lib/actions/request-booking.ts
lib/calendar/providers/apple-caldav.ts
lib/calendar/providers/google.ts
lib/calendar/providers/http.ts
lib/calendar/providers/outlook.ts
lib/email/resend.ts
lib/ops/stripe-resilience.ts
lib/professional/current-professional.ts
lib/professional/onboarding-gates.ts
lib/stripe/client.ts
middleware.ts
types/index.ts
```

### Created (new files)
See full list above in sections 1.2 and 1.3. Key new files include all extracted client components, new server actions, and helper utilities.

---

## 4. Deployment Recommendations

### Required before production:
1. **Deploy to Preview/Staging first** — Run full E2E suite against preview URL
2. **Verify critical user journeys:**
   - Login / Signup / Password reset
   - Booking flow (search → book → pay)
   - Professional onboarding (completar-perfil)
   - Admin dashboard (admin, taxonomia, planos)
   - Calendar sync (Google, Outlook, Apple)
3. **Monitor error rates** — Sentry alerts for 500s, hydration errors
4. **Check rate limiting** — Ensure `getClientIp` (last IP) works correctly on Vercel edge

### Rollback plan:
- Revert the single merge commit
- The old `'use client'` pages were fully replaced; there is no easy partial rollback
- Consider keeping the branch alive for 48h post-deploy

---

## 5. Known Limitations / Out of Scope

- **Rate limit memory fallback:** `globalThis.__muudayRateLimitStore` resets on cold starts. Upstash Redis is primary; fallback is intentional but non-persistent.
- **CSP `style-src 'unsafe-inline'`:** Intentionally kept. 25+ dynamic inline styles in core components would require significant UI refactoring to remove.
- **No generated Supabase types:** `ProfessionalRow` is hand-written. Consider running `supabase gen types typescript` for stronger type safety.
- **Component/hook test coverage:** Still zero. Only 41 utility/state-machine tests exist.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
