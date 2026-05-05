import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { executeBookingCreation, createBookingInputSchema } from '@/lib/booking/create-booking'
import { listBookingsService } from '@/lib/booking/manage-booking-service'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import { maybeCachedResponse } from '@/lib/http/cache-headers'
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'
import {
  emitProfessionalReceivedBooking,
  emitUserStartedCheckout,
} from '@/lib/email/resend-events'

export const GET = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'booking', message: 'GET /api/v1/bookings started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1BookingsList', ip)
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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const result = await listBookingsService(supabase, user.id, professionalId, {
    status,
    limit,
    offset,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return maybeCachedResponse(request, { data: result.data }, { cacheControl: 'private, max-age=30, must-revalidate' })
})

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'booking', message: 'POST /api/v1/bookings started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  // Mobile API key validation is handled in middleware.ts
  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1BookingsCreate', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsedInput = createBookingInputSchema.safeParse(body)
  if (!parsedInput.success) {
    const firstError = parsedInput.error.issues[0]?.message || 'Dados inválidos para agendamento.'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  // Execute booking creation
  const result = await executeBookingCreation(supabase, user, parsedInput.data)

  if (!result.success) {
    const status = result.reasonCode ? 400 : 500
    return NextResponse.json(
      { error: result.error, reasonCode: result.reasonCode },
      { status },
    )
  }

  // Calendar sync (awaited to guarantee Inngest enqueue before response)
  const bookingIdsForCalendarSync = result.createdBookingIds
  try {
    await Promise.all(
      bookingIdsForCalendarSync.map(syncBookingId =>
        enqueueBookingCalendarSync({
          bookingId: syncBookingId,
          action: 'upsert_booking',
          source: 'booking.api_v1.create',
        }),
      ),
    )
  } catch (err) {
    Sentry.captureException(err, { tags: { area: 'booking_calendar_sync' } })
  }

  // Emit Resend automation events (non-blocking)
  if (result.professionalEmail) {
    emitProfessionalReceivedBooking(result.professionalEmail, {
      booking_id: result.bookingId,
      client_name: user.email || 'Cliente',
    })
  }
  if (user.email) {
    emitUserStartedCheckout(user.email, {
      booking_id: result.bookingId,
      professional_id: parsedInput.data.professionalId,
    })
  }

  return NextResponse.json({
    success: true,
    bookingId: result.bookingId,
    createdBookingIds: result.createdBookingIds,
    usedAtomicPath: result.usedAtomicPath,
  }, { status: 201 })
})