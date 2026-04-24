# 03 — API-First Refactor Plan

## Objective

Extract all business logic from Server Actions (`lib/actions/*.ts`) into versioned REST API routes (`app/api/v1/*`) so the mobile app can consume the exact same backend. The web frontend will then call these API routes via `fetch` instead of importing Server Actions directly.

## Guiding Principles

1. **One source of truth**: Business logic lives in `lib/services/` (pure functions) or `lib/api-handlers/` (HTTP wrappers). Never duplicate.
2. **Server Actions become thin proxies**: A Server Action can still exist for Next.js progressive enhancement, but it should call the same service function as the API route.
3. **Zod schemas are shared**: Input validation schemas live in `lib/schemas/` and are used by both API routes and Server Action proxies.
4. **Versioned from day one**: All new mobile-facing endpoints are `/api/v1/*`. Existing unversioned routes stay for backward compatibility.
5. **Auth via `createApiClient`**: Every API route uses the dual-mode auth client (cookies + JWT bearer).

## Target Architecture

```
lib/
  services/              ← Pure business logic (DB-agnostic interfaces)
    booking-service.ts
    chat-service.ts
    notification-service.ts
    review-service.ts
    profile-service.ts
    professional-service.ts
  api-handlers/          ← HTTP-specific wrappers (auth, rate limit, CORS)
    with-auth.ts
    with-rate-limit.ts
    with-validation.ts
    with-error-handling.ts
  schemas/               ← Shared Zod schemas
    booking-schema.ts
    chat-schema.ts
    profile-schema.ts
app/
  api/
    v1/                  ← Versioned mobile-ready API
      bookings/
        route.ts         ← POST (create), GET (list)
        [id]/
          route.ts       ← GET, PATCH (update), DELETE
          cancel/route.ts
          reschedule/route.ts
      conversations/
        route.ts         ← GET (list)
        [id]/
          messages/
            route.ts     ← POST, GET
      notifications/
        route.ts         ← GET
        mark-all-read/route.ts
      professionals/
        search/route.ts  ← GET (public search, market-filtered)
        me/
          route.ts       ← GET, PATCH
          onboarding/
            route.ts
          settings/
            route.ts
      sessions/
        [id]/
          status/route.ts
          token/route.ts ← Agora token
      push/
        subscribe/route.ts
      auth/
        me/route.ts      ← GET current user
        refresh/route.ts ← POST refresh session
    # Legacy unversioned routes (keep for web backward compat)
    stripe/checkout-session/route.ts
    webhooks/...
    cron/...
lib/actions/             ← Thin proxies (optional, for web progressive enhancement)
  booking.ts             → calls POST /api/v1/bookings
  chat.ts                → calls POST /api/v1/conversations/[id]/messages
```

## Detailed Extraction Plan

### Phase A.1: Shared Infrastructure (Week 1)

#### A.1.1 Create `lib/api-handlers/with-auth.ts`
```ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: any; supabase: any }
) => Promise<NextResponse>

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    const supabase = await createApiClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(request, { user, supabase })
  }
}
```

#### A.1.2 Create `lib/api-handlers/with-rate-limit.ts`
```ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

export function withRateLimit(
  preset: string,
  getIdentifier: (request: NextRequest, userId?: string) => string
) {
  return (handler: Function) => async (request: NextRequest, ...args: any[]) => {
    // ...apply rate limit, return 429 if exceeded
  }
}
```

#### A.1.3 Create `lib/schemas/booking-schema.ts`
Extract the Zod schemas from `lib/actions/booking.ts` into standalone files:
```ts
import { z } from 'zod'
import { localDateTimeSchema } from '@/lib/booking/request-validation'

export const createBookingSchema = z.object({
  professionalId: z.string().uuid(),
  scheduledAt: localDateTimeSchema.optional(),
  notes: z.string().trim().max(500).optional(),
  // ...all fields
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
```

### Phase A.2: Extract Core Services (Weeks 2–4)

#### A.2.1 Booking Service
**Current location:** `lib/actions/booking.ts` (824 lines, `'use server'`)
**New structure:**
- `lib/services/booking/create-booking.ts` — the 824-line logic, refactored into:
  - `validateBookingInput(input)`
  - `lockSlots(supabase, slots)`
  - `createOneOffBooking(supabase, ...)`
  - `createRecurringBooking(supabase, ...)`
  - `createBatchBooking(supabase, ...)`
  - `recordPayment(supabase, ...)`
- `app/api/v1/bookings/route.ts` — HTTP handler
- `lib/actions/booking.ts` — thin proxy (optional)

