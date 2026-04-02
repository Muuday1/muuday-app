import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  PUBLIC_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'
import type { AuthLoginHint } from '@/lib/auth/messages'

const requestSchema = z.object({
  email: z.string().email(),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function extractProviders(user: unknown) {
  const record = (user ?? {}) as {
    app_metadata?: { provider?: string; providers?: string[] }
    identities?: Array<{ provider?: string | null } | null>
  }
  const providers = new Set<string>()
  if (record.app_metadata?.provider) providers.add(String(record.app_metadata.provider))
  if (Array.isArray(record.app_metadata?.providers)) {
    record.app_metadata.providers.forEach(provider => providers.add(String(provider)))
  }
  if (Array.isArray(record.identities)) {
    record.identities.forEach(identity => {
      if (identity?.provider) providers.add(String(identity.provider))
    })
  }
  return providers
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

  const admin = createAdminClient()
  if (!admin) {
    return withCors(NextResponse.json({ hint: 'unknown' as AuthLoginHint }))
  }

  const email = normalizeEmail(parsed.data.email)
  const { data: profile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!profile?.id) {
    return withCors(NextResponse.json({ hint: 'unknown' as AuthLoginHint }))
  }

  const { data: userResponse, error } = await admin.auth.admin.getUserById(profile.id)
  if (error || !userResponse?.user) {
    return withCors(NextResponse.json({ hint: 'unknown' as AuthLoginHint }))
  }

  const providers = extractProviders(userResponse.user)
  const hasEmailProvider = providers.has('email')
  const hasSocialProvider = Array.from(providers).some(provider => provider !== 'email')

  const hint: AuthLoginHint =
    hasSocialProvider && !hasEmailProvider ? 'social_only' : 'existing_account'

  return withCors(NextResponse.json({ hint }))
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, PUBLIC_API_CORS_POLICY)
}
