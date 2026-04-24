import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin, AdminAuthError } from '@/lib/admin/auth-helper'
import { insertTaxonomyItemService } from '@/lib/admin/taxonomy-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'admin', message: 'POST /api/v1/admin/taxonomy/items', level: 'info' })

  const supabase = await createApiClient(request)
  let admin: { userId: string }
  try {
    admin = await requireAdmin(supabase)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    throw error
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

  const result = await insertTaxonomyItemService(supabase, body as Parameters<typeof insertTaxonomyItemService>[1])

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
