import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, type RateLimitResult } from '@/lib/security/rate-limit'
import {
  WAITLIST_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

const LEAD_TYPES = ['usuario', 'profissional', 'empresa', 'parceiro'] as const

const waitlistSchema = z.object({
  firstname: z.string().trim().min(1, 'firstname is required').max(80, 'firstname is too long'),
  email: z.string().trim().toLowerCase().email('invalid email').max(254, 'email is too long'),
  pais_residencia: z.string().trim().max(120, 'country is too long').optional().or(z.literal('')),
  tipo_lead: z.enum(LEAD_TYPES).optional(),
  origem_lead: z.string().trim().max(120, 'origem_lead is too long').optional().or(z.literal('')),
})

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function buildRateLimitHeaders(rateLimitResult: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(rateLimitResult.limit),
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Source': rateLimitResult.source,
  }

  if (!rateLimitResult.allowed && rateLimitResult.retryAfterSeconds > 0) {
    headers['Retry-After'] = String(rateLimitResult.retryAfterSeconds)
  }

  return headers
}

function applyExtraHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

export async function POST(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, WAITLIST_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, WAITLIST_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  try {
    const rl = await rateLimit('waitlist', getClientIp(request))
    const rateLimitHeaders = buildRateLimitHeaders(rl)

    if (!rl.allowed) {
      return applyExtraHeaders(
        withCors(
          NextResponse.json(
            { error: 'Too many requests. Please try again in a few minutes.' },
            { status: 429 },
          ),
        ),
        rateLimitHeaders,
      )
    }

    const body = await request.json()
    const parsed = waitlistSchema.safeParse(body)

    if (!parsed.success) {
      return applyExtraHeaders(
        withCors(
          NextResponse.json(
            { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
            { status: 400 },
          ),
        ),
        rateLimitHeaders,
      )
    }

    const { firstname, email, pais_residencia, tipo_lead, origem_lead } = parsed.data
    const supabase = createClient()

    const { error: dbError } = await supabase
      .from('waitlist')
      .upsert(
        {
          email,
          firstname,
          country: pais_residencia || null,
          tipo_lead: tipo_lead || 'usuario',
          origem_lead: origem_lead || null,
          status: 'na_lista',
        },
        { onConflict: 'email' },
      )

    if (dbError) {
      console.error('[waitlist] DB error:', dbError)
      return applyExtraHeaders(
        withCors(
          NextResponse.json(
            { error: 'Unable to save waitlist entry right now. Please try again shortly.' },
            { status: 500 },
          ),
        ),
        rateLimitHeaders,
      )
    }

    void (async () => {
      try {
        const { sendWaitlistConfirmationEmail, addContactToResend, SEGMENTS } = await import(
          '@/lib/email/resend'
        )
        await Promise.all([
          sendWaitlistConfirmationEmail(email, firstname),
          addContactToResend(email, firstname, SEGMENTS.waitlist),
        ])
      } catch (error) {
        console.error('[waitlist] Email error:', error)
      }
    })()

    return applyExtraHeaders(withCors(NextResponse.json({ success: true })), rateLimitHeaders)
  } catch (error) {
    console.error('[waitlist] Error:', error)
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, WAITLIST_API_CORS_POLICY)
}
