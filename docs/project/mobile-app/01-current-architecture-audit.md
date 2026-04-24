# 01 — Current Architecture Audit (Code-Level Findings)

## 1. Authentication & Session Management

### What Exists Today
- **Supabase Auth** with `@supabase/ssr` cookie-based sessions (`sb-access-token`, `sb-refresh-token`).
- `createBrowserClient()` in browser, `createServerClient()` in middleware + Server Components.
- Middleware (`middleware.ts`) enforces route guards by calling `supabase.auth.getUser()` and checking `profiles.role`.
- OAuth: Google only (`supabase.auth.signInWithOAuth({ provider: 'google' })`).
- Password auth: `signInWithPassword({ email, password })`.
- No magic link / OTP flow visible.

### Mobile Implications
- **Cookies do not work in React Native** (no `document.cookie`, no automatic `Set-Cookie` handling).
- Supabase JS client in RN needs `AsyncStorage` as the storage adapter and must use the **same** `sb-access-token` / `sb-refresh-token` logic, but passed via `Authorization: Bearer <jwt>` headers to API routes.
- The current API routes (`app/api/*`) all use `createServerClient()` which reads **cookies** from the incoming request. A mobile app sending `Authorization: Bearer <token>` will be treated as unauthenticated unless we add JWT parsing.

### Code Evidence
```ts
// lib/supabase/server.ts — reads cookies only
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(...) { ... }
      }
    }
  )
}
```

**Verdict:** The auth system is web-only. Every API route that calls `supabase.auth.getUser()` via the cookie-based server client will reject mobile requests.

---

## 2. API Routes vs Server Actions

### What Exists Today
- **44 API route files** in `app/api/**/route.ts` — these are genuine HTTP endpoints.
- **34 Server Action files** in `lib/actions/**/*.ts` — these are `'use server'` functions callable only from React components.

### API Routes (Mobile-Consumable Today)
| Route | Auth Method | Mobile Ready? |
|-------|-------------|---------------|
| `POST /api/auth/attempt-guard` | CORS + IP rate limit | ✅ Yes (public) |
| `POST /api/auth/login-hint` | CORS + IP rate limit | ✅ Yes (public) |
| `POST /api/auth/password-reset` | CORS + IP rate limit | ✅ Yes (public) |
| `POST /api/stripe/checkout-session` | Cookie session | ❌ No (needs JWT) |
| `GET /api/sessao/status` | Cookie session | ❌ No (needs JWT) |
| `POST /api/agora/token` | Cookie session | ❌ No (needs JWT) |
| `POST /api/push/subscribe` | Cookie session | ❌ No (needs JWT) |
| `POST /api/professional/onboarding/*` | Cookie session | ❌ No (needs JWT) |
| `GET /api/plan-config` | Cookie session | ❌ No (needs JWT) |
| `GET /api/notifications/unread-count` | Cookie session | ❌ No (needs JWT) |
| Webhooks (`/api/webhooks/*`) | Signature validation | ✅ Yes ( Stripe/Supabase → server) |
| Cron jobs (`/api/cron/*`) | `X-Cron-Secret` | ✅ Yes (internal) |

### Server Actions (Mobile-Blocked Forever)
These files contain **core business logic** that is inaccessible to mobile:

| File | Responsibility | Lines |
|------|---------------|-------|
| `lib/actions/booking.ts` | Create booking (one-off, recurring, batch), slot validation, payment atomicity, calendar sync | 824 |
| `lib/actions/chat.ts` | Send message, get messages, mark read, get conversations, push notify | 395 |
| `lib/actions/notifications.ts` | Get notifications, mark read, unread count | 147 |
| `lib/actions/manage-booking.ts` | Cancel, reschedule, confirm, manage bookings | ~200+ |
| `lib/actions/request-booking.ts` | Booking request state machine | ~200+ |
| `lib/actions/review.ts` | Create review, respond to review | ~150 |
| `lib/actions/user-profile.ts` | Update profile, avatar, preferences | ~200+ |
| `lib/actions/professional.ts` | Update professional profile, services | ~300+ |
| `lib/actions/professional-services.ts` | CRUD on service offerings | ~200+ |
| `lib/actions/availability-exceptions.ts` | Block/unblock availability | ~150 |
| `lib/actions/complete-profile.ts` | Onboarding completion | ~200+ |
| `lib/actions/complete-account.ts` | Account completion flow | ~150 |
| `lib/actions/signup.ts` | Signup catalog, validation | 66 |
| `lib/actions/favorites.ts` | Add/remove favorites | ~100 |
| `lib/actions/disputes.ts` | Dispute management | ~100 |
| `lib/actions/client-records.ts` | Client medical/appointment records | ~200+ |

**Total: ~3,500+ lines of business logic** trapped in Server Actions.

