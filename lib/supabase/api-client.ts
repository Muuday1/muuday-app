import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

function getSupabaseProjectRef(url: string): string | null {
  try {
    const host = new URL(url).hostname
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function getAuthCookieName(supabaseUrl: string): string {
  const ref = getSupabaseProjectRef(supabaseUrl)
  return ref ? `sb-${ref}-auth-token` : 'sb-auth-token'
}

/**
 * Creates a Supabase client for API routes that supports BOTH cookie-based
 * sessions (web browser) and Bearer token authentication (mobile app).
 *
 * Usage in API routes:
 *   const supabase = await createApiClient(request)
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 * The client checks for an `Authorization: Bearer <token>` header first.
 * If present, it injects the token as a synthetic cookie so Supabase's
 * internal session resolution finds it. If absent, it falls back to
 * regular cookies (web browser flow).
 */
export async function createApiClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  const cookieStore = await cookies()
  const authCookieName = getAuthCookieName(supabaseUrl)

  // Extract bearer token from Authorization header (mobile app)
  const authHeader = request?.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  // Extract full Supabase session JSON from X-Supabase-Session header (mobile app)
  // The Supabase SSR cookie storage expects the full session JSON, not just
  // the access_token. Mobile apps can send the full session (as returned by
  // supabase.auth.signInWithPassword) in this header.
  const sessionHeader = request?.headers.get('x-supabase-session')

  // Build the cookie getter that prefers bearer token when present
  const getAllCookies = () => {
    const cookieList = cookieStore.getAll()

    if (sessionHeader) {
      // Mobile app sent full session JSON — inject it directly as cookie
      const filtered = cookieList.filter(c => c.name !== authCookieName)
      filtered.push({ name: authCookieName, value: sessionHeader })
      return filtered
    }

    if (bearerToken) {
      // Legacy fallback: inject the bearer token as a synthetic cookie.
      // Note: this only works if the Supabase SSR storage accepts raw
      // access_token values. For full session support, use X-Supabase-Session.
      const filtered = cookieList.filter(c => c.name !== authCookieName)
      filtered.push({ name: authCookieName, value: bearerToken })
      return filtered
    }

    return cookieList
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
      },
      cookies: {
        getAll() {
          return getAllCookies()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {
            // Expected in read-only contexts (e.g. when called from a
            // non-writable cookie store). In API routes this should not
            // happen for normal requests, but we guard anyway.
            if (process.env.NODE_ENV === 'development') {
              console.warn('[supabase/api-client] Cookie set failed:', e)
            }
          }
        },
      },
    }
  )
}
