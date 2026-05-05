import { NextRequest } from 'next/server'

/**
 * Validate that the request Origin or Referer header matches the expected app base URL.
 * This provides CSRF protection for state-changing API routes that are not protected
 * by Next.js built-in Server Action CSRF tokens.
 *
 * In production, requests without a matching Origin/Referer are rejected.
 * In development, the check is relaxed to allow local testing.
 */
export function validateCsrfOrigin(request: NextRequest): { ok: true } | { ok: false; error: string } {
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true }
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''

  if (!appBaseUrl) {
    return { ok: true }
  }

  let allowedHost: string
  try {
    allowedHost = new URL(appBaseUrl).host
  } catch {
    return { ok: true }
  }

  const requestHost = (() => {
    if (origin) {
      try {
        return new URL(origin).host
      } catch {
        return null
      }
    }
    if (referer) {
      try {
        return new URL(referer).host
      } catch {
        return null
      }
    }
    return null
  })()

  if (!requestHost) {
    return { ok: false, error: 'Requisicao sem origem valida.' }
  }

  if (requestHost !== allowedHost) {
    return { ok: false, error: 'Origem da requisicao nao permitida.' }
  }

  return { ok: true }
}

/**
 * CSRF validation for API routes that support both cookie auth (web) and Bearer token auth (mobile).
 * Bearer-token requests are inherently CSRF-safe (the token is not automatically sent by the browser),
 * so we skip Origin/Referer validation when an Authorization: Bearer header is present.
 */
export function validateApiCsrf(request: NextRequest): { ok: true } | { ok: false; error: string } {
  const authHeader = request.headers.get('authorization')
  const hasBearerToken = /^Bearer\s+\S+$/.test(authHeader ?? '')
  if (hasBearerToken) {
    return { ok: true }
  }
  return validateCsrfOrigin(request)
}
