import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getRequestBookingDetailService } from '@/lib/booking/request-booking-service'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const GET = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'request-booking', message: `GET /api/v1/bookings/requests/${id}`, level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1RequestBookingRead', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  const professionalId = professional?.id ?? null

  const result = await getRequestBookingDetailService(supabase, user.id, professionalId, id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data })
})
