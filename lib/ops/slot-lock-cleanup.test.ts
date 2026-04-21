import { describe, it, expect } from 'vitest'
import { runSlotLockCleanup } from './slot-lock-cleanup'

describe('runSlotLockCleanup', () => {
  const now = new Date('2026-04-21T12:00:00.000Z')

  function makeAdmin(expiredLocks: Array<{ id: string }>, deleteError?: string) {
    return {
      from: (table: string) => {
        if (table !== 'slot_locks') throw new Error(`Unexpected table: ${table}`)
        return {
          select: () => ({
            lte: () => ({
              limit: () =>
                Promise.resolve({
                  data: expiredLocks,
                  error: null,
                }),
            }),
          }),
          delete: () => ({
            in: () =>
              Promise.resolve({
                error: deleteError ? { message: deleteError } : null,
              }),
          }),
        }
      },
    } as any
  }

  it('returns zero when no expired locks exist', async () => {
    const admin = makeAdmin([])
    const result = await runSlotLockCleanup(admin, now)
    expect(result.checked).toBe(0)
    expect(result.deleted).toBe(0)
  })

  it('deletes expired locks', async () => {
    const admin = makeAdmin([{ id: 'lock-1' }, { id: 'lock-2' }])
    const result = await runSlotLockCleanup(admin, now)
    expect(result.checked).toBe(2)
    expect(result.deleted).toBe(2)
  })

  it('throws on select error', async () => {
    const admin = {
      from: () => ({
        select: () => ({
          lte: () => ({
            limit: () => Promise.resolve({ data: null, error: { message: 'db error' } }),
          }),
        }),
      }),
    } as any

    await expect(runSlotLockCleanup(admin, now)).rejects.toThrow('db error')
  })
})
