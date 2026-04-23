# 05 — Shared Infrastructure (Web + Mobile)

## Principle

Every piece of infrastructure that both web and mobile need should be **built once, shared, and versioned**. This section catalogs what must be unified.

---

## 1. Translation System (ICU Message Format)

### Why ICU?

- `next-intl` (web) uses ICU by default.
- `i18next` with `i18next-icu` (mobile) can consume the same files.
- ICU supports pluralization, interpolation, and formatting — essential for dates, currencies, and counts.

### Proposed Structure

```
packages/translations/
  src/
    messages/
      pt-BR.json
      es-MX.json
      en-GB.json
      pt-PT.json
    index.ts
  package.json
```

### Example Message File

```json
{
  "auth": {
    "login": {
      "title": "Entrar",
      "emailLabel": "E-mail",
      "passwordLabel": "Senha",
      "forgotPassword": "Esqueceu a senha?",
      "submit": "Entrar",
      "error": {
        "invalidCredentials": "E-mail ou senha incorretos.",
        "rateLimited": "Muitas tentativas. Aguarde {seconds} segundos."
      }
    }
  },
  "booking": {
    "create": {
      "success": "Agendamento confirmado!",
      "error": {
        "professionalUnavailable": "Profissional não disponível.",
        "slotTaken": "Outro cliente acabou de selecionar este horário. Escolha outro."
      }
    },
    "status": {
      "confirmed": "Confirmado",
      "pending": "Pendente",
      "cancelled": "Cancelado",
      "completed": "Realizado"
    }
  },
  "chat": {
    "placeholder": "Mensagem para {name}...",
    "emptyState": "Nenhuma mensagem ainda. Envie a primeira mensagem abaixo.",
    "unreadBadge": "{count, plural, =0 {} one {# nova} other {# novas}}"
  }
}
```

### Web Integration (`next-intl`)

```ts
// app/layout.tsx (future)
import { getMessages } from '@/packages/translations'

export default async function RootLayout({ children }) {
  const messages = await getMessages('pt-BR')
  return (
    <NextIntlClientProvider messages={messages} locale="pt-BR">
      {children}
    </NextIntlClientProvider>
  )
}
```

### Mobile Integration (`i18next`)

```ts
// mobile/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ICU from 'i18next-icu'
import ptBR from '@muuday/translations/messages/pt-BR.json'

i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: { 'pt-BR': { translation: ptBR } },
    lng: 'pt-BR',
    fallbackLng: 'en-GB',
  })
```

### Migration Path

1. Create `packages/translations` with `pt-BR.json`.
2. Extract all hardcoded Portuguese strings from the **most critical user flows** first:
   - Auth (login, signup, password reset)
   - Booking (create, cancel, status)
   - Chat (messages, notifications)
   - Errors (validation, API errors)
3. Web components adopt `next-intl` incrementally.
4. Mobile app uses the same JSON files from day one.
5. Less critical pages (settings, admin) are migrated later.

**Effort:** 5–7 days for core flows. Ongoing extraction as features are touched.

---

## 2. Supabase Database Types

### Current State

No generated types. All queries use raw strings with `any` casting.

### Fix

```bash
# Generate types from the Supabase CLI
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > types/supabase.ts
```

Then create a typed client:

```ts
// lib/supabase/database.types.ts
import type { Database } from '@/types/supabase'

// Use this type everywhere
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
```

Update all queries:

```ts
// BEFORE
const { data } = await supabase.from('bookings').select('*')
// data is any[]

// AFTER
const { data } = await supabase.from('bookings').select('*')
// data is Tables<'bookings'>[] | null
```

**Effort:** 1 day to set up; 2–3 days to annotate existing queries.

---

## 3. Image / Asset Pipeline

### Current State

- Avatars: Supabase Storage (`https://...supabase.co/storage/v1/object/public/...`)
- Professional credentials: Supabase Storage
- No resizing, no CDN optimization
- CSP whitelist includes Supabase Storage domain

### Mobile Requirements

- Thumbnails for professional lists (small, fast)
- Full-size for profile detail views
- Credential documents (PDFs) viewable in-app

### Proposed Solution: Sanity CDN

Given that Sanity is already the chosen CMS for content:

1. **Avatars & professional photos** → Upload to Sanity. Use Sanity's image URL builder for transforms:
   ```
   https://cdn.sanity.io/images/.../abc123-300x300.jpg?w=200&h=200&fit=crop
   ```
2. **Credential documents** → Keep in Supabase Storage (binary files, not CMS content).
3. **Marketing images** → Already in Sanity.

If Sanity is not yet provisioned for user-generated content:
- **Alternative**: Cloudinary or Supabase Image Transformations (if enabled).
- **Quick win**: Add query params to Supabase Storage URLs for basic resizing (if supported).

