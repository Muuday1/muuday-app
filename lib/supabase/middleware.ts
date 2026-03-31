import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // #region agent log (c00bae)
  fetch('http://127.0.0.1:7729/ingest/a51596be-eb67-4191-9398-29f465a9e679', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c00bae' },
    body: JSON.stringify({
      sessionId: 'c00bae',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'lib/supabase/middleware.ts:5',
      message: 'middleware entry',
      data: { pathname: request.nextUrl.pathname, hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), hasAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase env vars are missing (misconfigured preview/prod), do not crash middleware.
  // Keep public routes working and enforce basic route protection without auth.
  if (!supabaseUrl || !supabaseAnonKey) {
    const pathname = request.nextUrl.pathname
    // #region agent log (c00bae)
    fetch('http://127.0.0.1:7729/ingest/a51596be-eb67-4191-9398-29f465a9e679', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c00bae' },
      body: JSON.stringify({
        sessionId: 'c00bae',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'lib/supabase/middleware.ts:22',
        message: 'middleware env missing branch',
        data: { pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

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
      '/editar-perfil-profissional',
      '/configuracoes-agendamento',
      '/disponibilidade',
      '/financeiro',
    ]
    const isProtected = protectedPaths.some(path => pathname.startsWith(path))
    const isAdminRoute = pathname.startsWith('/admin')

    if (isProtected || isAdminRoute) {
      // #region agent log (c00bae)
      fetch('http://127.0.0.1:7729/ingest/a51596be-eb67-4191-9398-29f465a9e679', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c00bae' },
        body: JSON.stringify({
          sessionId: 'c00bae',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'lib/supabase/middleware.ts:53',
          message: 'redirecting to /login due to env missing',
          data: { pathname, isProtected, isAdminRoute },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

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
  // #region agent log (c00bae)
  fetch('http://127.0.0.1:7729/ingest/a51596be-eb67-4191-9398-29f465a9e679', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c00bae' },
    body: JSON.stringify({
      sessionId: 'c00bae',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'lib/supabase/middleware.ts:92',
      message: 'supabase getUser result',
      data: { pathname: request.nextUrl.pathname, hasUser: Boolean(user) },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  const pathname = request.nextUrl.pathname

  // Public routes accessible without login (search/discovery)
  const publicAppPaths = ['/buscar', '/profissional']
  const isPublicApp = publicAppPaths.some(path => pathname.startsWith(path))

  // Auth-required routes
  const protectedPaths = ['/dashboard', '/agenda', '/perfil', '/configuracoes', '/favoritos', '/completar-perfil', '/onboarding-profissional', '/agendar', '/solicitar', '/editar-perfil-profissional', '/configuracoes-agendamento', '/disponibilidade', '/financeiro']
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    cachedRole = profile?.role || null
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