**API Contract:**
```http
POST /api/v1/bookings
Authorization: Bearer <jwt>
Content-Type: application/json
X-Mobile-API-Key: <key>

{
  "professionalId": "uuid",
  "scheduledAt": "2026-05-01T14:00:00",
  "notes": "...",
  "bookingType": "one_off"
}

→ 201 Created
{ "success": true, "bookingId": "uuid" }

→ 400 Bad Request
{ "success": false, "error": "Profissional não disponível.", "reasonCode": "..." }

→ 429 Too Many Requests
{ "success": false, "error": "Muitas tentativas." }
```

#### A.2.2 Chat Service
**Current location:** `lib/actions/chat.ts` (395 lines)
**New structure:**
- `lib/services/chat/send-message.ts`
- `lib/services/chat/get-messages.ts`
- `lib/services/chat/get-conversations.ts`
- `lib/services/chat/mark-read.ts`
- `app/api/v1/conversations/[id]/messages/route.ts`

**API Contract:**
```http
POST /api/v1/conversations/{id}/messages
Authorization: Bearer <jwt>

{ "content": "Olá, tudo bem?" }

→ 201 Created
{ "success": true, "data": { "messageId": "uuid", "sentAt": "..." } }

GET /api/v1/conversations/{id}/messages?limit=50&cursor=...
→ 200 OK
{ "success": true, "data": { "messages": [...], "nextCursor": "..." } }

GET /api/v1/conversations
→ 200 OK
{ "success": true, "data": { "conversations": [...] } }
```

#### A.2.3 Notification Service
**Current location:** `lib/actions/notifications.ts` (147 lines)
**New structure:**
- `lib/services/notifications/get-notifications.ts`
- `lib/services/notifications/mark-read.ts`
- `app/api/v1/notifications/route.ts`

**API Contract:**
```http
GET /api/v1/notifications?limit=20&cursor=...&unreadOnly=true
→ 200 OK
{ "success": true, "data": { "notifications": [...], "nextCursor": "..." } }

PATCH /api/v1/notifications/{id}/read
→ 200 OK
{ "success": true, "data": { "readAt": "..." } }

POST /api/v1/notifications/mark-all-read
→ 200 OK
{ "success": true, "data": { "updatedCount": 5 } }
```

#### A.2.4 Professional Search
**Current location:** `app/buscar/page.tsx` + `lib/actions/signup.ts`
**Problem:** Public search currently returns all global professionals with no market isolation.
**New structure:**
- `app/api/v1/professionals/search/route.ts`
- Query params: `?market=BR&category=...&query=...&page=1&limit=20`
- Must enforce `market` parameter using `professionals.market_code` (new column).

#### A.2.5 Session / Agora Token
**Current location:** `app/api/agora/token/route.ts` + `app/api/sessao/status/route.ts`
**Action:** Move to versioned routes:
- `POST /api/v1/sessions/{bookingId}/token` — Agora token
- `GET /api/v1/sessions/{bookingId}/status` — session status
- These already exist as API routes; just version and add JWT support.

#### A.2.6 Profile & Professional Management
**Current locations:** `lib/actions/user-profile.ts`, `lib/actions/professional.ts`, `lib/actions/professional-services.ts`, `lib/actions/availability-exceptions.ts`
**New structure:**
- `app/api/v1/professionals/me/route.ts` — GET / PATCH current professional
- `app/api/v1/professionals/me/services/route.ts` — CRUD services
- `app/api/v1/professionals/me/availability/route.ts` — GET / PATCH availability
- `app/api/v1/users/me/route.ts` — GET / PATCH current user profile

### Phase A.3: Web Frontend Migration (Week 4–5)

For every extracted Server Action, update the web components to call the API instead:

```tsx
// BEFORE (today)
import { createBooking } from '@/lib/actions/booking'
const result = await createBooking(data)

// AFTER (target)
const response = await fetch('/api/v1/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
const result = await response.json()
```

**Alternative:** Keep thin Server Action proxies so web gets progressive enhancement (forms work without JS):
```ts
'use server'
export async function createBooking(data) {
  // Call the same API route internally
  const response = await fetch(`${getAppBaseUrl()}/api/v1/bookings`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Cookie': ... }, // forward cookies
  })
  return response.json()
}
```

**Decision:** For the Muuday app, progressive enhancement is not critical (users are logged in, JS is required for the app). We can **remove** most Server Actions entirely and have the web frontend call `fetch` directly. This simplifies the architecture.

---

## File Migration Matrix

