import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runNoShowDetection } from './no-show-detection'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('@/lib/push/sender', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(1),
}))

import { sendPushToUser } from '@/lib/push/sender'

function createMockAdmin(overrides?: {
  bookings?: Array<Record<string, unknown>>
  professional?: Record<string, unknown> | null
}) {
  const bookings = overrides?.bookings ?? []
  const professional = overrides?.professional ?? null

  let insertCalls: Array<Record<string, unknown>> = []

  function createEqChain() {
    const conditions: Array<{ field: string; value: unknown }> = []

    const eqFn = vi.fn((field: string, value: unknown) => {
      conditions.push({ field, value })
      return eqChain
    })

    const lteFn = vi.fn(() => eqChain)
    const orderFn = vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: bookings, error: null }) }))
    const maybeSingleFn = vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn, maybeSingle: maybeSingleFn })

    const eqChain = {
      eq: eqFn,
      lte: lteFn,
      order: orderFn,
      select: selectFn,
      maybeSingle: maybeSingleFn,
    }

    return eqChain
  }

  const mockFrom = vi.fn((table: string) => {
    if (table === 'bookings') {
      return {
        select: vi.fn().mockImplementation((columns?: string) => {
          if (columns === 'metadata') {
            return {
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null }),
              }),
            }
          }
          return {
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: bookings, error: null }),
                }),
              }),
            }),
          }
        }),
        update: vi.fn().mockReturnValue(createEqChain()),
      }
    }

    if (table === 'professionals') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: professional, error: null }),
          }),
        }),
      }
    }

    if (table === 'notifications') {
      return {
        insert: vi.fn().mockImplementation((data: Record<string, unknown> | Array<Record<string, unknown>>) => {
          const items = Array.isArray(data) ? data : [data]
          insertCalls = insertCalls.concat(items)
          return Promise.resolve({ error: null })
        }),
      }
    }

    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }
  })

  return {
    from: mockFrom,
    getInsertCalls: () => insertCalls,
  } as unknown as SupabaseClient & { getInsertCalls: () => Array<Record<string, unknown>> }
}

function endedBooking(overrides?: Record<string, unknown>) {
  const now = new Date()
  const startTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const endTime = new Date(now.getTime() - 20 * 60 * 1000).toISOString() // ended 20 min ago

  return {
    id: 'booking-1',
    user_id: 'user-1',
    professional_id: 'prof-1',
    scheduled_at: startTime,
    start_time_utc: startTime,
    end_time_utc: endTime,
    status: 'confirmed',
    metadata: {},
    updated_at: startTime,
    ...overrides,
  }
}

describe('runNoShowDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns zeros when no candidates', async () => {
    const admin = createMockAdmin()

    const result = await runNoShowDetection(admin, new Date())

    expect(result.checked).toBe(0)
    expect(result.detected).toBe(0)
    expect(result.refunded).toBe(0)
  })

  it('detects no-show for ended session without completion', async () => {
    const admin = createMockAdmin({
      bookings: [endedBooking()],
      professional: { user_id: 'prof-user-1' },
    })

    const result = await runNoShowDetection(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.detected).toBe(1)
    expect(result.refunded).toBe(0)
  })

  it('creates notifications for both client and professional', async () => {
    const admin = createMockAdmin({
      bookings: [endedBooking()],
      professional: { user_id: 'prof-user-1' },
    })

    await runNoShowDetection(admin, new Date())

    const insertCalls = (admin as unknown as { getInsertCalls: () => Array<Record<string, unknown>> }).getInsertCalls()
    expect(insertCalls).toHaveLength(2)

    const clientNotif = insertCalls.find((n: Record<string, unknown>) => n.user_id === 'user-1')
    const profNotif = insertCalls.find((n: Record<string, unknown>) => n.user_id === 'prof-user-1')

    expect(clientNotif).toBeDefined()
    expect(clientNotif?.type).toBe('booking_no_show_detected')
    expect(profNotif).toBeDefined()
    expect(profNotif?.type).toBe('booking_no_show_detected')
  })

  it('sends push to both client and professional', async () => {
    const admin = createMockAdmin({
      bookings: [endedBooking()],
      professional: { user_id: 'prof-user-1' },
    })

    await runNoShowDetection(admin, new Date())

    expect(sendPushToUser).toHaveBeenCalledTimes(2)
    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: 'Sessão marcada como ausente (no-show)',
        url: '/agenda',
        tag: 'booking_no_show_detected',
      }),
      expect.objectContaining({ notifType: 'booking_no_show_detected' }),
    )
    expect(sendPushToUser).toHaveBeenCalledWith(
      'prof-user-1',
      expect.objectContaining({
        title: 'Sessão marcada como ausente (no-show)',
        url: '/dashboard',
        tag: 'booking_no_show_detected',
      }),
      expect.objectContaining({ notifType: 'booking_no_show_detected' }),
    )
  })

  it('skips already handled bookings', async () => {
    const admin = createMockAdmin({
      bookings: [endedBooking({ status: 'no_show' })],
      professional: { user_id: 'prof-user-1' },
    })

    const result = await runNoShowDetection(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.detected).toBe(0)
  })

  it('applies refund when user reports professional no-show', async () => {
    const admin = createMockAdmin({
      bookings: [endedBooking({ metadata: { no_show_actor: 'user' } })],
      professional: { user_id: 'prof-user-1' },
    })

    const result = await runNoShowDetection(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.detected).toBe(1)
    expect(result.refunded).toBe(1)
  })

  it('handles bookings without professional_id', async () => {
    const admin = createMockAdmin({
      bookings: [endedBooking({ professional_id: null })],
      professional: null,
    })

    const result = await runNoShowDetection(admin, new Date())

    expect(result.checked).toBe(1)
    expect(result.detected).toBe(1)

    // Only client notification + push, no professional
    const insertCalls = (admin as unknown as { getInsertCalls: () => Array<Record<string, unknown>> }).getInsertCalls()
    expect(insertCalls).toHaveLength(1)
    expect(sendPushToUser).toHaveBeenCalledTimes(1)
    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-1',
      expect.any(Object),
      expect.objectContaining({ notifType: 'booking_no_show_detected' }),
    )
  })
})
