/**
 * Resend Automation Events — server-side event emitter for Resend Automations.
 *
 * Sends events to Resend to trigger email automation workflows.
 * All functions are fire-and-forget (non-blocking) and fail-safe.
 * Never throws; errors are logged and swallowed.
 *
 * @see https://resend.com/docs/api-reference/events/send-event
 */

import * as Sentry from '@sentry/nextjs'

function getResendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? ''
}

function isResendEventsEnabled(): boolean {
  return !!getResendApiKey() && process.env.NODE_ENV !== 'test'
}

async function sendEvent(
  eventName: string,
  email: string,
  payload?: Record<string, unknown>,
) {
  if (!isResendEventsEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[resend-events] ${eventName} → ${email}`, payload)
    }
    return
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch('https://api.resend.com/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getResendApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        email,
        payload,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!res.ok) {
      const body = await res.text().catch(() => 'unknown')
      Sentry.captureMessage(`[resend-events] ${eventName} failed (${res.status}): ${body}`, { level: 'warning', tags: { area: 'email/resend-events' } })
    }
  } catch (err) {
    Sentry.captureMessage(`[resend-events] ${eventName} error: ` + (err instanceof Error ? err.message : String(err)), { level: 'warning', tags: { area: 'email/resend-events' } })
  }
}

// ─── User lifecycle events ──────────────────────────────────────────────────

export function emitUserSignedUp(
  email: string,
  payload: {
    first_name: string
    country: string
    user_type: string
  },
) {
  void sendEvent('user.signed_up', email, payload)
}

export function emitUserProfileCompleted(
  email: string,
  payload: {
    user_id: string
  },
) {
  void sendEvent('user.profile_completed', email, payload)
}

export function emitUserBookingConfirmed(
  email: string,
  payload: {
    booking_id: string
    service: string
    professional_id: string
  },
) {
  void sendEvent('user.booking_confirmed', email, payload)
}

export function emitUserPaymentFailed(
  email: string,
  payload: {
    booking_id: string
    amount: string
  },
) {
  void sendEvent('user.payment_failed', email, payload)
}

export function emitUserSessionCompleted(
  email: string,
  payload: {
    booking_id: string
    professional_id: string
  },
) {
  void sendEvent('user.session_completed', email, payload)
}

export function emitUserReviewSubmitted(
  email: string,
  payload: {
    booking_id: string
    rating: number
  },
) {
  void sendEvent('user.review_submitted', email, payload)
}

export function emitUserCancelledBooking(
  email: string,
  payload: {
    booking_id: string
    cancelled_by: string
  },
) {
  void sendEvent('user.cancelled_booking', email, payload)
}

export function emitUserStartedCheckout(
  email: string,
  payload: {
    booking_id: string
    professional_id: string
  },
) {
  void sendEvent('user.started_checkout', email, payload)
}

export function emitUserAbandonedCheckout(
  email: string,
  payload: {
    booking_id: string
  },
) {
  void sendEvent('user.abandoned_checkout', email, payload)
}

export function emitUserSearched(
  email: string,
  payload: {
    query: string
    filters?: string
  },
) {
  void sendEvent('user.searched', email, payload)
}

export function emitUserViewedProfessional(
  email: string,
  payload: {
    professional_id: string
    specialty: string
    professional_name: string
  },
) {
  void sendEvent('user.viewed_professional', email, payload)
}

export function emitUserAbandonedSearch(
  email: string,
  payload: {
    query: string
    professional_id?: string
  },
) {
  void sendEvent('user.abandoned_search', email, payload)
}

export function emitUserInactive(
  email: string,
  days: 30 | 60 | 90,
  payload?: {
    last_booking_date?: string
  },
) {
  const eventName = `user.inactive_${days}d` as const
  void sendEvent(eventName, email, payload)
}

// ─── Professional lifecycle events ──────────────────────────────────────────

export function emitProfessionalSignedUp(
  email: string,
  payload: {
    first_name: string
    specialty: string
  },
) {
  void sendEvent('professional.signed_up', email, payload)
}

export function emitProfessionalProfileSubmitted(
  email: string,
  payload: {
    professional_id: string
  },
) {
  void sendEvent('professional.profile_submitted', email, payload)
}

export function emitProfessionalProfileApproved(
  email: string,
  payload: {
    professional_id: string
  },
) {
  void sendEvent('professional.profile_approved', email, payload)
}

export function emitProfessionalReceivedBooking(
  email: string,
  payload: {
    booking_id: string
    client_name: string
  },
) {
  void sendEvent('professional.received_booking', email, payload)
}

export function emitProfessionalSessionCompleted(
  email: string,
  payload: {
    booking_id: string
  },
) {
  void sendEvent('professional.session_completed', email, payload)
}

export function emitProfessionalReceivedReview(
  email: string,
  payload: {
    booking_id: string
    rating: number
  },
) {
  void sendEvent('professional.received_review', email, payload)
}

export function emitProfessionalPayoutProcessed(
  email: string,
  payload: {
    amount: string
    period: string
  },
) {
  void sendEvent('professional.payout_processed', email, payload)
}

export function emitProfessionalInactive(
  email: string,
  payload: {
    email: string
  },
) {
  void sendEvent('professional.inactive_30d', email, payload)
}

// ─── Marketing events ───────────────────────────────────────────────────────

export function emitMarketingNewsletterSend(
  email: string,
  payload: {
    segment: string
    topic_id: string
  },
) {
  void sendEvent('marketing.newsletter_send', email, payload)
}
