import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import {
  buildOneOffBookingPayload,
  buildRecurringParentPayload,
  buildRecurringChildPayloads,
  buildRecurringSessionsPayload,
  buildBatchBookingPayloads,
} from '@/lib/booking/payload-builders'
import {
  createBookingInputSchema,
  type BookingCreateResult,
  type CreateBookingInput,
} from './creation/types'
import type { PaymentData } from './creation/prepare-payment'
import { lookupBookingContext } from './creation/lookup-context'
import { prepareBookingSlots } from './creation/prepare-slots'
import { calculateBookingPrice } from './creation/calculate-price'
import { prepareBookingPayment } from './creation/prepare-payment'
import { persistOneOffBooking } from './creation/persist-one-off'
import { persistRecurringBooking } from './creation/persist-recurring'
import { persistBatchBooking } from './creation/persist-batch'
import { recordBookingPayment } from './creation/record-payment'
import { logBookingEvent } from './creation/logging'

export { createBookingInputSchema }
export type { CreateBookingInput }

const MANUAL_CONFIRMATION_SLA_HOURS = Number(process.env.MANUAL_CONFIRMATION_SLA_HOURS) || 24

export async function executeBookingCreation(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
  data: CreateBookingInput,
): Promise<BookingCreateResult> {
  const bookingInput = data
  const bookingType = bookingInput.bookingType || 'one_off'

  // 1. Lookup context (parallel queries)
  const contextResult = await lookupBookingContext(supabase, user.id, bookingInput)
  if ('success' in contextResult && !contextResult.success) {
    return contextResult as BookingCreateResult
  }
  const { profile, professional, settings, service } = contextResult as Exclude<typeof contextResult, { success: false }>

  const userTimezone = profile?.timezone || 'America/Sao_Paulo'

  // Override duration from selected service if provided
  const effectiveSettings = service
    ? { ...settings, sessionDurationMinutes: service.duration_minutes }
    : settings

  // Service-level recurring restriction
  if (bookingType === 'recurring' && service && service.enable_recurring === false) {
    return { success: false, error: 'Este serviço não está disponível para pacotes recorrentes.' }
  }

  // 2. Prepare slots
  const slotsResult = prepareBookingSlots(bookingInput, effectiveSettings, userTimezone)
  if ('success' in slotsResult && !slotsResult.success) {
    return slotsResult as BookingCreateResult
  }
  const { plannedSessions, recurrenceGroupId, batchBookingGroupId } = slotsResult as Exclude<typeof slotsResult, { success: false }>

  // 3. Validate slots
  for (const slot of plannedSessions) {
    const validation = await validateSlotAvailability({
      supabase,
      professionalId: bookingInput.professionalId,
      startUtc: slot.startUtc,
      endUtc: slot.endUtc,
      timezone: settings.timezone,
      bufferMinutes: settings.bufferMinutes,
      minimumNoticeHours: settings.minimumNoticeHours,
      maxBookingWindowDays: settings.maxBookingWindowDays,
      errorMessages: {
        minimumNotice: `Selecione um horário com pelo menos ${settings.minimumNoticeHours} horas de antecedência.`,
        maxWindow: `Agendamentos devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
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

  // 4. Acquire slot locks
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

  try {
    // 5. Calculate price
    const sessionCount = plannedSessions.length
    const priceBrlRaw = service ? service.price_brl : professional.session_price_brl
    const { perSessionPriceUserCurrency, totalPriceUserCurrency } = await calculateBookingPrice(
      supabase,
      priceBrlRaw,
      sessionCount,
      profile?.currency ?? null,
    )

    const priceBrl = Number(priceBrlRaw) || 0
    if (!Number.isFinite(priceBrl) || priceBrl <= 0) {
      return { success: false, error: 'Profissional não possui preço configurado para sessão.' }
    }

    const bookingStatus = 'pending_payment' as const
    const confirmationDeadlineAt =
      settings.confirmationMode === 'manual'
        ? new Date(Date.now() + MANUAL_CONFIRMATION_SLA_HOURS * 60 * 60 * 1000).toISOString()
        : null

    // 6. Prepare payment
    let paymentData: PaymentData
    try {
      const paymentResult = prepareBookingPayment(
        user,
        professional.id,
        totalPriceUserCurrency,
        profile?.currency ?? null,
        bookingInput,
        recurrenceGroupId,
        batchBookingGroupId,
        sessionCount,
        settings.confirmationMode,
      )
      paymentData = paymentResult.paymentData
    } catch (error) {
      const errorId = Sentry.captureException(error, {
        tags: { area: 'booking', action: 'prepare-payment' },
        extra: { userId: user.id, professionalId: professional.id },
      })
      return { success: false, error: `Erro interno ao preparar pagamento. (Ref: ${errorId})` }
    }

    // 6b. Re-validate slot availability immediately before persistence
    // (locks may have expired during payment preparation)
    for (const slot of plannedSessions) {
      const revalidation = await validateSlotAvailability({
        supabase,
        professionalId: bookingInput.professionalId,
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        timezone: settings.timezone,
        bufferMinutes: settings.bufferMinutes,
        minimumNoticeHours: settings.minimumNoticeHours,
        maxBookingWindowDays: settings.maxBookingWindowDays,
        errorMessages: {
          minimumNotice: `Selecione um horário com pelo menos ${settings.minimumNoticeHours} horas de antecedência.`,
          maxWindow: `Agendamentos devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
          workingHours: 'Um ou mais horários não estão disponíveis para este profissional.',
          exception: 'Um ou mais horários foram bloqueados por indisponibilidade.',
          internalConflict: 'Um ou mais horários já foram reservados. Escolha outro horário.',
          externalConflict: 'Um ou mais horários conflitam com a agenda externa conectada do profissional.',
        },
      })
      if (!revalidation.valid) {
        return { success: false, error: revalidation.error! }
      }
    }

    // 7. Persist booking
    let persistResult:
      | { bookingId: string; paymentAnchorBookingId: string; createdBookingIds: string[]; usedAtomicPath: boolean }
      | { success: false; error: string }

    if (bookingType === 'one_off') {
      const firstSlot = plannedSessions[0]
      const bookingPayload = buildOneOffBookingPayload({
        userId: user.id,
        professionalId: bookingInput.professionalId,
        slot: firstSlot,
        userTimezone,
        bookingSettings: effectiveSettings,
        bookingStatus,
        confirmationDeadlineAt,
        priceBrl,
        perSessionPriceUserCurrency,
        currency: (profile?.currency ?? null) || 'BRL',
        notes: bookingInput.notes,
        sessionPurpose: bookingInput.sessionPurpose,
        serviceId: service?.id,
      })

      persistResult = await persistOneOffBooking(supabase, bookingPayload, paymentData, professional.id)
    } else if (bookingType === 'recurring') {
      const firstSlot = plannedSessions[0]
      const recurrencePeriodicity = bookingInput.recurringPeriodicity || 'weekly'
      const recurrenceIntervalDays =
        recurrencePeriodicity === 'custom_days' ? bookingInput.recurringIntervalDays || 1 : null

      const parentPayload = buildRecurringParentPayload({
        userId: user.id,
        professionalId: bookingInput.professionalId,
        firstSlot,
        userTimezone,
        bookingSettings: effectiveSettings,
        bookingStatus,
        confirmationDeadlineAt,
        priceBrl,
        totalPriceUserCurrency,
        perSessionPriceUserCurrency,
        currency: profile?.currency || 'BRL',
        sessionCount,
        recurrenceGroupId,
        recurrencePeriodicity,
        recurrenceIntervalDays,
        recurringEndDate: bookingInput.recurringEndDate,
        recurringAutoRenew: bookingInput.recurringAutoRenew,
        notes: bookingInput.notes,
        sessionPurpose: bookingInput.sessionPurpose,
        serviceId: service?.id,
      })

      const childBookingsPayload = buildRecurringChildPayloads(
        {
          userId: user.id,
          professionalId: bookingInput.professionalId,
          firstSlot,
          userTimezone,
          bookingSettings: effectiveSettings,
          bookingStatus,
          confirmationDeadlineAt,
          priceBrl,
          totalPriceUserCurrency,
          perSessionPriceUserCurrency,
          currency: profile?.currency || 'BRL',
          sessionCount,
          recurrenceGroupId,
          recurrencePeriodicity,
          recurrenceIntervalDays,
          recurringEndDate: bookingInput.recurringEndDate,
          recurringAutoRenew: bookingInput.recurringAutoRenew,
          notes: bookingInput.notes,
          sessionPurpose: bookingInput.sessionPurpose,
          serviceId: service?.id,
        },
        plannedSessions,
      )

      const sessionsPayload = buildRecurringSessionsPayload(plannedSessions, bookingStatus)

      persistResult = await persistRecurringBooking(
        supabase,
        parentPayload,
        childBookingsPayload,
        sessionsPayload,
        paymentData,
        professional.id,
      )
    } else {
      const batchGroupId = batchBookingGroupId || crypto.randomUUID()
      const batchPayload = buildBatchBookingPayloads({
        userId: user.id,
        professionalId: bookingInput.professionalId,
        plannedSessions,
        userTimezone,
        bookingSettings: effectiveSettings,
        bookingStatus,
        confirmationDeadlineAt,
        priceBrl,
        perSessionPriceUserCurrency,
        currency: profile?.currency || 'BRL',
        serviceId: service?.id,
        batchBookingGroupId: batchGroupId,
        notes: bookingInput.notes,
        sessionPurpose: bookingInput.sessionPurpose,
      })

      persistResult = await persistBatchBooking(supabase, batchPayload, paymentData, professional.id)
    }

    if ('success' in persistResult && !persistResult.success) {
      return persistResult as BookingCreateResult
    }

    const { bookingId, paymentAnchorBookingId, createdBookingIds, usedAtomicPath } =
      persistResult as Exclude<typeof persistResult, { success: false }>

    // 8. Record payment (fallback path only)
    if (!usedAtomicPath) {
      try {
        await recordBookingPayment(supabase, paymentData, createdBookingIds, paymentAnchorBookingId, batchBookingGroupId)
      } catch {
        return { success: false, error: 'Falha ao processar pagamento. Nenhum agendamento foi confirmado.' }
      }
    }

    // 9. Assemble result
    const professionalProfile = Array.isArray(professional.profiles)
      ? professional.profiles[0]
      : professional.profiles
    const professionalEmail = (professionalProfile as { email?: string } | null)?.email
    const professionalName = (professionalProfile as { full_name?: string } | null)?.full_name

    logBookingEvent('booking_create_success', { bookingId, bookingType, usedAtomicPath, createdBookingIds })
    Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking completed', level: 'info', data: { bookingId, bookingType } })

    return {
      success: true,
      bookingId,
      createdBookingIds: Array.from(new Set(createdBookingIds.length ? createdBookingIds : [bookingId])),
      usedAtomicPath,
      professionalEmail: professionalEmail || null,
      professionalName: professionalName || null,
    }
  } finally {
    for (const lockId of acquiredLockIds) {
      await releaseSlotLock(supabase, lockId)
    }
  }
}