### API Cache Strategy for Mobile

Mobile apps operate on unreliable networks. The API should support efficient caching:

**HTTP Cache Headers:**
```ts
// For static/semi-static data (taxonomy, plan config)
res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')

// For user-specific data (profile, bookings)
res.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
res.headers.set('ETag', generateEtag(data))

// For search results (professionals)
res.headers.set('Cache-Control', 'public, max-age=60')
```

**Mobile Client (TanStack Query):**
```ts
useQuery({
  queryKey: ['professionals', market],
  queryFn: fetchProfessionals,
  staleTime: 60 * 1000,        // 1 minute
  gcTime: 5 * 60 * 1000,       // 5 minutes
  networkMode: 'offlineFirst', // Serve cache when offline
})
```

**Effort:** 2–3 days to set up upload pipeline + URL builder.

---

## 4. Push Notification Infrastructure

### Current State

- Web Push (VAPID) only.
- `push_subscriptions` table: `user_id, endpoint, p256dh, auth`.
- `lib/push/sender.ts` sends via `web-push`.

### Required for Mobile

Extend the `push_subscriptions` table:

```sql
-- Migration: backfill existing rows as 'web'
ALTER TABLE push_subscriptions
ADD COLUMN platform VARCHAR(20) NOT NULL DEFAULT 'web'
  CHECK (platform IN ('web', 'ios', 'android', 'expo')),
ADD COLUMN push_token TEXT,
ADD COLUMN device_id TEXT,
ADD COLUMN app_version TEXT,
ADD COLUMN os_version TEXT;

-- Backfill: all existing subscriptions are web push
UPDATE push_subscriptions SET platform = 'web' WHERE platform = 'web';

-- Add index for fast lookup by user + platform
CREATE INDEX idx_push_subscriptions_user_platform
ON push_subscriptions(user_id, platform);

-- Notes:
-- - web: endpoint + p256dh + auth (existing columns)
-- - native: push_token (FCM/APNS/Expo token), device_id for deduplication
```

Create a new sender module:

```ts
// lib/push/native-sender.ts
export async function sendNativePush(
  userId: string,
  payload: { title: string; body: string; data?: object }
): Promise<number> {
  // 1. Query push_subscriptions for this user where platform != 'web'
  // 2. For Expo tokens: call https://exp.host/--/api/v2/push/send
  // 3. For FCM tokens: call Firebase Admin SDK
  // 4. For APNS tokens: call apn provider
}
```

**Unified sender** (called from chat, booking reminders, etc.):

```ts
// lib/push/unified-sender.ts
export async function sendPushToUser(userId, payload, options) {
  const webSent = await sendWebPush(userId, payload, options)
  const nativeSent = await sendNativePush(userId, payload, options)
  return webSent + nativeSent
}
```

**Recommendation**: Use **Expo Push Service** if building with Expo.
- One API for both iOS and Android.
- No need to manage FCM/APNS certificates directly.
- Simply collect `ExpoPushToken` from the device and POST to `https://exp.host/--/api/v2/push/send`.

**Effort:** 3–4 days (table migration + sender + API endpoint for token registration).

---

## 5. API Versioning & Contracts

### Rule

All mobile-facing endpoints are prefixed with `/api/v1/`. Existing unversioned routes remain for backward compatibility but should be considered deprecated.

### Versioning Strategy

- **URL path versioning**: `/api/v1/bookings`, `/api/v2/bookings`.
- **Not header versioning**: Easier to debug, cache-friendly.
- **Bump major version** when breaking changes are introduced (e.g., removing a field).
- **Add fields freely** in minor versions (no URL change).

### Pagination & Sparse Fieldsets

Mobile list screens need small, fast payloads:

**Cursor-based pagination (required for all list endpoints):**
```http
GET /api/v1/professionals/search?market=BR&cursor=abc123&limit=20
→ {
  "data": [...],
  "pagination": {
    "nextCursor": "def456",
    "hasMore": true
  }
}
```

**Sparse fieldsets (optional, reduces payload size):**
```http
GET /api/v1/professionals/search?fields=id,full_name,avatar_url,session_price,currency
→ Returns only requested fields
```

**Why cursor-based?**
- Offset pagination (`?page=2`) breaks when items are inserted/deleted during scrolling.
- Cursor pagination is stable and works with real-time updates.
- Required for infinite scroll in mobile lists.

### Request/Response DTOs

Every API route must have a documented contract. Use Zod schemas as the source of truth:

