import { NextRequest } from 'next/server'

/**
 * Returns the most trustworthy client IP from the request.
 *
 * On Vercel, `x-forwarded-for` contains a chain where the *rightmost*
 * IP is the one added by Vercel's edge. The leftmost IPs can be
 * spoofed by the client, so we use the last entry.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean)
    const lastIp = ips[ips.length - 1]
    if (lastIp) return lastIp
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}
