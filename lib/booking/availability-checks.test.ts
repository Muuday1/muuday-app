import { describe, it, expect, vi } from 'vitest'
import {
  isSlotWithinRules,
  isSlotAllowedByExceptions,
  hasInternalConflict,
} from './availability-checks'

describe('isSlotWithinRules', () => {
  const timezone = 'America/Sao_Paulo'

  it('returns true when slot is within rule', () => {
    // 2026-04-24 is Friday (ISO weekday 5, but %7 gives 5 which is Fri in our mapping)
    const startUtc = new Date('2026-04-24T15:00:00Z') // 12:00 BRT Friday
    const endUtc = new Date('2026-04-24T16:00:00Z')   // 13:00 BRT Friday
    const rules = [
      { weekday: 5, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    expect(isSlotWithinRules(startUtc, endUtc, timezone, rules)).toBe(true)
  })

  it('returns false when no rule matches weekday', () => {
    const startUtc = new Date('2026-04-26T15:00:00Z') // Sunday
    const endUtc = new Date('2026-04-26T16:00:00Z')
    const rules = [
      { weekday: 1, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    expect(isSlotWithinRules(startUtc, endUtc, timezone, rules)).toBe(false)
  })

  it('returns false when slot exceeds rule end', () => {
    const startUtc = new Date('2026-04-24T20:00:00Z') // 17:00 BRT Friday
    const endUtc = new Date('2026-04-24T21:00:00Z')   // 18:00 BRT Friday
    const rules = [
      { weekday: 5, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    expect(isSlotWithinRules(startUtc, endUtc, timezone, rules)).toBe(false)
  })

  it('returns false for empty rules', () => {
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    expect(isSlotWithinRules(startUtc, endUtc, timezone, [])).toBe(false)
  })

  it('handles rules with null/missing fields gracefully', () => {
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const rules = [
      { weekday: 5, start_time_local: null, end_time_local: null },
      { weekday: 5, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    expect(isSlotWithinRules(startUtc, endUtc, timezone, rules)).toBe(true)
  })

  it('checks at least one matching rule', () => {
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const rules = [
      { weekday: 1, start_time_local: '09:00', end_time_local: '17:00' },
      { weekday: 5, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    expect(isSlotWithinRules(startUtc, endUtc, timezone, rules)).toBe(true)
  })
})

describe('isSlotAllowedByExceptions', () => {
  const timezone = 'America/Sao_Paulo'

  function makeSupabase(exceptions: any[], error: null | { message: string } = null) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: exceptions, error }),
            }),
          }),
        }),
      }),
    } as any
  }

  it('returns true when no exceptions exist', async () => {
    const supabase = makeSupabase([])
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const result = await isSlotAllowedByExceptions(supabase, 'pro-123', timezone, startUtc, endUtc)
    expect(result).toBe(true)
  })

  it('returns false when blocked exception overlaps', async () => {
    const supabase = makeSupabase([
      { is_available: false, start_time_local: '12:00', end_time_local: '14:00' },
    ])
    const startUtc = new Date('2026-04-24T15:00:00Z') // 12:00 BRT
    const endUtc = new Date('2026-04-24T16:00:00Z')   // 13:00 BRT
    const result = await isSlotAllowedByExceptions(supabase, 'pro-123', timezone, startUtc, endUtc)
    expect(result).toBe(false)
  })

  it('returns true when blocked exception does not overlap', async () => {
    const supabase = makeSupabase([
      { is_available: false, start_time_local: '14:00', end_time_local: '16:00' },
    ])
    const startUtc = new Date('2026-04-24T15:00:00Z') // 12:00 BRT
    const endUtc = new Date('2026-04-24T16:00:00Z')   // 13:00 BRT
    const result = await isSlotAllowedByExceptions(supabase, 'pro-123', timezone, startUtc, endUtc)
    expect(result).toBe(true)
  })

  it('returns true when allowed window covers slot', async () => {
    const supabase = makeSupabase([
      { is_available: false, start_time_local: '08:00', end_time_local: '11:00' },
      { is_available: true, start_time_local: '11:00', end_time_local: '14:00' },
    ])
    const startUtc = new Date('2026-04-24T15:00:00Z') // 12:00 BRT
    const endUtc = new Date('2026-04-24T16:00:00Z')   // 13:00 BRT
    const result = await isSlotAllowedByExceptions(supabase, 'pro-123', timezone, startUtc, endUtc)
    expect(result).toBe(true)
  })

  it('returns false when slot is outside all allowed windows', async () => {
    const supabase = makeSupabase([
      { is_available: false, start_time_local: '08:00', end_time_local: '18:00' },
      { is_available: true, start_time_local: '11:00', end_time_local: '11:30' },
    ])
    const startUtc = new Date('2026-04-24T15:00:00Z') // 12:00 BRT
    const endUtc = new Date('2026-04-24T16:00:00Z')   // 13:00 BRT
    const result = await isSlotAllowedByExceptions(supabase, 'pro-123', timezone, startUtc, endUtc)
    expect(result).toBe(false)
  })

  it('returns false on database error (fail-closed)', async () => {
    const supabase = makeSupabase([], { message: 'connection timeout' })
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const result = await isSlotAllowedByExceptions(supabase, 'pro-123', timezone, startUtc, endUtc)
    expect(result).toBe(false)
  })
})

describe('hasInternalConflict', () => {
  function makeSupabase(bookings: any[], error: null | { message: string } = null) {
    const finalResult = { data: bookings, error }

    const promiseLike: any = {
      then: (onFulfilled: any) => Promise.resolve(finalResult).then(onFulfilled),
    }
    promiseLike.neq = vi.fn().mockReturnValue(promiseLike)
    promiseLike.order = vi.fn().mockReturnValue(promiseLike)
    promiseLike.limit = vi.fn().mockReturnValue(promiseLike)

    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue(promiseLike),
          }),
        }),
      }),
    })

    return { from: fromMock } as any
  }

  it('returns false when no bookings overlap', async () => {
    const supabase = makeSupabase([
      {
        id: 'booking-1',
        start_time_utc: '2026-04-24T08:00:00Z',
        end_time_utc: '2026-04-24T09:00:00Z',
        duration_minutes: 60,
      },
    ])
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const result = await hasInternalConflict(supabase, 'pro-123', startUtc, endUtc, 15)
    expect(result).toBe(false)
  })

  it('returns true when booking overlaps with buffer', async () => {
    const supabase = makeSupabase([
      {
        id: 'booking-1',
        start_time_utc: '2026-04-24T15:30:00Z',
        end_time_utc: '2026-04-24T16:30:00Z',
        duration_minutes: 60,
      },
    ])
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const result = await hasInternalConflict(supabase, 'pro-123', startUtc, endUtc, 15)
    expect(result).toBe(true)
  })

  it('returns true on database error (fail-closed)', async () => {
    const supabase = makeSupabase([], { message: 'db error' })
    const startUtc = new Date('2026-04-24T15:00:00Z')
    const endUtc = new Date('2026-04-24T16:00:00Z')
    const result = await hasInternalConflict(supabase, 'pro-123', startUtc, endUtc, 15)
    expect(result).toBe(true)
  })
})
