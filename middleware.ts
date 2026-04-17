import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getAppBaseUrl } from '@/lib/config/app-url'

function hasExplicitAppHostConfig() {
  const appBaseUrl = String(process.env.APP_BASE_URL || '').trim()
  const publicAppUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim()
  return Boolean(appBaseUrl || publicAppUrl)
}

function shouldForceAppHostRedirect(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return false

  const pathname = request.nextUrl.pathname
  const authOrAppPaths = [
    '/buscar',
    '/profissional',
    '/login',
    '/cadastro',
    '/auth',
    '/dashboard',
    '/agenda',
    '/perfil',
    '/configuracoes',
    '/favoritos',
    '/completar-perfil',
    '/onboarding-profissional',
    '/agendar',
    '/solicitar',
    '/planos',
    '/sessao',
    '/avaliar',
    '/buscar-auth',
    '/mensagens',
    '/editar-perfil-profissional',
    '/configuracoes-agendamento',
    '/disponibilidade',
    '/financeiro',
    '/admin',
    '/api/professional',
    '/api/stripe/checkout-session',
  ]

  return authOrAppPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  if (shouldForceAppHostRedirect(request) && hasExplicitAppHostConfig()) {
    const appBaseUrl = getAppBaseUrl()
    try {
      const preferredUrl = new URL(appBaseUrl)
      if (preferredUrl.host && request.nextUrl.host !== preferredUrl.host) {
        const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, appBaseUrl)
        return NextResponse.redirect(redirectUrl, 307)
      }
    } catch {
      // Ignore invalid app base URL and continue with the request host.
    }
  }

  const response = await updateSession(request)

  const hasCountryCookie = request.cookies.has('muuday_country')
  if (!hasCountryCookie) {
    const geoCountry = request.geo?.country
    const headerCountry =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-country-code')

    const country = (geoCountry || headerCountry || 'BR').toUpperCase()
    response.cookies.set('muuday_country', country, {
      path: '/',
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
