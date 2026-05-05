# Muuday App — Comprehensive Code Review Report

**Date:** 2026-05-05  
**Scope:** Full-stack Next.js application (app router, Supabase, Stripe, Inngest)  
**Lines reviewed:** ~45,000+ across 400+ files  

---

## Executive Summary

| Severity | Count | Immediate Action Required |
|----------|-------|---------------------------|
| 🔴 **Critical** | 6 | Yes — fix before next deploy |
| 🟠 **High** | 10 | Yes — fix within 1 week |
| 🟡 **Medium** | 18 | Fix within 2 weeks |
| 🔵 **Low** | 22 | Fix when convenient |

**Overall verdict:** The codebase is well-structured with good separation of concerns, comprehensive test coverage, and strong security practices in many areas. However, several critical bugs around build stability, CSP configuration, timing-safe comparisons, and unhandled promise rejections in middleware could cause production outages or security vulnerabilities.

---

## 🔴 Critical Issues

### CRIT-1: `next-env.d.ts` references dev-only type file — will break production/CI builds
**File:** `next-env.d.ts` (line 3)  
**Issue:** The file was manually edited to import `./.next/dev/types/routes.d.ts`. This path only exists during `next dev`; it is absent in production builds and CI, causing TypeScript compilation failures. The file itself contains a comment saying "This file should not be edited."  
**Fix:** Revert to `import "./.next/types/routes.d.ts";` and add the file to `.gitignore` protection if needed.

### CRIT-2: CSP nonce generated in middleware is never relayed to Next.js
**File:** `middleware.ts` (lines 146–147)  
**Issue:** A per-request nonce is generated and injected into the `Content-Security-Policy` header, but there is no mechanism to pass that nonce to Next.js so inline/hydration scripts receive `nonce="…"` attributes. With `script-src 'self' 'nonce-…' 'strict-dynamic'`, Next.js's own scripts will be blocked, breaking the entire application in production.  
**Fix:** Pass the nonce to the rendering layer (e.g., set a custom request header like `x-nonce` in middleware, then read it via `headers()` in the root layout and forward it to `<Script nonce={…} />`).

### CRIT-3: Custom `timingSafeEqual` is not actually constant-time
**File:** `lib/api/mobile-api-key.ts` (lines 39–58)  
**Issue:** The hand-rolled JavaScript loop can be JIT-optimized by engines, branch prediction can leak timing information, and `padEnd` + `charCodeAt` do not provide hardware-level constant-time guarantees of Node.js `crypto.timingSafeEqual`. This undermines protection against timing attacks on the mobile API key.  
**Fix:** Use Node.js `crypto.timingSafeEqual` (convert strings to `Buffer` or `Uint8Array` first, padding to equal length).

### CRIT-4: Unhandled `getUser()` rejection crashes middleware / edge runtime
**File:** `lib/supabase/middleware.ts` (line 199)  
**Issue:** `await supabase.auth.getUser()` is not wrapped in `try/catch`. If Supabase is unreachable, the JWT is malformed, or the network times out, the unhandled rejection bubbles up and crashes the request/edge runtime.  
**Fix:** Wrap the call in `try/catch`, log via Sentry, and treat the user as unauthenticated on failure.

### CRIT-5: Booking creation has race condition between validation and slot lock acquisition
**File:** `lib/booking/create-booking.ts` (lines 78–128)  
**Issue:** Slots are validated sequentially in a `for` loop (lines 78–100), then locks are acquired sequentially in another `for` loop (lines 104–128). Between validation and lock acquisition, another user can book the same slot. The validation does not use a transaction or atomic check, so two concurrent requests can both pass validation and then fight for the lock — with the loser getting a confusing "already locked" error after payment data may have been prepared.  
**Fix:** Combine validation and lock acquisition into a single atomic database operation (RPC), or use advisory locks on the professional + time range.

### CRIT-6: Floating promise in API route — calendar sync silently fails
**File:** `app/api/v1/bookings/route.ts` (lines 101–113)  
**Issue:** The `Promise.all()` for calendar sync is not awaited. If it throws, the error is silently swallowed and the client receives a 201 success response while calendar sync never ran.  
```ts
// Line 103 — missing await
Promise.all(
  bookingIdsForCalendarSync.map(...)
).catch(err => { ... })
```
**Fix:** Add `await` before `Promise.all`.

