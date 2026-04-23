import type { SupabaseClient } from '@supabase/supabase-js'
import { emitUserAbandonedCheckout } from '@/lib/email/resend-events'

export type AbandonedCheckoutResult = {
  checked: number
  emitted: number
  at: string
}

const ABANDONMENT_THRESHOLD_MINUTES = 30

/**
 * Scan for bookings stuck in `pending_payment` that have an associated
 * payment row in `pending` status older than the abandonment threshold.
 *
 * This is future-proof for when the deferred Stripe payment flow is
 * activated (booking created with status='pending_payment' and payment
 * status='pending', then user is redirected to complete payment).
 *
 * In the current legacy flow, bookings are created with status='confirmed'
 * and payment status='captured' immediately, so this cron will find nothing.
 */
export async function runAbandonedCheckoutSync(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<AbandonedCheckoutResult> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()

  const thresholdIso = new Date(
    now.getTime() - ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000,
  ).toISOString()

  // Find pending_payment bookings older than threshold that have
  // a pending payment and have not yet had the abandoned event emitted.
  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, user_id, created_at, metadata, payments!inner(id, status), profiles!inner(email)')
    .eq('status', 'pending_payment')
    .eq('payments.status', 'pending')
    .lte('bookings.created_at', thresholdIso)
    .order('bookings.created_at', { ascending: true })
    .limit(200)

  if (error) {
    throw new Error(`Failed to load abandoned checkout candidates: ${error.message}`)
  }

  const candidates = bookings || []
  if (candidates.length === 0) {
    return { checked: 0, emitted: 0, at: nowIso }
  }

  let emitted = 0

  for (const row of candidates) {
    const record = row as unknown as Record<string, unknown>
    const bookingId = String(record.id)
    const metadata = (record.metadata as Record<string, unknown> | null) || {}

    // Idempotency: skip if already emitted
    if (metadata.abandoned_checkout_emitted_at) {
      continue
    }

    const profiles = record.profiles
    const email = Array.isArray(profiles)
      ? (profiles[0] as { email?: string } | null)?.email
      : (profiles as { email?: string } | null)?.email

    if (!email) {
      // Mark as handled to avoid retry loops
      await admin
        .from('bookings')
        .update({
          metadata: { ...metadata, abandoned_checkout_emitted_at: nowIso, abandoned_checkout_no_email: true },
          updated_at: nowIso,
        })
        .eq('id', bookingId)
        .eq('status', 'pending_payment')
      continue
    }

    emitUserAbandonedCheckout(email, { booking_id: bookingId })
    emitted++

    // Mark as emitted
    await admin
      .from('bookings')
      .update({
        metadata: { ...metadata, abandoned_checkout_emitted_at: nowIso },
        updated_at: nowIso,
      })
      .eq('id', bookingId)
      .eq('status', 'pending_payment')
  }

  return { checked: candidates.length, emitted, at: nowIso }
}
