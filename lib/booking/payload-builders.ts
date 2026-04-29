import { buildCancellationPolicySnapshot, roundCurrency } from './cancellation-policy'

export type SessionSlot = {
  startUtc: Date
  endUtc: Date
  localScheduledAt: string
  recurrenceOccurrenceIndex?: number
}

export type BookingSettings = {
  timezone: string
  sessionDurationMinutes: number
  bufferMinutes: number
  minimumNoticeHours: number
  maxBookingWindowDays: number
  enableRecurring: boolean
  confirmationMode: 'auto_accept' | 'manual'
  cancellationPolicyCode: string
  requireSessionPurpose: boolean
}

export type BuildOneOffPayloadInput = {
  userId: string
  professionalId: string
  slot: SessionSlot
  userTimezone: string
  bookingSettings: BookingSettings
  bookingStatus: string
  confirmationDeadlineAt: string | null
  priceBrl: number
  perSessionPriceUserCurrency: number
  currency: string
  notes?: string | null
  sessionPurpose?: string | null
  serviceId?: string
}

export function buildOneOffBookingPayload(input: BuildOneOffPayloadInput) {
  return {
    user_id: input.userId,
    professional_id: input.professionalId,
    scheduled_at: input.slot.startUtc.toISOString(),
    start_time_utc: input.slot.startUtc.toISOString(),
    end_time_utc: input.slot.endUtc.toISOString(),
    timezone_user: input.userTimezone,
    timezone_professional: input.bookingSettings.timezone,
    duration_minutes: input.bookingSettings.sessionDurationMinutes,
    status: input.bookingStatus,
    booking_type: 'one_off' as const,
    confirmation_mode_snapshot: input.bookingSettings.confirmationMode,
    cancellation_policy_snapshot: buildCancellationPolicySnapshot(
      input.bookingSettings.cancellationPolicyCode,
    ),
    price_brl: input.priceBrl,
    price_user_currency: input.perSessionPriceUserCurrency,
    price_total: input.perSessionPriceUserCurrency,
    user_currency: input.currency,
    notes: input.notes || null,
    session_purpose: input.sessionPurpose || null,
    service_id: input.serviceId || null,
    metadata: {
      booking_source: 'web_checkout',
      booking_mode: 'one_off',
      confirmation_deadline_utc: input.confirmationDeadlineAt,
    },
  }
}

export type BuildRecurringPayloadInput = {
  userId: string
  professionalId: string
  firstSlot: SessionSlot
  userTimezone: string
  bookingSettings: BookingSettings
  bookingStatus: string
  confirmationDeadlineAt: string | null
  priceBrl: number
  totalPriceUserCurrency: number
  perSessionPriceUserCurrency: number
  currency: string
  sessionCount: number
  recurrenceGroupId: string | null
  recurrencePeriodicity: string
  recurrenceIntervalDays: number | null
  recurringEndDate?: string | null
  recurringAutoRenew?: boolean
  notes?: string | null
  sessionPurpose?: string | null
  serviceId?: string
}

export function buildRecurringParentPayload(input: BuildRecurringPayloadInput) {
  return {
    user_id: input.userId,
    professional_id: input.professionalId,
    scheduled_at: input.firstSlot.startUtc.toISOString(),
    start_time_utc: input.firstSlot.startUtc.toISOString(),
    end_time_utc: input.firstSlot.endUtc.toISOString(),
    timezone_user: input.userTimezone,
    timezone_professional: input.bookingSettings.timezone,
    duration_minutes: input.bookingSettings.sessionDurationMinutes,
    status: input.bookingStatus,
    booking_type: 'recurring_parent' as const,
    recurrence_group_id: input.recurrenceGroupId,
    recurrence_periodicity: input.recurrencePeriodicity,
    recurrence_interval_days: input.recurrenceIntervalDays,
    recurrence_end_date: input.recurringEndDate || null,
    recurrence_occurrence_index: 1,
    recurrence_auto_renew: Boolean(input.recurringAutoRenew),
    confirmation_mode_snapshot: input.bookingSettings.confirmationMode,
    cancellation_policy_snapshot: buildCancellationPolicySnapshot(
      input.bookingSettings.cancellationPolicyCode,
    ),
    service_id: input.serviceId || null,
    price_brl: roundCurrency(input.priceBrl * input.sessionCount),
    price_user_currency: input.totalPriceUserCurrency,
    price_total: input.totalPriceUserCurrency,
    user_currency: input.currency,
    notes: input.notes || null,
    session_purpose: input.sessionPurpose || null,
    metadata: {
      booking_source: 'web_checkout',
      booking_mode: 'recurring',
      confirmation_deadline_utc: input.confirmationDeadlineAt,
      recurring_frequency: input.recurrencePeriodicity,
      recurring_sessions_count: input.sessionCount,
      recurring_auto_renew: Boolean(input.recurringAutoRenew),
    },
  }
}

