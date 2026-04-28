import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

/**
 * Generate an ETag for a JSON payload.
 */
export function generateETag(payload: unknown): string {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(payload))
  return `W/"${hash.digest('hex').slice(0, 16)}"`
}

/**
 * Check if the client's If-None-Match header matches the current ETag.
 */
export function isETagMatch(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  if (!ifNoneMatch) return false
  // Handle weak comparison (W/ prefix)
  const clientETag = ifNoneMatch.replace(/^W\//, '')
  const serverETag = etag.replace(/^W\//, '')
  return clientETag === serverETag
}

/**
 * Return a cached 304 response if the ETag matches.
 */
export function maybeCachedResponse<T>(
  request: NextRequest,
  payload: T,
  options?: {
    status?: number
    cacheControl?: string
  },
): NextResponse {
  const etag = generateETag(payload)
  const cacheControl = options?.cacheControl ?? 'private, max-age=30, must-revalidate'

  if (isETagMatch(request, etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'Cache-Control': cacheControl,
        ETag: etag,
      },
    })
  }

  return NextResponse.json(payload, {
    status: options?.status ?? 200,
    headers: {
      'Cache-Control': cacheControl,
      ETag: etag,
    },
  })
}
