import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'
import {
  INTERNAL_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

function parseAuthToken(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]?.trim()) return match[1].trim()
  const altHeader = request.headers.get('x-cron-secret') || ''
  if (altHeader.trim()) return altHeader.trim()
  return ''
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

function safeSecretCompare(left: string, right: string) {
  // Constant-time comparison: pad both to the same length so that
  // differing lengths do not produce a short-circuit timing signal.
  const maxLength = Math.max(left.length, right.length)
  const leftBuffer = Buffer.alloc(maxLength, left)
  const rightBuffer = Buffer.alloc(maxLength, right)
  return timingSafeEqual(leftBuffer, rightBuffer)
}

function isAuthorizedCronRequest(request: NextRequest) {
  const expectedSecret = normalizeSecret(process.env.CRON_SECRET)
  if (!expectedSecret) return false
  return safeSecretCompare(normalizeSecret(parseAuthToken(request)), expectedSecret)
}

export async function GET(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, INTERNAL_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, INTERNAL_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  if (!isAuthorizedCronRequest(request)) {
    return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  const admin = createAdminClient()
  if (!admin) {
    return withCors(
      NextResponse.json(
        { error: 'Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.' },
        { status: 500 },
      ),
    )
  }

  try {
    const result = await runBookingReminderSync(admin)
    return withCors(
      NextResponse.json({
        ok: true,
        source: 'cron',
        checked: result.checked,
        inserted: result.inserted,
        at: result.at,
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[cron/booking-reminders] sync error:', message)
    const body: Record<string, string> = { error: 'Failed to save reminders.' }
    if (process.env.NODE_ENV !== 'production') body.details = message
    return withCors(NextResponse.json(body, { status: 500 }))
  }
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, INTERNAL_API_CORS_POLICY)
}
