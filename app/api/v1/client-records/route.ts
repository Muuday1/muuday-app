import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireProfessional, ProfessionalAuthError } from '@/lib/professional/auth-helper'
import { withApiHandler } from '@/lib/api/with-api-handler'
import {
  upsertClientRecord,
  getClientRecords,
} from '@/lib/client-records/client-records-service'

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'client-records', message: 'POST /api/v1/client-records started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ClientRecordsWrite', `api-v1-client-records-write:${ip}`)
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

  const result = await upsertClientRecord(
    supabase,
    professionalId,
    String(body.userId || ''),
    String(body.notes || ''),
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, recordId: result.data.recordId }, { status: 201 })
})

export const GET = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'client-records', message: 'GET /api/v1/client-records started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ClientRecordsRead', `api-v1-client-records-read:${ip}`)
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

  const result = await getClientRecords(supabase, professionalId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data.records })
})