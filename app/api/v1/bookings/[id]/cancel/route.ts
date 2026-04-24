import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { cancelBookingService } from '@/lib/booking/manage-booking-service'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  Sentry.addBreadcrumb({ category: 'booking', message: `PATCH /api/v1/bookings/${id}/cancel`, level: 'info' })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit('apiV1BookingCancel', user.id)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  const professionalId = professional?.id ?? null

  const result = await cancelBookingService(
    supabase,
    user.id,
    professionalId,
    id,
    body.reason !== undefined ? String(body.reason) : undefined,
  )

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode, deadlineAtUtc: result.deadlineAtUtc },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
}
