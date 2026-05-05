/**
 * Mobile API key validation for `/api/v1/*` routes.
 *
 * The mobile app must send `X-Mobile-Api-Key` header.
 * If MOBILE_API_KEY is not configured in the environment, validation is skipped
 * (so local development does not break).
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export function validateMobileApiKey(request: NextRequest): NextResponse | null {
  const expectedKey = process.env.MOBILE_API_KEY

  // If no key is configured, skip validation (development fallback)
  if (!expectedKey) {
    return null
  }

  const providedKey = request.headers.get('x-mobile-api-key')

  if (!providedKey) {
    return NextResponse.json(
      { error: 'Missing X-Mobile-Api-Key header.' },
      { status: 401 },
    )
  }

  // Constant-time comparison to prevent timing attacks
  if (!safeCompare(providedKey, expectedKey)) {
    return NextResponse.json(
      { error: 'Invalid API key.' },
      { status: 401 },
    )
  }

  return null
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
