import { describe, it, expect, vi } from 'vitest'
import { isQuietHoursNow, isQuietHoursForUser } from './quiet-hours'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// isQuietHoursNow
// ---------------------------------------------------------------------------

describe('isQuietHoursNow', () => {
  it('returns true when current time is inside a simple range', () => {
    const now = new Date('2024-01-15T02:30:00')
    expect(isQuietHoursNow('01:00', '05:00', now)).toBe(true)
  })

  it('returns false when current time is before a simple range', () => {
    const now = new Date('2024-01-15T00:30:00')
    expect(isQuietHoursNow('01:00', '05:00', now)).toBe(false)
  })

  it('returns false when current time is after a simple range', () => {
    const now = new Date('2024-01-15T06:00:00')
    expect(isQuietHoursNow('01:00', '05:00', now)).toBe(false)
  })

  it('returns true when current time is inside a midnight-spanning range (before midnight)', () => {
    const now = new Date('2024-01-15T23:00:00')
    expect(isQuietHoursNow('22:00', '08:00', now)).toBe(true)
  })

  it('returns true when current time is inside a midnight-spanning range (after midnight)', () => {
    const now = new Date('2024-01-15T03:00:00')
    expect(isQuietHoursNow('22:00', '08:00', now)).toBe(true)
  })

  it('returns false when current time is outside a midnight-spanning range', () => {
    const now = new Date('2024-01-15T12:00:00')
    expect(isQuietHoursNow('22:00', '08:00', now)).toBe(false)
  })

  it('returns true exactly at start time (inclusive)', () => {
    const now = new Date('2024-01-15T22:00:00')
    expect(isQuietHoursNow('22:00', '08:00', now)).toBe(true)
  })

  it('returns false exactly at end time (exclusive)', () => {
    const now = new Date('2024-01-15T08:00:00')
    expect(isQuietHoursNow('22:00', '08:00', now)).toBe(false)
  })

  it('returns false for invalid start time (fail-open)', () => {
    const now = new Date('2024-01-15T02:00:00')
    expect(isQuietHoursNow('invalid', '05:00', now)).toBe(false)
  })

  it('returns false for invalid end time (fail-open)', () => {
    const now = new Date('2024-01-15T02:00:00')
    expect(isQuietHoursNow('01:00', 'invalid', now)).toBe(false)
  })

  it('returns false for out-of-range hours (fail-open)', () => {
    const now = new Date('2024-01-15T02:00:00')
    expect(isQuietHoursNow('25:00', '05:00', now)).toBe(false)
    expect(isQuietHoursNow('01:00', '99:00', now)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isQuietHoursForUser
// ---------------------------------------------------------------------------

function createMockAdmin(overrides?: {
  quietHours?: { enabled: boolean; start: string; end: string } | null
  timezone?: string | null
  error?: boolean
}) {
  const quietHours = overrides?.quietHours ?? null
  const timezone = overrides?.timezone === undefined ? 'UTC' : overrides.timezone
  const shouldError = overrides?.error ?? false

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            shouldError
              ? { data: null, error: { message: 'db error' } }
              : {
                  data: {
                    notification_preferences: quietHours
                      ? { quiet_hours: quietHours }
                      : null,
                    timezone,
                  },
                  error: null,
                },
          ),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

describe('isQuietHoursForUser', () => {
  it('returns false when userId is missing', async () => {
    const admin = createMockAdmin()
    expect(await isQuietHoursForUser(admin, null)).toBe(false)
    expect(await isQuietHoursForUser(admin, undefined)).toBe(false)
  })

  it('returns false when quiet_hours config is missing', async () => {
    const admin = createMockAdmin({ quietHours: null })
    expect(await isQuietHoursForUser(admin, 'user-1')).toBe(false)
  })

  it('returns false when quiet_hours is disabled', async () => {
    const admin = createMockAdmin({
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    })
    const now = new Date('2024-01-15T23:00:00')
    expect(await isQuietHoursForUser(admin, 'user-1', now)).toBe(false)
  })

  it('returns true when quiet_hours is enabled and current time is inside window', async () => {
    const admin = createMockAdmin({
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: 'UTC',
    })
    const now = new Date('2024-01-15T23:00:00Z')
    expect(await isQuietHoursForUser(admin, 'user-1', now)).toBe(true)
  })

  it('returns false when quiet_hours is enabled and current time is outside window', async () => {
    const admin = createMockAdmin({
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: 'UTC',
    })
    const now = new Date('2024-01-15T12:00:00Z')
    expect(await isQuietHoursForUser(admin, 'user-1', now)).toBe(false)
  })

  it('returns false on database error (fail-open)', async () => {
    const admin = createMockAdmin({ error: true })
    const now = new Date('2024-01-15T23:00:00Z')
    expect(await isQuietHoursForUser(admin, 'user-1', now)).toBe(false)
  })

  it('respects user timezone from profile', async () => {
    // User in Tokyo (UTC+9). Quiet hours 22:00-08:00 Tokyo time.
    // At 22:30 UTC it is 07:30 next day in Tokyo -> inside quiet hours.
    const admin = createMockAdmin({
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: 'Asia/Tokyo',
    })
    const now = new Date('2024-01-15T22:30:00Z')
    expect(await isQuietHoursForUser(admin, 'user-1', now)).toBe(true)
  })

  it('defaults to America/Sao_Paulo when timezone is missing', async () => {
    const admin = createMockAdmin({
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      timezone: null,
    })
    // 23:00 UTC = 20:00 BRT (Sao Paulo, UTC-3 in January) -> outside quiet hours
    const now = new Date('2024-01-15T23:00:00Z')
    expect(await isQuietHoursForUser(admin, 'user-1', now)).toBe(false)
  })
})
