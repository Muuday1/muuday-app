'use server'

import { z } from 'zod'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
import {
  isSlotWithinWorkingHours,
  mapLegacyAvailabilityToRules,
} from '@/lib/booking/availability-engine'

type ActionResult = { success: true } | { success: false; error: string }

const bookingIdSchema = z.string().uuid('Identificador de agendamento invalido.')
const cancelReasonSchema = z.string().trim().max(300, 'Motivo de cancelamento muito longo.')
const sessionLinkSchema = z.string().trim().url('Link da sessao invalido.').max(500, 'Link da sessao muito longo.')
const scheduledAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, 'Horario invalido.')

const RATE_LIMIT_ERROR: ActionResult = {
  success: false,
  error: 'Muitas tentativas. Tente novamente em breve.',
}

function validateBookingId(bookingId: string): { ok: true; id: string } | { ok: false; result: ActionResult } {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return {
      ok: false,
      result: { success: false, error: parsed.error.issues[0]?.message || 'Identificador invalido.' },
    }
  }
  return { ok: true, id: parsed.data }
}

function hhmmToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function getMinutesInTimezone(date: Date, timezone: string) {
  return hhmmToMinutes(formatInTimeZone(date, timezone, 'HH:mm'))
}

async function getAuthenticatedContext() {
  const supabase = createClient()
  const adminSupabase = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  return { supabase, adminSupabase, user, professionalId: professional?.id ?? null }
}

async function applyPaymentRefund(
  supabase: ReturnType<typeof createClient>,
  adminSupabase: ReturnType<typeof createAdminClient>,
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

  if ((!paymentData || paymentError) && adminSupabase) {
    ;({ data: paymentData, error: paymentError } = await adminSupabase
      .from('payments')
      .select('id, amount_total, status')
      .eq('booking_id', bookingId)
      .in('status', ['captured', 'partial_refunded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle())
  }

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

  let { error } = await supabase.from('payments').update(patch).eq('id', paymentData.id)
  if (error && adminSupabase) {
    ;({ error } = await adminSupabase.from('payments').update(patch).eq('id', paymentData.id))
  }
}

async function loadAvailabilityRules(
  supabase: ReturnType<typeof createClient>,
  professionalId: string,
  timezone: string,
) {
  const { data: rulesRows, error: rulesError } = await supabase
    .from('availability_rules')
    .select('weekday, start_time_local, end_time_local, timezone, is_active')
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if (!rulesError && rulesRows && rulesRows.length > 0) return rulesRows

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

  const slotStart = getMinutesInTimezone(startUtc, timezone)
  const slotEnd = getMinutesInTimezone(endUtc, timezone)
  const exceptionStart = hhmmToMinutes(exception.start_time_local)
  const exceptionEnd = hhmmToMinutes(exception.end_time_local)
  return slotStart >= exceptionStart && slotEnd <= exceptionEnd
}

async function hasInternalBookingConflict(
  supabase: ReturnType<typeof createClient>,
  professionalId: string,
  startUtc: Date,
  endUtc: Date,
  bufferMinutes: number,
  ignoreBookingId?: string,
) {
  const conflictWindowStart = new Date(startUtc.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const conflictWindowEnd = new Date(endUtc.getTime() + 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('bookings')
    .select('id, scheduled_at, start_time_utc, end_time_utc, duration_minutes')
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .or(
      `and(start_time_utc.gte.${conflictWindowStart},start_time_utc.lte.${conflictWindowEnd}),and(scheduled_at.gte.${conflictWindowStart},scheduled_at.lte.${conflictWindowEnd})`
    )

  if (ignoreBookingId) {
    query = query.neq('id', ignoreBookingId)
  }

  const { data } = await query
  const list = data || []

  return list.some((booking: Record<string, unknown>) => {
    const start = new Date((booking.start_time_utc as string) || (booking.scheduled_at as string) || '')
    if (Number.isNaN(start.getTime())) return false
    const duration = Number(booking.duration_minutes) || 60
    const end = booking.end_time_utc
      ? new Date(String(booking.end_time_utc))
      : new Date(start.getTime() + duration * 60 * 1000)
    const bufferedStart = new Date(start.getTime() - bufferMinutes * 60 * 1000)
    const bufferedEnd = new Date(end.getTime() + bufferMinutes * 60 * 1000)
    return startUtc < bufferedEnd && endUtc > bufferedStart
  })
}

export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()
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

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'confirmed')
  if (!transition.ok) {
    return { success: false, error: 'Este agendamento nao pode ser confirmado no estado atual.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation'])
    .select('id')
    .maybeSingle()

  if ((!updatedBooking || error) && adminSupabase) {
    ;({ data: updatedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .in('status', ['pending', 'pending_confirmation'])
      .select('id')
      .maybeSingle())
  }

  if (error || !updatedBooking) {
    return { success: false, error: 'Erro ao confirmar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
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
        error: parsedReason.error.issues[0]?.message || 'Motivo de cancelamento invalido.',
      }
    }
    normalizedReason = parsedReason.data
  }

  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }

  const isBookingUser = booking.user_id === user.id
  const isBookingProfessional = professionalId ? booking.professional_id === professionalId : false
  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Voce nao tem permissao para cancelar este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'cancelled')
  if (!transition.ok) return { success: false, error: 'Este agendamento nao pode ser cancelado.' }

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
  if ((!cancelledBooking || error) && adminSupabase) {
    let adminQuery = adminSupabase
      .from('bookings')
      .update(updateData)
      .eq('id', safeBookingId)
      .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    if (isBookingUser) adminQuery = adminQuery.eq('user_id', user.id)
    else if (professionalId) adminQuery = adminQuery.eq('professional_id', professionalId)
    ;({ data: cancelledBooking, error } = await adminQuery.select('id').maybeSingle())
  }

  if (error || !cancelledBooking) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, adminSupabase, safeBookingId, refundDecision.refundPercentage)
  revalidatePath('/agenda')
  return { success: true }
}

