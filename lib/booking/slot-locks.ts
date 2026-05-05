import * as Sentry from '@sentry/nextjs'
import type { BookingSlotInput } from './types'

type SupabaseLikeClient = {
  from: (table: string) => any
}

type SlotLockResult =
  | { ok: true; lockId: string }
  | { ok: false; reason: 'locked' | 'error'; errorMessage?: string }

export async function acquireSlotLock(
  supabase: SupabaseLikeClient,
  input: BookingSlotInput,
): Promise<SlotLockResult> {
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const ttlMinutes = input.ttlMinutes ?? 10
  const expiresAt = new Date(now + ttlMinutes * 60 * 1000).toISOString()

  const { data: overlappingLocks, error: lockQueryError } = await supabase
    .from('slot_locks')
    .select('id, user_id')
    .eq('professional_id', input.professionalId)
    .gt('expires_at', nowIso)
    .lt('start_time_utc', input.endUtcIso)
    .gt('end_time_utc', input.startUtcIso)

  if (lockQueryError) {
    return { ok: false, reason: 'error', errorMessage: lockQueryError.message }
  }

  const lockByOtherUser = (overlappingLocks || []).find(
    (lock: { id: string; user_id: string }) => lock.user_id !== input.userId,
  )
  if (lockByOtherUser) {
    return { ok: false, reason: 'locked' }
  }

  const ownLock = (overlappingLocks || []).find(
    (lock: { id: string; user_id: string }) => lock.user_id === input.userId,
  )
  if (ownLock) {
    const { error: renewError } = await supabase.from('slot_locks').update({ expires_at: expiresAt }).eq('id', ownLock.id)
    if (renewError) {
      Sentry.captureException(renewError, { tags: { area: 'slot_locks' } })
      return { ok: false, reason: 'error', errorMessage: renewError.message }
    }
    return { ok: true, lockId: ownLock.id }
  }

  const { data, error } = await supabase
    .from('slot_locks')
    .insert({
      professional_id: input.professionalId,
      user_id: input.userId,
      start_time_utc: input.startUtcIso,
      end_time_utc: input.endUtcIso,
      booking_type: input.bookingType || 'one_off',
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (error) {
    const errorCode = (error as { code?: string }).code
    if (errorCode === '23505') return { ok: false, reason: 'locked' }
    return { ok: false, reason: 'error', errorMessage: error.message }
  }

  return { ok: true, lockId: data.id as string }
}

export async function releaseSlotLock(supabase: SupabaseLikeClient, lockId: string) {
  const { error } = await supabase.from('slot_locks').delete().eq('id', lockId)
  if (error) {
    Sentry.captureException(error, { tags: { area: 'slot_locks' } })
  }
}
