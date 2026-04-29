import { describe, it, expect, vi } from 'vitest'
import { acquireSlotLock, releaseSlotLock } from './slot-locks'
import type { BookingSlotInput } from './types'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

function makeSupabaseClient(overrides?: {
  deleteResult?: { error: null | { message: string } }
  selectResult?: { data: any[] | null; error: null | { message: string } }
  updateResult?: { error: null | { message: string } }
  insertResult?: { data: { id: string } | null; error: null | { code?: string; message: string } }
}) {
  const o = overrides || {}
  const from = vi.fn().mockReturnValue({
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        lte: vi.fn().mockResolvedValue(o.deleteResult ?? { error: null }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gt: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            gt: vi.fn().mockResolvedValue(o.selectResult ?? { data: [], error: null }),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(o.updateResult ?? { error: null }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(o.insertResult ?? { data: { id: 'lock-new-123' }, error: null }),
      }),
    }),
  })
  return { from }
}

function makeInput(overrides?: Partial<BookingSlotInput>): BookingSlotInput {
  const now = new Date()
  const start = new Date(now.getTime() + 60 * 60 * 1000)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return {
    professionalId: 'pro-123',
    userId: 'user-456',
    startUtcIso: start.toISOString(),
    endUtcIso: end.toISOString(),
    ...overrides,
  }
}

describe('acquireSlotLock', () => {
  it('returns lockId on successful insert', async () => {
    const supabase = makeSupabaseClient()
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.lockId).toBe('lock-new-123')
  })

  it('returns locked when another user holds an overlapping lock', async () => {
    const supabase = makeSupabaseClient({
      selectResult: {
        data: [{ id: 'lock-other', user_id: 'other-user' }],
        error: null,
      },
    })
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('locked')
  })

  it('renews own lock instead of creating duplicate', async () => {
    const supabase = makeSupabaseClient({
      selectResult: {
        data: [{ id: 'lock-own-789', user_id: 'user-456' }],
        error: null,
      },
    })
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.lockId).toBe('lock-own-789')
  })

  it('returns error on select query failure', async () => {
    const supabase = makeSupabaseClient({
      selectResult: { data: null, error: { message: 'DB connection lost' } },
    })
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('error')
      expect(result.errorMessage).toBe('DB connection lost')
    }
  })

  it('returns error on renew failure', async () => {
    const supabase = makeSupabaseClient({
      selectResult: {
        data: [{ id: 'lock-own-789', user_id: 'user-456' }],
        error: null,
      },
      updateResult: { error: { message: 'update timeout' } },
    })
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('error')
      expect(result.errorMessage).toBe('update timeout')
    }
  })

  it('returns locked on unique violation (23505)', async () => {
    const supabase = makeSupabaseClient({
      selectResult: { data: [], error: null },
      insertResult: { data: null, error: { code: '23505', message: 'duplicate key value' } },
    })
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('locked')
  })

  it('returns error on generic insert failure', async () => {
    const supabase = makeSupabaseClient({
      selectResult: { data: [], error: null },
      insertResult: { data: null, error: { message: 'insert failed' } },
    })
    const result = await acquireSlotLock(supabase, makeInput())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('error')
      expect(result.errorMessage).toBe('insert failed')
    }
  })

  it('uses custom ttlMinutes when provided', async () => {
    const supabase = makeSupabaseClient()
    const input = makeInput({ ttlMinutes: 30 })
    await acquireSlotLock(supabase, makeInput({ ttlMinutes: 30 }))
    const insertCall = supabase.from('slot_locks').insert
    expect(insertCall).toHaveBeenCalled()
    const inserted = insertCall.mock.calls[0][0]
    const expiresAt = new Date(inserted.expires_at)
    const now = Date.now()
    const diffMinutes = Math.round((expiresAt.getTime() - now) / (60 * 1000))
    expect(diffMinutes).toBeGreaterThanOrEqual(29)
    expect(diffMinutes).toBeLessThanOrEqual(31)
  })
})

describe('releaseSlotLock', () => {
  it('calls delete without throwing on error', async () => {
    const supabase = makeSupabaseClient()
    await expect(releaseSlotLock(supabase, 'lock-123')).resolves.not.toThrow()
  })

  it('logs error on delete failure', async () => {
    const { captureException } = await import('@sentry/nextjs')
    const supabase = makeSupabaseClient()
    supabase.from = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
      }),
    })
    await releaseSlotLock(supabase, 'lock-123')
    expect(captureException).toHaveBeenCalled()
  })
})
