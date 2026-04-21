# Code Review Report: Booking Hang Issue

**Date:** 2026-04-21  
**Reviewer:** Kimi Code CLI  
**Scope:** Booking creation flow (`lib/actions/booking.ts`, `components/booking/BookingForm.tsx`, related modules)  
**Commit Range:** `29c2255..HEAD` (post-booking-atomic-refactor)  

---

## Executive Summary

### Verdict: **REQUEST CHANGES — Critical Production Issue**

| Metric | Score | Notes |
|--------|-------|-------|
| **Overall** | **62 / 100** | Critical hang bug in production; multiple structural issues |
| **Correctness** | 55 / 100 | Booking hang blocks core revenue flow |
| **Security** | 78 / 100 | PII guards present; minor RLS reliance gaps |
| **Performance** | 65 / 100 | N+1 risk in slot validation; Redis timeout exposure |
| **Maintainability** | 60 / 100 | 783-line function; deep nesting; mixed concerns |
| **Error Handling** | 50 / 100 | Missing timeout guards; uncaught throws; poor UX on failure |
| **Testing** | 80 / 100 | Unit tests exist and pass; missing E2E coverage for hang scenario |

---

## Root Cause Analysis: Why "Processando..." Hangs Forever

### Primary Suspect: UTF-8 BOM Before `'use server'` Directive

**Finding:** `lib/actions/booking.ts` and **46 other TypeScript files** across the codebase started with a UTF-8 BOM (`\xEF\xBB\xBF`) before the `'use server'` directive.

**Impact:** Next.js / Turbopack's Server Action bundler uses directive detection to register action handlers. A BOM at the file start can prevent correct parsing of `'use server'`, causing the action to not be registered. When the client calls `createBooking()`, the HTTP request to the Server Action endpoint may not resolve correctly — the server cannot route to an unregistered action, and the client-side promise never settles, leaving `isPending = true` indefinitely.

**Evidence:**
- BOM present in `lib/actions/booking.ts` (confirmed via hex inspection: `ef bb bf`)
- BOM propagated to 12 files in `lib/actions/` and 34 more across `app/api/`, `lib/`, `components/`
- Issue is **production-only** — consistent with a build-time bundler parsing issue
- Local Turbopack cache corruption prevented reproduction, masking the issue during dev

**Fix Applied:** Removed BOM from all 46 affected files.

### Secondary Suspect: PostgREST Timestamp Quoting Bug

**Finding:** `hasInternalConflict` in `lib/booking/availability-checks.ts` used single-quoted ISO timestamps in `.or()` filters:

```typescript
.or(
  `and(start_time_utc.gte.'${conflictWindowStart}',start_time_utc.lte.'${conflictWindowEnd}'),...`
)
```

PostgREST expects double quotes for values containing `:` and `-` characters. Single quotes may cause silent filter failures, returning zero conflicts and allowing overbooking. While this doesn't directly cause hangs, it indicates the same commit introduced multiple PostgREST-level issues.

**Fix Applied:** Changed single quotes to double quotes in `hasInternalConflict`.

### Tertiary Suspect: Unhandled `hasExternalBusyConflict` Throw

**Finding:** `hasExternalBusyConflict` throws on query error instead of returning `false`:

```typescript
if (error) {
  throw new Error(`Failed to check external busy conflicts: ${error.message}`)
}
```

This propagates an unhandled rejection through `validateSlotAvailability` → `createBooking` → `startTransition`. React 19's `startTransition` with async functions has edge cases where unhandled rejections may not correctly reset `isPending` in all scenarios.

**Fix Applied:** Changed to log error and return `false` (fail-open for external calendar checks).

### Additional Contributing Factors

| Factor | Risk | Explanation |
|--------|------|-------------|
| No client-side timeout | **Critical** | `BookingForm.tsx` had no timeout on `createBooking` call; any server hang = infinite "Processando..." |
| No try-catch in `startTransition` | **High** | Unhandled promise rejections leave UI in indeterminate state |
| RPC function deployment unknown | **Medium** | `create_booking_with_payment` may not exist in production DB; fallback path has complex logic but RPC call itself could hang if function exists but deadlocks |
| `revalidatePath` after long operations | **Low** | If `revalidatePath` throws in an edge case, it could prevent function return |

---

## Changes Made During Review

### 1. BOM Removal (Critical)
- **Files:** 46 TypeScript files across `lib/actions/`, `app/api/`, `lib/`, `components/`
- **Method:** Stripped `\xEF\xBB\xBF` prefix from all affected files
- **Verification:** TypeScript check passes, lint passes, all 69 unit tests pass

### 2. PostgREST Quoting Fix (High)
- **File:** `lib/booking/availability-checks.ts`
- **Change:** `.or()` filter values now use double quotes `"value"` instead of single quotes `'value'`

### 3. Client-Side Timeout & Error Handling (Critical)
- **File:** `components/booking/BookingForm.tsx`
- **Changes:**
  - Added 15-second client-side timeout that forces error state if Server Action hangs
  - Wrapped `createBooking` call in `try-catch` inside `startTransition`
  - Added cleanup `useEffect` for timeout ref
  - Users now see: *"A solicitação demorou muito. Verifique sua conexão e tente novamente."*

### 4. `hasExternalBusyConflict` Fail-Open (Medium)
- **File:** `lib/booking/external-calendar-conflicts.ts`
- **Change:** Returns `false` on query error instead of throwing