export function buildRecurringChildPayloads(
  input: BuildRecurringPayloadInput,
  plannedSessions: SessionSlot[],
) {
  return plannedSessions.map((slot, index) => ({
    user_id: input.userId,
    professional_id: input.professionalId,
    scheduled_at: slot.startUtc.toISOString(),
    start_time_utc: slot.startUtc.toISOString(),
    end_time_utc: slot.endUtc.toISOString(),
    timezone_user: input.userTimezone,
    timezone_professional: input.bookingSettings.timezone,
    duration_minutes: input.bookingSettings.sessionDurationMinutes,
    status: input.bookingStatus,
    booking_type: index === 0 ? ('recurring_parent' as const) : ('recurring_child' as const),
    parent_booking_id: index === 0 ? null : ('__PARENT_ID_PLACEHOLDER__' as const),
    recurrence_group_id: input.recurrenceGroupId,
    recurrence_periodicity: input.recurrencePeriodicity,
    recurrence_interval_days: input.recurrenceIntervalDays,
    recurrence_end_date: input.recurringEndDate || null,
    recurrence_occurrence_index: slot.recurrenceOccurrenceIndex || index + 1,
    recurrence_auto_renew: Boolean(input.recurringAutoRenew),
    confirmation_mode_snapshot: input.bookingSettings.confirmationMode,
    cancellation_policy_snapshot: buildCancellationPolicySnapshot(
      input.bookingSettings.cancellationPolicyCode,
    ),
    service_id: input.serviceId || null,
    price_brl: input.priceBrl,
    price_user_currency: input.perSessionPriceUserCurrency,
    price_total: input.perSessionPriceUserCurrency,
    user_currency: input.currency,
    notes: input.notes || null,
    session_purpose: input.sessionPurpose || null,
    metadata: {
      recurring_session_number: index + 1,
    },
  }))
}

export function buildRecurringSessionsPayload(
  plannedSessions: SessionSlot[],
  bookingStatus: string,
) {
  return plannedSessions.map((slot, index) => ({
    parent_booking_id: '__PARENT_ID_PLACEHOLDER__' as const,
    start_time_utc: slot.startUtc.toISOString(),
    end_time_utc: slot.endUtc.toISOString(),
    status: bookingStatus,
    session_number: index + 1,
  }))
}

export type BuildBatchPayloadInput = {
  userId: string
  professionalId: string
  plannedSessions: SessionSlot[]
  userTimezone: string
  bookingSettings: BookingSettings
  bookingStatus: string
  confirmationDeadlineAt: string | null
  priceBrl: number
  perSessionPriceUserCurrency: number
  currency: string
  batchBookingGroupId: string
  notes?: string | null
  sessionPurpose?: string | null
  serviceId?: string
}

export function buildBatchBookingPayloads(input: BuildBatchPayloadInput) {
  return input.plannedSessions.map((slot, index) => ({
    user_id: input.userId,
    professional_id: input.professionalId,
    scheduled_at: slot.startUtc.toISOString(),
    start_time_utc: slot.startUtc.toISOString(),
    end_time_utc: slot.endUtc.toISOString(),
    timezone_user: input.userTimezone,
    timezone_professional: input.bookingSettings.timezone,
    duration_minutes: input.bookingSettings.sessionDurationMinutes,
    status: input.bookingStatus,
    booking_type: 'one_off' as const,
    batch_booking_group_id: input.batchBookingGroupId,
    confirmation_mode_snapshot: input.bookingSettings.confirmationMode,
    cancellation_policy_snapshot: buildCancellationPolicySnapshot(
      input.bookingSettings.cancellationPolicyCode,
    ),
    service_id: input.serviceId || null,
    price_brl: input.priceBrl,
    price_user_currency: input.perSessionPriceUserCurrency,
    price_total: input.perSessionPriceUserCurrency,
    user_currency: input.currency,
    notes: input.notes || null,
    session_purpose: input.sessionPurpose || null,
    metadata: {
      booking_source: 'web_checkout',
      booking_mode: 'batch',
      batch_index: index + 1,
      batch_group_id: input.batchBookingGroupId,
      confirmation_deadline_utc: input.confirmationDeadlineAt,
    },
  }))
}
