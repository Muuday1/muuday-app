'use server'

import { z } from 'zod'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'
import {
  createBookingWithPaymentAtomic,
  createBatchBookingsWithPaymentAtomic,
  createRecurringBookingWithPaymentAtomic,
} from '@/lib/booking/transaction-operations'
import { rateLimit } from '@/lib/security/rate-limit'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import { roundCurrency, buildCancellationPolicySnapshot } from '@/lib/booking/cancellation-policy'
import {
  buildOneOffBookingPayload,
  buildRecurringParentPayload,
  buildRecurringChildPayloads,
  buildRecurringSessionsPayload,
  buildBatchBookingPayloads,
} from '@/lib/booking/payload-builders'
import { getExchangeRates } from '@/lib/exchange-rates'
import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import { createBatchBookingGroup } from '@/lib/booking/batch-booking'
import { generateRecurrenceSlots } from '@/lib/booking/recurrence-engine'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import {
  emitProfessionalReceivedBooking,
  emitUserStartedCheckout,
} from '@/lib/email/resend-events'
import {
  localDateTimeSchema,
  isActiveSlotCollision,
} from '@/lib/booking/request-validation'


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

function logBookingEvent(
  message: string,
  context: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[booking] ${message}`, context)
  }
  Sentry.captureMessage(message, {
    level: 'info',
    tags: { area: 'booking_create' },
    extra: context,
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${context}`)), ms),
    ),
  ])
}

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')

const createBookingSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inválido.'),
  scheduledAt: localDateTimeSchema.optional(),
  notes: z.string().trim().max(500, 'Observações muito longas.').optional(),
  sessionPurpose: z.string().trim().max(1200, 'Objetivo da sessão muito longo.').optional(),
  bookingType: z.enum(['one_off', 'recurring', 'batch']).default('one_off').optional(),
  recurringPeriodicity: z.enum(['weekly', 'biweekly', 'monthly', 'custom_days']).optional(),
  recurringIntervalDays: z.number().int().min(1).max(365).optional(),
  recurringOccurrences: z.number().int().min(2).max(52).optional(),
  recurringSessionsCount: z.number().int().min(2).max(52).optional(),
  recurringEndDate: localDateSchema.optional(),
  recurringAutoRenew: z.boolean().optional(),
  batchDates: z.array(localDateTimeSchema).min(2).max(20).optional(),
})

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
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking started', level: 'info', data })

  const parsedInput = createBookingSchema.safeParse(data)
  if (!parsedInput.success) {
    const firstError = parsedInput.error.issues[0]?.message || 'Dados inválidos para agendamento.'
    return { success: false, error: firstError }
  }

  const bookingInput = parsedInput.data
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking parsed', level: 'info' })

  const supabase = await createClient()
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking client created', level: 'info' })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking user authenticated', level: 'info', data: { userId: user.id } })

  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('currency, timezone')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[booking/create] profile query error:', profileError.message, profileError.code)
  }

  const { data: professional, error: professionalError } = await supabase
    .from('professionals')
    .select(
      'id, user_id, tier, session_price_brl, session_duration_minutes, status, first_booking_enabled, profiles!professionals_user_id_fkey(timezone, email, full_name)',
    )
    .eq('id', bookingInput.professionalId)
    .single()

  if (professionalError) {
    console.error('[booking/create] professional query error:', professionalError.message, professionalError.code)
  }

  if (!professional || professional.status !== 'approved') {
    return { success: false, error: 'Profissional não disponível.' }
  }

  if (professional.user_id === user.id) {
    return { success: false, error: 'Não é permitido agendar sessão com seu próprio perfil.' }
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
    return { success: false, error: 'Este profissional não aceita pacotes recorrentes no momento.' }
  }

  if (bookingSettings.requireSessionPurpose && !bookingInput.sessionPurpose?.trim()) {
    return { success: false, error: 'Informe o objetivo da sessão antes de continuar.' }
  }

  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const durationMinutes = bookingSettings.sessionDurationMinutes || professional.session_duration_minutes

  const plannedSessions: SessionSlot[] = []
  let recurrenceGroupId: string | null = null
  let batchBookingGroupId: string | null = null

  if (bookingType === 'one_off') {
    if (!bookingInput.scheduledAt) return { success: false, error: 'Escolha um horário para agendar.' }
    const slot = parseSlotFromLocalDateTime(bookingInput.scheduledAt, userTimezone, durationMinutes)
    if (!slot) return { success: false, error: 'Horário inválido.' }
    plannedSessions.push(slot)
  }

  if (bookingType === 'recurring') {
    if (!bookingInput.scheduledAt) return { success: false, error: 'Escolha o horário base da recorrência.' }

    const firstSlot = parseSlotFromLocalDateTime(bookingInput.scheduledAt, userTimezone, durationMinutes)
    if (!firstSlot) return { success: false, error: 'Horário inválido.' }

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
      return { success: false, error: 'Selecione ao menos duas datas para múltiplos agendamentos.' }
    }

    const parsedBatch = bookingInput.batchDates
      .map(localDateTime => parseSlotFromLocalDateTime(localDateTime, userTimezone, durationMinutes))
      .filter(Boolean) as SessionSlot[]

    if (parsedBatch.length !== bookingInput.batchDates.length) {
      return { success: false, error: 'Uma ou mais datas do pacote estão inválidas.' }
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
    return { success: false, error: 'Não foi possível montar os horários do agendamento.' }
  }

  // Hard server-side guard: reject any slot that is in the past or exactly now.
  // This is independent of minimumNoticeHours to prevent accepting stale frontend data.
  const now = new Date()
  for (const slot of plannedSessions) {
    if (slot.startUtc.getTime() <= now.getTime()) {
      return { success: false, error: 'O horário selecionado já passou. Escolha um horário futuro.' }
    }
  }

  for (const slot of plannedSessions) {
    const validation = await validateSlotAvailability({
      supabase,
      professionalId: bookingInput.professionalId,
      startUtc: slot.startUtc,
      endUtc: slot.endUtc,
      timezone: bookingSettings.timezone,
      bufferMinutes: bookingSettings.bufferMinutes,
      minimumNoticeHours: bookingSettings.minimumNoticeHours,
      maxBookingWindowDays: bookingSettings.maxBookingWindowDays,
      errorMessages: {
        minimumNotice: `Selecione um horário com pelo menos ${bookingSettings.minimumNoticeHours} horas de antecedência.`,
        maxWindow: `Agendamentos devem estar dentro de ${bookingSettings.maxBookingWindowDays} dias.`,
        workingHours: 'Um ou mais horários não estão disponíveis para este profissional.',
        exception: 'Um ou mais horários foram bloqueados por indisponibilidade.',
        internalConflict: 'Um ou mais horários já foram reservados. Escolha outro horário.',
        externalConflict: 'Um ou mais horários conflitam com a agenda externa conectada do profissional.',
      },
    })
    if (!validation.valid) {
      return { success: false, error: validation.error! }
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
            ? 'Outro cliente acabou de selecionar este horário. Escolha outro.'
            : 'Não foi possível reservar o horário. Tente novamente.',
      }
    }
    acquiredLockIds.push(lockResult.lockId)
  }

  const sessionCount = plannedSessions.length
  const currency = profile?.currency || 'BRL'
  const rates = await getExchangeRates(supabase)
  const priceBrl = Number(professional.session_price_brl) || 0
  if (priceBrl <= 0) {
    reportBookingError(
      new Error('Invalid session price'),
      { professionalId: bookingInput.professionalId, priceBrl: professional.session_price_brl },
      'booking_invalid_session_price',
    )
    return { success: false, error: 'Profissional não possui preço configurado para sessão.' }
  }
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
  let usedAtomicPath = false

  const paymentMetadata = {
    capturedBy: 'legacy_booking_flow',
    confirmationMode: bookingSettings.confirmationMode,
    bookingType,
    sessionsCount: sessionCount,
    recurrenceGroupId,
    batchBookingGroupId,
  }

  const paymentData = {
    user_id: user.id,
    professional_id: bookingInput.professionalId,
    provider: 'legacy' as const,
    amount_total: totalPriceUserCurrency,
    currency,
    status: 'captured' as const,
    metadata: paymentMetadata,
    captured_at: new Date().toISOString(),
  }

  try {
    assertNoSensitivePaymentPayload(paymentMetadata, 'payments.metadata.createBooking')
  } catch (error) {
    reportBookingError(
      error,
      { paymentAnchorBookingId: null, bookingType },
      'booking_payment_sensitive_metadata_blocked',
    )
    for (const lockId of acquiredLockIds) {
      await releaseSlotLock(supabase, lockId)
    }
    return {
      success: false,
      error: 'Erro interno ao preparar pagamento.',
    }
  }

  try {
    if (bookingType === 'one_off') {
      const firstSlot = plannedSessions[0]
      const bookingPayload = buildOneOffBookingPayload({
        userId: user.id,
        professionalId: bookingInput.professionalId,
        slot: firstSlot,
        userTimezone,
        bookingSettings,
        bookingStatus,
        confirmationDeadlineAt,
        priceBrl,
        perSessionPriceUserCurrency,
        currency,
        notes: bookingInput.notes,
        sessionPurpose: bookingInput.sessionPurpose,
      })

      Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking calling atomic one_off', level: 'info' })
      const atomic = await withTimeout(
        createBookingWithPaymentAtomic(supabase, bookingPayload, paymentData),
        8000,
        'createBookingWithPaymentAtomic one_off',
      )
      if (atomic.ok) {
        bookingId = atomic.bookingId!
        paymentAnchorBookingId = atomic.bookingId!
        createdBookingIds = [atomic.bookingId!]
        usedAtomicPath = true
        logBookingEvent('booking_create_atomic_success', { bookingId, bookingType: 'one_off' })
      } else if (atomic.fallback) {
        logBookingEvent('booking_create_atomic_fallback', { bookingType: 'one_off', reason: atomic.error?.message })
        const { data: booking, error } = await supabase
          .from('bookings')
          .insert(bookingPayload)
          .select('id')
          .single()

        if (error || !booking) {
          if (isActiveSlotCollision(error, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
            return {
              success: false,
              error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
            }
          }
          reportBookingError(error, { professionalId: bookingInput.professionalId, bookingType }, 'booking_insert_failed')
          return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
        }
        bookingId = booking.id
        paymentAnchorBookingId = booking.id
        createdBookingIds = [booking.id]
      } else {
        reportBookingError(atomic.error, { professionalId: bookingInput.professionalId, bookingType }, 'booking_atomic_insert_failed')
        return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
      }
    } else if (bookingType === 'recurring') {
      const firstSlot = plannedSessions[0]
      const recurrencePeriodicity = bookingInput.recurringPeriodicity || 'weekly'
      const recurrenceIntervalDays =
        recurrencePeriodicity === 'custom_days' ? bookingInput.recurringIntervalDays || 1 : null

      Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking calling atomic recurring', level: 'info' })

      const parentPayload = buildRecurringParentPayload({
        userId: user.id,
        professionalId: bookingInput.professionalId,
        firstSlot,
        userTimezone,
        bookingSettings,
        bookingStatus,
        confirmationDeadlineAt,
        priceBrl,
        totalPriceUserCurrency,
        perSessionPriceUserCurrency,
        currency,
        sessionCount,
        recurrenceGroupId,
        recurrencePeriodicity,
        recurrenceIntervalDays,
        recurringEndDate: bookingInput.recurringEndDate,
        recurringAutoRenew: bookingInput.recurringAutoRenew,
        notes: bookingInput.notes,
        sessionPurpose: bookingInput.sessionPurpose,
      })

      const childBookingsPayload = buildRecurringChildPayloads(
        {
          userId: user.id,
          professionalId: bookingInput.professionalId,
          firstSlot,
          userTimezone,
          bookingSettings,
          bookingStatus,
          confirmationDeadlineAt,
          priceBrl,
          totalPriceUserCurrency,
          perSessionPriceUserCurrency,
          currency,
          sessionCount,
          recurrenceGroupId,
          recurrencePeriodicity,
          recurrenceIntervalDays,
          recurringEndDate: bookingInput.recurringEndDate,
          recurringAutoRenew: bookingInput.recurringAutoRenew,
          notes: bookingInput.notes,
          sessionPurpose: bookingInput.sessionPurpose,
        },
        plannedSessions,
      )

      const sessionsPayload = buildRecurringSessionsPayload(plannedSessions, bookingStatus)

      const atomicChildren = childBookingsPayload.slice(1).map(child => ({
        ...child,
        parent_booking_id: undefined,
      }))

      const atomicSessions = sessionsPayload.map(s => ({
        ...s,
        parent_booking_id: undefined,
      }))

      const atomic = await withTimeout(
        createRecurringBookingWithPaymentAtomic(
          supabase,
          parentPayload,
          atomicChildren,
          atomicSessions,
          paymentData,
        ),
        10000,
        'createRecurringBookingWithPaymentAtomic',
      )

      if (atomic.ok) {
        bookingId = atomic.parentBookingId!
        paymentAnchorBookingId = atomic.parentBookingId!
        createdBookingIds = [
          atomic.parentBookingId!,
          ...(atomic.childBookingIds || []),
        ]
        usedAtomicPath = true
        logBookingEvent('booking_create_atomic_success', { bookingId, bookingType: 'recurring' })
      } else if (atomic.fallback) {
        logBookingEvent('booking_create_atomic_fallback', { bookingType: 'recurring', reason: atomic.error?.message })
        const { data: parentBooking, error: parentError } = await supabase
          .from('bookings')
          .insert(parentPayload)
          .select('id')
          .single()

        if (parentError || !parentBooking) {
          if (isActiveSlotCollision(parentError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
            return {
              success: false,
              error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
            }
          }
          reportBookingError(parentError, { professionalId: bookingInput.professionalId, bookingType }, 'booking_parent_insert_failed')
          return { success: false, error: 'Erro ao criar pacote recorrente. Tente novamente.' }
        }

        const childrenWithParentId = childBookingsPayload.slice(1).map(child => ({
          ...child,
          parent_booking_id: parentBooking.id,
        }))

        const { error: cleanupError } = await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
        if (cleanupError) {
          console.error('[booking] cleanup child bookings error:', cleanupError.message)
        }
        const { data: childRows, error: childError } = await supabase
          .from('bookings')
          .insert(childrenWithParentId)
          .select('id')

        if (childError) {
          if (isActiveSlotCollision(childError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
            const { error: rollbackError } = await supabase.from('bookings').delete().eq('id', parentBooking.id)
            if (rollbackError) {
              console.error('[booking] rollback parent booking error:', rollbackError.message)
            }
            return {
              success: false,
              error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
            }
          }
          reportBookingError(childError, { parentBookingId: parentBooking.id, bookingType }, 'booking_children_insert_failed')
          const { error: rollbackError } = await supabase.from('bookings').delete().eq('id', parentBooking.id)
          if (rollbackError) {
            console.error('[booking] rollback parent booking error:', rollbackError.message)
          }
          return { success: false, error: 'Erro ao criar sessões recorrentes. Tente novamente.' }
        }

        const sessionsWithParentId = sessionsPayload.map(s => ({
          ...s,
          parent_booking_id: parentBooking.id,
        }))

        const { error: sessionsError } = await supabase.from('booking_sessions').insert(sessionsWithParentId)
        if (sessionsError) {
          reportBookingError(sessionsError, { parentBookingId: parentBooking.id, bookingType }, 'booking_sessions_insert_failed')
          const { error: rollbackChildrenError } = await supabase.from('bookings').delete().eq('parent_booking_id', parentBooking.id)
          if (rollbackChildrenError) {
            console.error('[booking] rollback child bookings error:', rollbackChildrenError.message)
          }
          const { error: rollbackParentError } = await supabase.from('bookings').delete().eq('id', parentBooking.id)
          if (rollbackParentError) {
            console.error('[booking] rollback parent booking error:', rollbackParentError.message)
          }
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
        reportBookingError(atomic.error, { professionalId: bookingInput.professionalId, bookingType }, 'booking_recurring_atomic_insert_failed')
        return { success: false, error: 'Erro ao criar pacote recorrente. Tente novamente.' }
      }
    } else {
      Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking calling atomic batch', level: 'info' })
      const batchGroupId = batchBookingGroupId || crypto.randomUUID()

      const batchPayload = buildBatchBookingPayloads({
        userId: user.id,
        professionalId: bookingInput.professionalId,
        plannedSessions,
        userTimezone,
        bookingSettings,
        bookingStatus,
        confirmationDeadlineAt,
        priceBrl,
        perSessionPriceUserCurrency,
        currency,
        batchBookingGroupId: batchGroupId,
        notes: bookingInput.notes,
        sessionPurpose: bookingInput.sessionPurpose,
      })

      const atomic = await withTimeout(
        createBatchBookingsWithPaymentAtomic(supabase, batchPayload, paymentData),
        10000,
        'createBatchBookingsWithPaymentAtomic',
      )

      if (atomic.ok) {
        bookingId = atomic.bookingIds[0]
        paymentAnchorBookingId = atomic.bookingIds[0]
        createdBookingIds = atomic.bookingIds
        usedAtomicPath = true
        logBookingEvent('booking_create_atomic_success', { bookingId, bookingType: 'batch', count: atomic.bookingIds.length })
      } else if (atomic.fallback) {
        logBookingEvent('booking_create_atomic_fallback', { bookingType: 'batch', reason: atomic.error?.message })
        const { data: batchRows, error: batchInsertError } = await supabase
          .from('bookings')
          .insert(batchPayload)
          .select('id')

        if (batchInsertError || !batchRows || batchRows.length === 0) {
          if (isActiveSlotCollision(batchInsertError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
            return {
              success: false,
              error: 'Um ou mais horários já foram reservados. Escolha outro horário.',
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
      } else {
        reportBookingError(atomic.error, { professionalId: bookingInput.professionalId, bookingType }, 'booking_batch_atomic_insert_failed')
        return { success: false, error: 'Erro ao criar agendamentos em lote. Tente novamente.' }
      }
    }
  } finally {
    for (const lockId of acquiredLockIds) {
      await releaseSlotLock(supabase, lockId)
    }
  }

  if (!bookingId || !paymentAnchorBookingId) {
    return { success: false, error: 'Erro ao finalizar agendamento.' }
  }

  if (!usedAtomicPath) {
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: paymentAnchorBookingId,
      user_id: user.id,
      professional_id: bookingInput.professionalId,
      provider: paymentData.provider,
      amount_total: paymentData.amount_total,
      currency: paymentData.currency,
      status: paymentData.status,
      metadata: paymentData.metadata,
      captured_at: paymentData.captured_at,
    })

    if (paymentError) {
      reportBookingError(paymentError, { paymentAnchorBookingId, bookingType, usedAtomicPath }, 'booking_payment_record_failed')
      logBookingEvent('booking_create_payment_failed', { paymentAnchorBookingId, bookingType, usedAtomicPath, error: paymentError.message })
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

  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking revalidating paths', level: 'info' })
  revalidatePath('/agenda')
  revalidatePath('/dashboard')

  logBookingEvent('booking_create_success', { bookingId, bookingType, usedAtomicPath, createdBookingIds })
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking completed', level: 'info', data: { bookingId, bookingType } })

  // Emit Resend automation events (non-blocking)
  const professionalEmail = Array.isArray(professional.profiles)
    ? (professional.profiles[0] as { email?: string } | null)?.email
    : (professional.profiles as { email?: string } | null)?.email
  const professionalName = Array.isArray(professional.profiles)
    ? (professional.profiles[0] as { full_name?: string } | null)?.full_name
    : (professional.profiles as { full_name?: string } | null)?.full_name

  if (professionalEmail) {
    emitProfessionalReceivedBooking(professionalEmail, {
      booking_id: bookingId,
      client_name: user.email || 'Cliente',
    })
  }
  if (user.email) {
    emitUserStartedCheckout(user.email, {
      booking_id: bookingId,
      professional_id: bookingInput.professionalId,
    })
  }

  return { success: true, bookingId }
}