---

## 🟠 High Issues

### HIGH-1: Empty Bearer token bypasses CSRF origin check
**File:** `lib/http/csrf.ts` (lines 66–68)  
**Issue:** `authHeader?.startsWith('Bearer ')` returns `true` even when the token is empty (e.g., `Authorization: Bearer `). An attacker can send a cross-origin request with that header to skip origin validation entirely.  
**Fix:** Also verify `authHeader.length > 7` after the prefix check.

### HIGH-2: Missing `APP_BASE_URL` silently disables CSRF in production
**File:** `lib/http/csrf.ts` (lines 18–22)  
**Issue:** If `APP_BASE_URL` and `NEXT_PUBLIC_APP_URL` are both missing, `validateCsrfOrigin` returns `{ ok: true }`, disabling CSRF protection without alerting.  
**Fix:** In production, treat missing app base URL as a failure or at least log a Sentry warning.

### HIGH-3: Invalid env vars silently cast to typed object
**File:** `lib/config/env.ts` (line 187)  
**Issue:** When `envSchema.safeParse` fails, the function returns `process.env as unknown as z.infer<typeof envSchema>`. Downstream code thinks it has validated values but may hold empty strings, invalid URLs, or missing secrets.  
**Fix:** Return a partial/defaults object or throw in production instead of casting.

### HIGH-4: `document` access crashes during SSR
**File:** `lib/i18n/index.ts` (lines 26–29)  
**Issue:** `getLocale()` accesses `document.documentElement.lang` unconditionally. When `t()` is called in a Server Component or during SSR, `document` is undefined and throws `ReferenceError`.  
**Fix:** Guard with `typeof document !== 'undefined'`.

