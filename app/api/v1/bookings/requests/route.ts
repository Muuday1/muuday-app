import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { createRequestBookingService } from '@/lib/booking/request-booking-service'
import { validateApiCsrf } from '@/lib/http/csrf'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'request-booking', message: 'POST /api/v1/bookings/requests started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1RequestBookingCreate', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await createRequestBookingService(supabase, user.id, body as {
    professionalId: string
    preferredStartLocal: string
    durationMinutes?: number
    userMessage?: string
  })

  if (!result.success) {
    const status = result.reasonCode ? 400 : 500
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode },
      { status },
    )
  }

  return NextResponse.json({ success: true, requestId: result.requestId }, { status: 201 })
}
