import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireProfessional, ProfessionalAuthError } from '@/lib/professional/auth-helper'
import { removeAvailabilityException } from '@/lib/professional/availability-exceptions-service'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ exceptionId: string }> }) {
  Sentry.addBreadcrumb({ category: 'availability', message: 'DELETE /api/v1/professionals/me/availability-exceptions/:id started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1AvailabilityUpdate', `api-v1-availability-update:${ip}`)
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

  const { exceptionId } = await params

  const result = await removeAvailabilityException(supabase, professionalId, exceptionId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
