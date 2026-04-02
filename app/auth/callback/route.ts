import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'

function getBaseUrl(request: NextRequest) {
  // Keep OAuth callback on the same origin that started the login flow.
  // This avoids cookie/domain drift between custom domain and vercel domain.
  return request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  // Security: Always default to 'usuario' for OAuth signups.
  // Professional onboarding requires an explicit flow after account creation.
  const roleHint = 'usuario' as const
  const baseUrl = getBaseUrl(request)

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

  let callbackResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          callbackResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            callbackResponse.cookies.set(name, value, options),
          )
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
    callbackResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, country, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Usuário'

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      full_name: String(fullName),
      role: roleHint,
    })

    const { data: profileAfterUpsert } = await supabase
      .from('profiles')
      .select('country, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileAfterUpsert?.role === 'admin') {
      return redirectWithSession('/buscar')
    }

    if (!profileAfterUpsert?.country) {
      return redirectWithSession('/completar-conta')
    }

    return redirectWithSession(resolvePostLoginDestination(profileAfterUpsert.role))
  }

  if (profile.role === 'admin') {
    return redirectWithSession('/buscar')
  }

  if (!profile.country) {
    return redirectWithSession('/completar-conta')
  }

  return redirectWithSession(resolvePostLoginDestination(profile.role))
}
