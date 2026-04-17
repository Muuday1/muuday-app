import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

  // Return a generic hint to prevent account enumeration.
  // Even if we could look up the email, revealing whether an account
  // exists (or is social-only) is an information-leak vector.
  return withCors(NextResponse.json({ hint: 'unknown' as AuthLoginHint }))
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, PUBLIC_API_CORS_POLICY)
}
