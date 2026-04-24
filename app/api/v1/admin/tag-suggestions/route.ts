import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { reviewTagSuggestionService } from '@/lib/admin/taxonomy-service'

export async function PATCH(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'admin', message: 'PATCH /api/v1/admin/tag-suggestions', level: 'info' })

  const supabase = await createApiClient(request)
  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rl = await rateLimit('apiV1AdminWrite', admin.userId)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, status } = body as { id?: string; status?: 'approved' | 'rejected' }
  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  }

  const result = await reviewTagSuggestionService(supabase, id, status)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
