import { describe, it, expect, vi } from 'vitest'
import { canSendPush, notifTypeToPreferenceKey } from './preferences'
import type { SupabaseClient } from '@supabase/supabase-js'

function createMockAdmin(overrides?: {
  notification_preferences?: Record<string, boolean> | null
  quietHours?: { enabled: boolean; start: string; end: string } | null
  timezone?: string | null
  error?: boolean
}) {
  const prefs = overrides?.notification_preferences ?? null
  const quietHours = overrides?.quietHours ?? null
  const timezone = overrides?.timezone ?? 'UTC'
  const shouldError = overrides?.error ?? false

  const notification_preferences = quietHours
    ? { ...(prefs || {}), quiet_hours: quietHours }
    : prefs

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            shouldError
              ? { data: null, error: { message: 'db error' } }
              : { data: { notification_preferences, timezone }, error: null },
          ),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

describe('notifTypeToPreferenceKey', () => {
  it('maps session reminders', () => {
    expect(notifTypeToPreferenceKey('booking.reminder.24h')).toBe('session_reminders')
    expect(notifTypeToPreferenceKey('booking.reminder.1h')).toBe('session_reminders')
    expect(notifTypeToPreferenceKey('booking.reminder.10m')).toBe('session_reminders')
  })

  it('maps chat messages', () => {
    expect(notifTypeToPreferenceKey('chat_message')).toBe('chat_messages')
    expect(notifTypeToPreferenceKey('chat.reaction')).toBe('chat_messages')
  })

  it('maps booking lifecycle events', () => {
    expect(notifTypeToPreferenceKey('booking_auto_cancelled')).toBe('booking_emails')
    expect(notifTypeToPreferenceKey('booking_cancelled')).toBe('booking_emails')
    expect(notifTypeToPreferenceKey('booking_confirmed')).toBe('booking_emails')
    expect(notifTypeToPreferenceKey('booking_no_show_detected')).toBe('booking_emails')
    expect(notifTypeToPreferenceKey('ops.professional_no_show')).toBe('booking_emails')
  })

  it('maps payment events', () => {
    expect(notifTypeToPreferenceKey('payment_confirmed')).toBe('booking_emails')
    expect(notifTypeToPreferenceKey('payment_failed')).toBe('booking_emails')
    expect(notifTypeToPreferenceKey('payment_refunded')).toBe('booking_emails')
  })

  it('maps news and promotions', () => {
    expect(notifTypeToPreferenceKey('news')).toBe('news_promotions')
    expect(notifTypeToPreferenceKey('promotion')).toBe('news_promotions')
    expect(notifTypeToPreferenceKey('platform_update')).toBe('news_promotions')
  })

  it('returns null for unknown types', () => {
    expect(notifTypeToPreferenceKey('unknown_type')).toBeNull()
    expect(notifTypeToPreferenceKey('')).toBeNull()
  })
})

describe('canSendPush', () => {
  it('returns true when no userId', async () => {
    const admin = createMockAdmin()
    expect(await canSendPush(admin, null, 'session_reminders')).toBe(true)
    expect(await canSendPush(admin, undefined, 'booking_emails')).toBe(true)
  })

  it('returns true when preferences are null (default opt-in)', async () => {
    const admin = createMockAdmin({ notification_preferences: null })
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(true)
  })

  it('returns true when preference is explicitly enabled', async () => {
    const admin = createMockAdmin({ notification_preferences: { session_reminders: true } })
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(true)
  })

  it('returns false when preference is explicitly disabled', async () => {
    const admin = createMockAdmin({ notification_preferences: { session_reminders: false } })
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(false)
  })

  it('returns true for unspecified preferences (default opt-in)', async () => {
    const admin = createMockAdmin({ notification_preferences: { session_reminders: false } })
    expect(await canSendPush(admin, 'user-1', 'booking_emails')).toBe(true)
  })

  it('returns true on database error (fail-open)', async () => {
    const admin = createMockAdmin({ error: true })
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(true)
  })

  // Quiet hours integration

  it('returns false during active quiet hours even when preference is enabled', async () => {
    const admin = createMockAdmin({
      notification_preferences: { session_reminders: true },
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: 'UTC',
    })
    // 23:00 UTC is inside 22:00-08:00 quiet hours
    const now = new Date('2024-01-15T23:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(false)
    vi.useRealTimers()
  })

  it('returns true when quiet hours are inactive', async () => {
    const admin = createMockAdmin({
      notification_preferences: { session_reminders: true },
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: 'UTC',
    })
    // 12:00 UTC is outside 22:00-08:00 quiet hours
    const now = new Date('2024-01-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(true)
    vi.useRealTimers()
  })

  it('returns false when preference is disabled regardless of quiet hours', async () => {
    const admin = createMockAdmin({
      notification_preferences: { session_reminders: false },
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: 'UTC',
    })
    // 12:00 UTC is outside quiet hours, but preference is disabled
    const now = new Date('2024-01-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(false)
    vi.useRealTimers()
  })

  it('returns true when quiet hours are disabled', async () => {
    const admin = createMockAdmin({
      notification_preferences: { session_reminders: true },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      timezone: 'UTC',
    })
    const now = new Date('2024-01-15T23:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    expect(await canSendPush(admin, 'user-1', 'session_reminders')).toBe(true)
    vi.useRealTimers()
  })
})
