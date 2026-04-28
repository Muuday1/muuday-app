import type { SupabaseClient } from '@supabase/supabase-js'
import { isQuietHoursForUser } from '@/lib/notifications/quiet-hours'

/**
 * Preference keys used for push notifications.
 * Aligned with email notification preferences in lib/actions/email/shared.ts
 */
export type PushNotifKey =
  | 'booking_emails'
  | 'session_reminders'
  | 'news_promotions'
  | 'chat_messages'

/**
 * Map notification types (as stored in the notifications table) to preference keys.
 */
export function notifTypeToPreferenceKey(type: string): PushNotifKey | null {
  // Session reminders
  if (type.startsWith('booking.reminder.')) {
    return 'session_reminders'
  }
  // Chat messages
  if (type === 'chat_message' || type.startsWith('chat.')) {
    return 'chat_messages'
  }
  // Booking lifecycle events
  if (
    type === 'booking_auto_cancelled' ||
    type === 'booking_cancelled' ||
    type === 'booking_confirmed' ||
    type === 'booking_no_show_detected' ||
    type === 'ops.professional_no_show'
  ) {
    return 'booking_emails'
  }
  // Payment events
  if (
    type === 'payment_confirmed' ||
    type === 'payment_failed' ||
    type === 'payment_refunded'
  ) {
    return 'booking_emails'
  }
  // News/promotions
  if (type === 'news' || type === 'promotion' || type === 'platform_update') {
    return 'news_promotions'
  }
  return null
}

/**
 * Check if push notifications are enabled for a user + category.
 * Returns true if push should be sent (default opt-in).
 * Returns false only if user has explicitly disabled the category
 * OR quiet hours are currently active for the user.
 */
export async function canSendPush(
  admin: SupabaseClient,
  userId: string | null | undefined,
  key: PushNotifKey,
): Promise<boolean> {
  if (!userId) return true
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('[push/preferences] query error:', error.message)
      return true
    }

    const prefs = data?.notification_preferences as Record<string, boolean> | null
    if (!prefs) return true

    // Category opt-out check
    if (prefs[key] === false) return false

    // Quiet-hours check — suppress push during rest periods
    const quietHoursActive = await isQuietHoursForUser(admin, userId)
    if (quietHoursActive) return false

    return true
  } catch (e) {
    console.warn('[push/preferences] unexpected error:', e)
    return true
  }
}
