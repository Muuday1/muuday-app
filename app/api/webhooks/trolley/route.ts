/**
 * Trolley Webhook Handler
 *
 * Receives webhook events from Trolley about payout status changes.
 * All events are persisted and processed idempotently.
 *
 * Security: Signature verification (when TROLLEY_WEBHOOK_SECRET is configured)
 * Rate limiting: Yes
 */

import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import { rateLimit } from '@/lib/security/rate-limit'
import { verifyTWebhookSignature } from '@/lib/payments/trolley/client'
import {
  WEBHOOK_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'
import { getClientIp } from '@/lib/http/client-ip'

function buildRateLimitHeaders(limitResult: Awaited<ReturnType<typeof rateLimit>>) {
  return {
    'X-RateLimit-Limit': String(limitResult.limit),
    'X-RateLimit-Remaining': String(limitResult.remaining),
    'X-RateLimit-Source': limitResult.source,
    ...(limitResult.retryAfterSeconds > 0 ? { 'Retry-After': String(limitResult.retryAfterSeconds) } : {}),
  }
}

export async function POST(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, WEBHOOK_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, WEBHOOK_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  const ip = getClientIp(request)
  const rl = await rateLimit('trolleyWebhook', ip)
  const rateLimitHeaders = buildRateLimitHeaders(rl)

  if (!rl.allowed) {
    return withCors(
      NextResponse.json(
        { error: 'Rate limit de webhook excedido.' },
        { status: 429, headers: rateLimitHeaders },
      ),
    )
  }

  const signature = request.headers.get('x-trolley-signature')
  const rawBody = await request.text()

  if (signature && !verifyTWebhookSignature(rawBody, signature)) {
    return withCors(
      NextResponse.json(
        { error: 'Assinatura do webhook invalida.' },
        { status: 400, headers: rateLimitHeaders },
      ),
    )
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return withCors(
      NextResponse.json(
        { error: 'Payload JSON invalido.' },
        { status: 400, headers: rateLimitHeaders },
      ),
    )
  }

  try {
    await inngest.send({
      name: 'trolley/webhook.received',
      data: {
        eventType: String(event.type || event.event || 'unknown'),
        payload: event,
        receivedAt: new Date().toISOString(),
      },
    })

    return withCors(
      NextResponse.json({ ok: true }, { status: 202, headers: rateLimitHeaders }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook Trolley.'
    return withCors(
      NextResponse.json(
        { error: 'Erro ao enfileirar webhook Trolley.' },
        { status: 500, headers: rateLimitHeaders },
      ),
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, WEBHOOK_API_CORS_POLICY)
}
