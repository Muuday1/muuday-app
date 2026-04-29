import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/client'
import { emailLayout, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'
import { isQuietHoursForUser } from '@/lib/notifications/quiet-hours'

/**
 * Send review request emails for bookings completed ~24h ago that have no review yet.
 */
export async function runReviewReminderSync(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<{ checked: number; sent: number; at: string }> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()

  // Window: completed between 23h and 25h ago
  const fromTime = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()
  const toTime = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, user_id, professional_id, scheduled_at')
    .eq('status', 'completed')
    .gte('updated_at', fromTime)
    .lte('updated_at', toTime)
    .limit(500)

  if (error) {
    throw new Error(`Failed to load completed bookings: ${error.message}`)
  }

  const eligibleBookings = (bookings || []).filter((b) => b.user_id && b.professional_id)
  if (eligibleBookings.length === 0) {
    return { checked: 0, sent: 0, at: nowIso }
  }

  // Exclude bookings that already have a review
  const bookingIds = eligibleBookings.map((b) => b.id)
  const { data: existingReviews, error: reviewsError } = await admin
    .from('reviews')
    .select('booking_id')
    .in('booking_id', bookingIds)

  if (reviewsError) {
    Sentry.captureException(reviewsError, { tags: { area: 'review_reminders' } })
    // Abort to avoid sending duplicate review requests when we can't verify state
    return { checked: eligibleBookings.length, sent: 0, at: nowIso }
  }

  const reviewedBookingIds = new Set((existingReviews || []).map((r) => r.booking_id))
  const pendingBookings = eligibleBookings.filter((b) => !reviewedBookingIds.has(b.id))

  if (pendingBookings.length === 0) {
    return { checked: eligibleBookings.length, sent: 0, at: nowIso }
  }

  // Load user emails and professional names
  const userIds = Array.from(new Set(pendingBookings.map((b) => b.user_id)))
  const professionalIds = Array.from(new Set(pendingBookings.map((b) => b.professional_id)))

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds)

  const { data: professionals, error: professionalsError } = await admin
    .from('professionals')
    .select('id, user_id, bio')
    .in('id', professionalIds)

  if (profilesError) {
    Sentry.captureException(profilesError, { tags: { area: 'review_reminders' } })
  }
  if (professionalsError) {
    Sentry.captureException(professionalsError, { tags: { area: 'review_reminders' } })
  }

  const profileById = new Map((profiles || []).map((p) => [p.id, p]))
  const professionalById = new Map((professionals || []).map((p) => [p.id, p]))

  let sent = 0
  let skippedQuietHours = 0
  for (const booking of pendingBookings) {
    const user = profileById.get(booking.user_id)
    const professional = professionalById.get(booking.professional_id)
    if (!user?.email || !professional) continue

    // Respect quiet hours — skip email during rest periods
    const quietHoursActive = await isQuietHoursForUser(admin, booking.user_id, now)
    if (quietHoursActive) {
      skippedQuietHours++
      continue
    }

    const professionalName = professional.bio || 'seu profissional'

    const result = await sendEmail({
      from: from(),
      to: user.email,
      subject: `Como foi sua sessão com ${professionalName}?`,
      html: emailLayout(
        'Avaliação',
        'Conte-nos como foi sua sessão ✨',
        `<p class="greet">Olá, ${user.full_name || 'Olá'}!</p>
        <p class="bt">Sua sessão com <strong>${professionalName}</strong> foi concluída. Como foi sua experiência?</p>
        <p class="bt">Sua avaliação ajuda outros usuários a encontrarem os melhores profissionais e fortalece a comunidade Muuday.</p>
        ${cta(`${APP_URL}/avaliar/${booking.id}`, 'Avaliar sessão →')}
        ${signoff()}`
      ),
    })

    if (!result.error) {
      sent++
    }
  }

  if (skippedQuietHours > 0) {
    console.info(`[review-reminders] skipped ${skippedQuietHours} emails due to quiet hours`)
  }

  return { checked: pendingBookings.length, sent, at: nowIso }
}
