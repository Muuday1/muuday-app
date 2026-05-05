import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  PUBLIC_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'
import { getClientIp } from '@/lib/http/client-ip'

const schema = z.object({
  action: z.enum(['login', 'signup', 'oauth_start']),
  email: z.string().email().optional(),
})

function normalizeEmail(email: string | undefined) {
  return (email || '').trim().toLowerCase()
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

export async function POST(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, PUBLIC_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, PUBLIC_API_CORS_POLICY)
  }
  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  try {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }))
    }

    const action = parsed.data.action
    const email = normalizeEmail(parsed.data.email)
    if ((action === 'login' || action === 'signup') && !email) {
      return withCors(NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 }))
    }

    const ip = getClientIp(request)
    const identifier = `${ip}:${email || 'anonymous'}`
    const preset = action === 'login' ? 'authLogin' : action === 'signup' ? 'authSignup' : 'authOAuth'
    const rl = await rateLimit(preset, identifier)

    const rateLimitHeaders = buildRateLimitHeaders(rl)
    if (!rl.allowed) {
      return applyCorsHeaders(
        NextResponse.json(
          { allowed: false, error: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.' },
          { status: 429, headers: rateLimitHeaders },
        ),
        corsDecision.headers,
      )
    }

    return applyCorsHeaders(
      NextResponse.json({ allowed: true }, { headers: rateLimitHeaders }),
      corsDecision.headers,
    )
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error('auth_attempt_guard_unexpected_error'), {
      tags: { area: 'auth', flow: 'attempt_guard' },
    })
    return withCors(NextResponse.json({ allowed: true, warning: 'Rate limit unavailable' }, { status: 200 }))
  }
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, PUBLIC_API_CORS_POLICY)
}
