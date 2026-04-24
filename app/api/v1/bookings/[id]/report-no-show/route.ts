import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { reportProfessionalNoShowService } from '@/lib/booking/manage-booking-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'booking', message: `POST /api/v1/bookings/${id}/report-no-show`, level: 'info' })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit('apiV1BookingCancel', user.id)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const result = await reportProfessionalNoShowService(supabase, user.id, id)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
}
