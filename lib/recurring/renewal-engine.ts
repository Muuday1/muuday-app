/**
 * Recurring booking auto-renewal engine
 *
 * Orchestrates:
 * 1. Finding candidates due for renewal
 * 2. Charging the saved payment method off-session
 * 3. Creating the next cycle of bookings when payment succeeds
 */

import * as Sentry from '@sentry/nextjs'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripeClient } from '@/lib/stripe/client'
import { generateRecurrenceSlots } from '@/lib/booking/recurrence-engine'
import type { RecurrencePeriodicity } from '@/lib/booking/types'
import {
  findRenewalCandidates,
  loadBookingForRenewal,
  getLastChildSessionEnd,
  updateRecurringSettingsAfterCharge,
  markRecurringSettingsAsFailed,
  loadRecurringSettingsByGroupId,
  findPerSessionRenewalCandidates,
  type PerSessionCandidate,
} from './renewal-queries'
import type { RenewalCandidate, RenewalChargeResult, RenewalCycleResult } from './types'

const RENEWAL_BATCH_SIZE = 10

export { findRenewalCandidates }

export async function runRenewalChargeBatch(
  admin: SupabaseClient,
  candidates: RenewalCandidate[],
): Promise<{
  charged: number
  failed: number
  errors: Array<{ candidate: RenewalCandidate; error: string }>
}> {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('Stripe client not configured for renewal charging')
  }

  let charged = 0
  let failed = 0
  const errors: Array<{ candidate: RenewalCandidate; error: string }> = []

  // Process in batches to avoid Stripe rate limits
  for (let i = 0; i < candidates.length; i += RENEWAL_BATCH_SIZE) {
    const batch = candidates.slice(i, i + RENEWAL_BATCH_SIZE)
    const results = await Promise.all(
      batch.map((candidate) => chargeSingleRenewal(stripe, admin, candidate)),
    )

    for (let j = 0; j < results.length; j += 1) {
      const result = results[j]
      if (result.success) {
        charged += 1
      } else {
        failed += 1
        errors.push({ candidate: batch[j], error: result.reason })
      }
    }
  }

  return { charged, failed, errors }
}

async function chargeSingleRenewal(
  stripe: Stripe,
  admin: SupabaseClient,
  candidate: RenewalCandidate,
): Promise<RenewalChargeResult> {
  const idempotencyKey = `renewal-${candidate.settingsId}-${candidate.nextRenewalAt}`
  const amountMinor = Math.round(candidate.priceTotal * 100)
  const currency = candidate.currency.toLowerCase()

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountMinor,
        currency,
        customer: candidate.stripeCustomerId,
        payment_method: candidate.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        capture_method: 'manual',
        metadata: {
          muuday_renewal_type: 'recurring_booking',
          muuday_renewal_settings_id: candidate.settingsId,
          muuday_recurrence_group_id: candidate.recurrenceGroupId,
          muuday_user_id: candidate.userId,
          muuday_professional_id: candidate.professionalId,
          muuday_price_total: String(candidate.priceTotal),
          muuday_currency: candidate.currency,
        },
        description: `Renovacao automatica - Agendamento recorrente`,
      },
      { idempotencyKey },
    )

    // Store the PI id so the webhook can correlate later
    await updateRecurringSettingsAfterCharge(admin, candidate.settingsId, paymentIntent.id, candidate.nextRenewalAt)

    // If immediately succeeded (no 3DS), the webhook may already be processing.
    // If requires_action, Stripe will send webhook later.
    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    }
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : String(stripeError)

    // Mark as failed and pause auto-renew (per requirements: pause immediately on failure, no retry)
    await markRecurringSettingsAsFailed(admin, candidate.settingsId)

    Sentry.captureMessage(`[recurring-renewal] Charge failed for settings ${candidate.settingsId}: ${message}`, {
      level: 'warning',
      tags: { area: 'recurring_renewal', context: 'charge_failed' },
      extra: {
        settingsId: candidate.settingsId,
        recurrenceGroupId: candidate.recurrenceGroupId,
        userId: candidate.userId,
        amount: amountMinor,
        currency,
      },
    })

    return { success: false, reason: message }
  }
}

