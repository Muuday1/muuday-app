import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
// TODO: Re-enable Database generic after schema alignment (P3.7)
// import type { Database } from '@/types/supabase-generated'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
      },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {
            // Expected in Server Components where cookies are read-only.
            // Log in development to surface unexpected cookie issues.
            if (process.env.NODE_ENV === 'development') {
              console.warn('[supabase/server] Cookie set failed (expected in RSC):', e)
            }
          }
        },
      },
    }
  )
}
