# Muuday Mobile App

Expo React Native app for Muuday. Built with Expo SDK 54, React Native 0.81.5, React 19.

## Stack

- **Framework:** Expo ~54.0.33 with Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State & Data:** TanStack Query (React Query)
- **Auth:** Supabase Auth with `expo-secure-store` session persistence
- **API:** Typed client calling `/api/v1/*` endpoints with Bearer JWT + session headers
- **Icons:** Lucide React Native

## Project Structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root layout with providers (Auth, Query, SafeArea)
  index.tsx             # Redirect to login or tabs
  login.tsx             # Email/password login screen
  +not-found.tsx        # 404 screen
  (tabs)/               # Protected tab routes
    _layout.tsx         # Tab bar configuration
    index.tsx           # Home / Dashboard
    explore.tsx         # Search / Categories
    bookings.tsx        # My Bookings
    messages.tsx        # Conversations
    profile.tsx         # Profile & Settings

components/             # Shared components
  AuthProvider.tsx      # Auth context with Supabase
  LoadingState.tsx      # Full-screen loader

hooks/                  # TanStack Query hooks
  useUser.ts
  useBookings.ts
  useConversations.ts

lib/                    # Core modules
  api.ts                # Typed API client + v1 domain wrappers
  supabase.ts           # Supabase client with SecureStore adapter
  query-client.ts       # TanStack Query client config
  design-tokens.ts      # Theme tokens

types/                  # TypeScript declarations
  nativewind.d.ts       # NativeWind type extensions
```

## Getting Started

### Prerequisites

- Node.js 20+ (see repo root `.nvmrc`)
- `npm` or `yarn`
- iOS Simulator (macOS + Xcode) or Android Emulator

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=https://muuday-app.vercel.app
EXPO_PUBLIC_MOBILE_API_KEY=your-mobile-api-key
```

> `EXPO_PUBLIC_MOBILE_API_KEY` must match the server's `MOBILE_API_KEY` env var.

### Install & Run

```bash
# From repo root
cd mobile
npm install

# iOS
npx expo run:ios

# Android
npx expo run:android

# Or use Expo Go (limited — SecureStore requires dev build)
npx expo start
```

> **Note:** `expo-secure-store` requires a development build. Use `npx expo run:ios` / `npx expo run:android` instead of Expo Go for full auth functionality.

## Auth Flow

1. User enters email/password on `/login`
2. `AuthProvider` calls `supabase.auth.signInWithPassword()`
3. Session persisted in `expo-secure-store` (falls back to AsyncStorage on simulator)
4. `onAuthStateChange` listener updates React context
5. Root layout redirects authenticated users to `/(tabs)` and unauthenticated users to `/login`

## API Client

The `apiV1` object provides typed wrappers for all `/api/v1/*` endpoints:

```ts
import { apiV1 } from '@/lib/api'

// Auth
const { data, error } = await apiV1.auth.signIn(email, password)

// Bookings
const { data } = await apiV1.bookings.list({ status: 'upcoming', limit: 10 })
const { data } = await apiV1.bookings.create({ professionalId: '...', scheduledAt: '...' })

// Conversations
const { data } = await apiV1.conversations.list()
const { data } = await apiV1.conversations.getMessages(convId)
await apiV1.conversations.sendMessage(convId, 'Hello!')
await apiV1.conversations.markAsRead(convId)
```

Every request automatically includes:
- `Authorization: Bearer <supabase_access_token>`
- `X-Supabase-Session: <full_session_json>`
- `X-Mobile-API-Key: <mobile_api_key>`

## Theming

NativeWind is configured in `tailwind.config.js` with Muuday design tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#9FE870` | Buttons, active states, brand accent |
| `surface-page` | `#F8FAFC` | App background |
| `surface-card` | `#FFFFFF` | Cards, inputs |
| `text-primary` | `#0F172A` | Headings, body text |
| `text-muted` | `#64748B` | Secondary text, placeholders |
| `border` | `#E2E8F0` | Dividers, input borders |

## Roadmap

### Sprint 4 (Current) — Foundation ✅
- [x] Expo project setup
- [x] NativeWind theming
- [x] Supabase Auth with SecureStore
- [x] Tab navigation (5 tabs)
- [x] Login screen
- [x] API client with auth headers
- [x] TanStack Query hooks

### Sprint 5 — Core Features
- [ ] Google OAuth sign-in
- [ ] Professional search with infinite scroll
- [ ] Booking creation flow
- [ ] Conversation detail / chat thread
- [ ] Push notifications (Expo Push)

### Sprint 6 — Professional & Video
- [ ] Professional dashboard
- [ ] Calendar management
- [ ] Agora video integration
- [ ] Deep link handling
