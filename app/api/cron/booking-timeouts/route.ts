import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runRecurringReservedSlotRelease } from '@/lib/ops/recurring-slot-release'
import {
  INTERNAL_API_CORS_POLICY,
  applyCorsHeaders,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  evaluateCorsRequest,
} from '@/lib/http/cors'

const MANUAL_CONFIRMATION_SLA_HOURS = 24

type BookingRow = {
  id: string
  created_at: string
  metadata: Record<string, unknown> | null
  status?: string | null
  booking_type?: string | null
  parent_booking_id?: string | null
}

function parseAuthToken(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]?.trim()) return match[1].trim()
  const altHeader = request.headers.get('x-cron-secret') || ''
  if (altHeader.trim()) return altHeader.trim()
  // Never accept tokens via query string — they leak into logs, referrers, and browser history
  return ''
}

function normalizeSecret(value: string | undefined | null) {
  if (!value) return ''
  let normalized = value.trim()
  if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1)
  }
  normalized = normalized.replace(/\\n/g, '').trim()
  return normalized
}

function isAuthorizedCronRequest(request: NextRequest) {
  const expectedSecret = normalizeSecret(process.env.CRON_SECRET)
  // Always require a secret — preview/staging deployments are publicly accessible
  if (!expectedSecret) return false
  return normalizeSecret(parseAuthToken(request)) === expectedSecret
}

function getConfirmationDeadline(booking: BookingRow) {
  const metadata = booking.metadata || {}
  const metadataDeadline = metadata.confirmation_deadline_utc
  if (typeof metadataDeadline === 'string' && metadataDeadline) {
    const parsed = new Date(metadataDeadline)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  const createdAt = new Date(booking.created_at)
  if (Number.isNaN(createdAt.getTime())) {
    return new Date(Date.now() - 1)
  }

  return new Date(createdAt.getTime() + MANUAL_CONFIRMATION_SLA_HOURS * 60 * 60 * 1000)
}

export async function GET(request: NextRequest) {
  const corsDecision = evaluateCorsRequest(request, INTERNAL_API_CORS_POLICY)
  if (!corsDecision.allowed) {
    return createCorsErrorResponse(request, INTERNAL_API_CORS_POLICY)
  }

  const withCors = (response: NextResponse) => applyCorsHeaders(response, corsDecision.headers)

  if (!isAuthorizedCronRequest(request)) {
    return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  const admin = createAdminClient()
  if (!admin) {
    return withCors(NextResponse.json(
      { error: 'Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.' },
      { status: 500 },
    ))
  }

  const now = new Date()
  const nowIso = now.toISOString()
  let recurringReleaseError: string | null = null
  let recurringRelease = {
    checked: 0,
    eligible: 0,
    releasedSessions: 0,
    releasedBookings: 0,
    at: nowIso,
  }

  try {
    recurringRelease = await runRecurringReservedSlotRelease(admin, now)
  } catch (error) {
    recurringReleaseError = error instanceof Error ? error.message : 'unknown'
    console.error('[cron/booking-timeouts] recurring release error:', recurringReleaseError)
  }

  // Filter at database level to avoid loading all bookings into memory
  let bookingsResponse = (await admin
    .from('bookings')
    .select('id, created_at, metadata, status, booking_type, parent_booking_id')
    .eq('status', 'pending_confirmation')
    .limit(500)) as { data: BookingRow[] | null; error: { message?: string } | null }

  if (bookingsResponse.error && bookingsResponse.error.message?.includes('metadata')) {
    bookingsResponse = (await admin
      .from('bookings')
      .select('id, created_at, status')
      .eq('status', 'pending_confirmation')
      .limit(500)) as { data: BookingRow[] | null; error: { message?: string } | null }
  }

  if (bookingsResponse.error) {
    console.error('[cron/booking-timeouts] fetch error:', bookingsResponse.error)
    return NextResponse.json(
      {
        error: 'Failed to load pending bookings.',
        details: bookingsResponse.error.message || 'unknown',
      },
      { status: 500, headers: corsDecision.headers },
    )
  }

  // Already filtered at DB level via .eq('status', 'pending_confirmation')
  const pendingBookings = bookingsResponse.data || []

  const expired = ((pendingBookings || []) as BookingRow[]).filter(booking => {
    const deadline = getConfirmationDeadline(booking)
    return deadline.getTime() <= now.getTime()
  })

  if (expired.length === 0) {
    return withCors(NextResponse.json({
      ok: true,
      cancelled: 0,
      refunded: 0,
      checked: (pendingBookings || []).length,
      recurringRelease,
      recurringReleaseError,
      at: nowIso,
    }))
  }

  let cancelled = 0
  let refunded = 0

  for (const booking of expired) {
    const currentMetadata = booking.metadata || {}
    const metadata = {
      ...currentMetadata,
      auto_cancelled_at: nowIso,
      auto_cancel_reason: 'professional_confirmation_timeout',
    }

    let cancelResponse = await admin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Tempo para confirmacao expirou.',
        metadata,
      })
      .eq('id', booking.id)
      .eq('status', 'pending_confirmation')
      .select('id')
      .maybeSingle()

    if (cancelResponse.error && cancelResponse.error.message?.includes('metadata')) {
      cancelResponse = await admin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Tempo para confirmacao expirou.',
        })
        .eq('id', booking.id)
        .eq('status', 'pending_confirmation')
        .select('id')
        .maybeSingle()
    }

    const { data: updatedBooking, error: cancelError } = cancelResponse

    if (cancelError || !updatedBooking) {
      console.error('[cron/booking-timeouts] cancel error:', booking.id, cancelError?.message)
      continue
    }
    cancelled += 1

    if (booking.booking_type === 'recurring_parent') {
      const cascadeReason = 'Cancelado devido expiracao de confirmacao do pacote recorrente.'
      const { error: childCancelError } = await admin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: cascadeReason,
        })
        .eq('parent_booking_id', booking.id)
        .in('status', ['pending_confirmation', 'pending'])

      if (childCancelError) {
        console.error('[cron/booking-timeouts] recurring child cancel error:', booking.id, childCancelError.message)
      }

      const { error: sessionCancelError } = await admin
        .from('booking_sessions')
        .update({ status: 'cancelled' })
        .eq('parent_booking_id', booking.id)
        .in('status', ['pending_confirmation', 'pending_payment'])

      if (sessionCancelError) {
        console.error('[cron/booking-timeouts] recurring session cancel error:', booking.id, sessionCancelError.message)
      }
    }

    const refundResponse = await admin
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: nowIso,
      })
      .eq('booking_id', booking.id)
      .in('status', ['captured'])

    const { error: refundError } = refundResponse
    if (refundError) {
      console.error('[cron/booking-timeouts] refund error:', booking.id, refundError.message)
      continue
    }
    refunded += 1
  }

  return withCors(NextResponse.json({
    ok: true,
    checked: (pendingBookings || []).length,
    expired: expired.length,
    cancelled,
    refunded,
    recurringRelease,
    recurringReleaseError,
    at: nowIso,
  }))
}

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request, INTERNAL_API_CORS_POLICY)
}
