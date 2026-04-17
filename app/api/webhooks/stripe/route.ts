import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import { recordStripeWebhookEvent } from '@/lib/ops/stripe-resilience'
import { rateLimit } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  WEBHOOK_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  const realIp = request.headers.get('x-real-ip')
  return realIp || 'unknown'
}

function buildRateLimitHeaders(limitResult: Awaited<ReturnType<typeof rateLimit>>) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limitResult.limit),
    'X-RateLimit-Remaining': String(limitResult.remaining),
    'X-RateLimit-Source': limitResult.source,
  }
  if (!limitResult.allowed && limitResult.retryAfterSeconds > 0) {
    headers['Retry-After'] = String(limitResult.retryAfterSeconds)
  }
  return headers
}

function createStripeWebhookClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}

export async function POST(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, WEBHOOK_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, WEBHOOK_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  const ip = getRequestIp(request)
  const rl = await rateLimit('stripeWebhook', ip)
  const rateLimitHeaders = buildRateLimitHeaders(rl)
  if (!rl.allowed) {
    return withCors(
      NextResponse.json(
        { error: 'Rate limit de webhook excedido.' },
        { status: 429, headers: rateLimitHeaders },
      ),
    )
  }

  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return withCors(
      NextResponse.json(
        { error: 'Webhook Stripe nao configurado corretamente.' },
        { status: 503, headers: rateLimitHeaders },
      ),
    )
  }

  const stripeClient = createStripeWebhookClient()
  if (!stripeClient) {
    return withCors(
      NextResponse.json(
        { error: 'STRIPE_SECRET_KEY nao configurada no ambiente.' },
        { status: 503, headers: rateLimitHeaders },
      ),
    )
  }

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Assinatura do webhook invalida.'
    const body: Record<string, string> = { error: 'Assinatura do webhook invalida.' }
    if (process.env.NODE_ENV !== 'production') body.details = message
    return withCors(
      NextResponse.json(body, { status: 400, headers: rateLimitHeaders }),
    )
  }

  const admin = createAdminClient()
  if (!admin) {
    return withCors(
      NextResponse.json(
        { error: 'Admin client nao configurado para persistencia de webhooks Stripe.' },
        { status: 500, headers: rateLimitHeaders },
      ),
    )
  }

  try {
    const persisted = await recordStripeWebhookEvent(admin, {
      providerEventId: event.id,
      eventType: event.type,
      apiVersion: event.api_version || null,
      livemode: event.livemode,
      payload: event as unknown as Record<string, unknown>,
      signatureHeader: signature,
    })

    let enqueued = false
    let enqueueError: string | null = null
    try {
      await inngest.send({
        name: 'stripe/webhook.received',
        data: {
          webhookEventId: persisted.id,
          providerEventId: event.id,
          eventType: event.type,
          livemode: event.livemode,
          inserted: persisted.inserted,
        },
      })
      enqueued = true
    } catch (error) {
      enqueueError = error instanceof Error ? error.message : 'failed to enqueue webhook'
    }

    if (!enqueued) {
      return withCors(
        NextResponse.json(
          {
            ok: false,
            webhookEventId: persisted.id,
            inserted: persisted.inserted,
            status: persisted.status,
            enqueued,
            enqueueError,
          },
          { status: 500, headers: rateLimitHeaders },
        ),
      )
    }

    return withCors(
      NextResponse.json(
        {
          ok: true,
          webhookEventId: persisted.id,
          inserted: persisted.inserted,
          status: persisted.status,
          enqueued,
        },
        { status: 202, headers: rateLimitHeaders },
      ),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook Stripe.'
    const status = message.toLowerCase().includes('does not exist') ? 503 : 500
    const body: Record<string, string> = { error: 'Erro ao persistir webhook Stripe.' }
    if (process.env.NODE_ENV !== 'production') body.details = message
    return withCors(
      NextResponse.json(body, { status, headers: rateLimitHeaders }),
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, WEBHOOK_API_CORS_POLICY)
}
