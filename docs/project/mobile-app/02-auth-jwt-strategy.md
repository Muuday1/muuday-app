# 02 — Authentication & JWT Strategy for Mobile

## Problem Statement

The current auth stack is **100% cookie-based** via `@supabase/ssr`. The middleware, Server Components, and API routes all call `supabase.auth.getUser()` which reads the `sb-access-token` cookie. React Native cannot use cookies for API authentication.

## Solution: Dual-Mode Auth (Cookies + JWT Headers)

Supabase Auth natively supports both. The same `supabase.auth.getUser()` call works with either a cookie or a `Bearer` token. We just need to wire it up correctly in our API layer.

### How Supabase Auth Works Under the Hood

The Supabase server client (`createServerClient` from `@supabase/ssr`) calls `getUser()` by:
1. Reading the session from the configured storage adapter (cookies, by default).
2. Sending the JWT to `auth/v1/user` on the Supabase Auth server.
3. Returning the user object.

If we provide a **custom storage adapter** that checks cookies **first**, then falls back to the `Authorization` header, mobile requests will work transparently.

### Implementation Plan

#### Step 1: Create a Unified Auth Client Factory

Replace `lib/supabase/server.ts` with a dual-mode client:

```ts
// lib/supabase/server.ts (proposed)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { secure: true, sameSite: 'lax', httpOnly: true },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Expected in RSC
          }
        },
      },
    }
  )
}

/**
 * For API routes: supports both cookies AND Authorization header.
 * Call this from every app/api/*/route.ts file instead of createClient().
 */
export async function createApiClient(request?: NextRequest) {
  const cookieStore = await cookies()
  const authHeader = request?.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  // Custom storage adapter that prefers the bearer token for session retrieval
  const storageAdapter = {
    getAll() {
      // If bearer token is present, inject it as a synthetic cookie so
      // Supabase's internal logic finds it.
      if (bearerToken) {
        return [
          { name: 'sb-access-token', value: bearerToken },
          ...cookieStore.getAll().filter(c => c.name !== 'sb-access-token'),
        ]
      }
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch {
        // Expected in read-only contexts
      }
    },
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { secure: true, sameSite: 'lax', httpOnly: true },
      cookies: storageAdapter,
    }
  )
}
```

**Risk & Mitigation:**
- `@supabase/ssr` internals may change. Mitigation: wrap in our own abstraction (`lib/supabase/api-client.ts`) and pin the `@supabase/ssr` version. If the library changes, we update one file.
- Refresh tokens: Supabase auto-refreshes expired access tokens using the refresh token. In cookie mode, this updates the cookie. In JWT header mode, the mobile app is responsible for refreshing the token using `supabase.auth.refreshSession()` and storing the new access token in `AsyncStorage`.

#### Step 2: Mobile App Auth Flow

```ts
// React Native / Expo (pseudo-code)
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// The session is auto-stored in AsyncStorage.
// To call our API routes, extract the access token:
const session = await supabase.auth.getSession()
const accessToken = session.data.session?.access_token

const response = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Mobile-API-Key': MOBILE_API_KEY,
  },
})
```

#### Step 3: Middleware Update

The middleware (`lib/supabase/middleware.ts`) also needs to support bearer tokens. Currently it only uses `createServerClient` with cookies. We need a version of `updateSession` that accepts the `Authorization` header:

```ts
// In middleware.ts
const authHeader = request.headers.get('authorization')
const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

const supabase = createServerClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      getAll() {
        if (bearerToken) {
          return [
            { name: 'sb-access-token', value: bearerToken },
            ...request.cookies.getAll().filter(c => c.name !== 'sb-access-token'),
          ]
        }
        return request.cookies.getAll()
      },
      setAll() { /* middleware can't set cookies for bearer requests */ },
    },
  }
)
```

**Important:** Middleware runs on the Edge. The Edge runtime does not have Node.js crypto APIs that some Supabase auth features use. We must test thoroughly on Vercel Edge.

#### Step 4: OAuth for Mobile

