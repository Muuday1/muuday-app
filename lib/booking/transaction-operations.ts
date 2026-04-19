import { createClient } from '@/lib/supabase/server'

function isFunctionMissingError(error: unknown): boolean {
  const msg = (error as { message?: string } | null)?.message || ''
  return msg.includes('function') && msg.includes('does not exist')
}

export async function createBookingWithPaymentAtomic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingData: {
    user_id: string
    professional_id: string
    scheduled_at: string
    start_time_utc: string
    end_time_utc: string
    timezone_user: string
    timezone_professional: string
    duration_minutes: number
    status: string
    booking_type: string
    confirmation_mode_snapshot: string
    cancellation_policy_snapshot: Record<string, unknown>
    price_brl: number
    price_user_currency: number
    price_total: number
    user_currency: string
    notes: string | null
    session_purpose: string | null
    metadata: Record<string, unknown>
  },
  paymentData: {
    provider: string
    amount_total: number
    currency: string
    status: string
    metadata: Record<string, unknown>
    captured_at: string
  },
) {
  const { data, error } = await supabase.rpc('create_booking_with_payment', {
    p_user_id: bookingData.user_id,
    p_professional_id: bookingData.professional_id,
    p_scheduled_at: bookingData.scheduled_at,
    p_start_time_utc: bookingData.start_time_utc,
    p_end_time_utc: bookingData.end_time_utc,
    p_timezone_user: bookingData.timezone_user,
    p_timezone_professional: bookingData.timezone_professional,
    p_duration_minutes: bookingData.duration_minutes,
    p_status: bookingData.status,
    p_booking_type: bookingData.booking_type,
    p_confirmation_mode_snapshot: bookingData.confirmation_mode_snapshot,
    p_cancellation_policy_snapshot: bookingData.cancellation_policy_snapshot,
    p_price_brl: bookingData.price_brl,
    p_price_user_currency: bookingData.price_user_currency,
    p_price_total: bookingData.price_total,
    p_user_currency: bookingData.user_currency,
    p_notes: bookingData.notes,
    p_session_purpose: bookingData.session_purpose,
    p_booking_metadata: bookingData.metadata,
    p_payment_provider: paymentData.provider,
    p_payment_amount_total: paymentData.amount_total,
    p_payment_currency: paymentData.currency,
    p_payment_status: paymentData.status,
    p_payment_metadata: paymentData.metadata,
    p_captured_at: paymentData.captured_at,
  })

  if (error && isFunctionMissingError(error)) {
    return { ok: false as const, error, fallback: true as const }
  }
  if (error) return { ok: false as const, error, fallback: false as const }
  const row = (data as Array<{ booking_id: string; payment_id: string }> | null)?.[0]
  return { ok: true as const, bookingId: row?.booking_id, paymentId: row?.payment_id }
}

export async function createBatchBookingsWithPaymentAtomic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookings: Array<Record<string, unknown>>,
  paymentData: {
    user_id: string
    professional_id: string
    provider: string
    amount_total: number
    currency: string
    status: string
    metadata: Record<string, unknown>
    captured_at: string
  },
) {
  const { data, error } = await supabase.rpc('create_batch_bookings_with_payment', {
    p_bookings: bookings,
    p_user_id: paymentData.user_id,
    p_professional_id: paymentData.professional_id,
    p_payment_provider: paymentData.provider,
    p_payment_amount_total: paymentData.amount_total,
    p_payment_currency: paymentData.currency,
    p_payment_status: paymentData.status,
    p_payment_metadata: paymentData.metadata,
    p_captured_at: paymentData.captured_at,
  })

  if (error && isFunctionMissingError(error)) {
    return { ok: false as const, error, fallback: true as const }
  }
  if (error) return { ok: false as const, error, fallback: false as const }
  const rows = (data as Array<{ booking_id: string }> | null) || []
  return { ok: true as const, bookingIds: rows.map(r => r.booking_id) }
}

export async function createRecurringBookingWithPaymentAtomic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parent: Record<string, unknown>,
  children: Array<Record<string, unknown>>,
  sessions: Array<Record<string, unknown>>,
  paymentData: {
    user_id: string
    professional_id: string
    provider: string
    amount_total: number
    currency: string
    status: string
    metadata: Record<string, unknown>
    captured_at: string
  },
) {
  const { data, error } = await supabase.rpc('create_recurring_booking_with_payment', {
    p_parent: parent,
    p_children: children,
    p_sessions: sessions,
    p_user_id: paymentData.user_id,
    p_professional_id: paymentData.professional_id,
    p_payment_provider: paymentData.provider,
    p_payment_amount_total: paymentData.amount_total,
    p_payment_currency: paymentData.currency,
    p_payment_status: paymentData.status,
    p_payment_metadata: paymentData.metadata,
    p_captured_at: paymentData.captured_at,
  })

  if (error && isFunctionMissingError(error)) {
    return { ok: false as const, error, fallback: true as const }
  }
  if (error) return { ok: false as const, error, fallback: false as const }
  const row = (data as Array<{
    parent_booking_id: string
    child_booking_ids: string[]
    session_ids: string[]
    payment_id: string
  }> | null)?.[0]
  return {
    ok: true as const,
    parentBookingId: row?.parent_booking_id,
    childBookingIds: row?.child_booking_ids,
    sessionIds: row?.session_ids,
    paymentId: row?.payment_id,
  }
}
