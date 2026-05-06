import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'

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

function isPrefetchRequest(request: NextRequest) {
  const purpose = request.headers.get('purpose')?.toLowerCase()
  const secPurpose = request.headers.get('sec-purpose')?.toLowerCase()
  const nextRouterPrefetch = request.headers.get('next-router-prefetch')
  const middlewarePrefetch = request.headers.get('x-middleware-prefetch')
  return (
    purpose === 'prefetch' ||
    secPurpose === 'prefetch' ||
    nextRouterPrefetch === '1' ||
    middlewarePrefetch === '1'
  )
}

function isRscRequest(request: NextRequest) {
  return request.headers.get('rsc') === '1'
}

type SessionCacheEntry = {
  user: { id: string; email?: string | null; app_metadata?: Record<string, unknown>; raw_app_meta_data?: Record<string, unknown> } | null
  expiresAt: number
  cookieHash: string
  lastAccessedAt: number
}

const SESSION_CACHE = new Map<string, SessionCacheEntry>()
const SESSION_CACHE_TTL_MS = 5000
const MAX_CACHE_SIZE = 1000

function hashCookies(cookies: { name: string; value: string }[]): string {
  let hash = 0
  for (const c of cookies) {
    if (c.name.includes('sb-') && c.name.includes('-auth-token')) {
      for (let i = 0; i < c.value.length; i++) {
        hash = (hash * 31 + c.value.charCodeAt(i)) >>> 0
      }
    }
  }
  return String(hash)
}

/** Evict oldest entries by lastAccessedAt when cache exceeds capacity. */
function evictOldestSessions(targetSize: number) {
  if (SESSION_CACHE.size <= targetSize) return
  const entries = Array.from(SESSION_CACHE.entries())
  entries.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt)
  const toDelete = entries.slice(0, SESSION_CACHE.size - targetSize)
  for (const [key] of toDelete) {
    SESSION_CACHE.delete(key)
  }
}

function getCachedSession(cookieHash: string): SessionCacheEntry | null {
  const now = Date.now()
  // Clean expired entries and enforce LRU capacity bound
  if (SESSION_CACHE.size > MAX_CACHE_SIZE) {
    for (const [key, entry] of SESSION_CACHE) {
      if (entry.expiresAt < now) {
        SESSION_CACHE.delete(key)
      }
    }
    // If still over capacity after expiry cleanup, evict oldest by access time
    evictOldestSessions(Math.floor(MAX_CACHE_SIZE * 0.8))
  }
  const entry = SESSION_CACHE.get(cookieHash)
  if (!entry || entry.expiresAt < now) {
    SESSION_CACHE.delete(cookieHash)
    return null
  }
  // Update access time for LRU tracking
  entry.lastAccessedAt = now
  return entry
}

function setCachedSession(cookieHash: string, user: SessionCacheEntry['user']) {
  const now = Date.now()
  // Enforce capacity bound before insertion
  if (SESSION_CACHE.size >= MAX_CACHE_SIZE) {
    evictOldestSessions(MAX_CACHE_SIZE - 1)
  }
  SESSION_CACHE.set(cookieHash, {
    user,
    expiresAt: now + SESSION_CACHE_TTL_MS,
    cookieHash,
    lastAccessedAt: now,
  })
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pathname = request.nextUrl.pathname
  const isPrefetch = isPrefetchRequest(request)
  const isRsc = isRscRequest(request)

  // If Supabase env vars are missing (misconfigured preview/prod), do not crash middleware.
  // Keep public routes working and enforce basic route protection without auth.
  if (!supabaseUrl || !supabaseAnonKey) {
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
      '/pagamento',
    ]
    const isProtected = protectedPaths.some(path => pathname.startsWith(path))
    const isAdminRoute = pathname.startsWith('/admin')

    if ((isProtected || isAdminRoute) && !isPrefetch && !isRsc) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      if (!isAdminRoute) url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  // Avoid background session churn: for App Router prefetch/RSC requests, skip auth refresh.
  // Protected pages still enforce auth/role in their own server components.
  if (isPrefetch || isRsc) {
    return NextResponse.next({ request })
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []
  const supabaseResponse = NextResponse.next({ request })
  const cookieHash = hashCookies(request.cookies.getAll())
  let didRefreshTokens = false

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieEncoding: 'raw',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
      },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          didRefreshTokens = true
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            pendingCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  const applyPendingCookies = (response: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  // Try cache first; skip cache if tokens were refreshed (setAll was called)
  let user: { id: string; email?: string | null; app_metadata?: Record<string, unknown>; raw_app_meta_data?: Record<string, unknown> } | null
  const cached = getCachedSession(cookieHash)
  if (cached && !didRefreshTokens) {
    user = cached.user
  } else {
    try {
      const { data: { user: freshUser } } = await supabase.auth.getUser()
      user = freshUser
    } catch {
      user = null
    }
    if (!didRefreshTokens) {
      setCachedSession(cookieHash, user)
    }
  }
  const jwtClaimRole = normalizeProfileRole(
    user?.app_metadata?.role ??
    (user as { raw_app_meta_data?: Record<string, unknown> } | null)?.raw_app_meta_data?.role
  )

  // Public routes accessible without login (search/discovery)
  const publicAppPaths = ['/buscar', '/profissional']
  const isPublicApp = publicAppPaths.some(path => pathname.startsWith(path))

  // Auth-required routes
  const protectedPaths = ['/dashboard', '/agenda', '/perfil', '/configuracoes', '/favoritos', '/completar-perfil', '/onboarding-profissional', '/agendar', '/solicitar', '/mensagens', '/editar-perfil-profissional', '/configuracoes-agendamento', '/disponibilidade', '/financeiro', '/pagamento']
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profileError) {
      Sentry.captureException(profileError, { tags: { area: 'middleware', subArea: 'profile_role_query' } })
    }
    cachedRole = normalizeProfileRole(profile?.role) ?? null
    return cachedRole
  }

  if (!user && isProtected && !isPrefetch && !isRsc) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return applyPendingCookies(NextResponse.redirect(url))
  }

  if (!user && isAdminRoute && !isPrefetch && !isRsc) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return applyPendingCookies(NextResponse.redirect(url))
  }

  // Role-based guards (admin and professional routes)
  if (user && (isAdminRoute || isProfessionalRoute || isUserOnlyRoute)) {
    const role = await getProfileRole()

    if (isAdminRoute && role !== 'admin' && !isPrefetch && !isRsc) {
      const url = request.nextUrl.clone()
      url.pathname = '/buscar'
      return applyPendingCookies(NextResponse.redirect(url))
    }

    if (isProfessionalRoute && role !== 'profissional' && !isPrefetch && !isRsc) {
      const url = request.nextUrl.clone()
      url.pathname = '/buscar'
      return applyPendingCookies(NextResponse.redirect(url))
    }

    if (isUserOnlyRoute && role !== 'usuario' && role !== 'admin' && !isPrefetch && !isRsc) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'profissional' ? '/dashboard' : '/buscar'
      return applyPendingCookies(NextResponse.redirect(url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && ['/login', '/cadastro'].includes(pathname)) {
    const role = await getProfileRole()
    const url = request.nextUrl.clone()
    url.pathname = resolvePostLoginDestination(role)
    return applyPendingCookies(NextResponse.redirect(url))
  }

  if (user && pathname === '/buscar') {
    const url = request.nextUrl.clone()
    const query = request.nextUrl.search
    url.pathname = '/buscar-auth'
    url.search = query
    return applyPendingCookies(NextResponse.redirect(url))
  }

  return applyPendingCookies(supabaseResponse)
}
