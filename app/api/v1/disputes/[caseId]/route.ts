import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { requireAdmin, AdminAuthError } from '@/lib/admin/auth-helper'
import { getCaseById, resolveCase } from '@/lib/disputes/dispute-service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  Sentry.addBreadcrumb({ category: 'disputes', message: 'GET /api/v1/disputes/:caseId started', level: 'info' })

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

  const { caseId } = await params

  const result = await getCaseById(supabase, user.id, caseId, isAdmin)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  Sentry.addBreadcrumb({ category: 'disputes', message: 'PATCH /api/v1/disputes/:caseId started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1DisputesWrite', `api-v1-disputes-write:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  let adminId: string
  try {
    const admin = await requireAdmin(supabase)
    adminId = admin.userId
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    throw e
  }

  const { caseId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await resolveCase(
    supabase,
    adminId,
    caseId,
    String(body.resolution || ''),
    body.refundAmount !== undefined ? Number(body.refundAmount) : undefined,
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, resolvedAt: result.data.resolvedAt })
}
