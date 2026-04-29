import { z } from 'zod'
import { fromZonedTime } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assertBookingTransition } from '@/lib/booking/state-machine'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { patchBookingMetadata } from '@/lib/booking/metadata'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import {
  getHoursUntilSession,
  getProfessionalCancellationRefundDecision,
  getUserCancellationRefundDecision,
  roundCurrency,
} from '@/lib/booking/cancellation-policy'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import {
  evaluateRecurringChangeDeadline,
  evaluateRecurringPauseDeadline,
  type RecurringDeadlineDecision,
} from '@/lib/booking/recurring-deadlines'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import { localDateTimeSchema } from '@/lib/booking/request-validation'
import {
  emitUserSessionCompleted,
  emitProfessionalSessionCompleted,
  emitUserCancelledBooking,
} from '@/lib/email/resend-events'

export type ManageBookingResult =
  | { success: true }
  | {
      success: false
      error: string
      reasonCode?: string
      deadlineAtUtc?: string | null
    }

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

export async function applyPaymentRefund(
  supabase: SupabaseClient,
  bookingId: string,
  refundPercentage: number,
) {
  const query = supabase
    .from('payments')
    .select('id, amount_total, status')
    .eq('booking_id', bookingId)
    .in('status', ['captured', 'partial_refunded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let paymentData: { id: string; amount_total: number; status: string } | null = null
  let paymentError: { message?: string } | null = null
  ;({ data: paymentData, error: paymentError } = await query)

  if (!paymentData || paymentError) return

  const nowIso = new Date().toISOString()
  const refundAmount = roundCurrency((Number(paymentData.amount_total) || 0) * (refundPercentage / 100))

  if (refundPercentage <= 0) {
    await supabase
      .from('payments')
      .update({
        refund_percentage: 0,
        refunded_amount: 0,
      })
      .eq('id', paymentData.id)
    return
  }

  const patch =
    refundPercentage >= 100
      ? {
          status: 'refunded',
          refund_percentage: 100,
          refunded_amount: refundAmount,
          refunded_at: nowIso,
        }
      : {
          status: 'partial_refunded',
          refund_percentage: refundPercentage,
          refunded_amount: refundAmount,
          refunded_at: nowIso,
        }

  const { error: refundError } = await supabase.from('payments').update(patch).eq('id', paymentData.id)
  if (refundError) {
    console.error('[booking/refund] failed to update payment refund:', refundError.message)
  }
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

async function executeCancelSingleBooking(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  booking: {
    id: string
    status: string
    professional_id: string
    user_id: string
    scheduled_at: string
    booking_type: string | null
    metadata: Record<string, unknown> | null
  },
  normalizedReason?: string,
): Promise<ManageBookingResult> {
  const isBookingUser = booking.user_id === userId
  const isBookingProfessional = professionalId ? booking.professional_id === professionalId : false
  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status as Parameters<typeof assertBookingTransition>[0], 'cancelled')
  if (!transition.ok) return { success: false, error: 'Este agendamento não pode ser cancelado.' }

  if (booking.booking_type === 'recurring_parent' || booking.booking_type === 'recurring_child') {
    const deadlineDecision = evaluateRecurringPauseDeadline(booking.scheduled_at)
    if (!deadlineDecision.allowed) {
      const message =
        booking.booking_type === 'recurring_parent'
          ? 'Pausa de pacote recorrente fora do prazo de 7 dias.'
          : 'Pausa de sessão recorrente fora do prazo de 7 dias.'
      return recurringDeadlineBlockedResult(message, deadlineDecision)
    }
  }

  const hoursUntilSession = getHoursUntilSession(booking.scheduled_at)
  const refundDecision = isBookingUser
    ? getUserCancellationRefundDecision(hoursUntilSession)
    : getProfessionalCancellationRefundDecision()

  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    metadata: patchBookingMetadata(booking.metadata, {
      cancelled_by: isBookingUser ? 'user' : 'professional',
      cancelled_at: new Date().toISOString(),
      refund_percentage: refundDecision.refundPercentage,
      refund_rule: refundDecision.rule,
    }),
  }

  if (normalizedReason) {
    updateData.cancellation_reason = normalizedReason
  }

  let cancelQuery = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', booking.id)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])

  if (isBookingUser) {
    cancelQuery = cancelQuery.eq('user_id', userId)
  } else if (professionalId) {
    cancelQuery = cancelQuery.eq('professional_id', professionalId)
  }

  const { data: cancelledBooking, error } = await cancelQuery.select('id').maybeSingle()

  if (error || !cancelledBooking) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, booking.id, refundDecision.refundPercentage)
  await enqueueBookingCalendarSync({
    bookingId: booking.id,
    action: 'cancel_booking',
    source: 'booking.cancel',
  })

  const cancelledBy = isBookingUser ? 'user' : 'professional'
  const { data: cancelledUserProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', isBookingUser ? userId : booking.user_id)
    .maybeSingle()
  if (cancelledUserProfile?.email) {
    emitUserCancelledBooking(cancelledUserProfile.email, {
      booking_id: booking.id,
      cancelled_by: cancelledBy,
    })
  }

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

  const professionalProfile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles
  const professionalTimezoneFallback =
    (professionalProfile as { timezone?: string } | null)?.timezone || 'America/Sao_Paulo'

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, confirmation_mode'
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const settings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  const durationMinutes = settings.sessionDurationMinutes || professional.session_duration_minutes || booking.duration_minutes
  let scheduledDate: Date
  try {
    scheduledDate = fromZonedTime(parsedScheduledAt.data, userTimezone)
  } catch {
    return { success: false, error: 'Horário inválido.' }
  }
  if (Number.isNaN(scheduledDate.getTime())) return { success: false, error: 'Horário inválido.' }

  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (scheduledDate.getTime() < minimumStartTime) {
    return {
      success: false,
      error: `Selecione um horário com pelo menos ${settings.minimumNoticeHours} horas de antecedência.`,
    }
  }

  const maximumDate = new Date()
  maximumDate.setDate(maximumDate.getDate() + settings.maxBookingWindowDays)
  if (scheduledDate.getTime() > maximumDate.getTime()) {
    return {
      success: false,
      error: `Remarcações devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
    }
  }

  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000)
  const validation = await validateSlotAvailability({
    supabase,
    professionalId: professional.id,
    startUtc: scheduledDate,
    endUtc: endDate,
    timezone: settings.timezone,
    bufferMinutes: settings.bufferMinutes,
    ignoreBookingId: booking.id,
    errorMessages: {
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

export async function completeBookingService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, duration_minutes')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'completed')
  if (!transition.ok) {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser concluídos.' }
  }

  const sessionEnd = new Date(booking.scheduled_at).getTime() + (booking.duration_minutes || 0) * 60 * 1000
  if (Date.now() < sessionEnd) {
    return { success: false, error: 'A sessão só pode ser concluída após o horário previsto de término.' }
  }

  let { data: completedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if (error || !completedBooking) {
    return { success: false, error: 'Erro ao concluir agendamento. Tente novamente.' }
  }

  // Emit Resend automation events (non-blocking)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', booking.user_id)
    .maybeSingle()
  if (userProfile?.email) {
    emitUserSessionCompleted(userProfile.email, {
      booking_id: safeBookingId,
      professional_id: booking.professional_id,
    })
  }

  const { data: profProfile } = await supabase
    .from('professionals')
    .select('profiles!professionals_user_id_fkey(email)')
    .eq('id', booking.professional_id)
    .maybeSingle()
  const profEmail = profProfile
    ? (Array.isArray((profProfile as Record<string, unknown>).profiles)
      ? (((profProfile as Record<string, unknown>).profiles as unknown[])[0] as { email?: string })?.email
      : ((profProfile as Record<string, unknown>).profiles as { email?: string })?.email)
    : null
  if (profEmail) {
    emitProfessionalSessionCompleted(profEmail, {
      booking_id: safeBookingId,
    })
  }

  return { success: true }
}

export async function reportProfessionalNoShowService(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.user_id !== userId) {
    return { success: false, error: 'Apenas o cliente pode reportar no-show do profissional.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessões confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessão ainda não iniciou.' }
  }

  const patch = {
    status: 'no_show',
    metadata: patchBookingMetadata(booking.metadata, {
      no_show_actor: 'professional',
      flagged_for_support: true,
      no_show_reported_at: new Date().toISOString(),
    }),
  }

  let { data: updated, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', safeBookingId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    return { success: false, error: 'Não foi possível registrar no-show. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, safeBookingId, 100)

  const { error: notifyError } = await supabase.from('notifications').insert({
    user_id: null,
    booking_id: safeBookingId,
    type: 'ops.professional_no_show',
    title: 'No-show reportado para profissional',
    body: 'Um cliente reportou ausência do profissional. Revisão manual recomendada.',
    payload: {
      booking_id: safeBookingId,
      professional_id: booking.professional_id,
    },
  })
  if (notifyError) {
    console.error('[booking/no-show] failed to insert admin notification:', notifyError.message)
  }

  await enqueueBookingCalendarSync({
    bookingId: safeBookingId,
    action: 'cancel_booking',
    source: 'booking.no_show_professional',
  })

  return { success: true }
}

export async function markUserNoShowService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<ManageBookingResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode marcar no-show do cliente.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, scheduled_at, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode marcar no-show do cliente.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessões confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessão ainda não iniciou.' }
  }

  const patch = {
    status: 'no_show',
    metadata: patchBookingMetadata(booking.metadata, {
      no_show_actor: 'user',
      no_show_reported_at: new Date().toISOString(),
    }),
  }

  let { data: updated, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    return { success: false, error: 'Não foi possível registrar no-show. Tente novamente.' }
  }

  await enqueueBookingCalendarSync({
    bookingId: safeBookingId,
    action: 'cancel_booking',
    source: 'booking.no_show_user',
  })

  return { success: true }
}

export async function listBookingsService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  options?: {
    status?: string | string[]
    limit?: number
    offset?: number
  },
): Promise<
  | { success: true; data: { bookings: unknown[]; total: number } }
  | { success: false; error: string }
> {
  const limit = Math.min(100, Math.max(1, options?.limit || 50))
  const offset = Math.max(0, options?.offset || 0)

  let query = supabase
    .from('bookings')
    .select(
      'id, user_id, professional_id, scheduled_at, start_time_utc, end_time_utc, duration_minutes, status, session_link, timezone_user, timezone_professional, booking_type, metadata, cancellation_reason, created_at, updated_at',
      { count: 'exact' }
    )
    .or(`user_id.eq.${userId}${professionalId ? `,professional_id.eq.${professionalId}` : ''}`)
    .order('scheduled_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status]
    query = query.in('status', statuses)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[booking/list] failed to load bookings:', error.message)
    return { success: false, error: 'Erro ao carregar agendamentos.' }
  }

  return { success: true, data: { bookings: data || [], total: count || 0 } }
}

export async function getBookingDetailService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<
  | { success: true; data: unknown }
  | { success: false; error: string }
> {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      'id, user_id, professional_id, scheduled_at, start_time_utc, end_time_utc, duration_minutes, status, session_link, timezone_user, timezone_professional, booking_type, metadata, cancellation_reason, created_at, updated_at'
    )
    .eq('id', parsed.data)
    .maybeSingle()

  if (error) {
    console.error('[booking/detail] failed to load booking:', error.message)
    return { success: false, error: 'Erro ao carregar agendamento.' }
  }

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  const isClient = (booking as Record<string, unknown>).user_id === userId
  let isProfessional = false
  if (!isClient && professionalId && (booking as Record<string, unknown>).professional_id === professionalId) {
    isProfessional = true
  }

  if (!isClient && !isProfessional) {
    return { success: false, error: 'Você não tem acesso a este agendamento.' }
  }

  return { success: true, data: booking }
}
