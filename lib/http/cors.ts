import { NextResponse } from 'next/server'
import { getAppBaseUrl, getPrimaryDomainHost, getWaitlistAllowedOrigins } from '@/lib/config/app-url'

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000'

type CorsPolicy = {
  allowOrigins: Set<string>
  allowMethods: readonly string[]
  allowHeaders: readonly string[]
  exposeHeaders?: readonly string[]
  allowCredentials?: boolean
  maxAgeSeconds?: number
  allowWithoutOrigin?: boolean
}

type CorsDecision = {
  allowed: boolean
  origin: string | null
  headers: Record<string, string>
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null

  try {
    const parsed = new URL(value)
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '')
  } catch {
    return null
  }
}

function parseOriginsFromEnv(envName: string) {
  const value = process.env[envName]
  if (!value) return new Set<string>()

  return new Set(
    value
      .split(',')
      .map(part => normalizeOrigin(part.trim()))
      .filter((origin): origin is string => Boolean(origin)),
  )
}

function getBaseAllowedOrigins() {
  const origins = new Set<string>()

  const appBaseUrl = normalizeOrigin(getAppBaseUrl())
  const primaryDomainHost = getPrimaryDomainHost()

  if (appBaseUrl) {
    origins.add(appBaseUrl)
  }

  if (primaryDomainHost) {
    origins.add(`https://${primaryDomainHost}`)
    origins.add(`https://www.${primaryDomainHost}`)
  }

  parseOriginsFromEnv('API_CORS_ORIGINS').forEach(extraOrigin => {
    origins.add(extraOrigin)
  })

  if (process.env.NODE_ENV === 'development') {
    origins.add(DEFAULT_DEV_ORIGIN)
  }

  return origins
}

function withBaseHeaders(
  origin: string | null,
  policy: CorsPolicy,
  includePreflightMaxAge: boolean,
) {
  const headers: Record<string, string> = {
    Vary: 'Origin',
  }

  if (!origin) return headers

  headers['Access-Control-Allow-Origin'] = origin
  headers['Access-Control-Allow-Methods'] = policy.allowMethods.join(', ')
  headers['Access-Control-Allow-Headers'] = policy.allowHeaders.join(', ')

  if (policy.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  if (policy.exposeHeaders && policy.exposeHeaders.length > 0) {
    headers['Access-Control-Expose-Headers'] = policy.exposeHeaders.join(', ')
  }

  if (includePreflightMaxAge && policy.maxAgeSeconds && policy.maxAgeSeconds > 0) {
    headers['Access-Control-Max-Age'] = String(policy.maxAgeSeconds)
  }

  return headers
}

export const PUBLIC_API_CORS_POLICY: CorsPolicy = {
  allowOrigins: getBaseAllowedOrigins(),
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Cron-Secret'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Source', 'Retry-After'],
  allowCredentials: true,
  maxAgeSeconds: 86400,
  allowWithoutOrigin: true,
}

export const WAITLIST_API_CORS_POLICY: CorsPolicy = {
  ...PUBLIC_API_CORS_POLICY,
  allowOrigins: getWaitlistAllowedOrigins(),
}

export const INTERNAL_API_CORS_POLICY: CorsPolicy = {
  ...PUBLIC_API_CORS_POLICY,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}

export const WEBHOOK_API_CORS_POLICY: CorsPolicy = {
  allowOrigins: parseOriginsFromEnv('WEBHOOK_CORS_ORIGINS'),
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature', 'X-Signature', 'X-Cron-Secret'],
  allowCredentials: false,
  maxAgeSeconds: 600,
  allowWithoutOrigin: true,
}

export function evaluateCorsRequest(
  request: Request,
  policy: CorsPolicy,
): CorsDecision {
  const requestOrigin = normalizeOrigin(request.headers.get('origin'))
  const allowWithoutOrigin = policy.allowWithoutOrigin !== false

  if (!requestOrigin) {
    return {
      allowed: allowWithoutOrigin,
      origin: null,
      headers: withBaseHeaders(null, policy, false),
    }
  }

  const allowed = policy.allowOrigins.has(requestOrigin)
  return {
    allowed,
    origin: requestOrigin,
    headers: withBaseHeaders(requestOrigin, policy, false),
  }
}

export function applyCorsHeaders(response: Response, headers: Record<string, string>) {
  const nextResponse =
    response instanceof NextResponse
      ? response
      : new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })

  for (const [key, value] of Object.entries(headers)) {
    nextResponse.headers.set(key, value)
  }

  return nextResponse
}

export function createCorsErrorResponse(
  request: Request,
  policy: CorsPolicy,
  body: Record<string, unknown> = { error: 'Origin not allowed' },
) {
  const decision = evaluateCorsRequest(request, policy)
  return NextResponse.json(body, {
    status: 403,
    headers: decision.headers,
  })
}

export function createCorsPreflightResponse(request: Request, policy: CorsPolicy) {
  const decision = evaluateCorsRequest(request, policy)
  const headers = withBaseHeaders(decision.origin, policy, true)
  return new NextResponse(null, {
    status: decision.allowed ? 204 : 403,
    headers,
  })
}
