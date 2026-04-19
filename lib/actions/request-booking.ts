'use server'

import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import { roundCurrency } from '@/lib/booking/cancellation-policy'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getExchangeRates } from '@/lib/exchange-rates'
import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import {
  assertRequestBookingTransition,
} from '@/lib/booking/request-booking-state-machine'
import {
  createRequestSchema,
  offerRequestSchema,
  requestIdSchema,
  isActiveSlotCollision,
  getMinutesInTimezone,
} from '@/lib/booking/request-validation'
import {
  REQUEST_BOOKING_FIELDS,
  REQUEST_BOOKING_STATUS_SET,
  toRequestBookingStatus,
  expireRequestIfNeeded,
} from '@/lib/booking/request-helpers'
import {
  REQUEST_BOOKING_ALLOWED_TIERS,
  professionalCanReceiveRequestBooking,
} from '@/lib/booking/request-eligibility'

type RequestBookingResult =
  | { success: true; requestId: string }
  | { success: false; error: string; reasonCode?: string }

type RequestBookingActionResult =
  | { success: true }
  | { success: false; error: string; reasonCode?: string }

const OFFER_EXPIRATION_HOURS = 24
const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, currency, timezone')
    .eq('id', user.id)
    .single()

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  return {
    supabase,
    user,
    profile,
    professionalId: professional?.id ?? null,
  }
}

