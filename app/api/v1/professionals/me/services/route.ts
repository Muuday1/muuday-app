import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireProfessional, ProfessionalAuthError } from '@/lib/professional/auth-helper'
import { createProfessionalService } from '@/lib/professional/professional-services-service'
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'services', message: 'POST /api/v1/professionals/me/services started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ServicesWrite', `api-v1-services-write:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  let professionalId: string
  try {
    const prof = await requireProfessional(supabase)
    professionalId = prof.professionalId
  } catch (e) {
    if (e instanceof ProfessionalAuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await createProfessionalService(
    supabase,
    professionalId,
    String(body.name || ''),
    Number(body.durationMinutes || 0),
    Number(body.priceBrl || 0),
    body.description !== undefined ? String(body.description) : undefined,
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, serviceId: result.data.serviceId }, { status: 201 })
})