| Current File | New Service File(s) | New API Route | Server Action Proxy? |
|--------------|---------------------|---------------|----------------------|
| `lib/actions/booking.ts` | `lib/services/booking/*.ts` | `POST /api/v1/bookings` | No (remove) |
| `lib/actions/chat.ts` | `lib/services/chat/*.ts` | `POST/GET /api/v1/conversations/{id}/messages` | No (remove) |
| `lib/actions/notifications.ts` | `lib/services/notifications/*.ts` | `GET /api/v1/notifications` | No (remove) |
| `lib/actions/review.ts` | `lib/services/reviews/*.ts` | `POST /api/v1/bookings/{id}/reviews` | No (remove) |
| `lib/actions/user-profile.ts` | `lib/services/profiles/*.ts` | `PATCH /api/v1/users/me` | No (remove) |
| `lib/actions/professional.ts` | `lib/services/professionals/*.ts` | `PATCH /api/v1/professionals/me` | No (remove) |
| `lib/actions/professional-services.ts` | `lib/services/professionals/services.ts` | `POST/DELETE /api/v1/professionals/me/services` | No (remove) |
| `lib/actions/availability-exceptions.ts` | `lib/services/professionals/availability.ts` | `POST /api/v1/professionals/me/availability/exceptions` | No (remove) |
| `lib/actions/manage-booking.ts` | `lib/services/booking/manage.ts` | `PATCH /api/v1/bookings/{id}/cancel`, `PATCH .../reschedule` | No (remove) |
| `lib/actions/request-booking.ts` | `lib/services/booking/request.ts` | `POST /api/v1/bookings/requests` | No (remove) |
| `lib/actions/favorites.ts` | `lib/services/favorites.ts` | `POST/DELETE /api/v1/favorites` | No (remove) |
| `lib/actions/disputes.ts` | `lib/services/disputes.ts` | `POST /api/v1/disputes` | No (remove) |
| `lib/actions/client-records.ts` | `lib/services/client-records.ts` | `GET/POST /api/v1/client-records` | No (remove) |
| `lib/actions/complete-profile.ts` | `lib/services/onboarding/complete-profile.ts` | `POST /api/v1/onboarding/complete-profile` | No (remove) |
| `lib/actions/complete-account.ts` | `lib/services/onboarding/complete-account.ts` | `POST /api/v1/onboarding/complete-account` | No (remove) |
| `lib/actions/signup.ts` | `lib/services/taxonomy/catalog.ts` | `GET /api/v1/taxonomy/catalog` | No (remove) |

---

## Effort Estimation

| Task | Files | Estimated Days |
|------|-------|----------------|
| Shared infrastructure (handlers, schemas, api-client) | 5–8 new files | 2 |
| Booking service extraction (largest, most complex) | 1 service + 1 route + tests | 4 |
| Chat service extraction | 1 service + 2 routes + tests | 2 |
| Notification service extraction | 1 service + 2 routes + tests | 1 |
| Profile / professional service extraction | 2 services + 4 routes + tests | 3 |
| Search service + market isolation + pagination | 1 service + 1 route + tests | 2 |
| Remaining smaller services | ~8 services + routes | 3 |
| Web frontend migration (remove Server Actions, use fetch) | ~20 component files | 2 |
| Contract tests + OpenAPI docs | — | 1 |
| Testing, bug fixes & rollout monitoring | — | 2 |
| **Total** | | **~20 dev days** |

---

## Testing Strategy

1. **Unit tests** for service functions (pure logic, no HTTP).
2. **Integration tests** for API routes using `next-test-api-route-handler` or direct handler invocation.
3. **Contract tests**: Add **OpenAPI schema validation** or **Pact contract tests** that run in CI. If the backend changes a response field without bumping the API version, the contract test fails and blocks the PR.
4. **Regression tests**: Ensure existing web flows still work after removing Server Actions.

## Rollout Strategy (Zero-Downtime)

1. **Deploy new API routes alongside existing Server Actions** — nothing is removed yet.
2. **Web frontend migration** — update one page at a time to call `/api/v1/*`. Keep Server Actions as fallback during transition.
3. **Feature flag** — Use PostHog flag `use_api_v1_bookings` (and similar per-domain) to route 5% → 25% → 100% of traffic through the new API.
4. **Monitor** — Watch Sentry error rates and PostHog event volumes for 1 week at each traffic level.
5. **Remove Server Actions** — Only after 100% traffic is stable for 1 week.
6. **Rollback** — If error rate spikes, toggle the PostHog flag back to 0%. The old Server Actions remain functional until explicitly deleted.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
