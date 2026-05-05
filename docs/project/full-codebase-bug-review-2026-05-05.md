# Full-Codebase Bug & Mistake Review — muuday-app
**Date:** 2026-05-05
**Reviewer:** Kimi Code CLI
**Scope:** `lib/`, `app/`, `components/`, `mobile/`, `types/`, `middleware.ts`

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical** | 7 | Security vulnerabilities, production breakages, unhandled exceptions |
| **High** | 9 | Data integrity risks, auth bypasses, race conditions, XSS |
| **Medium** | 12 | Stability issues, incorrect error handling, performance |
| **Low** | 14 | Code quality, missing guards, edge cases |
| **Total** | **42** | |

---

## Critical Issues

### C1. `next-env.d.ts` — Production Typecheck Breakage
**File:** `next-env.d.ts:3`  
**Issue:** Manually edited to import `./.next/dev/types/routes.d.ts` (dev-only path). Next.js explicitly warns "This file should not be edited." This path does not exist in CI/production builds, causing `tsc` to fail.  
**Impact:** Build fails in CI and production.  
**Fix:** Revert to `./.next/types/routes.d.ts`.

```typescript
// BEFORE (BROKEN)
import "./.next/dev/types/routes.d.ts";

// AFTER (FIXED)
import "./.next/types/routes.d.ts";
```

---

### C2. CSP Nonce Generated but Never Relayed to Next.js
**File:** `middleware.ts`  
**Issue:** A nonce is generated and injected into the `Content-Security-Policy` header (`script-src 'nonce-...' 'strict-dynamic'`), but there is no mechanism to pass the nonce into Next.js hydration `<script>` tags or the root layout. Next.js will inject inline scripts without the nonce, causing CSP violations that block the app.  
**Impact:** App fails to load in production when CSP is enforced.  
**Fix:** Pass nonce via header to the app layer (e.g., `x-nonce`) and inject into `<Script nonce={...}>` in `app/layout.tsx`, or use Next.js built-in `nonce` support.

---

### C3. Mobile API Key Timing Attack
**File:** `lib/api/mobile-api-key.ts`  
**Issue:** Uses a hand-rolled `timingSafeEqual()` that is NOT constant-time in JavaScript engines. The loop short-circuits implicitly via `result |= ...` but JIT compilers may optimize this unpredictably.  
**Impact:** Attackers can brute-force the `X-Mobile-Api-Key` header byte-by-byte via timing analysis.  
**Fix:** Use Node.js `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))`.

```typescript
import { timingSafeEqual } from 'crypto'
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
```

---

### C4. Unhandled `getUser()` in Supabase Middleware
**File:** `lib/supabase/middleware.ts:~199`  
**Issue:** `await supabase.auth.getUser()` is called without `try/catch`. If Supabase Auth is unreachable or the JWT is malformed, this throws an unhandled exception that crashes the middleware.  
**Impact:** Complete site outage for users with invalid sessions or during Supabase outages.  
**Fix:** Wrap in try/catch and treat errors as unauthenticated.

---

### C5. CSRF Bypass via Empty Bearer Token
**File:** `lib/http/csrf.ts:67`  
**Issue:** `authHeader?.startsWith('Bearer ')` returns `true` for `"Bearer "` (empty token). This skips origin validation entirely, allowing cross-origin requests to hit API routes.  
**Impact:** CSRF attacks against cookie-authenticated users via crafted cross-origin requests.  
**Fix:** Check `authHeader.length > 7` (or use regex `/^Bearer\s+\S+$/`).

```typescript
const hasBearerToken = /^Bearer\s+\S+$/.test(authHeader ?? '')
```

---

### C6. Invalid Env Validation Silent Cast
**File:** `lib/config/env.ts:187`  
**Issue:** When `safeParse` fails, the code casts `process.env` to the inferred type instead of throwing. This allows missing/invalid secrets to propagate silently into production.  
**Impact:** Runtime crashes with cryptic errors; missing Stripe/Supabase keys could cause data loss or security issues.  
**Fix:** Throw a descriptive error on parse failure.

