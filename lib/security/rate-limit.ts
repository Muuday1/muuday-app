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
   
  var __muudayRateLimitStore: Map<string, MemoryBucket> | undefined
   
  var __muudayRateLimitFallbackAlerts: Map<string, number> | undefined
}

const MEMORY_STORE_CLEANUP_INTERVAL = 1_000

function getStore() {
  if (!globalThis.__muudayRateLimitStore) {
    globalThis.__muudayRateLimitStore = new Map<string, MemoryBucket>()
  }
  return globalThis.__muudayRateLimitStore
}

function cleanupExpiredBuckets(store: Map<string, MemoryBucket>) {
  const now = Date.now()
  for (const [key, bucket] of store.entries()) {
    // Use a 60-second grace period so that recently-expired buckets
    // are not removed while a parallel request may still reference them.
    if (now - bucket.windowStartedAt > 60_000) {
      store.delete(key)
    }
  }
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
  Sentry.captureMessage(message, {
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

  // Periodic cleanup to prevent unbounded growth when Redis is unavailable.
  if (store.size > 0 && store.size % MEMORY_STORE_CLEANUP_INTERVAL === 0) {
    cleanupExpiredBuckets(store)
  }

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
  supabaseDbWebhook: { limit: 240, windowSeconds: 60 },
  rewriteBio: { limit: 5, windowSeconds: 60 },
  profileUpdate: { limit: 10, windowSeconds: 60 },
  profileMediaUpload: { limit: 10, windowSeconds: 60 },
  credentialsUpload: { limit: 10, windowSeconds: 60 },
  onboardingSave: { limit: 15, windowSeconds: 60 },
  onboardingSubmitReview: { limit: 5, windowSeconds: 300 },
  recomputeVisibility: { limit: 10, windowSeconds: 60 },
  stripeCheckout: { limit: 10, windowSeconds: 60 },
  calendarSync: { limit: 10, windowSeconds: 60 },
  calendarConnect: { limit: 10, windowSeconds: 60 },
  calendarDisconnect: { limit: 10, windowSeconds: 60 },
  openTerm: { limit: 20, windowSeconds: 60 },
  acceptTerm: { limit: 20, windowSeconds: 60 },
  notificationRead: { limit: 30, windowSeconds: 60 },
  notificationWrite: { limit: 15, windowSeconds: 60 },
  messageSend: { limit: 30, windowSeconds: 60 },
  messageRead: { limit: 60, windowSeconds: 60 },
  reviewSubmit: { limit: 10, windowSeconds: 60 },
  apiV1UsersMe: { limit: 60, windowSeconds: 60 },
  apiV1ProfessionalsSearch: { limit: 30, windowSeconds: 60 },
  apiV1KycScan: { limit: 10, windowSeconds: 60 },
  apiV1BookingsCreate: { limit: 6, windowSeconds: 120 },
  apiV1ConversationsList: { limit: 60, windowSeconds: 60 },
  apiV1ConversationsCreate: { limit: 10, windowSeconds: 60 },
  apiV1MessagesRead: { limit: 60, windowSeconds: 60 },
  apiV1MessagesSend: { limit: 30, windowSeconds: 60 },
  apiV1ConversationRead: { limit: 60, windowSeconds: 60 },
  apiV1NotificationsRead: { limit: 60, windowSeconds: 60 },
  apiV1NotificationsWrite: { limit: 15, windowSeconds: 60 },
  apiV1PushSubscribe: { limit: 10, windowSeconds: 60 },
  apiV1ProfileUpdate: { limit: 10, windowSeconds: 60 },
  apiV1ProfessionalProfile: { limit: 10, windowSeconds: 60 },
  apiV1AvailabilityUpdate: { limit: 10, windowSeconds: 60 },
  apiV1ServicesWrite: { limit: 15, windowSeconds: 60 },
  apiV1ReviewSubmit: { limit: 10, windowSeconds: 60 },
  apiV1FavoritesWrite: { limit: 20, windowSeconds: 60 },
  apiV1DisputesWrite: { limit: 10, windowSeconds: 60 },
  apiV1DisputesRead: { limit: 30, windowSeconds: 60 },
  apiV1ClientRecordsWrite: { limit: 20, windowSeconds: 60 },
  apiV1ClientRecordsRead: { limit: 30, windowSeconds: 60 },
  apiV1BookingsList: { limit: 60, windowSeconds: 60 },
  apiV1BookingsDetail: { limit: 60, windowSeconds: 60 },
  apiV1BookingConfirm: { limit: 10, windowSeconds: 60 },
  apiV1BookingCancel: { limit: 10, windowSeconds: 60 },
  apiV1BookingReschedule: { limit: 10, windowSeconds: 60 },
  apiV1BookingComplete: { limit: 10, windowSeconds: 60 },
  apiV1RequestBookingCreate: { limit: 6, windowSeconds: 120 },
  apiV1RequestBookingWrite: { limit: 10, windowSeconds: 60 },
  apiV1RequestBookingRead: { limit: 30, windowSeconds: 60 },
  apiV1OnboardingWrite: { limit: 10, windowSeconds: 60 },
  apiV1ReviewResponse: { limit: 10, windowSeconds: 60 },
  apiV1BlogComment: { limit: 10, windowSeconds: 60 },
  apiV1BlogLike: { limit: 20, windowSeconds: 60 },
  apiV1GuideUseful: { limit: 20, windowSeconds: 60 },
  apiV1GuideReport: { limit: 10, windowSeconds: 60 },
  apiV1AdminRead: { limit: 60, windowSeconds: 60 },
  apiV1AdminWrite: { limit: 30, windowSeconds: 60 },
  apiV1TaxonomyCatalog: { limit: 60, windowSeconds: 60 },
  trolleyWebhook: { limit: 60, windowSeconds: 60 },
  revolutWebhook: { limit: 60, windowSeconds: 60 },
  stripePaymentIntent: { limit: 10, windowSeconds: 60 },
  stripeCheckoutBooking: { limit: 10, windowSeconds: 60 },
  payoutSetup: { limit: 5, windowSeconds: 300 },
  payoutSync: { limit: 10, windowSeconds: 60 },
  payoutPortal: { limit: 5, windowSeconds: 60 },
  payoutPeriodicityUpdate: { limit: 10, windowSeconds: 60 },
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
