import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin, AdminAuthError } from '@/lib/admin/auth-helper'
import { updateProfessionalStatusService } from '@/lib/admin/admin-service'
import { professionalStatusSchema, getFirstValidationError } from '@/lib/actions/admin/shared'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'admin', message: `PATCH /api/v1/admin/professionals/${id}/status`, level: 'info' })

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

  const parsed = professionalStatusSchema.safeParse((body as Record<string, unknown>)?.status)
  if (!parsed.success) {
    return NextResponse.json({ error: getFirstValidationError(parsed.error) }, { status: 400 })
  }
  const status = parsed.data
  const note = typeof (body as Record<string, unknown>)?.note === 'string' ? String((body as Record<string, unknown>).note) : undefined

  const result = await updateProfessionalStatusService(supabase, admin.userId, id, status, note)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
