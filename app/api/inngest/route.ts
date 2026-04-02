import { NextRequest, NextResponse } from 'next/server'
import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import {
  processStripeWebhookInboxQueue,
  releaseRecurringReservedSlots,
  stripeFailedPaymentRetries,
  stripeSubscriptionRenewalChecks,
  stripeWeeklyPayoutEligibilityScan,
  syncBookingReminders,
} from '@/inngest/functions'
import {
  INTERNAL_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

const inngestHandler = serve({
  client: inngest,
  functions: [
    syncBookingReminders,
    releaseRecurringReservedSlots,
    processStripeWebhookInboxQueue,
    stripeWeeklyPayoutEligibilityScan,
    stripeSubscriptionRenewalChecks,
    stripeFailedPaymentRetries,
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
