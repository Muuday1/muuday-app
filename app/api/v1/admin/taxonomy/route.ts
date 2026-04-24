import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin, AdminAuthError } from '@/lib/admin/auth-helper'
import { loadTaxonomyDataService } from '@/lib/admin/taxonomy-service'

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'admin', message: 'GET /api/v1/admin/taxonomy', level: 'info' })

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

  const rl = await rateLimit('apiV1AdminRead', admin.userId)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const result = await loadTaxonomyDataService(supabase)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data })
}