### HIGH-5: Unescaped parameter keys in dynamic RegExp
**File:** `lib/i18n/index.ts` (line 40)  
**Issue:** `new RegExp(`\\{${paramKey}\\}`, 'g')` injects `paramKey` directly. If a caller passes a key with regex metacharacters (e.g., `amount+tax`), the RegExp constructor throws or behaves unexpectedly.  
**Fix:** Escape `paramKey` using `paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

### HIGH-6: Slot lock cleanup is non-atomic and can miss stale locks
**File:** `lib/booking/slot-locks.ts` (lines 21–29)  
**Issue:** The cleanup deletes expired locks before checking for overlapping locks, but these are separate queries. In a concurrent scenario, a lock could expire between the cleanup and the overlap check, causing a false "locked" result.  
**Fix:** Use a single query with a composite condition, or rely on database-level filtering with `expires_at > now()`.

### HIGH-7: `priceBrlRaw` could be `null` causing `Number(null)` → `0` and false price rejection
**File:** `lib/booking/create-booking.ts` (lines 133, 141–143)  
**Issue:** If both `service.price_brl` and `professional.session_price_brl` are `null`, `priceBrlRaw` is `null`, `Number(null)` is `0`, and the check `priceBrl <= 0` rejects with "Profissional não possui preço configurado." This is correct behavior but the code path is fragile — if `priceBrlRaw` is `undefined`, `Number(undefined)` is `NaN`, and `NaN <= 0` is `false`, bypassing the check entirely and proceeding with a `NaN` price.  
**Fix:** Use explicit null/undefined checks: `if (priceBrlRaw == null || Number(priceBrlRaw) <= 0)`.

### HIGH-8: Request booking state machine allows `offered` → `open` transition which may be unintended
**File:** `lib/booking/request-booking-state-machine.ts` (line 15)  
**Issue:** `offered: ['open', ...]` allows a professional to offer a time and then revert to `open`. If this is intentional, document it; if not, remove `'open'` to prevent professionals from gaming the request system.  
**Fix:** Audit whether `offered → open` is a legitimate business flow.

### HIGH-9: Supabase DB webhook does not validate event source IP
**File:** `app/api/webhooks/supabase-db/route.ts`  
**Issue:** The webhook validates the secret token but does not check that the request originates from Supabase's known IP ranges. If the secret is leaked, anyone can trigger database change events.  
**Fix:** Add IP allowlist validation for Supabase webhook origins.

### HIGH-10: `safeSecretCompare` in `supabase-db` webhook uses `Buffer.alloc` with potential truncation
**File:** `app/api/webhooks/supabase-db/route.ts` (lines 59–66)  
**Issue:** `Buffer.alloc(maxLength, left)` pads with the entire string `left`, which repeats/truncates to fit. While `timingSafeEqual` itself is fine, the padding behavior means `left="abc"` and `right="abcdef"` padded to length 6 become `"abcabc"` vs `"abcdef"`, which is safe but semantically weird. More importantly, `Buffer.alloc(maxLength, left)` with very long `left` can be inefficient.  
**Fix:** Use `Buffer.from(left).length` comparison first, then `timingSafeEqual` on equal-length buffers (which is already done, but simplify the padding logic).

---

## 🟡 Medium Issues

### MED-1: Naive HTML tag regex for sanitization
**File:** `lib/security/sanitize-input.ts` (line 1)  
**Issue:** `HTML_TAG_REGEX = /<[^>]*>/g` is a naive tag stripper. It can be bypassed by malformed HTML (e.g., `<img src="x" onerror="alert(1)">` is removed, but certain HTML entities or nested patterns may slip through).  
**Fix:** Use `DOMPurify` (client) or `isomorphic-dompurify` for server-side HTML sanitization.

### MED-2: `generateETag` can crash on circular payloads
**File:** `lib/http/cache-headers.ts` (line 9)  
**Issue:** `JSON.stringify(payload)` without `try/catch` will throw `TypeError` on circular payloads, crashing the API route.  
**Fix:** Wrap in `try/catch` and return a fallback ETag.

### MED-3: `If-None-Match` doesn't support multiple ETags
**File:** `lib/http/cache-headers.ts` (lines 16–23)  
**Issue:** The header can contain multiple values (`"abc", "def"`). Simple string comparison misses valid cache hits.  
**Fix:** Split by comma, trim, and compare each value.

### MED-4: Unbounded in-memory rate-limit store growth
**File:** `lib/security/rate-limit.ts` (lines 92–97)  
**Issue:** `globalThis.__muudayRateLimitStore` is a global Map. If Redis is down, the store grows with every unique key. Cleanup is probabilistic and only removes entries older than 60s.  
**Fix:** Enforce a hard `MAX_MEMORY_STORE_SIZE` and evict aggressively.

### MED-5: `formatCurrency` accepts invalid numeric inputs
**File:** `lib/utils/index.ts` (lines 11–33)  
**Issue:** No validation for `NaN`, `Infinity`, or negative inputs. Hard-coded exchange rates will also drift stale.  
**Fix:** Add `Number.isFinite(amountBRL) && amountBrl >= 0` guard.

### MED-6: `formatDateTime` accepts invalid date strings
**File:** `lib/utils/index.ts` (lines 35–37)  
**Issue:** `new Date(date)` without validation produces `Invalid Date`, which `formatInTimeZone` may render nonsensically.  
**Fix:** Check `Number.isNaN(d.getTime())` before formatting.

### MED-7: `decodeURIComponent` can throw `URIError`
**File:** `lib/professional/public-profile-url.ts` (line 55)  
**Issue:** `decodeURIComponent(String(rawValue))` throws if the URL contains invalid percent-encoding (e.g., `%ZZ`).  
**Fix:** Wrap in `try/catch` and return `{ kind: 'unknown', raw: rawValue }` on failure.

### MED-8: Regex injection via XML tag name in CalDAV
**File:** `lib/calendar/providers/apple-caldav.ts` (line 66)  
**Issue:** `extractFirstTag` builds a `RegExp` from the `tag` argument without escaping regex metacharacters.  
**Fix:** Escape `tag` before interpolating.

### MED-9: Floating datetimes incorrectly treated as UTC in CalDAV
**File:** `lib/calendar/providers/apple-caldav.ts` (lines 127–131)  
**Issue:** Local/floating datetimes (no `Z` suffix) are passed to `Date.UTC`, treating them as UTC instead of local time. This can shift calendar events by the user's timezone offset.  
**Fix:** Parse floating times as local time or document the UTC-fallback behavior.

### MED-10: Sentry env var mismatch for traces sample rate
**File:** `sentry.server.config.ts` / `sentry.edge.config.ts`  
**Issue:** Both configs read `process.env.SENTRY_TRACES_SAMPLE_RATE`, but `lib/config/env.ts` only defines `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`. Sample rate silently falls back to `0`.  
**Fix:** Align env var names or add `SENTRY_TRACES_SAMPLE_RATE` to the schema.

### MED-11: Sequential DB call inside middleware role guard
**File:** `lib/supabase/middleware.ts` (lines 252–256)  
**Issue:** `getProfileRole` performs a Supabase query inside middleware, directly impacting TTFB. The code already samples this to Sentry, indicating it's a known hot path.  
**Fix:** Cache role in JWT claims and avoid the profile fallback wherever possible.

### MED-12: `btoa` can throw on non-Latin1 bytes in nonce generation
**File:** `middleware.ts` (line 30)  
**Issue:** `btoa(binary)` throws `InvalidCharacterError` if any byte maps outside Latin1 range. While `Uint8Array` values are 0–255, `String.fromCharCode` can produce surrogate pairs for values 128–255 in some contexts.  
**Fix:** Use a base64 encoder that handles bytes directly, or replace the loop with `btoa(String.fromCharCode(...array))`.

### MED-13: `Number(amount)` on strings can return `NaN` silently in payment formatting
**File:** `lib/payments/format-utils.ts` (lines 14, 34–35)  
**Issue:** `Number(amount)` on an arbitrary string produces `NaN` without throwing. `major` becomes `NaN`, and `toFixed(2)` returns `"NaN"`, resulting in currency strings like `"BRL NaN"`.  
**Fix:** Validate with `Number.isFinite(value)` after conversion.

### MED-14: `instrumentation.ts` import failures can crash startup
**File:** `instrumentation.ts`  
**Issue:** `await import('./sentry.server.config')` is not wrapped in `try/catch`. If Sentry initialization throws, the entire Node.js runtime fails to start.  
**Fix:** Wrap Sentry imports in `try/catch` and log to stderr.

### MED-15: `minorToMajor` uses division on potentially unsafe `Number()` conversion
**File:** `lib/payments/format-utils.ts` (lines 34–36)  
**Issue:** Same as MED-13 — `Number(amount)` can produce `NaN`, and `NaN / 100` is `NaN`, which propagates silently to charts and math operations.  
**Fix:** Validate input before conversion.

### MED-16: `safeRedirectPath` validation is too permissive
**File:** `components/auth/LoginForm.tsx` (lines 62–64)  
**Issue:** `redirectParam.startsWith('/') && !redirectParam.startsWith('//')` allows open redirects to `/@attacker.com` or `/\attacker.com` on some browsers.  
**Fix:** Use a strict allowlist of known paths or validate against `new URL(path, 'https://example.com')`.

### MED-17: `request-booking-state-machine.ts` has mojibake in error message
**File:** `lib/booking/request-booking-state-machine.ts` (line 38)  
**Issue:** `"Transi??o de solicita??o invalida"` contains corrupted characters (`??` instead of `ção`). This indicates an encoding issue that may affect user-facing error messages.  
**Fix:** Re-type the string with proper UTF-8 encoding.

### MED-18: Webhook handlers don't persist events before enqueuing to Inngest
**Files:** `app/api/webhooks/trolley/route.ts`, `app/api/webhooks/revolut/route.ts`  
**Issue:** Unlike the Stripe webhook which persists events before enqueuing, the Trolley and Revolut webhooks directly send to Inngest without persistence. If Inngest is down, the event is lost with no retry mechanism.  
**Fix:** Persist webhook events to a database table before enqueuing, matching the Stripe pattern.

---

## 🔵 Low Issues

### LOW-1: Missing advanced TypeScript strict flags
**File:** `tsconfig.json`  
**Issue:** `strict: true` is enabled, but `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are not.  
**Fix:** Add if the team can tolerate the migration effort.

