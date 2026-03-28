import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ReminderType = 'booking.reminder.24h' | 'booking.reminder.1h' | 'booking.reminder.10m'

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
  if (!expectedSecret) return process.env.NODE_ENV !== 'production'
  return normalizeSecret(parseAuthToken(request)) === expectedSecret
}

function resolveReminderType(minutesUntil: number): ReminderType | null {
  if (minutesUntil <= 24 * 60 + 15 && minutesUntil >= 24 * 60 - 15) {
    return 'booking.reminder.24h'
  }
  if (minutesUntil <= 60 + 15 && minutesUntil >= 60 - 15) {
    return 'booking.reminder.1h'
  }
  if (minutesUntil <= 10 + 5 && minutesUntil >= 10 - 5) {
    return 'booking.reminder.10m'
  }
  return null
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
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  let bookings: Record<string, unknown>[] = []
  let loadError: { message?: string } | null = null

  let bookingsResponse = (await admin
    .from('bookings')
    .select('id, user_id, professional_id, scheduled_at, status')
    .gte('scheduled_at', nowIso)
    .lte('scheduled_at', in24h)
    .limit(1000)) as { data: Record<string, unknown>[] | null; error: { message?: string } | null }

  if (bookingsResponse.error && bookingsResponse.error.message?.includes('professional_id')) {
    bookingsResponse = (await admin
      .from('bookings')
      .select('id, user_id, scheduled_at, status')
      .gte('scheduled_at', nowIso)
      .lte('scheduled_at', in24h)
      .limit(1000)) as {
      data: Record<string, unknown>[] | null
      error: { message?: string } | null
    }
  }

  if (bookingsResponse.error) {
    loadError = bookingsResponse.error
  } else {
    bookings = bookingsResponse.data || []
  }

  if (loadError) {
    console.error('[cron/booking-reminders] load error:', loadError)
    return NextResponse.json(
      { error: 'Failed to load bookings.', details: loadError.message || 'unknown' },
      { status: 500 },
    )
  }

  bookings = bookings.filter(booking => String(booking.status || '') === 'confirmed')

  const professionalIds = Array.from(
    new Set(
      bookings
        .map(booking => String((booking as Record<string, unknown>).professional_id || ''))
        .filter(Boolean),
    ),
  )

  const professionalOwnerById = new Map<string, string>()
  if (professionalIds.length > 0) {
    const { data: professionals, error: professionalsError } = await admin
      .from('professionals')
      .select('id, user_id')
      .in('id', professionalIds)

    if (professionalsError) {
      console.error('[cron/booking-reminders] professionals load error:', professionalsError)
      return NextResponse.json(
        { error: 'Failed to load professionals.', details: professionalsError.message || 'unknown' },
        { status: 500 },
      )
    }

    for (const professional of professionals || []) {
      const row = professional as Record<string, unknown>
      professionalOwnerById.set(String(row.id), String(row.user_id || ''))
    }
  }

  const notificationsToInsert: Record<string, unknown>[] = []

  for (const booking of bookings) {
    const bookingId = String((booking as Record<string, unknown>).id)
    const userId = String((booking as Record<string, unknown>).user_id)
    const professionalId = String((booking as Record<string, unknown>).professional_id || '')
    const scheduledAt = String((booking as Record<string, unknown>).scheduled_at)
    const professionalUserId = professionalOwnerById.get(professionalId) || ''

    const minutesUntil = Math.round((new Date(scheduledAt).getTime() - now.getTime()) / (1000 * 60))
    const reminderType = resolveReminderType(minutesUntil)
    if (!reminderType) continue

    const title =
      reminderType === 'booking.reminder.24h'
        ? 'Sua sessao e amanha'
        : reminderType === 'booking.reminder.1h'
          ? 'Sua sessao comeca em 1 hora'
          : 'Sua sessao comeca em 10 minutos'

    const body =
      reminderType === 'booking.reminder.24h'
        ? 'Revise horario e preparacao para a sessao.'
        : reminderType === 'booking.reminder.1h'
          ? 'Prepare-se para entrar na sessao no horario.'
          : 'A sessao esta prestes a comecar.'

    notificationsToInsert.push({
      user_id: userId,
      booking_id: bookingId,
      type: reminderType,
      title,
      body,
      payload: { role: 'user' },
    })

    if (professionalUserId) {
      notificationsToInsert.push({
        user_id: professionalUserId,
        booking_id: bookingId,
        type: reminderType,
        title,
        body,
        payload: { role: 'professional' },
      })
    }
  }

  if (notificationsToInsert.length === 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      checked: bookings.length,
      at: nowIso,
    })
  }

  const { error: insertError } = await admin.from('notifications').upsert(notificationsToInsert, {
    onConflict: 'booking_id,type,user_id',
    ignoreDuplicates: true,
  })

  if (insertError) {
    console.error('[cron/booking-reminders] insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save reminders.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    checked: bookings.length,
    inserted: notificationsToInsert.length,
    at: nowIso,
  })
}