### How Server Actions Are Called
```tsx
// From components (client-side)
import { createBooking } from '@/lib/actions/booking'
const result = await createBooking({ professionalId, scheduledAt: '...' })
```
Under the hood, Next.js serializes this into a `POST` request with an encrypted action ID. **This is not a stable, versioned API contract.** Mobile cannot call this.

---

## 3. Database Access Patterns

### What Exists Today
- All data access is via Supabase client (`supabase.from('...').select(...)`).
- **No generated TypeScript types** for tables. Queries are raw strings.
- Schema inferred from usage:
  - `profiles` (id, role, full_name, email, avatar_url, country, timezone, currency)
  - `professionals` (id, user_id, tier, status, session_price_brl, session_duration_minutes, rating, ...)
  - `bookings` (id, user_id, professional_id, status, scheduled_at, start_time_utc, end_time_utc, ...)
  - `booking_sessions` (child sessions for recurring)
  - `payments` (id, booking_id, user_id, professional_id, amount_total, currency, status, provider, ...)
  - `conversations`, `conversation_participants`, `messages`
  - `notifications` (id, user_id, type, title, body, payload, read_at, created_at)
  - `push_subscriptions` (user_id, endpoint, p256dh, auth)
  - `professional_settings` (professional_id, timezone, buffer_minutes, confirmation_mode, ...)
  - `calendar_connections` (OAuth tokens for Google/Outlook calendar sync)
  - `availability_exceptions`, `recurring_availability`

### Missing Fields for Mobile/Multi-Market
- `profiles.language` — needed for app UI language selection
- `professionals.market_code` — needed for market isolation
- `professionals.session_price` (generic, not `_brl`) — needed for multi-currency
- Taxonomy `name_es`, `name_en` — only `name_pt` is queried today

### Realtime Usage
- **Chat**: `supabase.channel('messages-${conversationId}')` with `postgres_changes` on `messages` table INSERT.
- **Notifications**: `supabase.channel('notifications-list-realtime')` with `postgres_changes` on `notifications` table.
- These will work in React Native **unchanged** because they use the Supabase realtime WebSocket, not HTTP cookies.

---

## 4. Payments & Stripe

### What Exists Today
- Stripe checkout sessions for professional subscription plans.
- `lib/stripe/client.ts` defines `StripePlatformRegion = 'br' | 'uk'`.
- `platform_region` stored on `professionals` table.
- Webhooks: `/api/webhooks/stripe` and `/api/webhooks/stripe-br`.
- Plan pricing pulled from env vars (`STRIPE_PRICE_BASIC_MONTHLY_UK`, etc.).

### Mobile Implications
- Stripe React Native SDK exists and can create PaymentIntents / SetupIntents natively.
- However, the current flow uses **Stripe Checkout redirect URLs** (`stripe.checkout.sessions.create`). This is a web flow.
- For the app, professionals will need a different flow: either in-app Stripe Elements or a redirect to a webview checkout.
- **Decision needed**: Keep web checkout for subscriptions ( professionals open a webview ) or migrate to Stripe Customer Portal / in-app billing.

---

## 5. Video Calls (Agora)

### What Exists Today
- `POST /api/agora/token` generates an Agora RTC token with `RtcTokenBuilder.buildTokenWithAccount()`.
- Token expires in 2 hours.
- Join window: 20 min before to 4 hours after session end.
- Uses `agora-access-token` (legacy Node SDK).

### Mobile Implications
- **Agora React Native SDK** exists and uses the same token format.
- The `/api/agora/token` endpoint is an API route, so once JWT auth is added, mobile can call it directly.
- Token generation logic is server-side and correct; no refactor needed.
- The `agora-access-token` package is deprecated in favor of `agora-token`. This is a low-priority migration.

---

## 6. Push Notifications

### What Exists Today
- `lib/push/sender.ts` uses `web-push` with VAPID keys.
- Stores subscriptions in `push_subscriptions` table.
- Sends push via `webPush.sendNotification()`.
- Called from chat (`lib/actions/chat.ts`) when a message is sent.
- Also has user preference system (`lib/push/preferences.ts`).

### Mobile Implications
- **Web Push (VAPID) does not work on iOS native apps** and is not the standard on Android native.
- Native apps need:
  - **FCM** (Firebase Cloud Messaging) for Android
  - **APNS** (Apple Push Notification Service) for iOS
- **Recommended:** Use **Expo Push Service** — one HTTP API for both platforms, no native FCM/APNS certificate management.
- The `push_subscriptions` table needs new columns (see `05-shared-infrastructure.md` for migration SQL):
  - `platform` ('web' | 'ios' | 'android' | 'expo')
  - `push_token` (Expo push token or FCM token)
  - `device_id` (for deduplication)
- A new push sender backend must be built to call Expo Push API (or FCM/APNS directly if not using Expo).

---

## 7. Internationalization (i18n)

