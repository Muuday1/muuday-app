import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { cancelRequestBookingByUserService } from '@/lib/booking/request-booking-service'
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const PATCH = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'request-booking', message: `PATCH /api/v1/bookings/requests/${id}/cancel-user`, level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit('apiV1RequestBookingWrite', user.id)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const result = await cancelRequestBookingByUserService(supabase, user.id, id)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
})