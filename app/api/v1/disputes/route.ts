import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { openCase, listCases } from '@/lib/disputes/dispute-service'
import { validateApiCsrf } from '@/lib/http/csrf'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'disputes', message: 'POST /api/v1/disputes started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1DisputesWrite', `api-v1-disputes-write:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await openCase(
    supabase,
    user.id,
    String(body.bookingId || ''),
    String(body.type || ''),
    String(body.reason || ''),
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, caseId: result.data.caseId }, { status: 201 })
}

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'disputes', message: 'GET /api/v1/disputes started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1DisputesRead', `api-v1-disputes-read:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let isAdmin = false
  try {
    await requireAdmin(supabase)
    isAdmin = true
  } catch {
    isAdmin = false
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const cursor = searchParams.get('cursor') || undefined

  const result = await listCases(supabase, user.id, isAdmin, { status, limit, cursor })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data.cases, nextCursor: result.data.nextCursor })
}
