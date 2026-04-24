/**
 * Server-side product analytics for Muuday.
 *
 * Uses PostHog Node SDK when available; falls back to console warnings
 * if posthog-node is not installed (run: npm install posthog-node).
 */

import { env } from '@/lib/config/env'

let PostHogClient: typeof import('posthog-node').PostHog | null = null

try {
  const ph = require('posthog-node')
  PostHogClient = ph.PostHog
} catch {
  // posthog-node not installed — analytics calls will be no-ops with warnings in dev
}

let posthogInstance: InstanceType<typeof import('posthog-node').PostHog> | null = null

function getPostHog() {
  if (!PostHogClient) return null
  if (!posthogInstance) {
    const apiKey = env.NEXT_PUBLIC_POSTHOG_KEY
    const host = env.NEXT_PUBLIC_POSTHOG_HOST
    if (!apiKey) return null
    posthogInstance = new PostHogClient(apiKey, { host })
  }
  return posthogInstance
}

function captureSafe(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const ph = getPostHog()
  if (!ph) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[analytics] posthog-node not installed. Skipping event: ${event}`)
    }
    return
  }
  ph.capture({ distinctId, event, properties })
}

// ─── Event tracking helpers ───────────────────────────────────────────────

export function trackBookingCreated(
  userId: string,
  props: {
    bookingId: string
    professionalId: string
    bookingType: string
    priceBrl: number
  },
) {
  captureSafe(userId, 'booking_created', {
    booking_id: props.bookingId,
    professional_id: props.professionalId,
    booking_type: props.bookingType,
    price_brl: props.priceBrl,
  })
}

export function trackPaymentCaptured(
  userId: string,
  props: {
    paymentId: string
    bookingId: string
    amount: number
    currency: string
  },
) {
  captureSafe(userId, 'payment_captured', {
    payment_id: props.paymentId,
    booking_id: props.bookingId,
    amount: props.amount,
    currency: props.currency,
  })
}

export function trackProfessionalOnboarded(
  userId: string,
  props: {
    professionalId: string
    tier: string
    category: string
  },
) {
  captureSafe(userId, 'professional_onboarded', {
    professional_id: props.professionalId,
    tier: props.tier,
    category: props.category,
  })
}

export function trackSearchPerformed(
  userId: string,
  props: {
    query?: string
    filters?: Record<string, unknown>
    resultsCount: number
  },
) {
  captureSafe(userId, 'search_performed', {
    query: props.query,
    filters: props.filters,
    results_count: props.resultsCount,
  })
}

export function trackSessionCompleted(
  userId: string,
  props: {
    bookingId: string
    durationMinutes: number
  },
) {
  captureSafe(userId, 'session_completed', {
    booking_id: props.bookingId,
    duration_minutes: props.durationMinutes,
  })
}

export function trackReviewSubmitted(
  userId: string,
  props: {
    reviewId: string
    bookingId: string
    professionalId: string
    rating: number
  },
) {
  captureSafe(userId, 'review_submitted', {
    review_id: props.reviewId,
    booking_id: props.bookingId,
    professional_id: props.professionalId,
    rating: props.rating,
  })
}

export function trackPlanUpgraded(
  userId: string,
  props: {
    professionalId: string
    fromTier: string
    toTier: string
    billingCycle: string
  },
) {
  captureSafe(userId, 'plan_upgraded', {
    professional_id: props.professionalId,
    from_tier: props.fromTier,
    to_tier: props.toTier,
    billing_cycle: props.billingCycle,
  })
}

export function trackMarketDetected(
  userId: string,
  props: {
    detectedMarket: string
    method: 'ip' | 'profile' | 'manual' | 'default'
    confidence?: number
  },
) {
  captureSafe(userId, 'market_detected', {
    detected_market: props.detectedMarket,
    method: props.method,
    confidence: props.confidence,
  })
}

export function trackBookingStarted(
  userId: string,
  props: {
    bookingId: string
    professionalId: string
    bookingType: string
    priceBrl: number
    marketCode?: string
  },
) {
  captureSafe(userId, 'booking_started', {
    booking_id: props.bookingId,
    professional_id: props.professionalId,
    booking_type: props.bookingType,
    price_brl: props.priceBrl,
    market_code: props.marketCode,
  })
}

export function trackBookingCompleted(
  userId: string,
  props: {
    bookingId: string
    professionalId: string
    durationMinutes: number
    marketCode?: string
  },
) {
  captureSafe(userId, 'booking_completed', {
    booking_id: props.bookingId,
    professional_id: props.professionalId,
    duration_minutes: props.durationMinutes,
    market_code: props.marketCode,
  })
}

/**
 * Flush pending analytics events.
 * Call this at the end of server actions if you need immediate delivery.
 */
export async function flushAnalytics() {
  const ph = getPostHog()
  if (ph) {
    await ph.shutdown()
    posthogInstance = null
  }
}

// ─── Payment funnel events ────────────────────────────────────────────────

export function trackPayoutSent(
  professionalId: string,
  props: {
    batchId: string
    amount: number
    netAmount: number
    debtDeducted: number
  },
) {
  captureSafe(professionalId, 'payout_sent', {
    batch_id: props.batchId,
    amount: props.amount,
    net_amount: props.netAmount,
    debt_deducted: props.debtDeducted,
  })
}

export function trackPayoutCompleted(
  professionalId: string,
  props: {
    batchId: string
    amount: number
  },
) {
  captureSafe(professionalId, 'payout_completed', {
    batch_id: props.batchId,
    amount: props.amount,
  })
}

export function trackPayoutFailed(
  professionalId: string,
  props: {
    batchId: string
    amount: number
    reason: string
  },
) {
  captureSafe(professionalId, 'payout_failed', {
    batch_id: props.batchId,
    amount: props.amount,
    reason: props.reason,
  })
}

export function trackRefundProcessed(
  adminId: string,
  props: {
    bookingId: string
    paymentId: string
    amount: number
    percentage: number
    postPayout: boolean
  },
) {
  captureSafe(adminId, 'refund_processed', {
    booking_id: props.bookingId,
    payment_id: props.paymentId,
    amount: props.amount,
    percentage: props.percentage,
    post_payout: props.postPayout,
  })
}

export function trackDisputeCreated(
  professionalId: string,
  props: {
    bookingId: string
    disputeAmount: number
    source: 'stripe_webhook' | 'admin'
  },
) {
  captureSafe(professionalId, 'dispute_created', {
    booking_id: props.bookingId,
    dispute_amount: props.disputeAmount,
    source: props.source,
  })
}
