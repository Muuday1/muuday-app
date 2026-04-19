import { describe, it, expect, vi } from 'vitest'
import { runReviewReminderSync } from './review-reminders'

function createMockAdmin(overrides: {
  bookings?: Array<Record<string, unknown>>
  reviews?: Array<Record<string, unknown>>
  profiles?: Array<Record<string, unknown>>
  professionals?: Array<Record<string, unknown>>
} = {}) {
  const { bookings = [], reviews = [], profiles = [], professionals = [] } = overrides

  return {
    from: vi.fn((table: string) => {
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        lte: vi.fn(() => chain),
        in: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        order: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => {
          if (table === 'bookings') return { data: bookings[0] || null, error: null }
          return { data: null, error: null }
        }),
        then: vi.fn(async (resolve: (v: unknown) => unknown) => {
          if (table === 'bookings') return resolve({ data: bookings, error: null })
          if (table === 'reviews') return resolve({ data: reviews, error: null })
          if (table === 'profiles') return resolve({ data: profiles, error: null })
          if (table === 'professionals') return resolve({ data: professionals, error: null })
          return resolve({ data: [], error: null })
        }),
      }
      return chain
    }),
  } as unknown as Parameters<typeof runReviewReminderSync>[0]
}

describe('runReviewReminderSync', () => {
  it('returns zero when no completed bookings exist', async () => {
    const admin = createMockAdmin({ bookings: [] })
    const result = await runReviewReminderSync(admin, new Date('2026-04-20T12:00:00Z'))
    expect(result.checked).toBe(0)
    expect(result.sent).toBe(0)
  })

  it('skips bookings that already have a review', async () => {
    const booking = {
      id: 'b1',
      user_id: 'u1',
      professional_id: 'p1',
      scheduled_at: '2026-04-19T12:00:00Z',
    }
    const admin = createMockAdmin({
      bookings: [booking],
      reviews: [{ booking_id: 'b1' }],
      profiles: [{ id: 'u1', email: 'user@test.com', full_name: 'User' }],
      professionals: [{ id: 'p1', user_id: 'pu1', bio: 'Prof' }],
    })
    const result = await runReviewReminderSync(admin, new Date('2026-04-20T12:00:00Z'))
    expect(result.checked).toBe(1)
    expect(result.sent).toBe(0)
  })
})
