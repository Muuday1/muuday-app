import { describe, it, expect, vi } from 'vitest'
import { hasExternalBusyConflict } from './external-calendar-conflicts'

function makeSupabase(result: { count: number | null; error: any }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            gt: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
    }),
  } as any
}

describe('hasExternalBusyConflict', () => {
  it('returns true when there is an overlapping busy slot', async () => {
    const supabase = makeSupabase({ count: 3, error: null })
    const result = await hasExternalBusyConflict(supabase, 'pro-1', '2026-04-25T10:00:00Z', '2026-04-25T11:00:00Z')
    expect(result).toBe(true)
  })

  it('returns false when no overlapping busy slots', async () => {
    const supabase = makeSupabase({ count: 0, error: null })
    const result = await hasExternalBusyConflict(supabase, 'pro-1', '2026-04-25T10:00:00Z', '2026-04-25T11:00:00Z')
    expect(result).toBe(false)
  })

  it('returns false on DB error (fail-open)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const supabase = makeSupabase({ count: null, error: { message: 'connection lost' } })
    const result = await hasExternalBusyConflict(supabase, 'pro-1', '2026-04-25T10:00:00Z', '2026-04-25T11:00:00Z')
    expect(result).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('connection lost'))
    consoleSpy.mockRestore()
  })

  it('returns false when count is null without error', async () => {
    const supabase = makeSupabase({ count: null, error: null })
    const result = await hasExternalBusyConflict(supabase, 'pro-1', '2026-04-25T10:00:00Z', '2026-04-25T11:00:00Z')
    expect(result).toBe(false)
  })

  it('filters by professional_id and time overlap', async () => {
    const selectFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        lt: vi.fn().mockReturnValue({
          gt: vi.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      }),
    })
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: selectFn,
      }),
    } as any

    await hasExternalBusyConflict(supabase, 'pro-2', '2026-04-25T09:00:00Z', '2026-04-25T10:00:00Z')

    expect(supabase.from).toHaveBeenCalledWith('external_calendar_busy_slots')
    expect(selectFn).toHaveBeenCalledWith('id', { count: 'exact', head: true })
  })
})