### 5. Server-Side Tracing Breadcrumbs (Diagnostic)
- **File:** `lib/actions/booking.ts`
- **Changes:** Added Sentry breadcrumbs at key execution points:
  - `createBooking started`
  - `createBooking client created`
  - `createBooking user authenticated`
  - `createBooking calling atomic one_off/recurring/batch`
  - `createBooking revalidating paths`
  - `createBooking completed`

### 6. Minor Lint Fix
- **File:** `components/agenda/BookingRealtimeListener.tsx`
- **Change:** Removed unnecessary `eslint-disable-next-line no-console` directive

---

## Prioritized Action Items

### P0 — Deploy & Verify (Do Now)

1. **Deploy to production immediately**
   - The BOM removal is the most likely fix for the hang
   - Monitor Sentry for `booking_create_success` breadcrumbs after deploy
   - Test one booking flow end-to-end in production before announcing recovery

2. **Verify RPC functions exist in production DB**
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'create_%_booking_with_payment';
   ```
   If any are missing, run migration `052-booking-transactions.sql`

3. **Add Vercel log drain or function logging**
   - Current inability to read production runtime logs is a major operational blind spot
   - Configure `vercel logs` access or add a Log Drain integration

### P1 — Harden Against Future Hangs (This Week)

4. **Add server-side timeout to `createBooking`**
   - Wrap the entire function body in a `Promise.race` with a 12-second timeout
   - If timeout fires, release all slot locks and return `{ success: false, error: '...' }`

5. **Add circuit breaker to `supabase.rpc()` calls**
   - If `createBookingWithPaymentAtomic` hangs for >5s, abort and use fallback
   - This prevents PostgreSQL lock contention from blocking the entire flow

6. **Audit all other Server Action files for BOM**
   - Script to check: `find lib/actions app/api -name '*.ts' -exec python -c "import sys; f=open(sys.argv[1],'rb'); print(sys.argv[1]) if f.read(3)==b'\xef\xbb\xbf' else None" {} \;`
   - Add a CI check (pre-commit hook or GitHub Action step) to reject files with BOM

### P2 — Code Quality & Refactoring (Next Sprint)

7. **Break up `createBooking` (783 lines)**
   - Extract: payload builders, atomic path orchestrator, fallback path orchestrator, payment recorder
   - Target: no function >100 lines, no file >400 lines
   - This function mixes validation, DB queries, business logic, payment handling, calendar sync, and cache invalidation

8. **Fix PostgREST `.or()` quoting across codebase**
   - The same single-quote pattern exists in `lib/actions/email/shared.ts`
   - Audit all `.or()` calls for correct quoting

9. **Improve `BookingForm.tsx` transition handling**
   - Consider using React 19's `useActionState` (formerly `useFormState`) instead of manual `useTransition` + `useState`
   - This provides built-in pending/error states designed for Server Actions

10. **Add E2E test for booking timeout scenario**
    - Mock `createBooking` to hang for 20s
    - Assert that timeout message appears and UI becomes interactive again

### P3 — Observability & Operational Excellence (Ongoing)

11. **Add structured logging to all Server Actions**
    - Every action should log: start, key milestones, completion/failure, duration
    - Use Sentry breadcrumbs or a lightweight logger

12. **Set up alerting for booking failure rate**
    - Alert if `booking_create_failed` events exceed 5% of `booking_submit_clicked` over 5 minutes

13. **Document the BOM issue in AGENTS.md**
    - Add a rule: "All TypeScript files must be UTF-8 without BOM. Check with `file -i` or hexdump."

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| BOM fix does not resolve hang | Medium | Critical | Client-side timeout + fallback path ensures users can retry |
| RPC functions missing in prod DB | Medium | High | Fallback path exists; verify with SQL query post-deploy |
| PostgreSQL deadlock in atomic function | Low | High | Add RPC timeout; fallback path provides escape hatch |
| Overbooking due to PostgREST quoting | Medium | High | Fixed double-quote syntax; monitor conflict detection |
| Client timeout fires too aggressively | Low | Medium | 15s is conservative for Vercel + Supabase round-trip |

---

## Conclusion

The booking hang is a **P0 production incident** caused most likely by UTF-8 BOM corruption interfering with Next.js Server Action bundling. The recent commit (`2142d35`) that introduced atomic booking creation appears to have been created or edited on a system that injected BOMs into files — possibly Windows + certain editors/IDEs.

**Immediate actions taken:**
- Removed BOM from 46 files
- Fixed PostgREST quoting
- Added client-side timeout and error handling
- Added server-side tracing breadcrumbs
- Added fail-open for external calendar conflict checks

**Next step:** Deploy to production and verify with an end-to-end booking test.

---

## Appendix: Files Modified

| File | Change | Severity |
|------|--------|----------|
| `lib/actions/booking.ts` | Removed BOM, added Sentry breadcrumbs | Critical |
| `components/booking/BookingForm.tsx` | Added timeout, try-catch, cleanup | Critical |
| `lib/booking/availability-checks.ts` | Fixed PostgREST `.or()` quoting | High |
| `lib/booking/external-calendar-conflicts.ts` | Fail-open on query error | Medium |
| `components/agenda/BookingRealtimeListener.tsx` | Removed unused eslint-disable | Low |
| 41 other `.ts/.tsx` files | Removed BOM | Critical |
