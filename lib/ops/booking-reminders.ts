import type { SupabaseClient } from '@supabase/supabase-js'

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
      ? 'Sua sess?o e amanha'
      : reminderType === 'booking.reminder.1h'
        ? 'Sua sess?o comeca em 1 hora'
        : 'Sua sess?o comeca em 10 minutos'

  const body =
    reminderType === 'booking.reminder.24h'
      ? 'Revise hor?rio e preparacao para a sess?o.'
      : reminderType === 'booking.reminder.1h'
        ? 'Prepare-se para entrar na sess?o no hor?rio.'
        : 'A sess?o est? prestes a comecar.'

  return { title, body }
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

  const notificationsToInsert: Record<string, unknown>[] = []

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

  const { error: insertError } = await admin.from('notifications').upsert(notificationsToInsert, {
    onConflict: 'booking_id,type,user_id',
    ignoreDuplicates: true,
  })

  if (insertError) {
    throw new Error(`Failed to upsert reminders: ${insertError.message || 'unknown'}`)
  }

  return {
    checked: bookings.length,
    inserted: notificationsToInsert.length,
    at: nowIso,
  }
}
