import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { acceptRequestBookingService } from '@/lib/booking/request-booking-service'
import { validateApiCsrf } from '@/lib/http/csrf'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'request-booking', message: `PATCH /api/v1/bookings/requests/${id}/accept`, level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit('apiV1RequestBookingCreate', user.id)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const result = await acceptRequestBookingService(supabase, user.id, id)

  if (!result.success) {
    const status = result.reasonCode ? 400 : 500
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode },
      { status },
    )
  }

  return NextResponse.json({ success: true, bookingId: result.bookingId })
}
