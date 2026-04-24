import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireProfessional, ProfessionalAuthError } from '@/lib/professional/auth-helper'
import {
  addAvailabilityException,
  getAvailabilityExceptions,
} from '@/lib/professional/availability-exceptions-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'availability', message: 'POST /api/v1/professionals/me/availability-exceptions started', level: 'info' })

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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await addAvailabilityException(supabase, professionalId, String(body.dateLocal || ''), {
    isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : undefined,
    startTimeLocal: body.startTimeLocal !== undefined ? String(body.startTimeLocal) : undefined,
    endTimeLocal: body.endTimeLocal !== undefined ? String(body.endTimeLocal) : undefined,
    timezone: body.timezone !== undefined ? String(body.timezone) : undefined,
    reason: body.reason !== undefined ? String(body.reason) : undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, exceptionId: result.data.exceptionId }, { status: 201 })
}

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'availability', message: 'GET /api/v1/professionals/me/availability-exceptions started', level: 'info' })

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

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const result = await getAvailabilityExceptions(supabase, professionalId, from, to)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data.exceptions })
}
