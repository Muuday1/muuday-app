/**
 * Database queries for recurring booking auto-renewal
 *
 * All functions use admin client (service_role) and are meant to run
 * inside Inngest steps or webhook handlers.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecurringPaymentSettings, RenewalCandidate } from './types'

export async function findRenewalCandidates(
  admin: SupabaseClient,
  lookaheadDays: number = 7,
): Promise<RenewalCandidate[]> {
  const { data, error } = await admin.rpc('get_recurring_settings_for_renewal', {
    p_lookahead_days: lookaheadDays,
  })

  if (error) {
    throw new Error(`Failed to find renewal candidates: ${error.message}`)
  }

  if (!data || !Array.isArray(data)) return []

  return data
    .filter(
      (row): row is NonNullable<typeof row> =>
        row?.stripe_payment_method_id != null && row?.stripe_customer_id != null,
    )
    .map((row) => ({
      settingsId: String(row.settings_id),
      userId: String(row.user_id),
      professionalId: String(row.professional_id),
      recurrenceGroupId: String(row.recurrence_group_id),
      stripePaymentMethodId: String(row.stripe_payment_method_id),
      stripeCustomerId: String(row.stripe_customer_id),
      priceTotal: Number(row.price_total),
      currency: String(row.currency),
      nextRenewalAt: String(row.next_renewal_at),
    }))
}

export async function loadRecurringSettingsByGroupId(
  admin: SupabaseClient,
  recurrenceGroupId: string,
): Promise<RecurringPaymentSettings | null> {
  const { data, error } = await admin
    .from('recurring_payment_settings')
    .select('*')
    .eq('recurrence_group_id', recurrenceGroupId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load recurring settings: ${error.message}`)
  }

  return data as RecurringPaymentSettings | null
}

export async function updateRecurringSettingsAfterCharge(
  admin: SupabaseClient,
  settingsId: string,
  paymentIntentId: string,
  nextRenewalAt: string,
): Promise<void> {
  const { error } = await admin.rpc('update_recurring_payment_settings', {
    p_settings_id: settingsId,
    p_last_renewal_at: new Date().toISOString(),
    p_last_payment_intent_id: paymentIntentId,
    p_next_renewal_at: nextRenewalAt,
  })

  if (error) {
    throw new Error(`Failed to update recurring settings after charge: ${error.message}`)
  }
}

export async function markRecurringSettingsAsFailed(
  admin: SupabaseClient,
  settingsId: string,
): Promise<void> {
  const { error } = await admin.rpc('update_recurring_payment_settings', {
    p_settings_id: settingsId,
    p_auto_renew: false,
    p_status: 'payment_failed',
  })

  if (error) {
    throw new Error(`Failed to mark recurring settings as failed: ${error.message}`)
  }
}

export async function createRecurringPaymentSettingsFromPayment(
  admin: SupabaseClient,
  input: {
    userId: string
    professionalId: string
    recurrenceGroupId: string
    stripePaymentMethodId: string
    stripeCustomerId: string
    priceTotal: number
    currency: string
    nextRenewalAt: string
    billingMode?: 'package' | 'per_session'
  },
): Promise<string | null> {
  const { data, error } = await admin.rpc('create_recurring_payment_settings', {
    p_user_id: input.userId,
    p_professional_id: input.professionalId,
    p_recurrence_group_id: input.recurrenceGroupId,
    p_stripe_payment_method_id: input.stripePaymentMethodId,
    p_stripe_customer_id: input.stripeCustomerId,
    p_next_renewal_at: input.nextRenewalAt,
    p_price_total: input.priceTotal,
    p_currency: input.currency,
    p_billing_mode: input.billingMode || 'package',
  })

  if (error) {
    throw new Error(`Failed to create recurring payment settings: ${error.message}`)
  }

  return data ? String(data) : null
}

export type PerSessionCandidate = {
  settingsId: string
  userId: string
  professionalId: string
  recurrenceGroupId: string
  stripePaymentMethodId: string
  stripeCustomerId: string
  priceTotal: number
  currency: string
  childBookingId: string
  sessionStartUtc: string
  sessionEndUtc: string
}

export async function findPerSessionRenewalCandidates(
  admin: SupabaseClient,
  lookaheadDays: number = 7,
): Promise<PerSessionCandidate[]> {
  const lookAheadIso = new Date(Date.now() + lookaheadDays * 24 * 60 * 60 * 1000).toISOString()

  // Find recurring_payment_settings that are per_session and have sessions coming up
  // that don't have a captured payment yet.
  const { data, error } = await admin
    .from('recurring_payment_settings')
    .select(
      `
      id,
      user_id,
      professional_id,
      recurrence_group_id,
      stripe_payment_method_id,
      stripe_customer_id,
      price_total,
      currency,
      bookings!recurring_payment_settings_recurrence_group_id_fkey(
        id,
        bookings!parent_booking_id(
          id,
          scheduled_at,
          start_time_utc,
          end_time_utc
        )
      )
    `,
    )
    .eq('auto_renew', true)
    .eq('status', 'active')
    .eq('billing_mode', 'per_session')
    .not('stripe_payment_method_id', 'is', null)

  if (error) {
    throw new Error(`Failed to find per-session candidates: ${error.message}`)
  }

  const candidates: PerSessionCandidate[] = []

  for (const row of data || []) {
    const settings = row as Record<string, unknown>
    const children = (settings.bookings as Record<string, unknown>[] | undefined)?.[0]?.bookings as
      | Array<{ id: string; scheduled_at: string; start_time_utc: string; end_time_utc: string }>
      | undefined

    if (!children || !Array.isArray(children)) continue

    for (const child of children) {
      if (!child.scheduled_at || new Date(child.scheduled_at) > new Date(lookAheadIso)) continue

      // Check if this child already has a captured payment
      const { data: paymentRow } = await admin
        .from('payments')
        .select('id, status')
        .eq('booking_id', child.id)
        .eq('status', 'captured')
        .maybeSingle()

      if (paymentRow) continue // Already paid

      candidates.push({
        settingsId: String(settings.id),
        userId: String(settings.user_id),
        professionalId: String(settings.professional_id),
        recurrenceGroupId: String(settings.recurrence_group_id),
        stripePaymentMethodId: String(settings.stripe_payment_method_id),
        stripeCustomerId: String(settings.stripe_customer_id),
        priceTotal: Number(settings.price_total),
        currency: String(settings.currency),
        childBookingId: child.id,
        sessionStartUtc: child.start_time_utc || child.scheduled_at,
        sessionEndUtc: child.end_time_utc || child.scheduled_at,
      })
    }
  }

  return candidates
}

export async function getLastChildSessionEnd(
  admin: SupabaseClient,
  recurrenceGroupId: string,
): Promise<string | null> {
  const { data, error } = await admin.rpc('get_last_child_session_end', {
    p_recurrence_group_id: recurrenceGroupId,
  })

  if (error) {
    throw new Error(`Failed to get last session end: ${error.message}`)
  }

  return data ? String(data) : null
}

export async function loadBookingForRenewal(
  admin: SupabaseClient,
  recurrenceGroupId: string,
): Promise<{
  id: string
  user_id: string
  professional_id: string
  recurrence_periodicity: string | null
  recurrence_interval_days: number | null
  recurrence_end_date: string | null
  duration_minutes: number
  timezone_user: string | null
  timezone_professional: string | null
  price_brl: number
  price_user_currency: number | null
  price_total: number | null
  user_currency: string | null
  confirmation_mode_snapshot: string | null
  cancellation_policy_snapshot: Record<string, unknown> | null
  notes: string | null
  session_purpose: string | null
  metadata: Record<string, unknown> | null
} | null> {
  const { data, error } = await admin
    .from('bookings')
    .select(
      'id, user_id, professional_id, recurrence_periodicity, recurrence_interval_days, recurrence_end_date, duration_minutes, timezone_user, timezone_professional, price_brl, price_user_currency, price_total, user_currency, confirmation_mode_snapshot, cancellation_policy_snapshot, notes, session_purpose, metadata',
    )
    .eq('id', recurrenceGroupId)
    .eq('booking_type', 'recurring_parent')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load booking for renewal: ${error.message}`)
  }

  if (!data) return null

  return {
    ...data,
    cancellation_policy_snapshot: data.cancellation_policy_snapshot as Record<string, unknown> | null,
    metadata: data.metadata as Record<string, unknown> | null,
  }
}
