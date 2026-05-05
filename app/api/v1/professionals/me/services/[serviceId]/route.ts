import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireProfessional, ProfessionalAuthError } from '@/lib/professional/auth-helper'
import { withApiHandler } from '@/lib/api/with-api-handler'
import {
  updateProfessionalService,
  deleteProfessionalService,
} from '@/lib/professional/professional-services-service'

export const PATCH = withApiHandler(async (request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) => {
  Sentry.addBreadcrumb({ category: 'services', message: 'PATCH /api/v1/professionals/me/services/:id started', level: 'info' })

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

  const { serviceId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await updateProfessionalService(supabase, professionalId, serviceId, {
    name: body.name !== undefined ? String(body.name) : undefined,
    durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
    priceBrl: body.priceBrl !== undefined ? Number(body.priceBrl) : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})

export const DELETE = withApiHandler(async (request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) => {
  Sentry.addBreadcrumb({ category: 'services', message: 'DELETE /api/v1/professionals/me/services/:id started', level: 'info' })

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

  const { serviceId } = await params

  const result = await deleteProfessionalService(supabase, professionalId, serviceId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})