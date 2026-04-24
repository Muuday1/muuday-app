import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireProfessional, ProfessionalAuthError } from '@/lib/professional/auth-helper'
import {
  upsertSessionNote,
  getSessionNotesForClient,
} from '@/lib/client-records/client-records-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'client-records', message: 'POST /api/v1/client-records/notes started', level: 'info' })

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

  const result = await upsertSessionNote(
    supabase,
    professionalId,
    String(body.bookingId || ''),
    String(body.notes || ''),
    body.metadata && typeof body.metadata === 'object'
      ? {
          mood: String((body.metadata as Record<string, unknown>).mood || ''),
          symptoms: String((body.metadata as Record<string, unknown>).symptoms || ''),
        }
      : undefined,
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, noteId: result.data.noteId }, { status: 201 })
}

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'client-records', message: 'GET /api/v1/client-records/notes started', level: 'info' })

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

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || ''

  const result = await getSessionNotesForClient(supabase, professionalId, userId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data.notes })
}
