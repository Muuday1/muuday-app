import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { inngest } from '@/inngest/client'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  WEBHOOK_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'
import { getClientIp } from '@/lib/http/client-ip'

const dbWebhookPayloadSchema = z.object({
  type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  table: z.string().min(1),
  schema: z.string().min(1),
  record: z.record(z.string(), z.unknown()).nullable().optional(),
  old_record: z.record(z.string(), z.unknown()).nullable().optional(),
})

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

function normalizeSecret(value: string | undefined | null) {
  if (!value) return ''
  let normalized = value.trim()
  if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1)
  }
  normalized = normalized.replace(/\\n/g, '').trim()
  return normalized
}

function parseAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch?.[1]?.trim()) return bearerMatch[1].trim()

  const xWebhookSecret = request.headers.get('x-webhook-secret') || ''
  if (xWebhookSecret.trim()) return xWebhookSecret.trim()

  const xSupabaseWebhookSecret = request.headers.get('x-supabase-webhook-secret') || ''
  if (xSupabaseWebhookSecret.trim()) return xSupabaseWebhookSecret.trim()

  return ''
}

function safeSecretCompare(left: string, right: string) {
  // Constant-time comparison: pad both to the same length so that
  // differing lengths do not produce a short-circuit timing signal.
  const maxLength = Math.max(left.length, right.length)
  const leftBuffer = Buffer.alloc(maxLength, left)
  const rightBuffer = Buffer.alloc(maxLength, right)
  return timingSafeEqual(leftBuffer, rightBuffer)
}

function isAuthorizedWebhookRequest(request: NextRequest) {
  const expectedSecret = normalizeSecret(process.env.SUPABASE_DB_WEBHOOK_SECRET)
  if (!expectedSecret) return false
  return safeSecretCompare(normalizeSecret(parseAuthToken(request)), expectedSecret)
}

export async function POST(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, WEBHOOK_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, WEBHOOK_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  const ip = getClientIp(request)
  const rl = await rateLimit('supabaseDbWebhook', ip)
  const rateLimitHeaders = buildRateLimitHeaders(rl)
  if (!rl.allowed) {
    return withCors(
      NextResponse.json(
        { error: 'Rate limit de webhook excedido.' },
        { status: 429, headers: rateLimitHeaders },
      ),
    )
  }

  if (!isAuthorizedWebhookRequest(request)) {
    return withCors(
      NextResponse.json(
        { error: 'Webhook Supabase DB nao autorizado.' },
        { status: 401, headers: rateLimitHeaders },
      ),
    )
  }

  const rawPayload = await request.json().catch(() => null)
  const parsed = dbWebhookPayloadSchema.safeParse(rawPayload)
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: 'Payload invalido para webhook de database.' },
        { status: 400, headers: rateLimitHeaders },
      ),
    )
  }

  const payload = parsed.data
  const baseEventData = {
    source: 'supabase_database_webhook',
    schema: payload.schema,
    table: payload.table,
    operation: payload.type,
    record: payload.record || null,
    oldRecord: payload.old_record || null,
    receivedAt: new Date().toISOString(),
  } as const

  let enqueued = 0
  const enqueueErrors: string[] = []

  try {
    await inngest.send({
      name: 'supabase/db.change.received',
      data: baseEventData,
    })
    enqueued += 1
  } catch (error) {
    enqueueErrors.push(
      error instanceof Error ? error.message : 'failed to enqueue supabase/db.change.received',
    )
  }

  if (payload.table === 'payments' && (payload.type === 'INSERT' || payload.type === 'UPDATE')) {
    try {
      await inngest.send({
        name: 'supabase/payments.changed',
        data: baseEventData,
      })
      enqueued += 1
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'failed to enqueue supabase/payments.changed'
      enqueueErrors.push(msg)
      Sentry.captureException(error instanceof Error ? error : new Error(msg), {
        tags: { area: 'supabase_db_webhook', subArea: 'payments_enqueue' },
      })
    }
  }

  // If payments.changed enqueue failed, return 500 so Supabase retries the webhook.
  // This is critical because the downstream Inngest function transitions bookings
  // from pending_payment → confirmed/pending_confirmation.
  const hasCriticalFailure = enqueueErrors.some((e) => e.includes('payments.changed'))
  const status = hasCriticalFailure ? 500 : enqueueErrors.length === 0 ? 202 : 207

  return withCors(
    NextResponse.json(
      {
        ok: enqueueErrors.length === 0,
        enqueued,
        enqueueErrors,
      },
      { status, headers: rateLimitHeaders },
    ),
  )
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, WEBHOOK_API_CORS_POLICY)
}

