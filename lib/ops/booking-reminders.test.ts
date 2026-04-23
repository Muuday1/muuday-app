import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runBookingReminderSync } from './booking-reminders'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock the push sender to avoid real network calls and admin client issues
vi.mock('@/lib/push/sender', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(1),
}))

import { sendPushToUser } from '@/lib/push/sender'

function createMockAdmin(overrides?: {
  bookings?: Array<Record<string, unknown>>
  professionals?: Array<Record<string, unknown>>
  existingNotifications?: Array<Record<string, unknown>>
}) {
  const bookings = overrides?.bookings ?? []
  const professionals = overrides?.professionals ?? []
  const existingNotifications = overrides?.existingNotifications ?? []

  let notificationsInserted = false

  const mockFrom = vi.fn((table: string) => {
    if (table === 'bookings') {
      return {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: bookings, error: null }),
            }),
          }),
        }),
      }
    }

    if (table === 'professionals') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: professionals, error: null }),
        }),
      }
    }

    if (table === 'notifications') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: existingNotifications, error: null }),
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }

    return {
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }
  })

  return {
    from: mockFrom,
  } as unknown as SupabaseClient
}

// Helper to create a booking at a specific offset from now
function bookingAt(minutesFromNow: number, overrides?: Record<string, unknown>) {
  const scheduledAt = new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString()
  return {
    id: `booking-${minutesFromNow}`,
    user_id: 'user-1',
    professional_id: 'prof-1',
    scheduled_at: scheduledAt,
    status: 'confirmed',
    ...overrides,
  }
}

describe('runBookingReminderSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates 24h reminders for bookings ~24 hours away', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(24 * 60)],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.inserted).toBe(2) // user + professional
  })

  it('creates 1h reminders for bookings ~1 hour away', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(60)],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.inserted).toBe(2)
  })

  it('creates 10m reminders for bookings ~10 minutes away', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(10)],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.inserted).toBe(2)
  })

  it('skips bookings that are not confirmed', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(60, { status: 'pending_payment' })],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(0)
    expect(result.inserted).toBe(0)
  })

  it('skips bookings without a matching reminder window', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(30)], // 30 min away — no reminder window
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(1) // booking was checked
    expect(result.inserted).toBe(0) // but no reminder window matched
  })

  it('does not duplicate reminders (upsert + dedup)', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(60)],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
      existingNotifications: [
        { booking_id: 'booking-60', type: 'booking.reminder.1h', user_id: 'user-1' },
      ],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.inserted).toBe(1) // only professional is new
  })

  it('sends push only for new notifications', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(60)],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
      existingNotifications: [],
    })

    await runBookingReminderSync(admin, new Date())

    // Should send push for both user and professional
    expect(sendPushToUser).toHaveBeenCalledTimes(2)
    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: 'Sua sessão começa em 1 hora',
        tag: 'booking.reminder.1h',
        url: '/agenda',
      }),
      expect.objectContaining({ notifType: 'booking.reminder.1h' }),
    )
    expect(sendPushToUser).toHaveBeenCalledWith(
      'prof-user-1',
      expect.objectContaining({
        title: 'Sua sessão começa em 1 hora',
        tag: 'booking.reminder.1h',
        url: '/dashboard',
      }),
      expect.objectContaining({ notifType: 'booking.reminder.1h' }),
    )
  })

  it('does not send push for existing notifications', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(60)],
      professionals: [{ id: 'prof-1', user_id: 'prof-user-1' }],
      existingNotifications: [
        { booking_id: 'booking-60', type: 'booking.reminder.1h', user_id: 'user-1' },
        { booking_id: 'booking-60', type: 'booking.reminder.1h', user_id: 'prof-user-1' },
      ],
    })

    await runBookingReminderSync(admin, new Date())

    expect(sendPushToUser).not.toHaveBeenCalled()
  })

  it('handles bookings without professional_id', async () => {
    const admin = createMockAdmin({
      bookings: [bookingAt(60, { professional_id: null })],
      professionals: [],
    })

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.inserted).toBe(1) // only user
  })

  it('handles empty bookings gracefully', async () => {
    const admin = createMockAdmin()

    const result = await runBookingReminderSync(admin, new Date())

    expect(result.checked).toBe(0)
    expect(result.inserted).toBe(0)
  })
})
