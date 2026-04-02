import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

const MEMORY_FALLBACK_ALERT_INTERVAL_MS = 15 * 60 * 1000

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

type MemoryBucket = {
  hits: number
  windowStartedAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __muudayRateLimitStore: Map<string, MemoryBucket> | undefined
  // eslint-disable-next-line no-var
  var __muudayRateLimitFallbackAlerts: Map<string, number> | undefined
}

function getStore() {
  if (!globalThis.__muudayRateLimitStore) {
    globalThis.__muudayRateLimitStore = new Map<string, MemoryBucket>()
  }
  return globalThis.__muudayRateLimitStore
}

function getFallbackAlertStore() {
  if (!globalThis.__muudayRateLimitFallbackAlerts) {
    globalThis.__muudayRateLimitFallbackAlerts = new Map<string, number>()
  }
  return globalThis.__muudayRateLimitFallbackAlerts
}

function getPresetNameFromKey(key: string) {
  const [preset] = key.split(':')
  return preset || 'unknown'
}

function reportMemoryFallback(options: RateLimitOptions) {
  const preset = getPresetNameFromKey(options.key)
  const now = Date.now()
  const alertStore = getFallbackAlertStore()
  const lastAlertAt = alertStore.get(preset) || 0

  if (now - lastAlertAt < MEMORY_FALLBACK_ALERT_INTERVAL_MS) {
    return
  }

  alertStore.set(preset, now)

  const message = `[rate-limit] Upstash unavailable; using in-memory fallback for preset="${preset}" (non-persistent across cold starts).`
  console.warn(message)
  Sentry.captureMessage('rate_limit_fallback_memory_active', {
    level: 'warning',
    tags: {
      area: 'rate_limit',
      source: 'memory',
      preset,
    },
    extra: {
      limit: options.limit,
      windowSeconds: options.windowSeconds,
    },
  })
}

function checkMemoryRateLimit({ key, limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const store = getStore()
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    store.set(key, { hits: 1, windowStartedAt: now })
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
      source: 'memory',
    }
  }

  existing.hits += 1
  store.set(key, existing)

  if (existing.hits <= limit) {
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - existing.hits),
      retryAfterSeconds: 0,
      source: 'memory',
    }
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowMs - (now - existing.windowStartedAt)) / 1000),
  )
  return { allowed: false, limit, remaining: 0, retryAfterSeconds, source: 'memory' }
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const upstashResult = await checkUpstashRateLimit(options)
  if (upstashResult) return upstashResult
  reportMemoryFallback(options)
  return checkMemoryRateLimit(options)
}

export const RATE_LIMITS = {
  booking: { limit: 5, windowSeconds: 60 },
  bookingCreate: { limit: 6, windowSeconds: 120 },
  bookingManage: { limit: 10, windowSeconds: 60 },
  email: { limit: 10, windowSeconds: 60 },
  professionalProfile: { limit: 3, windowSeconds: 3600 },
  availability: { limit: 10, windowSeconds: 60 },
  waitlist: { limit: 10, windowSeconds: 300 },
  auth: { limit: 10, windowSeconds: 60 },
  authLogin: { limit: 12, windowSeconds: 300 },
  authSignup: { limit: 6, windowSeconds: 600 },
  authOAuth: { limit: 12, windowSeconds: 300 },
  stripeWebhook: { limit: 120, windowSeconds: 60 },
} as const

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
