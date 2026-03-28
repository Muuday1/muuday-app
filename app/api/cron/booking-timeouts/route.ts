import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MANUAL_CONFIRMATION_SLA_HOURS = 24

type BookingRow = {
  id: string
  created_at: string
  metadata: Record<string, unknown> | null
}

function parseAuthToken(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]?.trim()) return match[1].trim()
  const altHeader = request.headers.get('x-cron-secret') || ''
  if (altHeader.trim()) return altHeader.trim()
  const queryToken = request.nextUrl.searchParams.get('token') || ''
  return queryToken.trim()
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
  if (!expectedSecret) {
    return process.env.NODE_ENV !== 'production'
  }
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
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.' },
      { status: 500 },
    )
  }

  const now = new Date()
  const nowIso = now.toISOString()

  const { data: pendingBookings, error: fetchError } = await admin
    .from('bookings')
    .select('id, created_at, metadata')
    .eq('status', 'pending_confirmation')
    .limit(500)

  if (fetchError) {
    console.error('[cron/booking-timeouts] fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to load pending bookings.' }, { status: 500 })
  }

  const expired = ((pendingBookings || []) as BookingRow[]).filter(booking => {
    const deadline = getConfirmationDeadline(booking)
    return deadline.getTime() <= now.getTime()
  })

  if (expired.length === 0) {
    return NextResponse.json({
      ok: true,
      cancelled: 0,
      refunded: 0,
      checked: (pendingBookings || []).length,
      at: nowIso,
    })
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

    const { data: updatedBooking, error: cancelError } = await admin
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

    if (cancelError || !updatedBooking) {
      console.error('[cron/booking-timeouts] cancel error:', booking.id, cancelError?.message)
      continue
    }
    cancelled += 1

    const { error: refundError } = await admin
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: nowIso,
      })
      .eq('booking_id', booking.id)
      .in('status', ['captured'])

    if (refundError) {
      console.error('[cron/booking-timeouts] refund error:', booking.id, refundError.message)
      continue
    }
    refunded += 1
  }

  return NextResponse.json({
    ok: true,
    checked: (pendingBookings || []).length,
    expired: expired.length,
    cancelled,
    refunded,
    at: nowIso,
  })
}
