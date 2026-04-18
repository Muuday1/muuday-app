'use server'

import { z } from 'zod'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { rateLimit } from '@/lib/security/rate-limit'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import {
  isSlotWithinWorkingHours,
  mapLegacyAvailabilityToRules,
} from '@/lib/booking/availability-engine'
import { roundCurrency } from '@/lib/booking/cancellation-policy'
import { getExchangeRates } from '@/lib/exchange-rates'
import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import { createBatchBookingGroup } from '@/lib/booking/batch-booking'
import { generateRecurrenceSlots } from '@/lib/booking/recurrence-engine'
import { hasExternalBusyConflict } from '@/lib/booking/external-calendar-conflicts'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'

type BookingCreateResult =
  | { success: true; bookingId: string }
  | { success: false; error: string; reasonCode?: string }

type SessionSlot = {
  startUtc: Date
  endUtc: Date
  localScheduledAt: string
  recurrenceOccurrenceIndex?: number
}

const MANUAL_CONFIRMATION_SLA_HOURS = 24
const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'

type PostgrestLikeError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

function reportBookingError(
  error: unknown,
  context: Record<string, unknown>,
  message: string,
) {
  Sentry.captureException(error, {
    tags: { area: 'booking_create' },
    extra: context,
  })
  Sentry.captureMessage(message, {
    level: 'error',
    tags: { area: 'booking_create' },
    extra: context,
  })
}

function isUniqueConstraintError(error: unknown, constraintName: string) {
  const pgError = error as PostgrestLikeError | null
  if (!pgError || pgError.code !== '23505') return false
  const details = `${pgError.message || ''} ${pgError.details || ''} ${pgError.hint || ''}`
  return details.includes(constraintName)
}

function isActiveSlotCollision(error: unknown) {
  if (isUniqueConstraintError(error, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) return true
  const pgError = error as PostgrestLikeError | null
  if (!pgError || pgError.code !== '23505') return false
  const details = `${pgError.message || ''} ${pgError.details || ''} ${pgError.hint || ''}`
  return details.includes('(professional_id, start_time_utc)')
}

function hhmmToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function getMinutesInTimezone(date: Date, timezone: string) {
  return hhmmToMinutes(formatInTimeZone(date, timezone, 'HH:mm'))
}

function buildCancellationPolicySnapshot(code: string) {
  return {
    code,
    refund_48h_or_more: 100,
    refund_24h_to_48h: 50,
    refund_under_24h: 0,
  }
}

function isValidIsoLocalDateTime(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!match) return false

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw] = match
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  const second = Number(secondRaw || '0')

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  )
}

const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, 'Horï¿½rio invï¿½lido.')
  .refine(isValidIsoLocalDateTime, 'Horï¿½rio invï¿½lido.')

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invï¿½lida.')

const createBookingSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invï¿½lido.'),
  scheduledAt: localDateTimeSchema.optional(),
  notes: z.string().trim().max(500, 'Observaï¿½ï¿½es muito longas.').optional(),
  sessionPurpose: z.string().trim().max(1200, 'Objetivo da sessï¿½o muito longo.').optional(),
  bookingType: z.enum(['one_off', 'recurring', 'batch']).default('one_off').optional(),
  recurringPeriodicity: z.enum(['weekly', 'biweekly', 'monthly', 'custom_days']).optional(),
  recurringIntervalDays: z.number().int().min(1).max(365).optional(),
  recurringOccurrences: z.number().int().min(2).max(52).optional(),
  recurringSessionsCount: z.number().int().min(2).max(52).optional(),
  recurringEndDate: localDateSchema.optional(),
  recurringAutoRenew: z.boolean().optional(),
  batchDates: z.array(localDateTimeSchema).min(2).max(20).optional(),
})

async function loadAvailabilityRules(
  supabase: ReturnType<typeof createClient>,
  professionalId: string,
  timezone: string,
) {
  const { data: availabilityRulesRows, error: availabilityRulesError } = await supabase
    .from('availability_rules')
    .select('weekday, start_time_local, end_time_local, timezone, is_active')
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if (!availabilityRulesError && availabilityRulesRows && availabilityRulesRows.length > 0) {
    return availabilityRulesRows
  }

  const { data: legacyAvailabilityRows } = await supabase
    .from('availability')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  return mapLegacyAvailabilityToRules(legacyAvailabilityRows || [], timezone)
}

