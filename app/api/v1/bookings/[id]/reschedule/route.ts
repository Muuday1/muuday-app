import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { rescheduleBookingService } from '@/lib/booking/manage-booking-service'
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const PATCH = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'booking', message: `PATCH /api/v1/bookings/${id}/reschedule`, level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit('apiV1BookingReschedule', user.id)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const newScheduledAt = body.newScheduledAt !== undefined ? String(body.newScheduledAt) : undefined
  if (!newScheduledAt) {
    return NextResponse.json({ error: 'newScheduledAt is required' }, { status: 400 })
  }

  const result = await rescheduleBookingService(supabase, user.id, id, newScheduledAt)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode, deadlineAtUtc: result.deadlineAtUtc },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
})