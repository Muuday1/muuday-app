import { NextRequest, NextResponse } from 'next/server'
import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import {
  processCalendarBookingSync,
  processSupabasePaymentsChange,
  processStripeWebhookInboxQueue,
  releaseRecurringReservedSlots,
  syncExternalCalendarIntegrations,
  stripeFailedPaymentRetries,
  stripeSubscriptionRenewalChecks,
  stripeWeeklyPayoutEligibilityScan,
  syncBookingReminders,
  syncPublicVisibilityFlags,
  sendReviewReminders,
  autoDetectNoShow,
  cleanupExpiredSlotLocks,
  cancelStalePendingPayments,
  syncUserInactivity30d,
  syncUserInactivity60d,
  syncUserInactivity90d,
  syncProfessionalInactivity30d,
  syncAbandonedSearch,
  syncAbandonedCheckout,
} from '@/inngest/functions'
import {
  INTERNAL_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

// In production, refuse to serve the Inngest endpoint if the signing key is missing.
// This prevents unauthenticated ingestion of background-job events.
const inngestSigningKey = process.env.INNGEST_SIGNING_KEY
const inngestEnv = process.env.VERCEL_ENV || process.env.NODE_ENV
if (inngestEnv === 'production' && !inngestSigningKey) {
  throw new Error('INNGEST_SIGNING_KEY is required in production')
}

const inngestHandler = serve({
  client: inngest,
  functions: [
    syncBookingReminders,
    releaseRecurringReservedSlots,
    syncPublicVisibilityFlags,
    syncExternalCalendarIntegrations,
    processCalendarBookingSync,
    processSupabasePaymentsChange,
    processStripeWebhookInboxQueue,
    stripeWeeklyPayoutEligibilityScan,
    stripeSubscriptionRenewalChecks,
    stripeFailedPaymentRetries,
    sendReviewReminders,
    autoDetectNoShow,
    cleanupExpiredSlotLocks,
    cancelStalePendingPayments,
    syncUserInactivity30d,
    syncUserInactivity60d,
    syncUserInactivity90d,
    syncProfessionalInactivity30d,
    syncAbandonedSearch,
    syncAbandonedCheckout,
  ],
})

export async function GET(request: NextRequest, context: unknown) {
  const corsDecision = evaluateCorsRequest(request, INTERNAL_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, INTERNAL_API_CORS_POLICY)
  }

  const response = await inngestHandler.GET(request, context as never)
  return applyCorsHeaders(response, corsDecision.headers)
}

export async function POST(request: NextRequest, context: unknown) {
  const corsDecision = evaluateCorsRequest(request, INTERNAL_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, INTERNAL_API_CORS_POLICY)
  }

  const response = await inngestHandler.POST(request, context as never)
  return applyCorsHeaders(response, corsDecision.headers)
}

export async function PUT(request: NextRequest, context: unknown) {
  const corsDecision = evaluateCorsRequest(request, INTERNAL_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, INTERNAL_API_CORS_POLICY)
  }

  const response = await inngestHandler.PUT(request, context as never)
  return applyCorsHeaders(response, corsDecision.headers)
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, INTERNAL_API_CORS_POLICY)
}