### LOW-2: HSTS `preload` without actual preload submission
**File:** `next.config.js`  
**Issue:** `Strict-Transport-Security` includes `preload`, which tells browsers the domain should be in the HSTS preload list. If not submitted to hstspreload.org, this is misleading.  
**Fix:** Remove `preload` until formally submitted.

### LOW-3: `SUPABASE_SECRET_KEY` fallback is undocumented
**File:** `lib/supabase/admin.ts` (line 34)  
**Issue:** Falls back to `SUPABASE_SECRET_KEY`, not defined in `lib/config/env.ts`. Creates invisible dependency.  
**Fix:** Remove fallback or add to env schema.

### LOW-4: `allowWithoutOrigin: true` weakens API CORS
**File:** `lib/http/cors.ts`  
**Issue:** `PUBLIC_API_CORS_POLICY` allows requests without an `Origin` header. Tools like `curl` can hit the API without origin validation.  
**Fix:** Document the decision explicitly.

### LOW-5: Empty taxonomy slug allowed after trim
**File:** `lib/admin/taxonomy-service.ts` (lines 62–69)  
**Issue:** If `data.name_pt` is whitespace-only, `trim()` produces empty string and slug becomes empty.  
**Fix:** Validate `data.name_pt.trim().length > 0`.

### LOW-6: `formatCurrency` hard-codes stale exchange rates
**File:** `lib/utils/index.ts` (lines 12–19)  
**Issue:** Exchange rates are hard-coded and will drift from market rates.  
**Fix:** Integrate with an exchange rate API or update rates regularly.

