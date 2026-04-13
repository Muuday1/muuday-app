import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  WEBHOOK_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

const dbWebhookPayloadSchema = z.object({
  type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  table: z.string().min(1),
  schema: z.string().min(1),
  record: z.record(z.string(), z.unknown()).nullable().optional(),
  old_record: z.record(z.string(), z.unknown()).nullable().optional(),
})

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
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
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

  const ip = getRequestIp(request)
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
      enqueueErrors.push(
        error instanceof Error ? error.message : 'failed to enqueue supabase/payments.changed',
      )
    }
  }

  return withCors(
    NextResponse.json(
      {
        ok: enqueueErrors.length === 0,
        enqueued,
        enqueueErrors,
      },
      { status: enqueueErrors.length === 0 ? 202 : 207, headers: rateLimitHeaders },
    ),
  )
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, WEBHOOK_API_CORS_POLICY)
}

