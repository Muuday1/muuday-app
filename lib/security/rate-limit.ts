import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Types ───────────────────────────────────────────────────────────────────

type RateLimitOptions = {
  key: string
  limit: number
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  source: 'upstash' | 'memory'
}

// ─── Upstash Redis (primary) ─────────────────────────────────────────────────

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const cacheKey = `${limit}:${windowSeconds}`
  let limiter = limiters.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: 'muuday:rl',
      analytics: true,
    })
    limiters.set(cacheKey, limiter)
  }
  return limiter
}

async function checkUpstashRateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult | null> {
  try {
    const limiter = getLimiter(limit, windowSeconds)
    if (!limiter) return null

    const result = await limiter.limit(key)

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      retryAfterSeconds: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      source: 'upstash',
    }
  } catch {
    return null
  }
}

// ─── In-memory fallback ──────────────────────────────────────────────────────

type MemoryBucket = {
  hits: number
  windowStartedAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __muudayRateLimitStore: Map<string, MemoryBucket> | undefined
}

function getStore() {
  if (!globalThis.__muudayRateLimitStore) {
    globalThis.__muudayRateLimitStore = new Map<string, MemoryBucket>()
  }
  return globalThis.__muudayRateLimitStore
}

function checkMemoryRateLimit({ key, limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const store = getStore()
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    store.set(key, { hits: 1, windowStartedAt: now })
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0, source: 'memory' }
  }

  existing.hits += 1
  store.set(key, existing)

  if (existing.hits <= limit) {
    return { allowed: true, limit, remaining: Math.max(0, limit - existing.hits), retryAfterSeconds: 0, source: 'memory' }
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - existing.windowStartedAt)) / 1000))
  return { allowed: false, limit, remaining: 0, retryAfterSeconds, source: 'memory' }
}

// ─── Public API ───────────────────────���──────────────────────────────────────

/**
 * Check rate limit. Uses Upstash Redis when configured, falls back to in-memory.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const upstashResult = await checkUpstashRateLimit(options)
  if (upstashResult) return upstashResult
  return checkMemoryRateLimit(options)
}

// ─── Preset limiters for common use cases ────���───────────────────────────────

/** Rate limit presets — use these in server actions and API routes */
export const RATE_LIMITS = {
  /** Booking creation: 5 per minute per user */
  booking: { limit: 5, windowSeconds: 60 },
  /** Booking management (confirm/cancel/complete): 10 per minute per user */
  bookingManage: { limit: 10, windowSeconds: 60 },
  /** Email sending: 10 per minute per user */
  email: { limit: 10, windowSeconds: 60 },
  /** Professional profile creation: 3 per hour per user */
  professionalProfile: { limit: 3, windowSeconds: 3600 },
  /** Availability update: 10 per minute per user */
  availability: { limit: 10, windowSeconds: 60 },
  /** Waitlist signup: 10 per 5 minutes per IP */
  waitlist: { limit: 10, windowSeconds: 300 },
  /** Auth actions: 10 per minute per IP */
  auth: { limit: 10, windowSeconds: 60 },
} as const

/**
 * Shorthand: check rate limit with a preset + identifier.
 * Returns the result (check `.allowed`).
 *
 * @example
 * const rl = await rateLimit('booking', userId)
 * if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
 */
export async function rateLimit(
  preset: keyof typeof RATE_LIMITS,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[preset]
  return checkRateLimit({
    key: `${preset}:${identifier}`,
    ...config,
  })
}