### LOW-7: `getAppBaseUrl()` Sentry call during module init
**File:** `lib/config/app-url.ts` (line 72)  
**Issue:** `Sentry.captureMessage` at module top-level may be dropped if Sentry isn't initialized yet.  
**Fix:** Defer warning to lazy init or wrap in initialization check.

### LOW-8: Middleware host redirect silently swallows invalid URLs
**File:** `middleware.ts` (lines 128–130)  
**Issue:** Invalid `appBaseUrl` is caught and ignored without logging.  
**Fix:** Log to Sentry before continuing.

### LOW-9: `availability-engine.ts` `getPeriodicIncrementDays` returns 0 for monthly
**File:** `lib/booking/availability-engine.ts` (line 43)  
**Issue:** `getPeriodicIncrementDays` returns `0` for `monthly`, but the caller in `generateRecurringSlotStarts` handles monthly separately with `addMonths`. This is correct but confusing — the function name implies it should handle all periodicities.  
**Fix:** Document the special-case handling or return a sentinel value.

### LOW-10: `LoginForm` mixes controlled/uncontrolled pattern for email
**File:** `components/auth/LoginForm.tsx` (line 71)  
**Issue:** `useState(initialEmail)` where `initialEmail` comes from search params. If the search param changes after mount, the state doesn't update.  
**Fix:** Use `useEffect` to sync state with search param, or derive directly.

### LOW-11: `SessionCountdown` uses `Date.now()` in SSR and client without hydration mismatch guard
**File:** `components/booking/SessionCountdown.tsx` (line 18)  
**Issue:** `useState(Date.now())` will differ between SSR and client hydration, potentially causing a React hydration mismatch warning.  
**Fix:** Initialize to `0` or `null` and set real value in `useEffect`.

### LOW-12: `buildProfessionalProfilePath` ignores slug when `id` is present
**File:** `lib/professional/public-profile-url.ts` (lines 41–52)  
**Issue:** If `input.id` is truthy, it returns `/profissional/${id}` without slug, even if a prettier slug+code path is available.  
**Fix:** Consider using slug+code for public-facing URLs even when ID is known.

### LOW-13: `toVideoEmbedUrl` doesn't validate YouTube video ID length
**File:** `app/(app)/profissional/[id]/page.tsx` (lines 181–193)  
**Issue:** Any string after `/embed/` is accepted, potentially creating invalid embed URLs.  
**Fix:** Validate video ID format (11 chars for YouTube).

### LOW-14: `videoEmbedUrl` iframe missing sandbox attribute
**File:** `app/(app)/profissional/[id]/page.tsx` (line 781)  
**Issue:** The iframe for professional videos lacks `sandbox` attribute, allowing full capabilities from embedded third-party content.  
**Fix:** Add `sandbox="allow-scripts allow-same-origin allow-presentation"`.

### LOW-15: `public-profile-url.ts` UUID regex too strict
**File:** `lib/professional/public-profile-url.ts` (line 5)  
**Issue:** The regex `UUID_V4_REGEX` only matches v4 UUIDs. Supabase uses v4 by default, but if the table ever contains v7 or other versions, parsing will fail.  
**Fix:** Use a more general UUID regex or validate with a library.