export async function rescheduleBooking(
  bookingId: string,
  newScheduledAt: string,
): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedScheduledAt = scheduledAtSchema.safeParse(newScheduledAt)
  if (!parsedScheduledAt.success) {
    return { success: false, error: parsedScheduledAt.error.issues[0]?.message || 'Horario invalido.' }
  }

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, duration_minutes, booking_type, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }
  if (booking.user_id !== user.id) {
    return { success: false, error: 'Apenas o cliente pode remarcar este agendamento.' }
  }

  if (booking.booking_type === 'recurring_parent') {
    return { success: false, error: 'Remarcacao de pacote recorrente ainda nao esta disponivel.' }
  }

  if (!['pending', 'pending_confirmation', 'confirmed'].includes(booking.status)) {
    return { success: false, error: 'Este agendamento nao pode ser remarcado.' }
  }

  const hoursUntilCurrentSession = getHoursUntilSession(booking.scheduled_at)
  if (hoursUntilCurrentSession < 24) {
    return {
      success: false,
      error: 'Remarcacoes so sao permitidas com no minimo 24 horas de antecedencia.',
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

  if (!professional) return { success: false, error: 'Profissional nao encontrado.' }

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
    return { success: false, error: 'Horario invalido.' }
  }
  if (Number.isNaN(scheduledDate.getTime())) return { success: false, error: 'Horario invalido.' }

  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (scheduledDate.getTime() < minimumStartTime) {
    return {
      success: false,
      error: `Selecione um horario com pelo menos ${settings.minimumNoticeHours} horas de antecedencia.`,
    }
  }

  const maximumDate = new Date()
  maximumDate.setDate(maximumDate.getDate() + settings.maxBookingWindowDays)
  if (scheduledDate.getTime() > maximumDate.getTime()) {
    return {
      success: false,
      error: `Remarcacoes devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
    }
  }

  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000)
  const rules = await loadAvailabilityRules(supabase, professional.id, settings.timezone)
  const fitsAvailability = isSlotWithinWorkingHours(scheduledDate, endDate, settings, rules)
  if (!fitsAvailability) {
    return { success: false, error: 'Este horario nao esta disponivel para este profissional.' }
  }

  const allowedByException = await isSlotAllowedByExceptions(
    supabase,
    professional.id,
    settings.timezone,
    scheduledDate,
    endDate,
  )
  if (!allowedByException) return { success: false, error: 'Este horario nao esta disponivel.' }

  const hasConflict = await hasInternalBookingConflict(
    supabase,
    professional.id,
    scheduledDate,
    endDate,
    settings.bufferMinutes,
    booking.id,
  )
  if (hasConflict) return { success: false, error: 'Este horario ja esta reservado. Escolha outro.' }

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
          ? 'Outro cliente acabou de selecionar este horario. Escolha outro.'
          : 'Nao foi possivel bloquear o horario para remarcacao.',
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

  await releaseSlotLock(supabase, slotLock.lockId)

  if (updateError) {
    return { success: false, error: 'Erro ao remarcar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function addSessionLink(bookingId: string, link: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedLink = sessionLinkSchema.safeParse(link)
  if (!parsedLink.success) {
    return { success: false, error: parsedLink.error.issues[0]?.message || 'Link da sessao invalido.' }
  }

  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessao.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessao.' }
  }
  if (!['confirmed', 'pending', 'pending_confirmation'].includes(booking.status)) {
    return { success: false, error: 'Nao e possivel adicionar link a este agendamento.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ session_link: parsedLink.data })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .select('id')
    .maybeSingle()

  if ((!updatedBooking || error) && adminSupabase) {
    ;({ data: updatedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ session_link: parsedLink.data })
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .in('status', ['pending', 'pending_confirmation', 'confirmed'])
      .select('id')
      .maybeSingle())
  }

  if (error || !updatedBooking) return { success: false, error: 'Erro ao salvar o link. Tente novamente.' }

  revalidatePath('/agenda')
  return { success: true }
}

export async function completeBooking(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, scheduled_at, duration_minutes')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'completed')
  if (!transition.ok) {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser concluidos.' }
  }

  const sessionEnd = new Date(booking.scheduled_at).getTime() + (booking.duration_minutes || 0) * 60 * 1000
  if (Date.now() < sessionEnd) {
    return { success: false, error: 'A sessao so pode ser concluida apos o horario previsto de termino.' }
  }

  let { data: completedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if ((!completedBooking || error) && adminSupabase) {
    ;({ data: completedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .eq('status', 'confirmed')
      .select('id')
      .maybeSingle())
  }

  if (error || !completedBooking) {
    return { success: false, error: 'Erro ao concluir agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function reportProfessionalNoShow(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, adminSupabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, metadata')
    .eq('id', safeBookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }
  if (booking.user_id !== user.id) {
    return { success: false, error: 'Apenas o cliente pode reportar no-show do profissional.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessoes confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessao ainda nao iniciou.' }
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

  if ((!updated || error) && adminSupabase) {
    ;({ data: updated, error } = await adminSupabase
      .from('bookings')
      .update(patch)
      .eq('id', safeBookingId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .select('id')
      .maybeSingle())
  }

  if (error || !updated) {
    return { success: false, error: 'Nao foi possivel registrar no-show. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, adminSupabase, safeBookingId, 100)

  if (adminSupabase) {
    await adminSupabase.from('notifications').insert({
      user_id: null,
      booking_id: safeBookingId,
      type: 'ops.professional_no_show',
      title: 'No-show reportado para profissional',
      body: 'Um cliente reportou ausencia do profissional. Revisao manual recomendada.',
      payload: {
        booking_id: safeBookingId,
        professional_id: booking.professional_id,
      },
    })
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function markUserNoShow(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()
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

  if (!booking) return { success: false, error: 'Agendamento nao encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode marcar no-show do cliente.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessoes confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessao ainda nao iniciou.' }
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

  if ((!updated || error) && adminSupabase) {
    ;({ data: updated, error } = await adminSupabase
      .from('bookings')
      .update(patch)
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .eq('status', 'confirmed')
      .select('id')
      .maybeSingle())
  }

  if (error || !updated) {
    return { success: false, error: 'Nao foi possivel registrar no-show. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}
