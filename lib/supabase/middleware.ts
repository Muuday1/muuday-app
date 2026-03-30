import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (isAdminRoute && profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/buscar'
      return NextResponse.redirect(url)
    }

    if (isProfessionalRoute && profile?.role !== 'profissional' && profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/buscar'
      return NextResponse.redirect(url)
    }

    if (isUserOnlyRoute && profile?.role !== 'usuario') {
      const url = request.nextUrl.clone()
      url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && ['/login', '/cadastro'].includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/buscar'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