### LOW-16: `availability-engine.ts` `timeToMinutes` doesn't validate input format
**File:** `lib/booking/availability-engine.ts` (line 26)  
**Issue:** `value.slice(0, 5).split(':').map(Number)` on malformed input (e.g., `"abc"`) produces `NaN` hours and minutes, silently breaking availability logic.  
**Fix:** Add validation and return `NaN` or throw on invalid format.

### LOW-17: `manage-booking.ts` actions don't revalidate `/sessao` or `/pagamento`
**File:** `lib/actions/manage-booking.ts`  
**Issue:** All actions revalidate `/agenda` and `/dashboard` but not `/sessao` or `/pagamento`, so users on those pages may see stale data after booking changes.  
**Fix:** Add `revalidatePath('/sessao')` and `revalidatePath('/pagamento/[bookingId]')` where appropriate.

### LOW-18: `stripe/webhook-handlers.ts` uses `BigInt(Math.round(...))` which can lose precision
**File:** `lib/stripe/webhook-handlers.ts` (line 243)  
**Issue:** `BigInt(Math.round((bt.fee || 0)))` on very large numbers can lose precision because `Math.round` operates on Number (IEEE 754, max safe integer 2^53-1). For Stripe amounts this is unlikely to be an issue, but it's a latent bug.  
**Fix:** Use string-based BigInt conversion if Stripe ever returns values above safe integer range.

### LOW-19: `stripe/webhook-handlers.ts` settlement update doesn't handle race condition
**File:** `lib/stripe/webhook-handlers.ts` (lines 285–304)  
**Issue:** `recordStripeSettlement` checks for existing, then updates or inserts. This is a classic read-then-write race condition under concurrent webhook delivery.  
**Fix:** Use `upsert` with conflict resolution instead of separate read and write.

### LOW-20: `create-booking.ts` `MANUAL_CONFIRMATION_SLA_HOURS` is hard-coded
**File:** `lib/booking/create-booking.ts` (line 37)  
**Issue:** 24-hour SLA is hard-coded. Should come from professional settings or environment.  
**Fix:** Move to settings or env config.

### LOW-21: `request-validation.ts` `isValidIsoLocalDateTime` uses UTC constructor for local validation
**File:** `lib/booking/request-validation.ts` (lines 18–26)  
**Issue:** Constructs `new Date(Date.UTC(...))` and compares UTC components. This validates the numeric components but doesn't truly validate the local datetime semantics (e.g., DST transitions).  
**Fix:** Document the limitation or use a proper date library.

### LOW-22: `Booking` server action emits email events without awaiting
**File:** `lib/actions/booking.ts` (lines 83–94)  
**Issue:** `emitProfessionalReceivedBooking` and `emitUserStartedCheckout` are called without `await` or `.catch()`. If they throw, the error is unhandled.  
**Fix:** Wrap in `.catch()` with Sentry logging, or await them.

---

## Architecture & Design Concerns

### A-1: Over-reliance on client-side fallback for `is_publicly_visible` column
**File:** `app/(app)/profissional/[id]/page.tsx`  
**Issue:** The code repeatedly tries queries with `is_publicly_visible`, catches errors mentioning that column, and falls back to queries without it. This indicates a schema migration in progress that should be completed. The fallback paths add significant complexity and extra queries.  
**Fix:** Complete the migration and remove fallback paths.

### A-2: Server Component page (`profissional/[id]`) is 936 lines
**File:** `app/(app)/profissional/[id]/page.tsx`  
**Issue:** While recently refactored, this page still contains rendering logic, data fetching, formatting, and business rules. It's difficult to test and maintain.  
**Fix:** Extract pure functions to `lib/` and split presentation into smaller components.

### A-3: Duplicate code between server action and API route for booking creation
**Files:** `lib/actions/booking.ts`, `app/api/v1/bookings/route.ts`  
**Issue:** Both files call `executeBookingCreation`, but the post-creation logic (calendar sync, revalidation, email events) is duplicated with slight differences.  
**Fix:** Extract a shared `finalizeBookingCreation` helper.

