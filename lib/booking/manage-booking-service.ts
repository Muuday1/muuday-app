import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseBookingSlot } from '@/lib/booking/slot-parsing'
import { assertBookingTransition } from '@/lib/booking/state-machine'
import {
  extractProfessionalTimezone,
  loadProfessionalSettings,
} from '@/lib/booking/settings'
import { patchBookingMetadata } from '@/lib/booking/metadata'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import { getHoursUntilSession } from '@/lib/booking/cancellation-policy'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import {
  evaluateRecurringChangeDeadline,
  evaluateRecurringPauseDeadline,
  type RecurringDeadlineDecision,
} from '@/lib/booking/recurring-deadlines'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import { localDateTimeSchema } from '@/lib/booking/request-validation'
import { executeCancelSingleBooking } from '@/lib/booking/cancellation/execute-cancel'
import type { ManageBookingResult } from '@/lib/booking/types'

// Re-exports for backward compatibility
export { completeBookingService } from '@/lib/booking/completion/complete-booking'
export { reportProfessionalNoShowService, markUserNoShowService } from '@/lib/booking/no-show/report-no-show'
export { listBookingsService, getBookingDetailService } from '@/lib/booking/query/booking-queries'

const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')
const cancelReasonSchema = z.string().trim().max(300, 'Motivo de cancelamento muito longo.')
const sessionLinkSchema = z.string().trim().url('Link da sessão inválido.').max(500, 'Link da sessão muito longo.')

export function recurringDeadlineBlockedResult(
  message: string,
  decision: RecurringDeadlineDecision,
): ManageBookingResult {
  return {
    success: false,
    error: message,
    reasonCode: decision.reason_code,
    deadlineAtUtc: decision.deadline_at_utc,
  }
}

export function validateBookingId(
  bookingId: string,
): { ok: true; id: string } | { ok: false; result: ManageBookingResult } {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return {
      ok: false,
      result: { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' },
    }
  }
  return { ok: true, id: parsed.data }
}

export async function confirmBookingService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'confirmed')
  if (!transition.ok) {
    return { success: false, error: 'Este agendamento não pode ser confirmado no estado atual.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation'])
    .select('id')
    .maybeSingle()

  if (error || !updatedBooking) {
    return { success: false, error: 'Erro ao confirmar agendamento. Tente novamente.' }
  }

  await enqueueBookingCalendarSync({
    bookingId: safeBookingId,
    action: 'upsert_booking',
    source: 'booking.confirm',
  })

  return { success: true }
}

export async function cancelBookingService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
  reason?: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  let normalizedReason: string | undefined
  if (typeof reason === 'string' && reason.trim()) {
    const parsedReason = cancelReasonSchema.safeParse(reason)
    if (!parsedReason.success) {
      return {
        success: false,
        error: parsedReason.error.issues[0]?.message || 'Motivo de cancelamento inválido.',
      }
    }
    normalizedReason = parsedReason.data
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, booking_type, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }

  return executeCancelSingleBooking(supabase, userId, professionalId, booking, normalizedReason)
}

export async function cancelBookingWithScopeService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
  scope: 'this' | 'future' | 'series',
  reason?: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  let normalizedReason: string | undefined
  if (typeof reason === 'string' && reason.trim()) {
    const parsedReason = cancelReasonSchema.safeParse(reason)
    if (!parsedReason.success) {
      return {
        success: false,
        error: parsedReason.error.issues[0]?.message || 'Motivo de cancelamento inválido.',
      }
    }
    normalizedReason = parsedReason.data
  }

  const { data: targetBooking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, booking_type, metadata, recurrence_group_id')
    .eq('id', safeBookingId)
    .single()

  if (!targetBooking) return { success: false, error: 'Agendamento não encontrado.' }

  if (scope === 'this') {
    return executeCancelSingleBooking(supabase, userId, professionalId, targetBooking, normalizedReason)
  }

  if (!targetBooking.recurrence_group_id) {
    return { success: false, error: 'Este agendamento não faz parte de um pacote recorrente.' }
  }

  const isBookingUser = targetBooking.user_id === userId
  const isBookingProfessional = professionalId ? targetBooking.professional_id === professionalId : false
  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  let siblingsQuery = supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, booking_type, metadata')
    .eq('recurrence_group_id', targetBooking.recurrence_group_id)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])

  if (isBookingUser) {
    siblingsQuery = siblingsQuery.eq('user_id', userId)
  } else if (professionalId) {
    siblingsQuery = siblingsQuery.eq('professional_id', professionalId)
  }

  if (scope === 'future') {
    siblingsQuery = siblingsQuery.gte('scheduled_at', targetBooking.scheduled_at)
  }

  const { data: bookingsToCancel, error: siblingsError } = await siblingsQuery.order('scheduled_at', {
    ascending: true,
  })

  if (siblingsError || !bookingsToCancel) {
    return { success: false, error: 'Erro ao buscar sessões do pacote. Tente novamente.' }
  }

  if (bookingsToCancel.length === 0) {
    return { success: false, error: 'Não há sessões elegíveis para cancelamento no escopo selecionado.' }
  }

  const results: { id: string; result: ManageBookingResult }[] = []
  for (const b of bookingsToCancel) {
    const result = await executeCancelSingleBooking(supabase, userId, professionalId, b, normalizedReason)
    results.push({ id: b.id, result })
  }

  const successCount = results.filter(r => r.result.success).length
  const failureCount = results.length - successCount

  if (successCount === 0) {
    const firstErrorResult = results.find(r => !r.result.success)?.result
    const firstError = firstErrorResult && firstErrorResult.success === false ? firstErrorResult : null
    return {
      success: false,
      error: firstError?.error || 'Não foi possível cancelar as sessões.',
      reasonCode: firstError?.reasonCode,
      deadlineAtUtc: firstError?.deadlineAtUtc,
    }
  }

  if (failureCount > 0) {
    return {
      success: true,
      error: `${successCount} sessão(ões) cancelada(s). ${failureCount} não pôde(ram) ser cancelada(s) (fora do prazo ou já concluídas).`,
    } as ManageBookingResult
  }

  return { success: true }
}

