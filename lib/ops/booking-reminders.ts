import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendPushToUser } from '@/lib/push/sender'

type ReminderType = 'booking.reminder.24h' | 'booking.reminder.1h' | 'booking.reminder.10m'

function resolveReminderType(minutesUntil: number): ReminderType | null {
  if (minutesUntil <= 24 * 60 + 15 && minutesUntil >= 24 * 60 - 15) return 'booking.reminder.24h'
  if (minutesUntil <= 60 + 15 && minutesUntil >= 60 - 15) return 'booking.reminder.1h'
  if (minutesUntil <= 10 + 5 && minutesUntil >= 10 - 5) return 'booking.reminder.10m'
  return null
}

function buildReminderCopy(reminderType: ReminderType) {
  const title =
    reminderType === 'booking.reminder.24h'
      ? 'Sua sessão é amanhã'
      : reminderType === 'booking.reminder.1h'
        ? 'Sua sessão começa em 1 hora'
        : 'Sua sessão começa em 10 minutos'

  const body =
    reminderType === 'booking.reminder.24h'
      ? 'Revise horário e preparação para a sessão.'
      : reminderType === 'booking.reminder.1h'
        ? 'Prepare-se para entrar na sessão no horário.'
        : 'A sessão está prestes a começar.'

  return { title, body }
}

interface NotificationTuple {
  user_id: string
  booking_id: string
  type: ReminderType
  title: string
  body: string
  payload: { role: string }
}

export async function runBookingReminderSync(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<{ checked: number; inserted: number; at: string }> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  let bookings: Record<string, unknown>[] = []

  let bookingsResponse = (await admin
    .from('bookings')
    .select('id, user_id, professional_id, scheduled_at, status')
    .gte('scheduled_at', nowIso)
    .lte('scheduled_at', in24h)
    .limit(1000)) as { data: Record<string, unknown>[] | null; error: { message?: string } | null }

  // Backward compatibility for environments where professional_id may be absent.
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
    throw new Error(`Failed to load bookings: ${bookingsResponse.error.message || 'unknown'}`)
  }

  bookings = (bookingsResponse.data || []).filter(booking => String(booking.status || '') === 'confirmed')

  const professionalIds = Array.from(
    new Set(bookings.map(booking => String(booking.professional_id || '')).filter(Boolean)),
  )

  const professionalOwnerById = new Map<string, string>()
  if (professionalIds.length > 0) {
    const { data: professionals, error: professionalsError } = await admin
      .from('professionals')
      .select('id, user_id')
      .in('id', professionalIds)

    if (professionalsError) {
      throw new Error(`Failed to load professionals: ${professionalsError.message || 'unknown'}`)
    }

    for (const professional of professionals || []) {
      const row = professional as Record<string, unknown>
      professionalOwnerById.set(String(row.id), String(row.user_id || ''))
    }
  }

  const notificationsToInsert: NotificationTuple[] = []

  for (const booking of bookings) {
    const bookingId = String(booking.id)
    const userId = String(booking.user_id)
    const professionalId = String(booking.professional_id || '')
    const scheduledAt = String(booking.scheduled_at)
    const professionalUserId = professionalOwnerById.get(professionalId) || ''

    const minutesUntil = Math.round((new Date(scheduledAt).getTime() - now.getTime()) / (1000 * 60))
    const reminderType = resolveReminderType(minutesUntil)
    if (!reminderType) continue

    const { title, body } = buildReminderCopy(reminderType)

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
    return { checked: bookings.length, inserted: 0, at: nowIso }
  }

  // Determine which notifications are actually new to avoid duplicate push sends.
  // The cron runs every 5 minutes; upsert ignores duplicates, but we need to
  // know which rows will be inserted to send push only once per reminder.
  const existingKeys = new Set<string>()
  if (notificationsToInsert.length > 0) {
    const bookingIds = Array.from(new Set(notificationsToInsert.map(n => n.booking_id)))
    const types = Array.from(new Set(notificationsToInsert.map(n => n.type)))
    const userIds = Array.from(new Set(notificationsToInsert.map(n => n.user_id)))

    const { data: existing } = await admin
      .from('notifications')
      .select('booking_id, type, user_id')
      .in('booking_id', bookingIds)
      .in('type', types)
      .in('user_id', userIds)

    for (const row of existing || []) {
      existingKeys.add(`${row.booking_id}:${row.type}:${row.user_id}`)
    }
  }

  const newNotifications = notificationsToInsert.filter(
    n => !existingKeys.has(`${n.booking_id}:${n.type}:${n.user_id}`),
  )

  // Send push notifications for new reminders (fire-and-forget)
  for (const n of newNotifications) {
    const url = n.payload.role === 'professional' ? '/dashboard' : '/agenda'
    void sendPushToUser(
      n.user_id,
      {
        title: n.title,
        body: n.body,
        url,
        tag: n.type,
      },
      { notifType: n.type, admin },
    ).catch(err => {
      Sentry.captureMessage('[booking-reminders] push failed: ' + (err instanceof Error ? err.message : String(err)), { level: 'warning', tags: { area: 'ops/booking-reminders' } })
    })
  }

  const { error: insertError } = await admin.from('notifications').upsert(notificationsToInsert, {
    onConflict: 'booking_id,type,user_id',
    ignoreDuplicates: true,
  })

  if (insertError) {
    throw new Error(`Failed to upsert reminders: ${insertError.message || 'unknown'}`)
  }

  return {
    checked: bookings.length,
    inserted: newNotifications.length,
    at: nowIso,
  }
}
