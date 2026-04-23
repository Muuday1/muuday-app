import type { SupabaseClient } from '@supabase/supabase-js'
import { emitUserAbandonedSearch } from '@/lib/email/resend-events'

export type AbandonedSearchResult = {
  checked: number
  emitted: number
  at: string
}

const CONVERSION_WINDOW_MINUTES = 120 // 2 hours
const ABANDONMENT_THRESHOLD_MINUTES = 30 // emit after 30 min of no conversion

/**
 * Scan for search sessions that:
 * 1. Have no conversion after searched_at
 * 2. Are older than the abandonment threshold
 * 3. Have not already emitted an abandoned_search event
 *
 * For each candidate, verify the user has not created any booking
 * since searched_at + conversion_window. If still no conversion,
 * emit `user.abandoned_search` and mark the session.
 */
export async function runAbandonedSearchSync(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<AbandonedSearchResult> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()

  // Find sessions past the abandonment threshold that are unconverted
  // and have not had the event emitted yet.
  const thresholdIso = new Date(
    now.getTime() - ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000,
  ).toISOString()

  const { data: sessions, error } = await admin
    .from('search_sessions')
    .select('id, user_id, query, filters, searched_at, profiles!inner(email)')
    .is('converted_at', null)
    .is('abandoned_event_emitted_at', null)
    .lte('searched_at', thresholdIso)
    .order('searched_at', { ascending: true })
    .limit(500)

  if (error) {
    throw new Error(`Failed to load search sessions: ${error.message}`)
  }

  const candidates = sessions || []
  if (candidates.length === 0) {
    return { checked: 0, emitted: 0, at: nowIso }
  }

  let emitted = 0

  for (const session of candidates) {
    const sessionRecord = session as unknown as Record<string, unknown>
    const sessionId = String(sessionRecord.id)
    const userId = String(sessionRecord.user_id)
    const query = String(sessionRecord.query || '')
    const filters = sessionRecord.filters as Record<string, unknown> | null
    const searchedAt = String(sessionRecord.searched_at)

    const profiles = sessionRecord.profiles
    const email = Array.isArray(profiles)
      ? (profiles[0] as { email?: string } | null)?.email
      : (profiles as { email?: string } | null)?.email

    if (!email) {
      // No email — mark as handled so we don't keep retrying
      await admin
        .from('search_sessions')
        .update({ abandoned_event_emitted_at: nowIso })
        .eq('id', sessionId)
      continue
    }

    // Verify the user has not created any booking within the conversion window
    const conversionWindowEnd = new Date(
      new Date(searchedAt).getTime() + CONVERSION_WINDOW_MINUTES * 60 * 1000,
    ).toISOString()

    const { data: recentBooking } = await admin
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', searchedAt)
      .lte('created_at', conversionWindowEnd)
      .limit(1)
      .maybeSingle()

    if (recentBooking) {
      // User converted — mark session as converted
      await admin
        .from('search_sessions')
        .update({ converted_at: nowIso, converted_booking_id: recentBooking.id })
        .eq('id', sessionId)
      continue
    }

    // Still unconverted within the window — emit abandoned search event
    const filtersString = filters
      ? Object.entries(filters)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')
      : undefined

    emitUserAbandonedSearch(email, {
      query,
      ...(filtersString ? { professional_id: filtersString } : {}),
    })
    emitted++

    // Mark as emitted
    await admin
      .from('search_sessions')
      .update({ abandoned_event_emitted_at: nowIso })
      .eq('id', sessionId)
  }

  return { checked: candidates.length, emitted, at: nowIso }
}