export async function rescheduleBookingService(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string,
  newScheduledAt: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedScheduledAt = localDateTimeSchema.safeParse(newScheduledAt)
  if (!parsedScheduledAt.success) {
    return { success: false, error: parsedScheduledAt.error.issues[0]?.message || 'Horário inválido.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, duration_minutes, booking_type, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.user_id !== userId) {
    return { success: false, error: 'Apenas o cliente pode remarcar este agendamento.' }
  }

  if (booking.booking_type === 'recurring_parent') {
    return { success: false, error: 'Remarcação de pacote recorrente ainda não está disponível.' }
  }

  if (booking.booking_type === 'recurring_child') {
    const deadlineDecision = evaluateRecurringChangeDeadline(booking.scheduled_at)
    if (!deadlineDecision.allowed) {
      return recurringDeadlineBlockedResult(
        'Alteração de sessão recorrente fora do prazo de 7 dias.',
        deadlineDecision,
      )
    }
  }

  if (!['pending', 'pending_confirmation', 'confirmed'].includes(booking.status)) {
    return { success: false, error: 'Este agendamento não pode ser remarcado.' }
  }

  const hoursUntilCurrentSession = getHoursUntilSession(booking.scheduled_at)
  if (hoursUntilCurrentSession < 24) {
    return {
      success: false,
      error: 'Remarcações só são permitidas com no mínimo 24 horas de antecedência.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()
  const userTimezone = profile?.timezone || 'America/Sao_Paulo'

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, session_duration_minutes, profiles!professionals_user_id_fkey(timezone)')
    .eq('id', booking.professional_id)
    .single()

  if (!professional) return { success: false, error: 'Profissional não encontrado.' }

  const professionalTimezoneFallback = extractProfessionalTimezone(professional)
  const settings = await loadProfessionalSettings(supabase, professional.id, professionalTimezoneFallback)

  const durationMinutes = settings.sessionDurationMinutes || professional.session_duration_minutes || booking.duration_minutes
  const parsedSlot = parseBookingSlot(parsedScheduledAt.data, userTimezone, durationMinutes)
  if (!parsedSlot.ok) {
    return { success: false, error: parsedSlot.error }
  }
  const { startUtc: scheduledDate, endUtc: endDate } = parsedSlot.slot

  const validation = await validateSlotAvailability({
    supabase,
    professionalId: professional.id,
    startUtc: scheduledDate,
    endUtc: endDate,
    timezone: settings.timezone,
    bufferMinutes: settings.bufferMinutes,
    minimumNoticeHours: settings.minimumNoticeHours,
    maxBookingWindowDays: settings.maxBookingWindowDays,
    ignoreBookingId: booking.id,
    errorMessages: {
      minimumNotice: `Selecione um horário com pelo menos ${settings.minimumNoticeHours} horas de antecedência.`,
      maxWindow: `Remarcações devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
      workingHours: 'Este horário não está disponível para este profissional.',
      exception: 'Este horário não está disponível.',
      internalConflict: 'Este horário já está reservado. Escolha outro.',
      externalConflict: 'Este horário conflita com agenda externa conectada do profissional.',
    },
  })
  if (!validation.valid) {
    return { success: false, error: validation.error! }
  }

  const slotLock = await acquireSlotLock(supabase, {
    professionalId: professional.id,
    userId,
    startUtcIso: scheduledDate.toISOString(),
    endUtcIso: endDate.toISOString(),
    bookingType: 'one_off',
    ttlMinutes: 10,
  })
  if (!slotLock.ok) {
    return {
      success: false,
      error:
        slotLock.reason === 'locked'
          ? 'Outro cliente acabou de selecionar este horário. Escolha outro.'
          : 'Não foi possível bloquear o horário para remarcação.',
    }
  }

  const newStatus = settings.confirmationMode === 'manual' ? 'pending_confirmation' : 'confirmed'
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      scheduled_at: scheduledDate.toISOString(),
      start_time_utc: scheduledDate.toISOString(),
      end_time_utc: endDate.toISOString(),
      duration_minutes: durationMinutes,
      timezone_user: userTimezone,
      timezone_professional: settings.timezone,
      status: newStatus,
      metadata: patchBookingMetadata(booking.metadata, {
        rescheduled_at: new Date().toISOString(),
        rescheduled_by: 'user',
      }),
    })
    .eq('id', booking.id)
    .eq('user_id', userId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])

  await releaseSlotLock(supabase, slotLock.lockId)

  if (updateError) {
    return { success: false, error: 'Erro ao remarcar agendamento. Tente novamente.' }
  }

  await enqueueBookingCalendarSync({
    bookingId: booking.id,
    action: 'upsert_booking',
    source: 'booking.reschedule',
  })

  return { success: true }
}

export async function addSessionLinkService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
  link: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedLink = sessionLinkSchema.safeParse(link)
  if (!parsedLink.success) {
    return { success: false, error: parsedLink.error.issues[0]?.message || 'Link da sessão inválido.' }
  }

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessão.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessão.' }
  }
  if (!['confirmed', 'pending', 'pending_confirmation'].includes(booking.status)) {
    return { success: false, error: 'Não é possível adicionar link a este agendamento.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ session_link: parsedLink.data })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .select('id')
    .maybeSingle()

  if (error || !updatedBooking) return { success: false, error: 'Erro ao salvar o link. Tente novamente.' }

  return { success: true }
}