```ts
// lib/schemas/api/bookings.ts
import { z } from 'zod'

export const CreateBookingRequest = z.object({
  professionalId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
  bookingType: z.enum(['one_off', 'recurring', 'batch']).default('one_off'),
})

export const CreateBookingResponse = z.object({
  success: z.boolean(),
  bookingId: z.string().uuid().optional(),
  error: z.string().optional(),
  reasonCode: z.string().optional(),
})

export type CreateBookingRequest = z.infer<typeof CreateBookingRequest>
export type CreateBookingResponse = z.infer<typeof CreateBookingResponse>
```

### OpenAPI / Documentation

Generate API docs from Zod schemas using `zod-to-openapi` or similar. Mobile team needs this to build clients.

**Effort:** 1–2 days to set up versioning + DTO patterns.

---

## 6. Error Handling Standard

### Current State

Inconsistent error shapes. Some return `{ error: string }`, others return `{ success: false, error: string }`, others throw.

### Standard (Apply Everywhere)

```ts
interface ApiError {
  code: string        // machine-readable, e.g., "BOOKING_SLOT_TAKEN"
  message: string     // human-readable, translated
  details?: object    // extra context
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}
```

### Error Codes by Domain

| Domain | Code Examples |
|--------|---------------|
| Auth | `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED`, `AUTH_RATE_LIMITED` |
| Booking | `BOOKING_PRO_UNAVAILABLE`, `BOOKING_SLOT_TAKEN`, `BOOKING_PAST_DATE` |
| Chat | `CHAT_NOT_PARTICIPANT`, `CHAT_MESSAGE_TOO_LONG` |
| Payment | `PAYMENT_FAILED`, `PAYMENT_PRICE_MISSING` |
| Profile | `PROFILE_NOT_FOUND`, `PROFILE_INCOMPLETE` |

**Mobile benefit:** The app can show specific UI for specific codes (e.g., "Escolha outro horário" with a button to open the calendar for `BOOKING_SLOT_TAKEN`).

---

## 7. Feature Flags (PostHog)

### Current State

PostHog is configured but feature flags are lightly used.

### Shared Flag Strategy

Define flags that work across web and mobile:

```
- mobile_app_enabled         → Global kill switch for mobile features
- mobile_video_calls         → Enable/disable video in mobile
- mobile_recurring_bookings  → Enable recurring packages in mobile
- mobile_biometric_login     → Enable Face ID / fingerprint
- new_search_algorithm       → Affects both web and mobile (same API)
```

Both web (`posthog-js`) and mobile (`posthog-react-native`) evaluate the same flags using the same user ID.

---

## 8. Logging & Observability

### Current State

- Sentry for error tracking (Next.js SDK).
- PostHog for product analytics.
- Console logs in development.

### Mobile Requirements

- **Sentry React Native SDK**: Captures native crashes (iOS/Android) + JS errors.
- **PostHog React Native SDK**: Same event taxonomy as web.
- **Structured logging**: Use the same `logBookingEvent()`, `reportBookingError()` patterns.

### Unified Event Taxonomy

| Event | Web Property | Mobile Property |
|-------|--------------|-----------------|
| `booking_created` | `booking_type`, `professional_id` | same + `platform: 'ios'` |
| `session_joined` | `booking_id`, `role` | same + `connection_type` |
| `message_sent` | `conversation_id` | same + `platform` |
| `profile_updated` | `field_changed` | same |

---

## 9. Environment Variables

### New Variables Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `MOBILE_API_KEY` | API routes | Validates requests from the mobile app |
| `SUPABASE_AUTH_GOOGLE_IOS_CLIENT_ID` | Supabase Auth | Native Google Sign-In on iOS |
| `SUPABASE_AUTH_GOOGLE_ANDROID_CLIENT_ID` | Supabase Auth | Native Google Sign-In on Android |
| `EXPO_ACCESS_TOKEN` | Backend (optional) | Verify Expo push tokens |
| `FCM_SERVER_KEY` | Backend | Send FCM pushes (if not using Expo) |
| `APNS_KEY_ID` | Backend | Send APNS pushes (if not using Expo) |
| `APNS_TEAM_ID` | Backend | Apple developer team ID |
| `APNS_BUNDLE_ID` | Backend | iOS bundle identifier |

---

## 10. Shared Packages Structure (Monorepo)

If the team moves to a monorepo (recommended):

```
muuday/
  apps/
    web/                  → Current Next.js app
    mobile/               → Expo React Native app
  packages/
    translations/         → ICU JSON files
    design-tokens/        → Colors, spacing, typography
    api-schemas/          → Zod schemas shared by web + mobile
    supabase-types/       → Generated DB types
    eslint-config/        → Shared lint rules
    tsconfig/             → Shared TS configs
```

If monorepo is too heavy now, start with a single repo and use path aliases:
```
lib/
  translations/           → JSON files
  schemas/                → Zod schemas
  design-tokens.ts        → Shared tokens
```

The mobile app can import these via a shared npm package or git submodule later.
