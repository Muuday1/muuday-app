import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * OAuth initiation proxy.
 *
 * Problem: calling supabase.auth.signInWithOAuth() client-side redirects the
 * browser to the Supabase project URL (e.g. xxx.supabase.co), which is visible
 * in the address bar and on the provider consent screen.
 *
 * Solution: this endpoint initiates OAuth server-side using the Supabase SSR
 * client, obtains the provider URL, and redirects the browser to it. The
 * browser first visits our custom domain (/api/auth/oauth), then gets
 * redirected to Supabase. At least the starting point is on the app's domain.
 *
 * Note: the final Supabase auth URL will still appear briefly during the
 * provider handshake. Full domain masking requires Supabase Custom Domains.
 */

const ALLOWED_PROVIDERS = new Set(['google', 'facebook', 'apple'])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  const redirectTo = searchParams.get('redirect_to')

  if (!provider || !ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieEncoding: 'raw',
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options })
        })
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google' | 'facebook' | 'apple',
    options: {
      redirectTo: redirectTo || undefined,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data?.url) {
    Sentry.captureMessage(`[auth/oauth] OAuth initiation failed: ${error?.message || 'unknown'}`, {
      level: 'error',
      tags: { area: 'auth_oauth', context: 'initiation' },
    })
    return NextResponse.json(
      { error: error?.message || 'OAuth initiation failed' },
      { status: 500 }
    )
  }

  const response = NextResponse.redirect(data.url)
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