```typescript
if (!parsed.success) {
  console.error(parsed.error.format())
  throw new Error('Environment validation failed. Check missing/invalid env vars.')
}
return parsed.data
```

---

### C7. Naive HTML Sanitization (XSS)
**File:** `lib/security/sanitize-input.ts`  
**Issue:** Uses `HTML_TAG_REGEX = /<[^>]*>/g` which is easily bypassed: e.g., `<img src=x onerror=alert(1)>`, `<script>`, HTML entities, malformed tags.  
**Impact:** Stored/reflected XSS if user input is rendered without additional escaping.  
**Fix:** Use DOMPurify (server-side via `jsdom`) or a robust HTML parser for sanitization.

---

## High Issues

### H1. i18n SSR Crash + Regex Injection
**File:** `lib/i18n/index.ts`  
**Issues:**
1. `getLocale()` accesses `document.documentElement.lang` without `typeof document !== 'undefined'` guard, crashing in Server Components.
2. `t()` interpolates `paramKey` directly into `new RegExp` without escaping special regex characters.

**Impact:** SSR crashes; ReDoS or incorrect replacement if param keys contain regex metacharacters.  
**Fix:** Add `typeof document` guard; escape param keys with `paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

---

### H2. Unbounded Rate-Limit Memory Store
**File:** `lib/security/rate-limit.ts`  
**Issue:** When Redis is unavailable, the in-memory fallback `globalThis.__muudayRateLimitStore` Map grows without a hard ceiling. Cleanup is probabilistic (every 1000th entry) and only removes entries >60s old.  
**Impact:** Memory exhaustion during DDoS or prolonged Redis outages; Vercel Functions OOM.  
**Fix:** Add a hard maximum size (e.g., 10000 entries) with LRU eviction.

---

### H3. `decodeURIComponent` Uncaught `URIError`
**File:** `lib/professional/public-profile-url.ts`  
**Issue:** `decodeURIComponent(String(rawValue))` throws `URIError` on invalid percent-encoding (e.g., `%ZZ`).  
**Impact:** Uncaught exception crashes the request.  
**Fix:** Wrap in try/catch.

---

### H4. `JSON.stringify` Circular Reference Crash
**File:** `lib/http/cache-headers.ts`  
**Issue:** `generateETag` calls `JSON.stringify(payload)` without checking for circular references.  
**Impact:** `TypeError` crashes the API route if a circular object is passed.  
**Fix:** Use a safe stringify or try/catch.

---

### H5. `formatCurrency` / `formatDateTime` Missing Validation
**File:** `lib/utils/index.ts`  
**Issues:**
1. `formatCurrency` doesn't validate for `NaN`, `Infinity`, or negative amounts.
2. `formatDateTime` creates `new Date(date)` without checking validity; `Invalid Date` propagates into `formatInTimeZone`.

**Impact:** UI renders nonsensical values ("BRL NaN", "Invalid Date").  
**Fix:** Add `Number.isFinite()` and `isNaN()` checks; validate `Date` before formatting.

---

### H6. `icsDateToIso` Timezone Drift
**File:** `lib/calendar/providers/apple-caldav.ts`  
**Issue:** Floating local datetimes are treated as UTC via `Date.UTC`, potentially shifting times by the server's timezone offset.  
**Impact:** Calendar events display at wrong times for users.  
**Fix:** Parse floating times as local, not UTC.

---

### H7. `extractFirstTag` Regex Injection
**File:** `lib/calendar/providers/apple-caldav.ts`  
**Issue:** Builds `RegExp` from user-influenced tag names without escaping regex metacharacters.  
**Impact:** ReDoS or incorrect parsing if tag names contain special characters.  
**Fix:** Escape tag name before inserting into regex.

---

### H8. `getUserWithSessionFallback` Misleading Name + Unhandled Error
**File:** `lib/auth/get-user-with-fallback.ts`  
**Issue:**
1. Function name says "fallback" but there is NO fallback — it only calls `getUser()`.
2. `getUser()` is unwrapped; network/JWT errors will throw.

**Impact:** Uncaught exceptions in server components/actions.  
**Fix:** Rename to `getUserSafe` and add try/catch.

---

### H9. `guardAuthAttempt` Fails Open on Network Errors
**File:** `lib/auth/attempt-guard-client.ts:41-42`  
**Issue:** If the fetch to `/api/auth/attempt-guard` fails (network error, server down), the catch block returns `{ allowed: true }`.  
**Impact:** Rate limiting is bypassed during server outages or network attacks.  
**Fix:** Return `{ allowed: false, error: '...' }` on fetch failure.

---

## Medium Issues

### M1. Booking Price Validation Uses `Number()` on Raw Input
**File:** `lib/booking/create-booking.ts:141`  
**Issue:** `const priceBrl = Number(priceBrlRaw) || 0` then `if (priceBrl <= 0)` reject. If `priceBrlRaw` is a non-numeric string, `Number()` returns `NaN`, and `NaN <= 0` is `false`, so the check passes.  
**Impact:** Bookings created with `NaN` prices, causing payment failures.  
**Fix:** Use `Number.isFinite(priceBrl) && priceBrl > 0`.

---

### M2. Slot Lock TTL Race Condition
**File:** `lib/booking/create-booking.ts`, `lib/booking/slot-locks.ts`  
**Issue:** Locks have a 10-minute TTL. Between lock acquisition (step 4) and booking persistence (step 7), if the process stalls (e.g., slow DB, Stripe latency), locks can expire. Another user could then acquire the same slot, leading to double-booking.  
**Impact:** Overlapping bookings for the same slot.  
**Fix:** Re-validate slot availability immediately before persistence, or use DB-level constraints (unique index on professional + start_time).

---

### M3. `formatMinorUnits` / `minorToMajor` Silent `NaN`
**File:** `lib/payments/format-utils.ts`  
**Issue:** `Number(amount)` on arbitrary strings can produce `NaN`, which renders as `"BRL NaN"`.  
**Impact:** Confusing UI and potential payment amount errors.  
**Fix:** Validate with `Number.isFinite()`.

---

### M4. `insertTaxonomyItemService` Allows Whitespace-Only Name
**File:** `lib/admin/taxonomy-service.ts`  
**Issue:** `name_pt` trimmed and slugified can produce an empty slug if the input is whitespace-only.  
**Impact:** Empty slugs cause URL routing issues or DB constraint violations.  
**Fix:** Reject whitespace-only names before processing.

---

### M5. `acquireSlotLock` Cleanup Race
**File:** `lib/booking/slot-locks.ts`  
**Issue:** Expired lock cleanup (`delete ... lte expires_at`) runs before overlap check, but another concurrent request could insert a new lock between cleanup and insert. The unique constraint (`23505`) is the only real guard.  
**Impact:** Rare race condition; mostly mitigated by unique constraint but not ideal.  
**Fix:** Rely on DB unique constraint as primary guard; remove probabilistic cleanup or move to background job.

---

### M6. Stripe Webhook `fetchStripeFeeForPaymentIntent` Hardcoded Fee
**File:** `lib/stripe/webhook-handlers.ts`  
**Issue:** Fallback estimate uses hardcoded `2.9% + 30 cents` which may not match Stripe's actual BRL pricing.  
**Impact:** Incorrect fee accounting in ledger.  
**Fix:** Query Stripe's `balance_transaction` for actual fee, or update fallback to current BRL rate.

---

### M7. `validateApiCsrf` Missing `APP_BASE_URL` Silently Disables CSRF
**File:** `lib/http/csrf.ts:20-21`  
**Issue:** If `APP_BASE_URL` and `NEXT_PUBLIC_APP_URL` are both missing, CSRF returns `{ ok: true }`.  
**Impact:** CSRF protection silently disabled in misconfigured environments.  
**Fix:** Fail closed (reject) when app base URL is unknown.

---

### M8. `types/supabase-generated.ts` Parser Failure
**File:** `types/supabase-generated.ts`  
**Issue:** ESLint reports "File appears to be binary"; ReadFile also fails. Likely BOM or encoding mismatch.  
**Impact:** TypeScript language service and ESLint may skip this file, reducing type safety.  
**Fix:** Re-save as UTF-8 without BOM; check for mojibake.

---

### M9. `request-booking-state-machine.ts` Encoding Corruption
**File:** `lib/booking/request-booking-state-machine.ts:38`  
**Issue:** String contains corrupted characters: `Transi??o de solicita??o invalida`.  
**Impact:** Poor UX with garbled error messages.  
**Fix:** Re-save file as UTF-8; replace with proper Portuguese.

---

### M10. `ETag` Multiple Value Handling
**File:** `lib/http/cache-headers.ts`  
**Issue:** `If-None-Match` can legally contain multiple comma-separated ETags (e.g., `"abc", "def"`). The current code does a simple string comparison.  
**Impact:** Incorrect 200 responses when a matching ETag is present in a list.  
**Fix:** Parse and compare against each ETag in the list.

---

### M11. Root Layout Hardcoded Sentry Ingest URL
**File:** `app/layout.tsx`  
**Issue:** Hardcoded `o4511120268722176.ingest.us.sentry.io` in `<head>` preconnect/dns-prefetch.  
**Impact:** If Sentry DSN changes, these hints become useless or point to wrong domain.  
**Fix:** Derive from `SENTRY_DSN` env var or remove hardcoding.

---

### M12. Non-Blocking Calendar Sync After Booking Creation
**File:** `app/api/v1/bookings/route.ts`  
**Issue:** Calendar sync is fire-and-forget (`Promise.all(...).catch(...)` without `await`). If it fails, the booking exists but the professional's external calendar is out of sync.  
**Impact:** Silent calendar desync.  
**Fix:** Add retry logic or queue via Inngest for guaranteed delivery.

---

## Low Issues

### L1. `getUserWithSessionFallback` Type is Overly Permissive
**File:** `lib/auth/get-user-with-fallback.ts`  
**Issue:** `SupabaseAuthClientLike` type accepts any object with `auth.getUser`, losing type safety.  
**Fix:** Use proper `SupabaseClient` generic.

---

### L2. `bookingType` Default in `acquireSlotLock`
**File:** `lib/booking/slot-locks.ts:69`  
**Issue:** `booking_type` defaults to `'one_off'` at DB level but is also set in code, creating redundancy.  
**Fix:** Let DB handle default or ensure consistency.

---

### L3. `priceBrl` vs `perSessionPriceUserCurrency` Mismatch Risk
**File:** `lib/booking/create-booking.ts`  
**Issue:** `priceBrl` is validated > 0, but `perSessionPriceUserCurrency` could still be 0/NaN if conversion fails.  
**Fix:** Validate both amounts.

---

### L4. `MANUAL_CONFIRMATION_SLA_HOURS` Hardcoded
**File:** `lib/booking/create-booking.ts:37`  
**Issue:** 24-hour SLA is a magic number.  
**Fix:** Move to env or settings table.

---

### L5. `sendBookingConfirmationEmail` Fire-and-Forget Without Retry
**File:** `lib/booking/create-booking.ts:321-344`  
**Issue:** Email failures are logged to Sentry but not retried.  
**Fix:** Queue via Inngest or Resend for at-least-once delivery.

---

### L6. `crypto.randomUUID()` in Booking Code Not Cryptographically Required
**File:** `lib/booking/create-booking.ts:265`  
**Issue:** `crypto.randomUUID()` is fine but overkill for a batch group ID; not a security issue.  

---

### L7. `booking.professionals` Type Casting
**File:** `app/api/stripe/payment-intent/route.ts:185`, `app/api/stripe/checkout-session/booking/route.ts:127`  
**Issue:** `as unknown as { profiles?: ... }` bypasses TypeScript safety.  
**Fix:** Use proper Supabase type generation.

---

### L8. Stripe Customer Creation Race Condition
**File:** `app/api/stripe/payment-intent/route.ts:148-176`  
**Issue:** Two parallel requests could both find no existing customer and create duplicates. The `stripe_customers` table may not have a unique constraint on `user_id`.  
**Fix:** Ensure unique index on `stripe_customers(user_id)`.

---

### L9. Checkout Session Route Does Not Create Stripe Customer Before Session
**File:** `app/api/stripe/checkout-session/booking/route.ts:131-141`  
**Issue:** If no existing customer, it passes `customer: undefined` and relies on `customer_email`. This creates a new Stripe customer on every checkout session for guest-like flows.  
**Impact:** Customer duplication in Stripe dashboard.  
**Fix:** Create customer proactively before session creation, or ensure `stripe_customers` has unique constraint.

---

### L10. `validateCsrfOrigin` Development Skip
**File:** `lib/http/csrf.ts:12-13`  
**Issue:** CSRF is entirely disabled in non-production. This is standard for local dev but dangerous if `NODE_ENV` is misconfigured (e.g., staging set to `development`).  
**Fix:** Use an explicit `DISABLE_CSRF` env flag instead of `NODE_ENV` check.

---

### L11. `rateLimit` Key Construction Without User ID for Authenticated Routes
**File:** `app/api/stripe/payment-intent/route.ts:31`, `app/api/stripe/checkout-session/booking/route.ts:39`  
**Issue:** Rate limiting uses IP only. A malicious user with rotating IPs (VPN, proxy) can bypass.  
**Fix:** Include user ID in rate limit key for authenticated routes.

---

### L12. `Sentry.addBreadcrumb` in Hot Paths
**File:** `lib/booking/create-booking.ts:44,49`  
**Issue:** Breadcrumbs add overhead in the booking hot path.  
**Fix:** Use conditional logging or remove non-critical breadcrumbs.

---

### L13. `try/catch` in `prepareBookingPayment` Swallows Stack Trace
**File:** `lib/booking/create-booking.ts:167-173`  
**Issue:** Catches error, logs to Sentry, but returns generic message. Hard to debug.  
**Fix:** Include a correlation ID in the error response.

---

### L14. `formatInTimeZone` Locale Import
**File:** `lib/booking/create-booking.ts:32`  
**Issue:** `ptBR` locale is imported but may not match the user's actual locale.  
**Fix:** Use user's preferred locale from profile.

---

## Fix Priority Matrix

| Priority | Issues | Action |
|----------|--------|--------|
| **P0 (Fix Now)** | C1, C2, C3, C4, C5, C6, C7 | Security & production breakages |
| **P1 (This Sprint)** | H1, H2, H3, H4, H5, H8, H9 | Auth, data integrity, stability |
| **P2 (Next Sprint)** | M1, M2, M3, M6, M8, M9, M12 | Race conditions, UX, encoding |
| **P3 (Backlog)** | L1-L14 | Code quality, observability, edge cases |

---

## Appendix: Files Requiring Immediate Attention

1. `next-env.d.ts`
2. `middleware.ts`
3. `lib/api/mobile-api-key.ts`
4. `lib/supabase/middleware.ts`
5. `lib/http/csrf.ts`
6. `lib/config/env.ts`
7. `lib/security/sanitize-input.ts`
8. `lib/i18n/index.ts`
9. `lib/security/rate-limit.ts`
10. `lib/booking/create-booking.ts`
11. `lib/booking/slot-locks.ts`
12. `lib/auth/get-user-with-fallback.ts`
13. `lib/auth/attempt-guard-client.ts`
14. `types/supabase-generated.ts`
