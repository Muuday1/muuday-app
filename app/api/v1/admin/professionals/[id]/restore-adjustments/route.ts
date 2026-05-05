import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin, AdminAuthError } from '@/lib/admin/auth-helper'
import { restoreLatestReviewAdjustmentsService } from '@/lib/admin/admin-service'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const POST = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'admin', message: `POST /api/v1/admin/professionals/${id}/restore-adjustments`, level: 'info' })

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

  const result = await restoreLatestReviewAdjustmentsService(supabase, admin.userId, id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})