### A-4: `createAdminClient()` returns `null` instead of throwing
**File:** `lib/supabase/admin.ts`  
**Issue:** Throughout the codebase, callers must check `if (!admin)` after every `createAdminClient()` call. This is error-prone — it's easy to forget the check.  
**Fix:** Consider throwing on misconfiguration so callers can assume success, or use a Result type.

---

## Testing Gaps

1. **Middleware tests:** No unit tests for `updateSession`, CSP nonce generation, or role-based redirects.
2. **Webhook handler tests:** Only Stripe has tests; Trolley and Revolut webhooks lack coverage.
3. **Slot lock concurrency tests:** No tests for the race condition between validation and lock acquisition.
4. **i18n SSR tests:** No tests verifying `t()` works in Server Components.
5. **CSP integration tests:** No tests verifying scripts load with the nonce in production-like CSP.

---

## Performance Observations

1. **Sequential slot validation in booking creation:** `for (const slot of plannedSessions) { await validateSlotAvailability(...) }` is O(n) sequential. Could be parallelized with `Promise.all` for batch bookings.
2. **Sequential slot lock acquisition:** Same pattern — locks are acquired one at a time instead of in parallel.
3. **Professional profile page does 11 parallel queries:** Good use of `Promise.all`, but some queries (recommendations, specialty context) could be deferred or cached.
4. **Middleware DB query on every request:** The `getProfileRole()` fallback queries `profiles` table. With the session cache, this is reduced but still happens for cache misses and role-guarded routes.

---

## Security Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| No hardcoded secrets | ✅ Pass | No secrets found in source |
| SQL injection prevention | ✅ Pass | Uses parameterized queries / RPC |
| XSS output encoding | ⚠️ Partial | `sanitizePlainText` uses naive regex |
| CSRF protection | ⚠️ Partial | Empty Bearer bypass (HIGH-1) |
| Rate limiting | ✅ Pass | Comprehensive presets defined |
| Auth middleware | ⚠️ Partial | Unhandled `getUser()` rejection (CRIT-4) |
| Webhook signature verification | ✅ Pass | Stripe, Revolut, Trolley all verify |
| Input validation (Zod) | ✅ Pass | Most API routes validate with Zod |
| RLS enforcement | ✅ Pass | No `createAdminClient` fallback in user code |
| CSP nonce | 🔴 Fail | Nonce generated but not relayed (CRIT-2) |

---

## Recommended Fix Priority

### Week 1 (Critical)
1. Fix `next-env.d.ts` dev-only import (CRIT-1)
2. Fix CSP nonce relay to Next.js (CRIT-2)
3. Replace custom `timingSafeEqual` with `crypto.timingSafeEqual` (CRIT-3)
4. Wrap `getUser()` in try/catch in middleware (CRIT-4)
5. Fix booking slot lock race condition (CRIT-5)
6. Add `await` to calendar sync in API route (CRIT-6)

### Week 2 (High)
7. Fix empty Bearer CSRF bypass (HIGH-1)
8. Fix missing env var silent disable of CSRF (HIGH-2)
9. Fix env validation casting bug (HIGH-3)
10. Fix `document` SSR crash in i18n (HIGH-4)
11. Fix regex injection in i18n (HIGH-5)
12. Fix slot cleanup atomicity (HIGH-6)
13. Fix price null/undefined handling (HIGH-7)
14. Audit request booking state machine transitions (HIGH-8)

### Week 3–4 (Medium)
15. Replace naive HTML sanitizer with DOMPurify (MED-1)
16. Add ETag circular payload protection (MED-2)
17. Fix If-None-Match multi-value support (MED-3)
18. Cap in-memory rate-limit store size (MED-4)
19. Add input validation to format utilities (MED-5–7)
20. Fix CalDAV regex and timezone handling (MED-8–9)
21. Align Sentry env var names (MED-10)
22. Reduce middleware DB fallback queries (MED-11)
23. Fix nonce generation base64 (MED-12)
24. Add payment format NaN guards (MED-13–15)
25. Protect instrumentation startup (MED-14)
26. Fix open redirect in login (MED-16)
27. Fix mojibake in state machine (MED-17)
28. Add persistence to Trolley/Revolut webhooks (MED-18)

---

*Report generated by automated code review. All findings should be validated by a human developer before fixing.*
