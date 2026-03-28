'use server'

import { z } from 'zod'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import {
  isSlotWithinWorkingHours,
  mapLegacyAvailabilityToRules,
} from '@/lib/booking/availability-engine'
import { roundCurrency } from '@/lib/booking/cancellation-policy'

type BookingCreateResult = { success: true; bookingId: string } | { success: false; error: string }

type SessionSlot = {
  startUtc: Date
  endUtc: Date
  localScheduledAt: string
}

const MANUAL_CONFIRMATION_SLA_HOURS = 24

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

function addDaysToLocalDateTime(localDateTime: string, daysToAdd: number) {
  const [datePart, timePart] = localDateTime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = (timePart || '00:00').split(':').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}:00`
}

const createBookingSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invalido.'),
  scheduledAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, 'Horario invalido.'),
  notes: z.string().trim().max(500, 'Observacoes muito longas.').optional(),
  sessionPurpose: z.string().trim().max(1200, 'Objetivo da sessao muito longo.').optional(),
  bookingType: z.enum(['one_off', 'recurring']).default('one_off').optional(),
  recurringSessionsCount: z.number().int().min(2).max(12).optional(),
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
    .limit(1)

  const exception = exceptionRows?.[0] as
    | { is_available: boolean; start_time_local: string | null; end_time_local: string | null }
    | undefined

  if (!exception) return true
  if (!exception.is_available) return false
  if (!exception.start_time_local || !exception.end_time_local) return false

  const slotStartMinutes = getMinutesInTimezone(startUtc, timezone)
  const slotEndMinutes = getMinutesInTimezone(endUtc, timezone)
  const exceptionStart = hhmmToMinutes(exception.start_time_local)
  const exceptionEnd = hhmmToMinutes(exception.end_time_local)

  return slotStartMinutes >= exceptionStart && slotEndMinutes <= exceptionEnd
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

export async function createBooking(data: {
  professionalId: string
  scheduledAt: string
  notes?: string
  sessionPurpose?: string
  bookingType?: 'one_off' | 'recurring'
  recurringSessionsCount?: number
}): Promise<BookingCreateResult> {
  const parsedInput = createBookingSchema.safeParse(data)
  if (!parsedInput.success) {
    const firstError = parsedInput.error.issues[0]?.message || 'Dados invalidos para agendamento.'
    return { success: false, error: firstError }
  }

  const bookingInput = parsedInput.data
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rl = await rateLimit('booking', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency, timezone')
    .eq('id', user.id)
    .single()

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, user_id, session_price_brl, session_duration_minutes, status, profiles!professionals_user_id_fkey(timezone)'
    )
    .eq('id', bookingInput.professionalId)
    .single()

  if (!professional || professional.status !== 'approved') {
    return { success: false, error: 'Profissional nao disponivel.' }
  }

  if (professional.user_id === user.id) {
    return { success: false, error: 'Nao e permitido agendar sessao com seu proprio perfil.' }
  }

  const professionalProfile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles
  const professionalTimezoneFallback =
    (professionalProfile as { timezone?: string } | null)?.timezone || 'America/Sao_Paulo'

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose'
    )
    .eq('professional_id', bookingInput.professionalId)
    .maybeSingle()

  const bookingSettings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  const bookingType = bookingInput.bookingType || 'one_off'
  if (bookingType === 'recurring' && !bookingSettings.enableRecurring) {
    return { success: false, error: 'Este profissional nao aceita pacotes recorrentes no momento.' }
  }

  if (bookingSettings.requireSessionPurpose && !bookingInput.sessionPurpose?.trim()) {
    return { success: false, error: 'Informe o objetivo da sessao antes de continuar.' }
  }

  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const durationMinutes = bookingSettings.sessionDurationMinutes || professional.session_duration_minutes
  const sessionCount =
    bookingType === 'recurring' ? bookingInput.recurringSessionsCount || 4 : 1

  const plannedSessions: SessionSlot[] = []
  for (let i = 0; i < sessionCount; i++) {
    const localScheduledAt = addDaysToLocalDateTime(bookingInput.scheduledAt, i * 7)
    let startUtc: Date
    try {
      startUtc = fromZonedTime(localScheduledAt, userTimezone)
    } catch {
      return { success: false, error: 'Horario invalido.' }
    }
    if (Number.isNaN(startUtc.getTime())) return { success: false, error: 'Horario invalido.' }
    const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000)
    plannedSessions.push({ startUtc, endUtc, localScheduledAt })
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
        error: `Selecione um horario com pelo menos ${bookingSettings.minimumNoticeHours} horas de antecedencia.`,
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
      return { success: false, error: 'Um ou mais horarios nao estao disponiveis para este profissional.' }
    }

    const allowedByException = await isSlotAllowedByExceptions(
      supabase,
      bookingInput.professionalId,
      bookingSettings.timezone,
      slot.startUtc,
      slot.endUtc,
    )
    if (!allowedByException) {
      return { success: false, error: 'Um ou mais horarios foram bloqueados por indisponibilidade.' }
    }

    const conflict = await hasInternalConflict(
      supabase,
      bookingInput.professionalId,
      slot.startUtc,
      slot.endUtc,
      bookingSettings.bufferMinutes,
    )
    if (conflict) {
      return { success: false, error: 'Um ou mais horarios ja foram reservados. Escolha outro horario.' }
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
            ? 'Outro cliente acabou de selecionar este horario. Escolha outro.'
            : 'Nao foi possivel reservar o horario. Tente novamente.',
      }
    }
    acquiredLockIds.push(lockResult.lockId)
  }

  const currency = profile?.currency || 'BRL'
  const rates: Record<string, number> = {
    BRL: 1,
    USD: 0.19,
    EUR: 0.17,
    GBP: 0.15,
    CAD: 0.26,
    AUD: 0.29,
  }
  const priceBrl = Number(professional.session_price_brl) || 0
  const perSessionPriceUserCurrency = roundCurrency(priceBrl * (rates[currency] || 1))
  const totalPriceUserCurrency = roundCurrency(perSessionPriceUserCurrency * sessionCount)
  const bookingStatus = bookingSettings.confirmationMode === 'manual' ? 'pending_confirmation' : 'confirmed'
  const confirmationDeadlineAt =
    bookingSettings.confirmationMode === 'manual'
      ? new Date(Date.now() + MANUAL_CONFIRMATION_SLA_HOURS * 60 * 60 * 1000).toISOString()
      : null

  let bookingId: string | null = null
  let parentBookingId: string | null = null

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
            confirmation_deadline_utc: confirmationDeadlineAt,
          },
        })
        .select('id')
        .single()

      if (error || !booking) {
        return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
      }
      bookingId = booking.id
      parentBookingId = booking.id
    } else {
      const firstSlot = plannedSessions[0]
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
            confirmation_deadline_utc: confirmationDeadlineAt,
            recurring_frequency: 'weekly',
            recurring_sessions_count: sessionCount,
          },
        })
        .select('id')
        .single()

      if (parentError || !parentBooking) {
        return { success: false, error: 'Erro ao criar pacote recorrente. Tente novamente.' }
      }
      parentBookingId = parentBooking.id
      bookingId = parentBooking.id

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
        booking_type: 'recurring_child',
        parent_booking_id: parentBooking.id,
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

      const { error: childError } = await supabase.from('bookings').insert(childBookingsPayload)
      if (childError) {
        await supabase.from('bookings').delete().eq('id', parentBooking.id)
        return { success: false, error: 'Erro ao criar sessoes recorrentes. Tente novamente.' }
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
        await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
        await supabase.from('bookings').delete().eq('id', parentBooking.id)
        return { success: false, error: 'Erro ao criar estrutura de pacote recorrente.' }
      }
    }
  } finally {
    for (const lockId of acquiredLockIds) {
      await releaseSlotLock(supabase, lockId)
    }
  }

  if (!bookingId || !parentBookingId) {
    return { success: false, error: 'Erro ao finalizar agendamento.' }
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    booking_id: parentBookingId,
    user_id: user.id,
    professional_id: bookingInput.professionalId,
    provider: 'legacy',
    amount_total: totalPriceUserCurrency,
    currency,
    status: 'captured',
    metadata: {
      capturedBy: 'legacy_booking_flow',
      confirmationMode: bookingSettings.confirmationMode,
      bookingType,
      sessionsCount: sessionCount,
    },
    captured_at: new Date().toISOString(),
  })

  if (paymentError) {
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        metadata: {
          cancelled_reason: 'payment_capture_failed',
        },
      })
      .eq('id', parentBookingId)

    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        metadata: {
          cancelled_reason: 'parent_payment_capture_failed',
        },
      })
      .eq('parent_booking_id', parentBookingId)

    return {
      success: false,
      error: 'Falha ao processar pagamento. Nenhum agendamento foi confirmado.',
    }
  }

  return { success: true, bookingId }
}
