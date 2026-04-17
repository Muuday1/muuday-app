import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'
import { getAppBaseUrl } from '@/lib/config/app-url'

function resolveRequestOrigin(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin
  if (requestOrigin) return requestOrigin
  return getAppBaseUrl()
}

function sanitizeNextPath(value: string | null) {
  if (!value) return ''
  if (value === '/') return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

function normalizeRole(value: unknown) {
  const normalized = String(value || '').toLowerCase().trim()
  if (normalized === 'admin' || normalized === 'profissional' || normalized === 'usuario') {
    return normalized
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const roleHint = normalizeRole(searchParams.get('role')) || 'usuario'
  const safeNextPath = sanitizeNextPath(searchParams.get('next'))
  const baseUrl = resolveRequestOrigin(request)

  if (oauthError || !code) {
    Sentry.captureMessage('auth_oauth_callback_invalid_request', {
      level: 'warning',
      tags: { area: 'auth', flow: 'oauth_callback' },
      extra: {
        has_code: Boolean(code),
        oauth_error: oauthError || null,
      },
    })
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            pendingCookies.push({ name, value, options })
          })
        },
      },
    },
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    Sentry.captureException(exchangeError, {
      tags: { area: 'auth', flow: 'oauth_callback' },
    })
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    Sentry.captureMessage('auth_oauth_callback_missing_user', {
      level: 'error',
      tags: { area: 'auth', flow: 'oauth_callback' },
    })
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  function redirectWithSession(pathname: string) {
    const redirectResponse = NextResponse.redirect(`${baseUrl}${pathname}`)
    pendingCookies.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  function resolveCompleteAccountPath() {
    const params = new URLSearchParams()
    params.set('role', roleHint)
    if (safeNextPath) params.set('next', safeNextPath)
    return `/completar-conta?${params.toString()}`
  }

  function resolveDestinationByRole(role: string | null | undefined) {
    if (safeNextPath) return safeNextPath
    return resolvePostLoginDestination(role)
  }

  const metadataRole =
    normalizeRole(user.app_metadata?.role) ||
    normalizeRole((user as { raw_app_meta_data?: Record<string, unknown> } | null)?.raw_app_meta_data?.role) ||
    normalizeRole(user.user_metadata?.role)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, country, timezone, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Usuario'

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      full_name: String(fullName),
      role: metadataRole || roleHint,
    })

    const { data: profileAfterUpsert } = await supabase
      .from('profiles')
      .select('country, timezone, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profileAfterUpsert?.country || !profileAfterUpsert?.timezone) {
      return redirectWithSession(resolveCompleteAccountPath())
    }

    return redirectWithSession(resolveDestinationByRole(profileAfterUpsert?.role))
  }

  if (!profile.country || !profile.timezone) {
    return redirectWithSession(resolveCompleteAccountPath())
  }

  return redirectWithSession(resolveDestinationByRole(profile.role))
}
