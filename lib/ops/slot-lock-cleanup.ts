import type { SupabaseClient } from '@supabase/supabase-js'

export type SlotLockCleanupResult = {
  checked: number
  deleted: number
  at: string
}

/**
 * Remove expired slot locks that were never released.
 *
 * Slot locks have a TTL (default 10 minutes) and should be released
 * after booking creation succeeds or fails. This job handles orphaned
 * locks from crashes, network failures, or unhandled exceptions.
 */
export async function runSlotLockCleanup(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<SlotLockCleanupResult> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()

  const { data: expiredLocks, error } = await admin
    .from('slot_locks')
    .select('id')
    .lte('expires_at', nowIso)
    .limit(1000)

  if (error) {
    throw new Error(`Failed to load expired slot locks: ${error.message}`)
  }

  const locks = expiredLocks || []
  if (locks.length === 0) {
    return { checked: 0, deleted: 0, at: nowIso }
  }

  const ids = locks.map((lock) => lock.id)

  const { error: deleteError } = await admin.from('slot_locks').delete().in('id', ids)

  if (deleteError) {
    throw new Error(`Failed to delete expired slot locks: ${deleteError.message}`)
  }

  return {
    checked: locks.length,
    deleted: locks.length,
    at: nowIso,
  }
}
