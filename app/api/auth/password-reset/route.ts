import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { rateLimit } from '@/lib/security/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email/resend'
import {
  PUBLIC_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

const requestSchema = z.object({
  email: z.string().email(),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  const realIp = request.headers.get('x-real-ip')
  return realIp || 'unknown'
}

function getPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  return createSupabaseClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function resolveBaseUrlFromRequest(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin
  if (requestOrigin) return requestOrigin
  return getAppBaseUrl()
}

export async function POST(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, PUBLIC_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, PUBLIC_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return withCors(NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 }))
  }

  const email = normalizeEmail(parsed.data.email)
  const ip = getRequestIp(request)
  const limiter = await rateLimit('auth', `${ip}:${email}`)

  if (!limiter.allowed) {
    return withCors(
      NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.' },
        { status: 429 },
      ),
    )
  }

  const redirectTo = `${resolveBaseUrlFromRequest(request)}/auth/callback`

  let deliveredByResend = false
  const admin = createAdminClient()
  if (admin) {
    try {
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      })

      const actionLink = data?.properties?.action_link
      if (!error && actionLink) {
        await sendPasswordResetEmail(email, actionLink)
        deliveredByResend = true
      }
    } catch (error) {
      console.error('[auth/password-reset] admin generateLink failed', error)
    }
  }

  if (!deliveredByResend) {
    const supabase = getPublicSupabaseClient()
    if (!supabase) {
      return withCors(
        NextResponse.json(
          { error: 'Serviço de autenticação indisponível no momento.' },
          { status: 503 },
        ),
      )
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      return withCors(
        NextResponse.json(
          { error: 'Não foi possível enviar o e-mail de recuperação.' },
          { status: 500 },
        ),
      )
    }
  }

  return withCors(NextResponse.json({ success: true }))
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, PUBLIC_API_CORS_POLICY)
}
