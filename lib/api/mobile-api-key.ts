/**
 * Mobile API key validation for `/api/v1/*` routes.
 *
 * The mobile app must send `X-Mobile-Api-Key` header.
 * If MOBILE_API_KEY is not configured in the environment, validation is skipped
 * (so local development does not break).
 */

import { NextRequest, NextResponse } from 'next/server'

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
  if (!timingSafeEqual(providedKey, expectedKey)) {
    return NextResponse.json(
      { error: 'Invalid API key.' },
      { status: 401 },
    )
  }

  return null
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid leaking length via timing,
    // but against a padded version.
    const maxLen = Math.max(a.length, b.length)
    const pa = a.padEnd(maxLen, '\0')
    const pb = b.padEnd(maxLen, '\0')
    let result = 0
    for (let i = 0; i < maxLen; i++) {
      result |= pa.charCodeAt(i) ^ pb.charCodeAt(i)
    }
    return result === 0 && a.length === b.length
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