export async function createRequestBooking(input: {
  professionalId: string
  preferredStartLocal: string
  durationMinutes?: number
  userMessage?: string
}): Promise<RequestBookingResult> {
  const parsed = createRequestSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Dados inválidos para solicitação.',
    }
  }

  const { supabase, user, profile } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, user_id, status, tier, first_booking_enabled, session_duration_minutes, profiles!professionals_user_id_fkey(timezone)',
    )
    .eq('id', parsed.data.professionalId)
    .single()

  if (!professional) return { success: false, error: 'Profissional não encontrado.' }
  if (professional.user_id === user.id) {
    return { success: false, error: 'Não é permitido solicitar horário para seu próprio perfil.' }
  }

  const requestBookingEligibility = await professionalCanReceiveRequestBooking(supabase, professional)
  if (!requestBookingEligibility.ok) {
    return {
      success: false,
      error: requestBookingEligibility.error,
      reasonCode: requestBookingEligibility.reasonCode,
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
      'timezone, session_duration_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose, buffer_minutes',
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const settings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const durationMinutes =
    parsed.data.durationMinutes || settings.sessionDurationMinutes || professional.session_duration_minutes || 60

  let preferredStartUtc: Date
  try {
    preferredStartUtc = fromZonedTime(parsed.data.preferredStartLocal, userTimezone)
  } catch {
    return { success: false, error: 'Horário preferencial inválido.' }
  }

  if (Number.isNaN(preferredStartUtc.getTime())) {
    return { success: false, error: 'Horário preferencial inválido.' }
  }

  const preferredEndUtc = new Date(preferredStartUtc.getTime() + durationMinutes * 60 * 1000)
  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (preferredStartUtc.getTime() < minimumStartTime) {
    return {
      success: false,
      error: `Selecione um horário com pelo menos ${settings.minimumNoticeHours} horas de antecedência.`,
    }
  }

  const maximumDate = new Date()
  maximumDate.setDate(maximumDate.getDate() + settings.maxBookingWindowDays)
  if (preferredStartUtc.getTime() > maximumDate.getTime()) {
    return {
      success: false,
      error: `Solicitacoes devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
    }
  }

  const { data: request } = await supabase
    .from('request_bookings')
    .insert({
      user_id: user.id,
      professional_id: professional.id,
      status: 'open',
      preferred_start_utc: preferredStartUtc.toISOString(),
      preferred_end_utc: preferredEndUtc.toISOString(),
      user_timezone: userTimezone,
      user_message: parsed.data.userMessage || null,
    })
    .select('id')
    .single()

  if (!request) {
    return { success: false, error: 'Não foi possível criar a solicitação. Tente novamente.' }
  }

  revalidatePath('/agenda')
  revalidatePath(`/profissional/${professional.id}`)
  return { success: true, requestId: request.id }
}

export async function offerRequestBooking(input: {
  requestId: string
  proposalStartLocal: string
  proposalDurationMinutes?: number
  proposalMessage?: string
}): Promise<RequestBookingActionResult> {
  const parsed = offerRequestSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Dados inválidos para proposta.',
    }
  }

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
  if (!professionalId) return { success: false, error: 'Apenas profissionais podem enviar proposta.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select(REQUEST_BOOKING_FIELDS)
    .eq('id', parsed.data.requestId)
    .eq('professional_id', professionalId)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada.' }

  const freshRequest = await expireRequestIfNeeded(
    supabase,
    request as unknown as Record<string, unknown>,
  )
  if (freshRequest.status === 'expired') {
    return { success: false, error: 'Esta solicitação expirou e precisa ser recriada pelo usuário.' }
  }
  if (!['open', 'offered'].includes(String(freshRequest.status))) {
    return { success: false, error: 'Esta solicitação não pode receber nova proposta.' }
  }
  const currentStatus = toRequestBookingStatus(freshRequest.status)
  if (!currentStatus) {
    return { success: false, error: 'Estado atual da solicitação inválido.' }
  }
  const transitionToOffered = assertRequestBookingTransition(currentStatus, 'offered')
  if (!transitionToOffered.ok) {
    return { success: false, error: transitionToOffered.reason }
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, status, tier, first_booking_enabled, session_duration_minutes, profiles!professionals_user_id_fkey(timezone)',
    )
    .eq('id', professionalId)
    .single()

  if (!professional) return { success: false, error: 'Profissional não encontrado.' }
  const requestBookingEligibility = await professionalCanReceiveRequestBooking(supabase, professional)
  if (!requestBookingEligibility.ok) {
    return {
      success: false,
      error: requestBookingEligibility.error,
      reasonCode: requestBookingEligibility.reasonCode,
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
      'timezone, session_duration_minutes, minimum_notice_hours, max_booking_window_days, buffer_minutes, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const settings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  const durationMinutes =
    parsed.data.proposalDurationMinutes || settings.sessionDurationMinutes || professional.session_duration_minutes

  let proposalStartUtc: Date
  try {
    proposalStartUtc = fromZonedTime(parsed.data.proposalStartLocal, settings.timezone)
  } catch {
    return { success: false, error: 'Horário proposto inválido.' }
  }
  if (Number.isNaN(proposalStartUtc.getTime())) {
    return { success: false, error: 'Horário proposto inválido.' }
  }
  const proposalEndUtc = new Date(proposalStartUtc.getTime() + durationMinutes * 60 * 1000)

  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (proposalStartUtc.getTime() < minimumStartTime) {
    return {
      success: false,
      error: `Proposta deve respeitar mínimo de ${settings.minimumNoticeHours}h de antecedência.`,
    }
  }
  const maximumDate = new Date()
  maximumDate.setDate(maximumDate.getDate() + settings.maxBookingWindowDays)
  if (proposalStartUtc.getTime() > maximumDate.getTime()) {
    return {
      success: false,
      error: `Proposta deve estar dentro de ${settings.maxBookingWindowDays} dias.`,
    }
  }

  const validation = await validateSlotAvailability({
    supabase,
    professionalId: professional.id,
    startUtc: proposalStartUtc,
    endUtc: proposalEndUtc,
    timezone: settings.timezone,
    bufferMinutes: settings.bufferMinutes,
    errorMessages: {
      workingHours: 'Horário fora da disponibilidade configurada.',
      exception: 'Horário bloqueado por indisponibilidade excepcional.',
      internalConflict: 'Horário indisponível por conflito com outro agendamento.',
      externalConflict: 'Horário proposto conflita com agenda externa conectada do profissional.',
    },
  })
  if (!validation.valid) {
    return { success: false, error: validation.error! }
  }

  const proposalExpiresAt = new Date(
    Date.now() + OFFER_EXPIRATION_HOURS * 60 * 60 * 1000,
  ).toISOString()

  const { error: updateError } = await supabase
    .from('request_bookings')
    .update({
      status: 'offered',
      proposal_start_utc: proposalStartUtc.toISOString(),
      proposal_end_utc: proposalEndUtc.toISOString(),
      proposal_timezone: settings.timezone,
      proposal_message: parsed.data.proposalMessage || null,
      proposal_expires_at: proposalExpiresAt,
      declined_at: null,
      cancelled_at: null,
      expired_at: null,
    })
    .eq('id', parsed.data.requestId)
    .eq('professional_id', professionalId)
    .eq('status', currentStatus)

  if (updateError) {
    return { success: false, error: 'Não foi possível enviar a proposta. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function declineRequestBookingByProfessional(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
  if (!professionalId) return { success: false, error: 'Apenas profissionais podem recusar solicitacoes.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('professional_id', professionalId)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada.' }
  if (!['open', 'offered'].includes(String(request.status))) {
    return { success: false, error: 'Esta solicitação não pode ser recusada no estado atual.' }
  }
  const currentStatus = toRequestBookingStatus(request.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicitação inválido.' }
  const transitionToDeclined = assertRequestBookingTransition(currentStatus, 'declined')
  if (!transitionToDeclined.ok) return { success: false, error: transitionToDeclined.reason }

  const { error } = await supabase
    .from('request_bookings')
    .update({
      status: 'declined',
      declined_at: new Date().toISOString(),
      proposal_expires_at: null,
    })
    .eq('id', parsed.data)
    .eq('professional_id', professionalId)
    .eq('status', currentStatus)

  if (error) return { success: false, error: 'Não foi possível recusar a solicitação.' }
  revalidatePath('/agenda')
  return { success: true }
}

export async function cancelRequestBookingByUser(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada.' }
  if (!['open', 'offered'].includes(String(request.status))) {
    return { success: false, error: 'Esta solicitação não pode ser cancelada no estado atual.' }
  }
  const currentStatus = toRequestBookingStatus(request.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicitação inválido.' }
  const transitionToCancelled = assertRequestBookingTransition(currentStatus, 'cancelled')
  if (!transitionToCancelled.ok) return { success: false, error: transitionToCancelled.reason }

  const { error } = await supabase
    .from('request_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      proposal_expires_at: null,
    })
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .eq('status', currentStatus)

  if (error) return { success: false, error: 'Não foi possível cancelar a solicitação.' }
  revalidatePath('/agenda')
  return { success: true }
}

export async function declineRequestBookingByUser(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada.' }
  if (request.status !== 'offered') {
    return { success: false, error: 'Apenas propostas recebidas podem ser recusadas.' }
  }
  const currentStatus = toRequestBookingStatus(request.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicitação inválido.' }
  const transitionToDeclined = assertRequestBookingTransition(currentStatus, 'declined')
  if (!transitionToDeclined.ok) return { success: false, error: transitionToDeclined.reason }

  const { error } = await supabase
    .from('request_bookings')
    .update({
      status: 'declined',
      declined_at: new Date().toISOString(),
      proposal_expires_at: null,
    })
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .eq('status', currentStatus)

  if (error) return { success: false, error: 'Não foi possível recusar a proposta.' }
  revalidatePath('/agenda')
  return { success: true }
}

export async function acceptRequestBooking(
  requestId: string,
): Promise<
  { success: true; bookingId: string } | { success: false; error: string; reasonCode?: string }
> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { supabase, user, profile } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select(REQUEST_BOOKING_FIELDS)
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada.' }

  const freshRequest = await expireRequestIfNeeded(
    supabase,
    request as unknown as Record<string, unknown>,
  )
  if (freshRequest.status === 'expired') {
    return { success: false, error: 'A proposta expirou. Solicite um novo horário.' }
  }
  if (freshRequest.status !== 'offered') {
    return { success: false, error: 'Esta solicitação não possui proposta ativa para aceitar.' }
  }
  const currentStatus = toRequestBookingStatus(freshRequest.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicitação inválido.' }
  const transitionToConverted = assertRequestBookingTransition(currentStatus, 'converted')
  if (!transitionToConverted.ok) return { success: false, error: transitionToConverted.reason }

  if (
    !freshRequest.proposal_start_utc ||
    !freshRequest.proposal_end_utc ||
    !freshRequest.proposal_timezone
  ) {
    return { success: false, error: 'Proposta incompleta. Solicite nova proposta ao profissional.' }
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, user_id, status, tier, first_booking_enabled, session_price_brl, session_duration_minutes, profiles!professionals_user_id_fkey(timezone)',
    )
    .eq('id', String(freshRequest.professional_id))
    .single()

  if (!professional) return { success: false, error: 'Profissional não encontrado.' }
  const requestBookingEligibility = await professionalCanReceiveRequestBooking(supabase, professional)
  if (!requestBookingEligibility.ok) {
    return {
      success: false,
      error: requestBookingEligibility.error,
      reasonCode: requestBookingEligibility.reasonCode,
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
      'timezone, session_duration_minutes, minimum_notice_hours, max_booking_window_days, confirmation_mode, cancellation_policy_code, require_session_purpose, buffer_minutes, enable_recurring',
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const settings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  const startUtc = new Date(String(freshRequest.proposal_start_utc))
  const endUtc = new Date(String(freshRequest.proposal_end_utc))
  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()) || startUtc >= endUtc) {
    return { success: false, error: 'Horário proposto inválido.' }
  }

  const validation = await validateSlotAvailability({
    supabase,
    professionalId: professional.id,
    startUtc,
    endUtc,
    timezone: settings.timezone,
    bufferMinutes: settings.bufferMinutes,
    minimumNoticeHours: settings.minimumNoticeHours,
    maxBookingWindowDays: settings.maxBookingWindowDays,
    errorMessages: {
      minimumNotice: 'A proposta venceu a janela mínima de antecedência.',
      maxWindow: 'A proposta saiu da janela máxima de agendamento.',
      workingHours: 'O horário proposto não está mais disponível.',
      exception: 'Horário bloqueado por indisponibilidade excepcional.',
      internalConflict: 'Outro agendamento ocupou este horário. Solicite nova proposta.',
      externalConflict: 'A proposta conflita com agenda externa do profissional. Solicite novo horário.',
    },
  })
  if (!validation.valid) {
    return { success: false, error: validation.error! }
  }

  const userCurrency = profile?.currency || 'BRL'
  const sessionPriceBrl = Number(professional.session_price_brl) || 0
  const exchangeRates = await getExchangeRates(supabase)
  const sessionPriceUserCurrency = roundCurrency(sessionPriceBrl * (exchangeRates[userCurrency] || 1))
  const bookingStatus = settings.confirmationMode === 'manual' ? 'pending_confirmation' : 'confirmed'
  const confirmationDeadlineAt =
    settings.confirmationMode === 'manual'
      ? new Date(Date.now() + OFFER_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString()
      : null

  const { data: booking, error: bookingInsertError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      professional_id: professional.id,
      scheduled_at: startUtc.toISOString(),
      start_time_utc: startUtc.toISOString(),
      end_time_utc: endUtc.toISOString(),
      timezone_user: freshRequest.user_timezone,
      timezone_professional: settings.timezone,
      duration_minutes: Math.max(15, Math.round((endUtc.getTime() - startUtc.getTime()) / 60000)),
      status: bookingStatus,
      booking_type: 'one_off',
      confirmation_mode_snapshot: settings.confirmationMode,
      cancellation_policy_snapshot: {
        code: settings.cancellationPolicyCode,
        refund_48h_or_more: 100,
        refund_24h_to_48h: 50,
        refund_under_24h: 0,
      },
      price_brl: sessionPriceBrl,
      price_user_currency: sessionPriceUserCurrency,
      price_total: sessionPriceUserCurrency,
      user_currency: userCurrency,
      notes: freshRequest.user_message || null,
      session_purpose: freshRequest.user_message || null,
      metadata: {
        booking_source: 'request_booking_accept',
        request_booking_id: freshRequest.id,
        confirmation_deadline_utc: confirmationDeadlineAt,
      },
    })
    .select('id')
    .single()

  if (bookingInsertError || !booking) {
    if (isActiveSlotCollision(bookingInsertError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
      return { success: false, error: 'Outro agendamento ocupou este horario. Solicite nova proposta.' }
    }
    return { success: false, error: 'Não foi possível converter a proposta em agendamento.' }
  }

  const paymentMetadata = {
    capturedBy: 'request_booking_accept_flow',
    request_booking_id: freshRequest.id,
    confirmationMode: settings.confirmationMode,
  }

  try {
    assertNoSensitivePaymentPayload(paymentMetadata, 'payments.metadata.acceptRequestBooking')
  } catch (error) {
    console.error('[request-booking] blocked sensitive payment metadata', error)
    return {
      success: false,
      error: 'Não foi possível processar a proposta neste momento.',
    }
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    booking_id: booking.id,
    user_id: user.id,
    professional_id: professional.id,
    provider: 'legacy',
    amount_total: sessionPriceUserCurrency,
    currency: userCurrency,
    status: 'captured',
    metadata: paymentMetadata,
    captured_at: new Date().toISOString(),
  })

  if (paymentError) {
    Sentry.captureException(paymentError, {
      tags: { area: 'request_booking_accept', flow: 'payment' },
      extra: {
        requestBookingId: freshRequest.id,
        bookingId: booking.id,
        professionalId: professional.id,
      },
    })
    Sentry.captureMessage('request_booking_payment_record_failed', {
      level: 'error',
      tags: { area: 'request_booking_accept', flow: 'payment' },
      extra: {
        requestBookingId: freshRequest.id,
        bookingId: booking.id,
      },
    })
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        metadata: {
          cancelled_reason: 'payment_capture_failed',
          request_booking_id: freshRequest.id,
        },
      })
      .eq('id', booking.id)

    const requestRecoveryPatch = {
      status: 'open',
      proposal_start_utc: null,
      proposal_end_utc: null,
      proposal_timezone: null,
      proposal_message: null,
      proposal_expires_at: null,
      converted_booking_id: null,
      accepted_at: null,
      updated_at: new Date().toISOString(),
    }
    const { error: requestRecoveryError } = await supabase
      .from('request_bookings')
      .update(requestRecoveryPatch)
      .eq('id', String(freshRequest.id))
      .eq('user_id', user.id)
      .eq('status', currentStatus)



    return {
      success: false,
      error: 'Falha ao processar pagamento da proposta. A solicitação foi reaberta para nova proposta.',
    }
  }

  const { error: requestUpdateError } = await supabase
    .from('request_bookings')
    .update({
      status: 'converted',
      accepted_at: new Date().toISOString(),
      converted_booking_id: booking.id,
      proposal_expires_at: null,
    })
    .eq('id', String(freshRequest.id))
    .eq('user_id', user.id)
    .eq('status', currentStatus)



  await enqueueBookingCalendarSync({
    bookingId: booking.id,
    action: 'upsert_booking',
    source: 'request-booking.accept',
  })
  revalidatePath('/agenda')
  revalidatePath(`/profissional/${professional.id}`)
  return { success: true, bookingId: booking.id }
}