async function isSlotAllowedByExceptions(
  supabase: ReturnType<typeof createClient>,
  professionalId: string,
  timezone: string,
  startUtc: Date,
  endUtc: Date,
) {
  const localDate = formatInTimeZone(startUtc, timezone, 'yyyy-MM-dd')
  const { data: exceptionRows } = await supabase
    .from('availability_exceptions')
    .select('is_available, start_time_local, end_time_local')
    .eq('professional_id', professionalId)
    .eq('date_local', localDate)

  const slotStartMinutes = getMinutesInTimezone(startUtc, timezone)
  const slotEndMinutes = getMinutesInTimezone(endUtc, timezone)
  const exceptions = (exceptionRows || []) as Array<{
    is_available: boolean
    start_time_local: string | null
    end_time_local: string | null
  }>

  if (exceptions.length === 0) return true

  const overlaps = (row: { start_time_local: string | null; end_time_local: string | null }) => {
    if (!row.start_time_local || !row.end_time_local) return true
    const start = hhmmToMinutes(row.start_time_local)
    const end = hhmmToMinutes(row.end_time_local)
    return slotStartMinutes < end && slotEndMinutes > start
  }

  const hasBlockedException = exceptions.some(row => row.is_available === false && overlaps(row))
  if (hasBlockedException) return false

  const allowedWindows = exceptions.filter(row => row.is_available)
  if (allowedWindows.length === 0) return true

  return allowedWindows.some(window => {
    if (!window.start_time_local || !window.end_time_local) return false
    const start = hhmmToMinutes(window.start_time_local)
    const end = hhmmToMinutes(window.end_time_local)
    return slotStartMinutes >= start && slotEndMinutes <= end
  })
}

