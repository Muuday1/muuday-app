import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'

type ProfileRole = 'usuario' | 'profissional' | 'admin'

const ALLOWED_PROFILE_ROLES = new Set<ProfileRole>(['usuario', 'profissional', 'admin'])

function normalizeProfileRole(value: unknown): ProfileRole | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return ALLOWED_PROFILE_ROLES.has(normalized as ProfileRole)
    ? (normalized as ProfileRole)
    : null
}

function shouldSampleFallback(userId: string, sampleRatePercent = 5) {
  if (!userId) return false
  let hash = 0
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return hash % 100 < sampleRatePercent
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase env vars are missing (misconfigured preview/prod), do not crash middleware.
  // Keep public routes working and enforce basic route protection without auth.
  if (!supabaseUrl || !supabaseAnonKey) {
    const pathname = request.nextUrl.pathname

    const protectedPaths = [
      '/dashboard',
      '/agenda',
      '/perfil',
      '/configuracoes',
      '/favoritos',
      '/completar-perfil',
      '/onboarding-profissional',
      '/agendar',
      '/solicitar',
      '/mensagens',
      '/editar-perfil-profissional',
      '/configuracoes-agendamento',
      '/disponibilidade',
      '/financeiro',
    ]
    const isProtected = protectedPaths.some(path => pathname.startsWith(path))
    const isAdminRoute = pathname.startsWith('/admin')

    if (isProtected || isAdminRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      if (!isAdminRoute) url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const jwtClaimRole = normalizeProfileRole(
    user?.app_metadata?.role ??
    (user as { raw_app_meta_data?: Record<string, unknown> } | null)?.raw_app_meta_data?.role
  )

  const pathname = request.nextUrl.pathname

  // Public routes accessible without login (search/discovery)
  const publicAppPaths = ['/buscar', '/profissional']
  const isPublicApp = publicAppPaths.some(path => pathname.startsWith(path))

  // Auth-required routes
  const protectedPaths = ['/dashboard', '/agenda', '/perfil', '/configuracoes', '/favoritos', '/completar-perfil', '/onboarding-profissional', '/agendar', '/solicitar', '/mensagens', '/editar-perfil-profissional', '/configuracoes-agendamento', '/disponibilidade', '/financeiro']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  // Admin-only routes
  const isAdminRoute = pathname.startsWith('/admin')

  // Professional-only routes
  const professionalPaths = ['/dashboard', '/editar-perfil-profissional', '/configuracoes-agendamento', '/disponibilidade', '/completar-perfil', '/onboarding-profissional', '/financeiro']
  const isProfessionalRoute = professionalPaths.some(path => pathname.startsWith(path))
  const userOnlyPaths = ['/agendar', '/solicitar', '/favoritos']
  const isUserOnlyRoute = userOnlyPaths.some(path => pathname.startsWith(path))
  let cachedRole: string | null = null
  let didLoadRole = false

  async function getProfileRole() {
    if (didLoadRole) return cachedRole
    didLoadRole = true
    if (!user) return null
    if (jwtClaimRole) {
      cachedRole = jwtClaimRole
      return cachedRole
    }

    if (process.env.NODE_ENV === 'production' && shouldSampleFallback(user.id, 5)) {
      Sentry.captureMessage('middleware_role_fallback_to_profile', {
        level: 'warning',
        tags: {
          area: 'auth_role',
          role_source: 'profile_fallback',
        },
        extra: {
          userIdPrefix: user.id.slice(0, 8),
          path: pathname,
        },
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    cachedRole = normalizeProfileRole(profile?.role) ?? null
    return cachedRole
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based guards (admin and professional routes)
  if (user && (isAdminRoute || isProfessionalRoute || isUserOnlyRoute)) {
    const role = await getProfileRole()

    if (isAdminRoute && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/buscar'
      return NextResponse.redirect(url)
    }

    if (isProfessionalRoute && role !== 'profissional') {
      const url = request.nextUrl.clone()
      url.pathname = '/buscar'
      return NextResponse.redirect(url)
    }

    if (isUserOnlyRoute && role !== 'usuario' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'profissional' ? '/dashboard' : '/buscar'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && ['/login', '/cadastro'].includes(pathname)) {
    const role = await getProfileRole()
    const url = request.nextUrl.clone()
    url.pathname = role === 'profissional' ? '/dashboard' : '/buscar'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
