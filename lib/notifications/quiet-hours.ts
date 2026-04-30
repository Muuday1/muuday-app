import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

interface QuietHoursConfig {
  enabled: boolean
  start: string
  end: string
}

/**
 * Parse "HH:MM" into minutes since midnight.
 * Returns null for invalid formats.
 */
function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * Check whether the current moment falls within a quiet-hours window.
 *
 * @param start   Start time in "HH:MM" (inclusive)
 * @param end     End time in "HH:MM" (exclusive)
 * @param now     Optional Date to test against (defaults to new Date())
 * @returns true  if now is inside the quiet-hours window
 *
 * Supports windows that span midnight (e.g. 22:00 → 08:00).
 * Invalid time strings are treated as "not in quiet hours" (fail-open).
 */
export function isQuietHoursNow(
  start: string,
  end: string,
  now: Date = new Date(),
): boolean {
  const startMinutes = parseTimeToMinutes(start)
  const endMinutes = parseTimeToMinutes(end)
  if (startMinutes === null || endMinutes === null) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }
  // Window spans midnight (e.g. 22:00 -> 08:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

/**
 * Check whether a user's quiet-hours are currently active.
 *
 * Reads `notification_preferences.quiet_hours` and `timezone` from the
 * user's profile. Defaults timezone to 'America/Sao_Paulo' when missing.
 *
 * Returns `false` (fail-open) when:
 * - userId is missing
 * - quiet_hours is missing or disabled
 * - DB query fails
 * - time strings are malformed
 */
export async function isQuietHoursForUser(
  admin: SupabaseClient,
  userId: string | null | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  if (!userId) return false

  try {
    const { data, error } = await admin
      .from('profiles')
      .select('notification_preferences, timezone')
      .eq('id', userId)
      .single()

    if (error) {
      Sentry.captureMessage('[quiet-hours] query error: ' + error.message, { level: 'warning', tags: { area: 'notifications/quiet-hours' } })
      return false
    }

    const prefs = data?.notification_preferences as
      | { quiet_hours?: QuietHoursConfig }
      | null

    const quietHours = prefs?.quiet_hours
    if (!quietHours || !quietHours.enabled) return false

    // Use user's timezone if available, otherwise default to São Paulo
    const userTz = (data?.timezone as string | null) || 'America/Sao_Paulo'

    // Extract hour/minute in the user's timezone using Intl.
    // This avoids locale-dependent Date parsing issues in test environments.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: userTz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now)

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)

    // Build a neutral Date with just the local hour/minute for comparison
    const localNow = new Date(2000, 0, 1, hour, minute)

    return isQuietHoursNow(quietHours.start, quietHours.end, localNow)
  } catch (e) {
    Sentry.captureMessage('[quiet-hours] unexpected error: ' + e, { level: 'warning', tags: { area: 'notifications/quiet-hours' } })
    return false
  }
}
