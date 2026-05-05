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

const ALLOWED_NEXT_PATHS = [
  '/buscar',
  '/dashboard',
  '/agenda',
  '/perfil',
  '/configuracoes',
  '/favoritos',
  '/completar-perfil',
  '/onboarding-profissional',
  '/planos',
  '/sessao',
  '/avaliar',
  '/editar-perfil-profissional',
  '/configuracoes-agendamento',
  '/disponibilidade',
  '/financeiro',
  '/admin',
  '/mensagens',
  '/ajuda',
  '/sobre',
] as const

function isAllowedNextPath(value: string | null) {
  if (!value || value === '/') return false
  if (!value.startsWith('/') || value.startsWith('//')) return false
  // Exact match
  if ((ALLOWED_NEXT_PATHS as readonly string[]).includes(value)) return true
  // Allow subpaths for known prefixes (e.g. /sessao/123, /agendar/abc)
  for (const prefix of ALLOWED_NEXT_PATHS) {
    if (value.startsWith(`${prefix}/`)) return true
  }
  return false
}

function sanitizeNextPath(value: string | null) {
  return isAllowedNextPath(value) ? value : ''
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

  try {
    const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieEncoding: 'raw',
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

    const [{ data: profile }, { data: professionalRow }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, country, timezone, role')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('professionals')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const effectiveRole = profile?.role || metadataRole || roleHint

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

      // Professionals must complete profile even if country/timezone exist
      if ((profileAfterUpsert?.role === 'profissional') && !professionalRow) {
        return redirectWithSession('/completar-perfil')
      }

      return redirectWithSession(resolveDestinationByRole(profileAfterUpsert?.role))
    }

    if (!profile.country || !profile.timezone) {
      return redirectWithSession(resolveCompleteAccountPath())
    }

    // Professionals must complete profile before accessing dashboard
    if (effectiveRole === 'profissional' && !professionalRow) {
      return redirectWithSession('/completar-perfil')
    }

    return redirectWithSession(resolveDestinationByRole(profile.role))
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error('auth_callback_unexpected_error'), {
      tags: { area: 'auth', flow: 'oauth_callback' },
      extra: { role_hint: roleHint },
    })
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }
}