Google OAuth on mobile should use **native sign-in**, not web redirect:

- **iOS**: `GoogleSignIn` SDK (or `expo-auth-session` with `promptAsync`).
- **Android**: `expo-auth-session` or `@react-native-google-signin/google-signin`.
- After native OAuth, exchange the provider token with Supabase using `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`.

This requires Supabase Auth to be configured with the **iOS Client ID** and **Android Client ID** in addition to the web Client ID.

**Action:** Add env vars:
- `SUPABASE_AUTH_GOOGLE_IOS_CLIENT_ID`
- `SUPABASE_AUTH_GOOGLE_ANDROID_CLIENT_ID`

---

## Auth Flow Comparison: Web vs Mobile

| Flow | Web (Today) | Mobile (Target) |
|------|-------------|-----------------|
| Password login | `signInWithPassword` → cookie | `signInWithPassword` → AsyncStorage → Bearer header |
| Google OAuth | `signInWithOAuth` → redirect → cookie | Native Google SDK → `signInWithIdToken` → AsyncStorage |
| Session refresh | Cookie auto-refreshed by `@supabase/ssr` | `autoRefreshToken: true` in RN Supabase client |
| Logout | `signOut` → cookie cleared | `signOut` → AsyncStorage cleared |
| API call auth | Cookie sent automatically | `Authorization: Bearer <token>` + `X-Mobile-API-Key` |

---

## Security Considerations

1. **Token Storage in Mobile**
   - Do NOT store tokens in `AsyncStorage` for production apps (it is unencrypted).
   - Use **Keychain** (iOS) and **Keystore** (Android).
   - Expo provides `expo-secure-store` which wraps these.
   - Update the mobile Supabase client config:
   ```ts
   import * as SecureStore from 'expo-secure-store'
   const supabase = createClient(url, key, {
     auth: {
       storage: {
         getItem: (key) => SecureStore.getItemAsync(key),
         setItem: (key, value) => SecureStore.setItemAsync(key, value),
         removeItem: (key) => SecureStore.deleteItemAsync(key),
       },
     },
   })
   ```

2. **Deep Link Hijacking**
   - OAuth callbacks and password reset deep links must use a **verified custom scheme** (`muuday://auth/callback`).
   - Register the scheme in `app.json` / `app.config.js` for Expo.
   - Validate the `state` parameter in OAuth callbacks.

3. **API Key for Mobile**
   - Add a dedicated `MOBILE_API_KEY` env var.
   - API routes verify this key for requests that come from mobile (as a second factor alongside JWT).
   - **⚠️ Security Warning:** Static API keys embedded in app bundles can be extracted. Do not rely solely on this key for sensitive operations.
   - **Defense in depth:**
     - Use **Apple App Attest** (iOS) and **Google Play Integrity API** (Android) to verify the app binary is genuine.
     - Implement **certificate pinning** on the mobile app to prevent MITM attacks on public WiFi.
     - Rotate `MOBILE_API_KEY` quarterly and distribute updates via OTA (Expo) or forced app updates.
     - For highest-security operations (e.g., password reset, account deletion), require additional verification (email OTP or biometric re-auth).

4. **Rate Limiting for Mobile**
   - Mobile users may switch between WiFi and cellular, changing their IP.
   - Use `userId` as the primary rate limit key, with `deviceId` as secondary.
   - Add `X-Device-ID` header requirement for mobile API calls.

---

## Implementation Checklist

- [ ] Create `lib/supabase/api-client.ts` with dual-mode cookie + bearer support
- [ ] Update all `app/api/**/route.ts` files to use `createApiClient(request)` instead of `createClient()`
- [ ] Update `middleware.ts` to support bearer tokens for protected route guards
- [ ] Add `MOBILE_API_KEY` env var and validation in CORS / API key middleware
- [ ] Configure Supabase Auth dashboard with iOS/Android OAuth client IDs
- [ ] Document mobile auth flow for the mobile team
- [ ] Add E2E tests for bearer token auth on API routes