### What Exists Today
- `lang="pt-BR"` hardcoded in `app/layout.tsx`.
- **All UI strings are hardcoded Portuguese** in components and Server Actions.
- Error messages in Zod schemas are Portuguese.
- No `next-intl`, no `react-intl`, no translation files.
- Taxonomy DB has `name_pt` and `name_en` columns, but **only `name_pt` is ever selected**.

### Mobile Implications
- React Native apps typically use `i18next` + `react-i18next` or `react-native-localize`.
- The **ICU message format** (used by `next-intl`, `react-intl`, `i18next-icu`) is the industry standard for sharing translations between web and mobile.
- Without a shared message catalog, every translation is duplicated work and will drift.
- **Critical decision**: Adopt ICU JSON message files in a shared package (`packages/translations`) that both web and mobile consume.

---

## 8. Assets & Images

### What Exists Today
- Avatars served from Supabase Storage (`jbbnbbrroifghrshplsq.supabase.co`) and `ui-avatars.com`.
- Professional credentials uploaded to Supabase Storage.
- No image resizing/CDN optimization.
- CSP in middleware explicitly allows Supabase Storage domain.

### Mobile Implications
- Mobile apps need responsive images (thumbnails for lists, full-size for detail views).
- Supabase Storage does not provide on-the-fly resizing like Cloudinary or Imgix.
- **Recommendation**: Migrate avatars and professional media to a CDN with query-parameter transforms (e.g., Sanity CDN, Cloudinary, or Supabase Image Transformations if enabled).
- Professional credential documents (PDFs) can stay in Supabase Storage.

---

## 9. Calendar & External Integrations

### What Exists Today
- Google Calendar and Outlook Calendar OAuth connections.
- `app/api/professional/calendar/connect/[provider]/route.ts` and callback routes.
- Calendar sync enqueued via Inngest (`enqueueBookingCalendarSync`).
- Token encryption with `CALENDAR_TOKEN_ENCRYPTION_KEY`.

### Mobile Implications
- Calendar connections are a **web-only OAuth flow** (redirect-based).
- Professionals will likely still set up calendar sync on the web dashboard.
- The app does not need to replicate the OAuth flow; it can show a "Manage on Web" link.
- However, the app **does** need to read availability data, which is already accessible via API (once JWT auth is added).

---

## 10. Rate Limiting & Security

### What Exists Today
- Upstash Redis + in-memory fallback (`lib/security/rate-limit.ts`).
- 20+ presets: `authLogin`, `authSignup`, `bookingCreate`, `messageSend`, `notificationRead`, etc.
- CORS policies for public APIs (`lib/http/cors.ts`).
- CSRF origin validation (`lib/http/csrf.ts`).
- CSP with nonces in middleware.

### Mobile Implications
- Rate limiting uses IP + user identifier. Mobile users will have different IPs (carrier/WiFi).
- The `getClientIp()` function uses `X-Forwarded-For` rightmost trusted IP. This is correct for Vercel.
- Mobile API requests should include a consistent `X-Device-ID` header for rate limit bucketing.
- **Rate limit preset update:** Presets like `notificationWrite` currently use `userId + IP`. For mobile, they should use `userId + deviceId` when `X-Device-ID` is present. Example:
  ```ts
  const identifier = request.headers.get('x-device-id')
    ? `${userId}:${deviceId}`
    : `${userId}:${ip}`
  ```
- CORS policies currently allow `APP_BASE_URL` + `API_CORS_ORIGINS`. Mobile app origins (e.g., `https://localhost` in dev, custom scheme `muuday://` in prod) must be added.
- **Decision**: Mobile app should use a dedicated API key (`X-Mobile-API-Key`) in addition to JWT, for origin validation and abuse detection. See `02-auth-jwt-strategy.md` for security hardening (app attestation, certificate pinning).

---

## 11. Feature Flags & Analytics

### What Exists Today
- PostHog for analytics and feature flags (`NEXT_PUBLIC_POSTHOG_KEY`).
- `captureEvent()` and `identifyEventUser()` wrappers.
- Feature flags not heavily used yet, but PostHog supports both web and mobile.

### Mobile Implications
- PostHog has a React Native SDK. The same feature flags and events can be reused.
- Ensure user IDs are consistent between web and mobile (they will be, via Supabase `auth.users.id`).

---

## 12. State Management on Web

### What Exists Today
- Server Components + Server Actions for most data fetching.
- Client-side state is minimal: React `useState` / `useEffect` for forms and realtime subscriptions.
- No global state library (Redux, Zustand, Jotai) visible.
- TanStack Query (React Query) is **not** used.

### Mobile Implications
- React Native will need a data-fetching layer. **TanStack Query** is the standard and works identically on web and mobile.
- Adopting TanStack Query on the web now would create a shared pattern for caching, optimistic updates, and pagination.
- This is not a blocker, but a **strong recommendation** for consistency.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