/**
 * Create the next cycle of bookings when a renewal payment succeeds.
 * Called from the Stripe webhook handler.
 */
export async function createNextRenewalCycle(
  admin: SupabaseClient,
  metadata: Record<string, unknown>,
  paymentIntentId: string,
): Promise<RenewalCycleResult> {
  const recurrenceGroupId = String(metadata.muuday_recurrence_group_id || '')
  const settingsId = String(metadata.muuday_renewal_settings_id || '')

  if (!recurrenceGroupId) {
    return { success: false, reason: 'missing_recurrence_group_id_in_metadata' }
  }

  // Load the original parent booking to copy its recurrence configuration
  const parentBooking = await loadBookingForRenewal(admin, recurrenceGroupId)
  if (!parentBooking) {
    return { success: false, reason: 'parent_booking_not_found' }
  }

  // Load settings for pricing
  const settings = await loadRecurringSettingsByGroupId(admin, recurrenceGroupId)
  if (!settings) {
    return { success: false, reason: 'recurring_settings_not_found' }
  }

  // Determine the start of the next cycle:
  // Last session end of the current cycle + 1 period
  const lastSessionEndRaw = await getLastChildSessionEnd(admin, recurrenceGroupId)
  const lastSessionEnd = lastSessionEndRaw ? new Date(lastSessionEndRaw) : new Date()

  const periodicity = (parentBooking.recurrence_periodicity || 'weekly') as RecurrencePeriodicity
  const intervalDays = parentBooking.recurrence_interval_days || undefined

  // Compute next start based on periodicity
  let nextStart = new Date(lastSessionEnd)
  if (periodicity === 'monthly') {
    nextStart = new Date(nextStart.setMonth(nextStart.getMonth() + 1))
  } else if (periodicity === 'biweekly') {
    nextStart = new Date(nextStart.setDate(nextStart.getDate() + 14))
  } else if (periodicity === 'custom_days') {
    nextStart = new Date(nextStart.setDate(nextStart.getDate() + (intervalDays || 1)))
  } else {
    nextStart = new Date(nextStart.setDate(nextStart.getDate() + 7))
  }

  // Count how many sessions the previous cycle had (to create the same number)
  const { count: sessionCount } = await admin
    .from('booking_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('parent_booking_id', recurrenceGroupId)

  const occurrences = sessionCount ?? 4 // fallback to 4 if unknown

  // Build slots
  const durationMs = (parentBooking.duration_minutes || 60) * 60_000
  const slots = generateRecurrenceSlots({
    startDateUtc: nextStart,
    endDateUtc: new Date(nextStart.getTime() + durationMs),
    periodicity,
    intervalDays,
    occurrences,
    bookingWindowDays: 365, // Renewals are internal, no public window restriction
  })

  if (slots.slots.length === 0) {
    return { success: false, reason: 'no_slots_generated' }
  }

  // Build payloads for the atomic RPC
  const parentPayload = {
    user_id: parentBooking.user_id,
    professional_id: parentBooking.professional_id,
    scheduled_at: slots.slots[0].startUtc.toISOString(),
    start_time_utc: slots.slots[0].startUtc.toISOString(),
    end_time_utc: slots.slots[0].endUtc.toISOString(),
    timezone_user: parentBooking.timezone_user,
    timezone_professional: parentBooking.timezone_professional,
    duration_minutes: parentBooking.duration_minutes,
    status: 'pending_payment',
    booking_type: 'recurring_parent',
    confirmation_mode_snapshot: parentBooking.confirmation_mode_snapshot || 'auto_accept',
    cancellation_policy_snapshot: parentBooking.cancellation_policy_snapshot || {},
    price_brl: parentBooking.price_brl,
    price_user_currency: parentBooking.price_user_currency,
    price_total: settings.price_total,
    user_currency: settings.currency,
    recurrence_group_id: recurrenceGroupId,
    recurrence_periodicity: periodicity,
    recurrence_interval_days: intervalDays,
    recurrence_end_date: parentBooking.recurrence_end_date,
    recurrence_auto_renew: true,
    notes: parentBooking.notes,
    session_purpose: parentBooking.session_purpose,
    metadata: {
      ...parentBooking.metadata,
      auto_renewal_cycle: true,
      previous_cycle_parent_id: recurrenceGroupId,
      renewal_payment_intent_id: paymentIntentId,
    },
  }

  const childPayloads = slots.slots.slice(1).map((slot) => ({
    user_id: parentBooking.user_id,
    professional_id: parentBooking.professional_id,
    scheduled_at: slot.startUtc.toISOString(),
    start_time_utc: slot.startUtc.toISOString(),
    end_time_utc: slot.endUtc.toISOString(),
    timezone_user: parentBooking.timezone_user,
    timezone_professional: parentBooking.timezone_professional,
    duration_minutes: parentBooking.duration_minutes,
    status: 'pending_payment',
    booking_type: 'recurring_child',
    confirmation_mode_snapshot: parentBooking.confirmation_mode_snapshot || 'auto_accept',
    cancellation_policy_snapshot: parentBooking.cancellation_policy_snapshot || {},
    price_brl: parentBooking.price_brl,
    price_user_currency: parentBooking.price_user_currency,
    price_total: settings.price_total,
    user_currency: settings.currency,
    notes: parentBooking.notes,
    session_purpose: parentBooking.session_purpose,
    metadata: {
      auto_renewal_cycle: true,
      occurrence_index: slot.occurrenceIndex,
    },
  }))

  const sessionsPayload = slots.slots.map((slot, idx) => ({
    scheduled_at: slot.startUtc.toISOString(),
    start_time_utc: slot.startUtc.toISOString(),
    end_time_utc: slot.endUtc.toISOString(),
    status: 'pending_payment',
    session_order: idx + 1,
  }))

  // Call the atomic RPC to create bookings + payment
  const { data: rpcResult, error: rpcError } = await admin.rpc('create_recurring_booking_with_payment', {
    p_parent: parentPayload,
    p_children: childPayloads,
    p_sessions: sessionsPayload,
    p_user_id: parentBooking.user_id,
    p_professional_id: parentBooking.professional_id,
    p_payment_provider: 'stripe',
    p_payment_amount_total: settings.price_total,
    p_payment_currency: settings.currency,
    p_payment_status: 'requires_payment',
    p_payment_metadata: {
      auto_renewal: true,
      renewal_payment_intent_id: paymentIntentId,
      previous_cycle_parent_id: recurrenceGroupId,
    },
    p_captured_at: null,
  })

  if (rpcError) {
    Sentry.captureException(rpcError, {
      tags: { area: 'recurring_renewal', context: 'create_next_cycle' },
      extra: { recurrenceGroupId, settingsId, paymentIntentId },
    })
    return { success: false, reason: `rpc_error: ${rpcError.message}` }
  }

  if (!rpcResult || !Array.isArray(rpcResult) || rpcResult.length === 0) {
    return { success: false, reason: 'rpc_empty_result' }
  }

  const row = rpcResult[0] as Record<string, unknown>
  const newParentBookingId = String(row.parent_booking_id || '')
  const newPaymentId = String(row.payment_id || '')

  if (!newParentBookingId) {
    return { success: false, reason: 'rpc_missing_parent_id' }
  }

  // Update the payment row to link the Stripe PI
  await admin
    .from('payments')
    .update({
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', newPaymentId)

  // Update settings: last_renewal_at, next_renewal_at based on the new cycle end
  const newCycleEnd = slots.slots[slots.slots.length - 1].endUtc
  const nextRenewalAt = new Date(newCycleEnd.getTime() - 7 * 24 * 60 * 60 * 1000)

  await updateRecurringSettingsAfterCharge(admin, settingsId, paymentIntentId, nextRenewalAt.toISOString())

  return { success: true, newParentBookingId, paymentId: newPaymentId }
}

/**
 * Per-session billing: charge each session individually, rather than
 * charging the full cycle upfront.
 *
 * For each upcoming session that does not yet have a captured payment,
 * create a PaymentIntent off-session and link it to the child booking.
 *
 * If any charge fails for a given recurrence group, auto-renew is paused
 * for that entire group (since it's the same payment method).
 */
export async function runPerSessionRenewalChargeBatch(
  admin: SupabaseClient,
): Promise<{
  charged: number
  failed: number
  errors: Array<{ settingsId: string; childBookingId: string; error: string }>
}> {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('Stripe client not configured for per-session renewal charging')
  }

  const candidates = await findPerSessionRenewalCandidates(admin, 7)

  let charged = 0
  let failed = 0
  const errors: Array<{ settingsId: string; childBookingId: string; error: string }> = []

  // Group by settingsId so one failure pauses the whole group
  const byGroup = new Map<string, PerSessionCandidate[]>()
  for (const c of candidates) {
    const arr = byGroup.get(c.settingsId) || []
    arr.push(c)
    byGroup.set(c.settingsId, arr)
  }

  for (const [settingsId, groupCandidates] of byGroup) {
    for (const candidate of groupCandidates) {
      const result = await chargeSingleSession(stripe, admin, candidate)

      if (result.success) {
        charged += 1
      } else {
        failed += 1
        errors.push({
          settingsId,
          childBookingId: candidate.childBookingId,
          error: result.reason,
        })

        // Pause auto-renew for this entire group immediately
        await markRecurringSettingsAsFailed(admin, settingsId)

        Sentry.captureMessage(
          `[recurring-renewal] Per-session charge failed for settings ${settingsId}, child ${candidate.childBookingId}: ${result.reason}`,
          {
            level: 'warning',
            tags: { area: 'recurring_renewal', context: 'per_session_charge_failed' },
            extra: {
              settingsId,
              childBookingId: candidate.childBookingId,
              recurrenceGroupId: candidate.recurrenceGroupId,
              userId: candidate.userId,
            },
          },
        )

        // Stop processing further sessions for this group
        break
      }
    }
  }

  return { charged, failed, errors }
}

async function chargeSingleSession(
  stripe: Stripe,
  admin: SupabaseClient,
  candidate: PerSessionCandidate,
): Promise<RenewalChargeResult> {
  const idempotencyKey = `per-session-${candidate.childBookingId}-${candidate.sessionStartUtc}`
  const amountMinor = Math.round(candidate.priceTotal * 100)
  const currency = candidate.currency.toLowerCase()

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountMinor,
        currency,
        customer: candidate.stripeCustomerId,
        payment_method: candidate.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        capture_method: 'manual',
        metadata: {
          muuday_renewal_type: 'per_session_booking',
          muuday_renewal_settings_id: candidate.settingsId,
          muuday_recurrence_group_id: candidate.recurrenceGroupId,
          muuday_user_id: candidate.userId,
          muuday_professional_id: candidate.professionalId,
          muuday_child_booking_id: candidate.childBookingId,
          muuday_price_total: String(candidate.priceTotal),
          muuday_currency: candidate.currency,
        },
        description: `Renovacao automatica - Sessao individual`,
      },
      { idempotencyKey },
    )

    // Create the payment row immediately (webhook will capture it later)
    const { error: paymentError } = await admin.from('payments').insert({
      booking_id: candidate.childBookingId,
      user_id: candidate.userId,
      professional_id: candidate.professionalId,
      provider: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      amount_total_minor: amountMinor,
      currency: candidate.currency.toUpperCase(),
      status: 'requires_payment',
      metadata: {
        per_session_renewal: true,
        recurrence_group_id: candidate.recurrenceGroupId,
        settings_id: candidate.settingsId,
      },
    })

    if (paymentError) {
      Sentry.captureException(paymentError, {
        tags: { area: 'recurring_renewal', context: 'per_session_payment_insert' },
        extra: { childBookingId: candidate.childBookingId, settingsId: candidate.settingsId },
      })
    }

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    }
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : String(stripeError)
    return { success: false, reason: message }
  }
}
