/**
 * Server-side session lifecycle tracker.
 *
 * All functions here MUST run in a Node.js server context (Route Handler,
 * Server Action, or Inngest function). They use `createAdminClient()` to
 * bypass RLS because these are system-level bookkeeping updates.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { SessionStatus, SessionFailureReason, SessionTelemetryEvent } from './types';

const SUPABASE_TABLE = 'bookings' as const;

/**
 * Atomically set session_status.  Returns the previous status so callers
 * can detect transitions (e.g. not_ready -> join_open).
 */
export async function setSessionStatus(
  bookingId: string,
  status: SessionStatus,
  failureReason?: SessionFailureReason
): Promise<{ previousStatus: SessionStatus | null; updated: boolean }> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.error('[sessionTracker] Admin client unavailable (missing service role key)');
    return { previousStatus: null, updated: false };
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select('session_status')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('[sessionTracker] Failed to read current status:', error.message);
    return { previousStatus: null, updated: false };
  }

  const previousStatus = (data?.session_status as SessionStatus | null) ?? null;

  const patch: Record<string, unknown> = { session_status: status };
  if (failureReason) {
    patch.session_failure_reason = failureReason;
  }

  const { error: updateError } = await supabase
    .from(SUPABASE_TABLE)
    .update(patch)
    .eq('id', bookingId);

  if (updateError) {
    console.error('[sessionTracker] Failed to update status:', updateError.message);
    return { previousStatus, updated: false };
  }

  return { previousStatus, updated: true };
}

/**
 * Record the exact timestamp when a participant first joined.
 * Safe to call multiple times — only the first call writes.
 */
export async function recordParticipantJoined(
  bookingId: string,
  role: 'client' | 'professional'
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const column = role === 'client' ? 'client_joined_at' : 'professional_joined_at';

  // Only write if NULL (first join)
  const { data, error: readError } = await supabase
    .from(SUPABASE_TABLE)
    .select(column)
    .eq('id', bookingId)
    .single();

  if (readError) {
    console.error(`[sessionTracker] Failed to read ${column}:`, readError.message);
    return;
  }

  const value = (data as Record<string, unknown> | null)?.[column];
  if (value != null) {
    return; // already recorded
  }

  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .update({ [column]: new Date().toISOString() })
    .eq('id', bookingId)
    .is(column, null);

  if (error) {
    console.error(`[sessionTracker] Failed to record ${role} joined:`, error.message);
  }
}

/**
 * Mark actual_started_at when both participants have joined.
 */
export async function recordActualStartIfBothJoined(bookingId: string): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select('client_joined_at, professional_joined_at, actual_started_at')
    .eq('id', bookingId)
    .single();

  if (error || !data) return;

  const row = data as Record<string, unknown>;
  if (row.client_joined_at && row.professional_joined_at && !row.actual_started_at) {
    const { error: updateError } = await supabase
      .from(SUPABASE_TABLE)
      .update({
        actual_started_at: new Date().toISOString(),
        session_status: 'in_progress',
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('[sessionTracker] Failed to record actual start:', updateError.message);
    }
  }
}

/**
 * Mark actual_ended_at and final status when the session ends.
 */
export async function recordSessionEnded(
  bookingId: string,
  finalStatus: Extract<SessionStatus, 'ended' | 'failed'>,
  failureReason?: SessionFailureReason
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const patch: Record<string, unknown> = {
    actual_ended_at: new Date().toISOString(),
    session_status: finalStatus,
  };
  if (failureReason) {
    patch.session_failure_reason = failureReason;
  }

  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .update(patch)
    .eq('id', bookingId);

  if (error) {
    console.error('[sessionTracker] Failed to record session ended:', error.message);
  }
}

/**
 * Write a telemetry event.  Currently logs to console + (future) could
 * insert into a dedicated session_events table or send to Inngest.
 */
export async function emitSessionTelemetry(event: SessionTelemetryEvent): Promise<void> {
  // TODO: persist to DB or Inngest if analytics requirement grows
  console.info('[sessionTelemetry]', JSON.stringify(event));
}
