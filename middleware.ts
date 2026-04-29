import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { validateMobileApiKey } from '@/lib/api/mobile-api-key'
import {
  evaluateCorsRequest,
  createCorsPreflightResponse,
  PUBLIC_API_CORS_POLICY,
} from '@/lib/http/cors'

const API_V1_CORS_POLICY = {
  ...PUBLIC_API_CORS_POLICY,
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] as const,
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Mobile-API-Key',
    'X-Device-ID',
  ],
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  let binary = ''
  for (let i = 0; i < array.length; i += 1) {
    binary += String.fromCharCode(array[i])
  }
  return btoa(binary)
}

function buildCspHeader(nonce: string): string {
  const isProduction = process.env.NODE_ENV === 'production'

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    'https://js.stripe.com',
    'https://cdn.agora.io',
    'https://us.i.posthog.com',
  ]

  if (!isProduction) {
    scriptSrc.push("'unsafe-eval'")
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://jbbnbbrroifghrshplsq.supabase.co https://ui-avatars.com https://lh3.googleusercontent.com data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://*.sentry.io https://*.ingest.us.sentry.io https://api.stripe.com https://*.stripe.com https://*.agora.io wss://*.agora.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

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
  // Handle CORS preflight and validate mobile API key for all /api/v1/* routes
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    if (request.method === 'OPTIONS') {
      return createCorsPreflightResponse(request, API_V1_CORS_POLICY)
    }

    const apiKeyError = validateMobileApiKey(request)
    if (apiKeyError) {
      return apiKeyError
    }
  }

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

  // Apply CORS headers to /api/v1/* responses
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const corsDecision = evaluateCorsRequest(request, API_V1_CORS_POLICY)
    if (corsDecision.allowed) {
      for (const [key, value] of Object.entries(corsDecision.headers)) {
        response.headers.set(key, value)
      }
    }
  }

  // Apply CSP with per-request nonce (primary XSS defense)
  const nonce = generateNonce()
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce))

  const hasCountryCookie = request.cookies.has('muuday_country')
  if (!hasCountryCookie) {
    const headerCountry =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-country-code')

    const country = (headerCountry || 'BR').toUpperCase()
    response.cookies.set('muuday_country', country, {
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
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
