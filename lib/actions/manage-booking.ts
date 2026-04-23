'use server'

import { z } from 'zod'
import { fromZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { assertBookingTransition } from '@/lib/booking/state-machine'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { acquireSlotLock, releaseSlotLock } from '@/lib/booking/slot-locks'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
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

type ActionResult =
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

const RATE_LIMIT_ERROR: ActionResult = {
  success: false,
  error: 'Muitas tentativas. Tente novamente em breve.',
}

function recurringDeadlineBlockedResult(
  message: string,
  decision: RecurringDeadlineDecision,
): ActionResult {
  return {
    success: false,
    error: message,
    reasonCode: decision.reason_code,
    deadlineAtUtc: decision.deadline_at_utc,
  }
}

function validateBookingId(bookingId: string): { ok: true; id: string } | { ok: false; result: ActionResult } {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return {
      ok: false,
      result: { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' },
    }
  }
  return { ok: true, id: parsed.data }
}

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  return { supabase, user, professionalId: professional?.id ?? null }
}

async function applyPaymentRefund(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

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
  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<ActionResult> {
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

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, booking_type, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }

  const isBookingUser = booking.user_id === user.id
  const isBookingProfessional = professionalId ? booking.professional_id === professionalId : false
  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'cancelled')
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

  const currentMetadata = (booking.metadata as Record<string, unknown> | null) || {}
  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    metadata: {
      ...currentMetadata,
      cancelled_by: isBookingUser ? 'user' : 'professional',
      cancelled_at: new Date().toISOString(),
      refund_percentage: refundDecision.refundPercentage,
      refund_rule: refundDecision.rule,
    },
  }

  if (normalizedReason) {
    updateData.cancellation_reason = normalizedReason
  }

  let cancelQuery = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', safeBookingId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])

  if (isBookingUser) {
    cancelQuery = cancelQuery.eq('user_id', user.id)
  } else if (professionalId) {
    cancelQuery = cancelQuery.eq('professional_id', professionalId)
  }

  let { data: cancelledBooking, error } = await cancelQuery.select('id').maybeSingle()

  if (error || !cancelledBooking) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, safeBookingId, refundDecision.refundPercentage)
  await enqueueBookingCalendarSync({
    bookingId: safeBookingId,
    action: 'cancel_booking',
    source: 'booking.cancel',
  })

  // Emit Resend automation event (non-blocking)
  const cancelledBy = isBookingUser ? 'user' : 'professional'
  const { data: cancelledUserProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', isBookingUser ? user.id : booking.user_id)
    .maybeSingle()
  if (cancelledUserProfile?.email) {
    emitUserCancelledBooking(cancelledUserProfile.email, {
      booking_id: safeBookingId,
      cancelled_by: cancelledBy,
    })
  }

  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function rescheduleBooking(
  bookingId: string,
  newScheduledAt: string,
): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedScheduledAt = localDateTimeSchema.safeParse(newScheduledAt)
  if (!parsedScheduledAt.success) {
    return { success: false, error: parsedScheduledAt.error.issues[0]?.message || 'Horário inválido.' }
  }

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, duration_minutes, booking_type, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.user_id !== user.id) {
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
    .eq('id', user.id)
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
    userId: user.id,
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

  const currentMetadata = (booking.metadata as Record<string, unknown> | null) || {}
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
      metadata: {
        ...currentMetadata,
        rescheduled_at: new Date().toISOString(),
        rescheduled_by: 'user',
      },
    })
    .eq('id', booking.id)
    .eq('user_id', user.id)
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
  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function addSessionLink(bookingId: string, link: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedLink = sessionLinkSchema.safeParse(link)
  if (!parsedLink.success) {
    return { success: false, error: parsedLink.error.issues[0]?.message || 'Link da sessão inválido.' }
  }

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

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

  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeBooking(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

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

  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function reportProfessionalNoShow(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.user_id !== user.id) {
    return { success: false, error: 'Apenas o cliente pode reportar no-show do profissional.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessões confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessão ainda não iniciou.' }
  }

  const currentMetadata = (booking.metadata as Record<string, unknown> | null) || {}
  const patch = {
    status: 'no_show',
    metadata: {
      ...currentMetadata,
      no_show_actor: 'professional',
      flagged_for_support: true,
      no_show_reported_at: new Date().toISOString(),
    },
  }

  let { data: updated, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', safeBookingId)
    .eq('user_id', user.id)
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
  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markUserNoShow(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

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

  const currentMetadata = (booking.metadata as Record<string, unknown> | null) || {}
  const patch = {
    status: 'no_show',
    metadata: {
      ...currentMetadata,
      no_show_actor: 'user',
      no_show_reported_at: new Date().toISOString(),
    },
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
  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}