async function hasInternalConflict(
  supabase: ReturnType<typeof createClient>,
  professionalId: string,
  startUtc: Date,
  endUtc: Date,
  bufferMinutes: number,
) {
  const conflictWindowStart = new Date(startUtc.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const conflictWindowEnd = new Date(endUtc.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const { data: candidateConflicts } = await supabase
    .from('bookings')
    .select('id, scheduled_at, start_time_utc, end_time_utc, duration_minutes')
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .or(
      `and(start_time_utc.gte.${conflictWindowStart},start_time_utc.lte.${conflictWindowEnd}),and(scheduled_at.gte.${conflictWindowStart},scheduled_at.lte.${conflictWindowEnd})`
    )

  return (candidateConflicts || []).some((booking: Record<string, unknown>) => {
    const existingStart = new Date(
      (booking.start_time_utc as string) || (booking.scheduled_at as string) || '',
    )
    if (Number.isNaN(existingStart.getTime())) return false

    const existingDuration = Number(booking.duration_minutes) || 60
    const existingEnd = booking.end_time_utc
      ? new Date(String(booking.end_time_utc))
      : new Date(existingStart.getTime() + existingDuration * 60 * 1000)
    const bufferedExistingStart = new Date(existingStart.getTime() - bufferMinutes * 60 * 1000)
    const bufferedExistingEnd = new Date(existingEnd.getTime() + bufferMinutes * 60 * 1000)
    return startUtc < bufferedExistingEnd && endUtc > bufferedExistingStart
  })
}

function parseSlotFromLocalDateTime(
  localDateTime: string,
  userTimezone: string,
  durationMinutes: number,
): SessionSlot | null {
  try {
    const startUtc = fromZonedTime(localDateTime, userTimezone)
    if (Number.isNaN(startUtc.getTime())) return null
    const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000)
    return { startUtc, endUtc, localScheduledAt: localDateTime }
  } catch {
    return null
  }
}

export async function createBooking(data: {
  professionalId: string
  scheduledAt?: string
  notes?: string
  sessionPurpose?: string
  bookingType?: 'one_off' | 'recurring' | 'batch'
  recurringPeriodicity?: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  recurringIntervalDays?: number
  recurringOccurrences?: number
  recurringSessionsCount?: number
  recurringEndDate?: string
  recurringAutoRenew?: boolean
  batchDates?: string[]
}): Promise<BookingCreateResult> {
  const parsedInput = createBookingSchema.safeParse(data)
  if (!parsedInput.success) {
    const firstError = parsedInput.error.issues[0]?.message || 'Dados invï¿½lidos para agendamento.'
    return { success: false, error: firstError }
  }

  const bookingInput = parsedInput.data
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency, timezone')
    .eq('id', user.id)
    .single()

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, user_id, tier, session_price_brl, session_duration_minutes, status, first_booking_enabled, profiles!professionals_user_id_fkey(timezone)',
    )
    .eq('id', bookingInput.professionalId)
    .single()

  if (!professional || professional.status !== 'approved') {
    return { success: false, error: 'Profissional nï¿½o disponï¿½vel.' }
  }

  if (professional.user_id === user.id) {
    return { success: false, error: 'Nï¿½o ï¿½ permitido agendar sessï¿½o com seu prï¿½prio perfil.' }
  }

  const eligibility = await evaluateFirstBookingEligibility(supabase, bookingInput.professionalId)
  if (!eligibility.ok) {
    return {
      success: false,
      error: eligibility.message,
      reasonCode: eligibility.reasonCode,
    }
  }

  const professionalProfile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles
  const professionalTimezoneFallback =
    (professionalProfile as { timezone?: string } | null)?.timezone || 'America/Sao_Paulo'

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, buffer_time_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
    )
    .eq('professional_id', bookingInput.professionalId)
    .maybeSingle()

  const bookingSettings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  const bookingType = bookingInput.bookingType || 'one_off'
  if (bookingType === 'recurring' && !bookingSettings.enableRecurring) {
    return { success: false, error: 'Este profissional nï¿½o aceita pacotes recorrentes no momento.' }
  }

  if (bookingSettings.requireSessionPurpose && !bookingInput.sessionPurpose?.trim()) {
    return { success: false, error: 'Informe o objetivo da sessï¿½o antes de continuar.' }
  }

  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const durationMinutes = bookingSettings.sessionDurationMinutes || professional.session_duration_minutes

  const plannedSessions: SessionSlot[] = []
  let recurrenceGroupId: string | null = null
  let batchBookingGroupId: string | null = null

  if (bookingType === 'one_off') {
    if (!bookingInput.scheduledAt) return { success: false, error: 'Escolha um horï¿½rio para agendar.' }
    const slot = parseSlotFromLocalDateTime(bookingInput.scheduledAt, userTimezone, durationMinutes)
    if (!slot) return { success: false, error: 'Horï¿½rio invï¿½lido.' }
    plannedSessions.push(slot)
  }

  if (bookingType === 'recurring') {
    if (!bookingInput.scheduledAt) return { success: false, error: 'Escolha o horï¿½rio base da recorrï¿½ncia.' }

    const firstSlot = parseSlotFromLocalDateTime(bookingInput.scheduledAt, userTimezone, durationMinutes)
    if (!firstSlot) return { success: false, error: 'Horï¿½rio invï¿½lido.' }

    let recurrenceEndDateUtc: Date | null = null
    if (bookingInput.recurringEndDate) {
      const endCandidate = parseSlotFromLocalDateTime(
        `${bookingInput.recurringEndDate}T23:59:00`,
        userTimezone,
        0,
      )
      recurrenceEndDateUtc = endCandidate?.startUtc || null
    }

    const recurrenceDecision = generateRecurrenceSlots({
      startDateUtc: firstSlot.startUtc,
      endDateUtc: firstSlot.endUtc,
      periodicity: bookingInput.recurringPeriodicity || 'weekly',
      intervalDays: bookingInput.recurringIntervalDays,
      occurrences: bookingInput.recurringOccurrences || bookingInput.recurringSessionsCount || 4,
      endDateLimitUtc: recurrenceEndDateUtc,
      bookingWindowDays: bookingSettings.maxBookingWindowDays,
    })

    recurrenceGroupId = recurrenceDecision.recurrenceGroupId
    for (const slot of recurrenceDecision.slots) {
      plannedSessions.push({
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        localScheduledAt: formatInTimeZone(slot.startUtc, userTimezone, "yyyy-MM-dd'T'HH:mm:ss"),
        recurrenceOccurrenceIndex: slot.occurrenceIndex,
      })
    }
  }

  if (bookingType === 'batch') {
    if (!bookingInput.batchDates || bookingInput.batchDates.length < 2) {
      return { success: false, error: 'Selecione ao menos duas datas para mï¿½ltiplos agendamentos.' }
    }

    const parsedBatch = bookingInput.batchDates
      .map(localDateTime => parseSlotFromLocalDateTime(localDateTime, userTimezone, durationMinutes))
      .filter(Boolean) as SessionSlot[]

    if (parsedBatch.length !== bookingInput.batchDates.length) {
      return { success: false, error: 'Uma ou mais datas do pacote estï¿½o invï¿½lidas.' }
    }

    const batchDecision = createBatchBookingGroup({
      dates: parsedBatch.map(item => ({ startUtc: item.startUtc, endUtc: item.endUtc })),
    })

    batchBookingGroupId = batchDecision.batchBookingGroupId
    for (const slot of batchDecision.slots) {
      plannedSessions.push({
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        localScheduledAt: formatInTimeZone(slot.startUtc, userTimezone, "yyyy-MM-dd'T'HH:mm:ss"),
      })
    }
  }

  if (plannedSessions.length === 0) {
    return { success: false, error: 'Nï¿½o foi possï¿½vel montar os horï¿½rios do agendamento.' }
  }

  const availabilityRules = await loadAvailabilityRules(
    supabase,
    bookingInput.professionalId,
    bookingSettings.timezone,
  )

  for (const slot of plannedSessions) {
    const minimumStartTime = Date.now() + bookingSettings.minimumNoticeHours * 60 * 60 * 1000
    if (slot.startUtc.getTime() < minimumStartTime) {
      return {
        success: false,
        error: `Selecione um horï¿½rio com pelo menos ${bookingSettings.minimumNoticeHours} horas de antecedï¿½ncia.`,
      }
    }

    const maximumDate = new Date()
    maximumDate.setDate(maximumDate.getDate() + bookingSettings.maxBookingWindowDays)
    if (slot.startUtc.getTime() > maximumDate.getTime()) {
      return {
        success: false,
        error: `Agendamentos devem estar dentro de ${bookingSettings.maxBookingWindowDays} dias.`,
      }
    }

    const fitsAvailability = isSlotWithinWorkingHours(
      slot.startUtc,
      slot.endUtc,
      bookingSettings,
      availabilityRules,
    )
    if (!fitsAvailability) {
      return { success: false, error: 'Um ou mais horï¿½rios nï¿½o estï¿½o disponï¿½veis para este profissional.' }
    }

    const allowedByException = await isSlotAllowedByExceptions(
      supabase,
      bookingInput.professionalId,
      bookingSettings.timezone,
      slot.startUtc,
      slot.endUtc,
    )
    if (!allowedByException) {
      return { success: false, error: 'Um ou mais horï¿½rios foram bloqueados por indisponibilidade.' }
    }

    const conflict = await hasInternalConflict(
      supabase,
      bookingInput.professionalId,
      slot.startUtc,
      slot.endUtc,
      bookingSettings.bufferMinutes,
    )
    if (conflict) {
      return { success: false, error: 'Um ou mais horï¿½rios jï¿½ foram reservados. Escolha outro horï¿½rio.' }
    }
    const externalConflict = await hasExternalBusyConflict(
      supabase,
      bookingInput.professionalId,
      slot.startUtc.toISOString(),
      slot.endUtc.toISOString(),
    )
    if (externalConflict) {
      return {
        success: false,
        error: 'Um ou mais horários conflitam com a agenda externa conectada do profissional.',
      }
    }
  }

  const acquiredLockIds: string[] = []
  for (const slot of plannedSessions) {
    const lockResult = await acquireSlotLock(supabase, {
      professionalId: bookingInput.professionalId,
      userId: user.id,
      startUtcIso: slot.startUtc.toISOString(),
      endUtcIso: slot.endUtc.toISOString(),
      bookingType: bookingType === 'recurring' ? 'recurring' : 'one_off',
      ttlMinutes: 10,
    })

    if (!lockResult.ok) {
      for (const lockId of acquiredLockIds) {
        await releaseSlotLock(supabase, lockId)
      }

      return {
        success: false,
        error:
          lockResult.reason === 'locked'
            ? 'Outro cliente acabou de selecionar este horï¿½rio. Escolha outro.'
            : 'Nï¿½o foi possï¿½vel reservar o horï¿½rio. Tente novamente.',
      }
    }
    acquiredLockIds.push(lockResult.lockId)
  }

  const sessionCount = plannedSessions.length
  const currency = profile?.currency || 'BRL'
  const rates = await getExchangeRates(supabase)
  const priceBrl = Number(professional.session_price_brl) || 0
  const perSessionPriceUserCurrency = roundCurrency(priceBrl * (rates[currency] || 1))
  const totalPriceUserCurrency = roundCurrency(perSessionPriceUserCurrency * sessionCount)
  const bookingStatus = bookingSettings.confirmationMode === 'manual' ? 'pending_confirmation' : 'confirmed'
  const confirmationDeadlineAt =
    bookingSettings.confirmationMode === 'manual'
      ? new Date(Date.now() + MANUAL_CONFIRMATION_SLA_HOURS * 60 * 60 * 1000).toISOString()
      : null

  let bookingId: string | null = null
  let paymentAnchorBookingId: string | null = null
  let createdBookingIds: string[] = []

  try {
    if (bookingType === 'one_off') {
      const firstSlot = plannedSessions[0]
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          professional_id: bookingInput.professionalId,
          scheduled_at: firstSlot.startUtc.toISOString(),
          start_time_utc: firstSlot.startUtc.toISOString(),
          end_time_utc: firstSlot.endUtc.toISOString(),
          timezone_user: userTimezone,
          timezone_professional: bookingSettings.timezone,
          duration_minutes: durationMinutes,
          status: bookingStatus,
          booking_type: 'one_off',
          confirmation_mode_snapshot: bookingSettings.confirmationMode,
          cancellation_policy_snapshot: buildCancellationPolicySnapshot(
            bookingSettings.cancellationPolicyCode,
          ),
          price_brl: priceBrl,
          price_user_currency: perSessionPriceUserCurrency,
          price_total: perSessionPriceUserCurrency,
          user_currency: currency,
          notes: bookingInput.notes || null,
          session_purpose: bookingInput.sessionPurpose || null,
          metadata: {
            booking_source: 'web_checkout',
            booking_mode: 'one_off',
            confirmation_deadline_utc: confirmationDeadlineAt,
          },
        })
        .select('id')
        .single()

      if (error || !booking) {
        if (isActiveSlotCollision(error)) {
          return {
            success: false,
            error: 'Um ou mais horï¿½rios jï¿½ foram reservados. Escolha outro horï¿½rio.',
          }
        }
        reportBookingError(error, { professionalId: bookingInput.professionalId, bookingType }, 'booking_insert_failed')
        return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
      }
      bookingId = booking.id
      paymentAnchorBookingId = booking.id
      createdBookingIds = [booking.id]
    } else if (bookingType === 'recurring') {
      const firstSlot = plannedSessions[0]
      const recurrencePeriodicity = bookingInput.recurringPeriodicity || 'weekly'
      const recurrenceIntervalDays =
        recurrencePeriodicity === 'custom_days' ? bookingInput.recurringIntervalDays || 1 : null

      const { data: parentBooking, error: parentError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          professional_id: bookingInput.professionalId,
          scheduled_at: firstSlot.startUtc.toISOString(),
          start_time_utc: firstSlot.startUtc.toISOString(),
          end_time_utc: firstSlot.endUtc.toISOString(),
          timezone_user: userTimezone,
          timezone_professional: bookingSettings.timezone,
          duration_minutes: durationMinutes,
          status: bookingStatus,
          booking_type: 'recurring_parent',
          recurrence_group_id: recurrenceGroupId,
          recurrence_periodicity: recurrencePeriodicity,
          recurrence_interval_days: recurrenceIntervalDays,
          recurrence_end_date: bookingInput.recurringEndDate || null,
          recurrence_occurrence_index: 1,
          recurrence_auto_renew: Boolean(bookingInput.recurringAutoRenew),
          confirmation_mode_snapshot: bookingSettings.confirmationMode,
          cancellation_policy_snapshot: buildCancellationPolicySnapshot(
            bookingSettings.cancellationPolicyCode,
          ),
          price_brl: roundCurrency(priceBrl * sessionCount),
          price_user_currency: totalPriceUserCurrency,
          price_total: totalPriceUserCurrency,
          user_currency: currency,
          notes: bookingInput.notes || null,
          session_purpose: bookingInput.sessionPurpose || null,
          metadata: {
            booking_source: 'web_checkout',
            booking_mode: 'recurring',
            confirmation_deadline_utc: confirmationDeadlineAt,
            recurring_frequency: recurrencePeriodicity,
            recurring_sessions_count: sessionCount,
            recurring_auto_renew: Boolean(bookingInput.recurringAutoRenew),
          },
        })
        .select('id')
        .single()

      if (parentError || !parentBooking) {
        if (isActiveSlotCollision(parentError)) {
          return {
            success: false,
            error: 'Um ou mais horï¿½rios jï¿½ foram reservados. Escolha outro horï¿½rio.',
          }
        }
        reportBookingError(parentError, { professionalId: bookingInput.professionalId, bookingType }, 'booking_parent_insert_failed')
        return { success: false, error: 'Erro ao criar pacote recorrente. Tente novamente.' }
      }

      const childBookingsPayload = plannedSessions.map((slot, index) => ({
        user_id: user.id,
        professional_id: bookingInput.professionalId,
        scheduled_at: slot.startUtc.toISOString(),
        start_time_utc: slot.startUtc.toISOString(),
        end_time_utc: slot.endUtc.toISOString(),
        timezone_user: userTimezone,
        timezone_professional: bookingSettings.timezone,
        duration_minutes: durationMinutes,
        status: bookingStatus,
        booking_type: index === 0 ? 'recurring_parent' : 'recurring_child',
        parent_booking_id: index === 0 ? null : parentBooking.id,
        recurrence_group_id: recurrenceGroupId,
        recurrence_periodicity: recurrencePeriodicity,
        recurrence_interval_days: recurrenceIntervalDays,
        recurrence_end_date: bookingInput.recurringEndDate || null,
        recurrence_occurrence_index: slot.recurrenceOccurrenceIndex || index + 1,
        recurrence_auto_renew: Boolean(bookingInput.recurringAutoRenew),
        confirmation_mode_snapshot: bookingSettings.confirmationMode,
        cancellation_policy_snapshot: buildCancellationPolicySnapshot(
          bookingSettings.cancellationPolicyCode,
        ),
        price_brl: priceBrl,
        price_user_currency: perSessionPriceUserCurrency,
        price_total: perSessionPriceUserCurrency,
        user_currency: currency,
        notes: bookingInput.notes || null,
        session_purpose: bookingInput.sessionPurpose || null,
        metadata: {
          recurring_session_number: index + 1,
        },
      }))

      // keep parent row, replace recurrence children
      await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
      const { data: childRows, error: childError } = await supabase
        .from('bookings')
        .insert(childBookingsPayload.slice(1))
        .select('id')
      if (childError) {
        if (isActiveSlotCollision(childError)) {
          await supabase.from('bookings').delete().eq('id', parentBooking.id)
          return {
            success: false,
            error: 'Um ou mais horï¿½rios jï¿½ foram reservados. Escolha outro horï¿½rio.',
          }
        }
        reportBookingError(childError, { parentBookingId: parentBooking.id, bookingType }, 'booking_children_insert_failed')
        await supabase.from('bookings').delete().eq('id', parentBooking.id)
        return { success: false, error: 'Erro ao criar sessï¿½es recorrentes. Tente novamente.' }
      }

      const sessionsPayload = plannedSessions.map((slot, index) => ({
        parent_booking_id: parentBooking.id,
        start_time_utc: slot.startUtc.toISOString(),
        end_time_utc: slot.endUtc.toISOString(),
        status: bookingStatus,
        session_number: index + 1,
      }))

      const { error: sessionsError } = await supabase.from('booking_sessions').insert(sessionsPayload)
      if (sessionsError) {
        reportBookingError(sessionsError, { parentBookingId: parentBooking.id, bookingType }, 'booking_sessions_insert_failed')
        await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
        await supabase.from('bookings').delete().eq('id', parentBooking.id)
        return { success: false, error: 'Erro ao criar estrutura de pacote recorrente.' }
      }

      bookingId = parentBooking.id
      paymentAnchorBookingId = parentBooking.id
      createdBookingIds = [
        parentBooking.id,
        ...((childRows || [])
          .map(row => String((row as Record<string, unknown>).id))
          .filter(Boolean)),
      ]
    } else {
      const batchGroupId = batchBookingGroupId || crypto.randomUUID()

      const batchPayload = plannedSessions.map((slot, index) => ({
        user_id: user.id,
        professional_id: bookingInput.professionalId,
        scheduled_at: slot.startUtc.toISOString(),
        start_time_utc: slot.startUtc.toISOString(),
        end_time_utc: slot.endUtc.toISOString(),
        timezone_user: userTimezone,
        timezone_professional: bookingSettings.timezone,
        duration_minutes: durationMinutes,
        status: bookingStatus,
        booking_type: 'one_off',
        batch_booking_group_id: batchGroupId,
        confirmation_mode_snapshot: bookingSettings.confirmationMode,
        cancellation_policy_snapshot: buildCancellationPolicySnapshot(
          bookingSettings.cancellationPolicyCode,
        ),
        price_brl: priceBrl,
        price_user_currency: perSessionPriceUserCurrency,
        price_total: perSessionPriceUserCurrency,
        user_currency: currency,
        notes: bookingInput.notes || null,
        session_purpose: bookingInput.sessionPurpose || null,
        metadata: {
          booking_source: 'web_checkout',
          booking_mode: 'batch',
          batch_index: index + 1,
          batch_group_id: batchGroupId,
          confirmation_deadline_utc: confirmationDeadlineAt,
        },
      }))

      const { data: batchRows, error: batchInsertError } = await supabase
        .from('bookings')
        .insert(batchPayload)
        .select('id')

      if (batchInsertError || !batchRows || batchRows.length === 0) {
        if (isActiveSlotCollision(batchInsertError)) {
          return {
            success: false,
            error: 'Um ou mais horï¿½rios jï¿½ foram reservados. Escolha outro horï¿½rio.',
          }
        }
        reportBookingError(batchInsertError, { professionalId: bookingInput.professionalId, bookingType }, 'booking_batch_insert_failed')
        return { success: false, error: 'Erro ao criar agendamentos em lote. Tente novamente.' }
      }

      bookingId = String(batchRows[0].id)
      paymentAnchorBookingId = String(batchRows[0].id)
      createdBookingIds = (batchRows || [])
        .map(row => String((row as Record<string, unknown>).id))
        .filter(Boolean)
    }
  } finally {
    for (const lockId of acquiredLockIds) {
      await releaseSlotLock(supabase, lockId)
    }
  }

  if (!bookingId || !paymentAnchorBookingId) {
    return { success: false, error: 'Erro ao finalizar agendamento.' }
  }

  const paymentMetadata = {
    capturedBy: 'legacy_booking_flow',
    confirmationMode: bookingSettings.confirmationMode,
    bookingType,
    sessionsCount: sessionCount,
    recurrenceGroupId,
    batchBookingGroupId,
  }

  try {
    assertNoSensitivePaymentPayload(paymentMetadata, 'payments.metadata.createBooking')
  } catch (error) {
    reportBookingError(
      error,
      { paymentAnchorBookingId, bookingType },
      'booking_payment_sensitive_metadata_blocked',
    )
    return {
      success: false,
      error: 'Erro interno ao preparar pagamento.',
    }
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    booking_id: paymentAnchorBookingId,
    user_id: user.id,
    professional_id: bookingInput.professionalId,
    provider: 'legacy',
    amount_total: totalPriceUserCurrency,
    currency,
    status: 'captured',
    metadata: paymentMetadata,
    captured_at: new Date().toISOString(),
  })

  if (paymentError) {
    reportBookingError(paymentError, { paymentAnchorBookingId, bookingType }, 'booking_payment_record_failed')
    const cancellationPatch = {
      status: 'cancelled',
      metadata: {
        cancelled_reason: 'payment_capture_failed',
      },
    }

    const bookingIdsToCancel = Array.from(new Set(createdBookingIds.filter(Boolean)))
    if (bookingIdsToCancel.length > 0) {
      await supabase
        .from('bookings')
        .update(cancellationPatch)
        .in('id', bookingIdsToCancel)
    } else {
      await supabase
        .from('bookings')
        .update(cancellationPatch)
        .eq('id', paymentAnchorBookingId)
    }

    if (batchBookingGroupId) {
      await supabase
        .from('bookings')
        .update(cancellationPatch)
        .eq('batch_booking_group_id', batchBookingGroupId)
    }

    return {
      success: false,
      error: 'Falha ao processar pagamento. Nenhum agendamento foi confirmado.',
    }
  }
  const bookingIdsForCalendarSync = Array.from(
    new Set(createdBookingIds.length ? createdBookingIds : [bookingId]),
  )
  await Promise.all(
    bookingIdsForCalendarSync.map(syncBookingId =>
      enqueueBookingCalendarSync({
        bookingId: syncBookingId,
        action: 'upsert_booking',
        source: 'booking.create',
      }),
    ),
  )

  return { success: true, bookingId }
}


