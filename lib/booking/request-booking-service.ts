import { fromZonedTime } from 'date-fns-tz'
import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { roundCurrency } from '@/lib/booking/cancellation-policy'
import { getExchangeRates } from '@/lib/exchange-rates'
import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import { createBookingWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { assertRequestBookingTransition } from '@/lib/booking/request-booking-state-machine'
import {
  createRequestSchema,
  offerRequestSchema,
  requestIdSchema,
  isActiveSlotCollision,
} from '@/lib/booking/request-validation'
import {
  REQUEST_BOOKING_FIELDS,
  toRequestBookingStatus,
  expireRequestIfNeeded,
} from '@/lib/booking/request-helpers'
import {
  professionalCanReceiveRequestBooking,
} from '@/lib/booking/request-eligibility'

export type RequestBookingResult =
  | { success: true; requestId: string }
  | { success: false; error: string; reasonCode?: string }

export type RequestBookingActionResult =
  | { success: true }
  | { success: false; error: string; reasonCode?: string }

const OFFER_EXPIRATION_HOURS = 24
const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'

export async function getRequestBookingDetailService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  requestId: string,
): Promise<
  | { success: true; data: unknown }
  | { success: false; error: string }
> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Solicitação inválida.' }
  }

  const { data: request, error } = await supabase
    .from('request_bookings')
    .select(REQUEST_BOOKING_FIELDS)
    .eq('id', parsed.data)
    .maybeSingle()

  if (error) {
    console.error('[request-booking/detail] failed to load request:', error.message)
    return { success: false, error: 'Erro ao carregar solicitação.' }
  }

  if (!request) {
    return { success: false, error: 'Solicitação não encontrada.' }
  }

  const req = request as Record<string, unknown>
  const isClient = req.user_id === userId
  let isProfessional = false
  if (!isClient && professionalId && req.professional_id === professionalId) {
    isProfessional = true
  }

  if (!isClient && !isProfessional) {
    return { success: false, error: 'Você não tem acesso a esta solicitação.' }
  }

  return { success: true, data: request }
}

export async function createRequestBookingService(
  supabase: SupabaseClient,
  userId: string,
  input: {
    professionalId: string
    preferredStartLocal: string
    durationMinutes?: number
    userMessage?: string
  },
): Promise<RequestBookingResult> {
  const parsed = createRequestSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Dados inválidos para solicitação.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, currency, timezone')
    .eq('id', userId)
    .single()

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, user_id, status, tier, first_booking_enabled, session_duration_minutes, profiles!professionals_user_id_fkey(timezone)',
    )
    .eq('id', parsed.data.professionalId)
    .single()

  if (!professional) return { success: false, error: 'Profissional não encontrado.' }
  if (professional.user_id === userId) {
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

  const { data: request, error: requestError } = await supabase
    .from('request_bookings')
    .insert({
      user_id: userId,
      professional_id: professional.id,
      status: 'open',
      preferred_start_utc: preferredStartUtc.toISOString(),
      preferred_end_utc: preferredEndUtc.toISOString(),
      user_timezone: userTimezone,
      user_message: parsed.data.userMessage || null,
    })
    .select('id')
    .single()

  if (requestError || !request) {
    console.error('[request-booking/create] insert failed:', requestError?.message)
    return { success: false, error: 'Não foi possível criar a solicitação. Tente novamente.' }
  }

  return { success: true, requestId: request.id }
}

export async function offerRequestBookingService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  requestId: string,
  input: {
    proposalStartLocal: string
    proposalDurationMinutes?: number
    proposalMessage?: string
  },
): Promise<RequestBookingActionResult> {
  if (!professionalId) return { success: false, error: 'Apenas profissionais podem enviar proposta.' }

  const parsedRequestId = requestIdSchema.safeParse(requestId)
  if (!parsedRequestId.success) {
    return { success: false, error: 'Solicitação inválida.' }
  }

  const parsedInput = offerRequestSchema.safeParse({ requestId: parsedRequestId.data, ...input })
  if (!parsedInput.success) {
    return {
      success: false,
      error: parsedInput.error.issues[0]?.message || 'Dados inválidos para proposta.',
    }
  }

  const { data: request } = await supabase
    .from('request_bookings')
    .select(REQUEST_BOOKING_FIELDS)
    .eq('id', parsedRequestId.data)
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
    parsedInput.data.proposalDurationMinutes || settings.sessionDurationMinutes || professional.session_duration_minutes

  let proposalStartUtc: Date
  try {
    proposalStartUtc = fromZonedTime(parsedInput.data.proposalStartLocal, settings.timezone)
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
      proposal_message: parsedInput.data.proposalMessage || null,
      proposal_expires_at: proposalExpiresAt,
      declined_at: null,
      cancelled_at: null,
      expired_at: null,
    })
    .eq('id', parsedRequestId.data)
    .eq('professional_id', professionalId)
    .eq('status', currentStatus)

  if (updateError) {
    return { success: false, error: 'Não foi possível enviar a proposta. Tente novamente.' }
  }

  return { success: true }
}

export async function declineRequestBookingByProfessionalService(
  supabase: SupabaseClient,
  _userId: string,
  professionalId: string | null,
  requestId: string,
  _reason?: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

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
  return { success: true }
}

export async function cancelRequestBookingByUserService(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('user_id', userId)
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
    .eq('user_id', userId)
    .eq('status', currentStatus)

  if (error) return { success: false, error: 'Não foi possível cancelar a solicitação.' }
  return { success: true }
}

export async function declineRequestBookingByUserService(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('user_id', userId)
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
    .eq('user_id', userId)
    .eq('status', currentStatus)

  if (error) return { success: false, error: 'Não foi possível recusar a proposta.' }
  return { success: true }
}

export async function acceptRequestBookingService(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
): Promise<
  { success: true; bookingId: string; professionalId: string } | { success: false; error: string; reasonCode?: string }
> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicitação inválida.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, currency, timezone')
    .eq('id', userId)
    .single()

  const { data: request } = await supabase
    .from('request_bookings')
    .select(REQUEST_BOOKING_FIELDS)
    .eq('id', parsed.data)
    .eq('user_id', userId)
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
  if (sessionPriceBrl <= 0) {
    console.error('[request-booking/accept] invalid session price for professional:', professional.id)
    return { success: false, error: 'Profissional não possui preço configurado para sessão.' }
  }
  const exchangeRates = await getExchangeRates(supabase)
  const sessionPriceUserCurrency = roundCurrency(sessionPriceBrl * (exchangeRates[userCurrency] || 1))
  const bookingStatus = settings.confirmationMode === 'manual' ? 'pending_confirmation' : 'confirmed'
  const confirmationDeadlineAt =
    settings.confirmationMode === 'manual'
      ? new Date(Date.now() + OFFER_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString()
      : null

  const cancellationPolicySnapshot = {
    code: settings.cancellationPolicyCode,
    refund_48h_or_more: 100,
    refund_24h_to_48h: 50,
    refund_under_24h: 0,
  }

  const bookingMetadata = {
    booking_source: 'request_booking_accept',
    request_booking_id: freshRequest.id,
    confirmation_deadline_utc: confirmationDeadlineAt,
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

  const bookingPayload = {
    user_id: userId,
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
    cancellation_policy_snapshot: cancellationPolicySnapshot,
    price_brl: sessionPriceBrl,
    price_user_currency: sessionPriceUserCurrency,
    price_total: sessionPriceUserCurrency,
    user_currency: userCurrency,
    notes: freshRequest.user_message || null,
    session_purpose: freshRequest.user_message || null,
    metadata: bookingMetadata,
  }

  const paymentData = {
    provider: 'legacy' as const,
    amount_total: sessionPriceUserCurrency,
    currency: userCurrency,
    status: 'captured' as const,
    metadata: paymentMetadata,
    captured_at: new Date().toISOString(),
  }

  let bookingId: string
  let usedAtomicPath = false

  const atomic = await createBookingWithPaymentAtomic(supabase, bookingPayload, paymentData)
  if (atomic.ok) {
    bookingId = atomic.bookingId!
    usedAtomicPath = true
    Sentry.captureMessage('request_booking_accept_atomic_success', {
      level: 'info',
      tags: { area: 'request_booking_accept', flow: 'atomic' },
      extra: { requestBookingId: freshRequest.id, bookingId, usedAtomicPath },
    })
  } else if (atomic.fallback) {
    Sentry.captureMessage('request_booking_accept_atomic_fallback', {
      level: 'info',
      tags: { area: 'request_booking_accept', flow: 'atomic_fallback' },
      extra: { requestBookingId: freshRequest.id, reason: atomic.error?.message },
    })

    const { data: booking, error: bookingInsertError } = await supabase
      .from('bookings')
      .insert(bookingPayload)
      .select('id')
      .single()

    if (bookingInsertError || !booking) {
      if (isActiveSlotCollision(bookingInsertError, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
        return { success: false, error: 'Outro agendamento ocupou este horario. Solicite nova proposta.' }
      }
      return { success: false, error: 'Não foi possível converter a proposta em agendamento.' }
    }

    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: booking.id,
      user_id: userId,
      professional_id: professional.id,
      provider: paymentData.provider,
      amount_total: paymentData.amount_total,
      currency: paymentData.currency,
      status: paymentData.status,
      metadata: paymentData.metadata,
      captured_at: paymentData.captured_at,
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
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          metadata: {
            cancelled_reason: 'payment_capture_failed',
            request_booking_id: freshRequest.id,
          },
        })
        .eq('id', booking.id)

      if (cancelError) {
        Sentry.captureException(cancelError, {
          tags: { area: 'request_booking_accept', flow: 'rollback' },
          extra: {
            requestBookingId: freshRequest.id,
            bookingId: booking.id,
            reason: 'booking_cancellation_failed_after_payment_error',
          },
        })
      }

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
      const { error: recoveryError } = await supabase
        .from('request_bookings')
        .update(requestRecoveryPatch)
        .eq('id', String(freshRequest.id))
        .eq('user_id', userId)
        .eq('status', currentStatus)

      if (recoveryError) {
        Sentry.captureException(recoveryError, {
          tags: { area: 'request_booking_accept', flow: 'rollback' },
          extra: {
            requestBookingId: freshRequest.id,
            bookingId: booking.id,
            reason: 'request_booking_recovery_failed_after_payment_error',
          },
        })
      }

      return {
        success: false,
        error: 'Falha ao processar pagamento da proposta. A solicitação foi reaberta para nova proposta.',
      }
    }

    bookingId = booking.id
  } else {
    Sentry.captureException(atomic.error, {
      tags: { area: 'request_booking_accept', flow: 'atomic' },
      extra: { requestBookingId: freshRequest.id },
    })
    if (isActiveSlotCollision(atomic.error, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) {
      return { success: false, error: 'Outro agendamento ocupou este horario. Solicite nova proposta.' }
    }
    return { success: false, error: 'Não foi possível converter a proposta em agendamento.' }
  }

  const { error: requestUpdateError } = await supabase
    .from('request_bookings')
    .update({
      status: 'converted',
      accepted_at: new Date().toISOString(),
      converted_booking_id: bookingId,
      proposal_expires_at: null,
    })
    .eq('id', String(freshRequest.id))
    .eq('user_id', userId)
    .eq('status', currentStatus)

  if (requestUpdateError) {
    console.error('[request-booking/accept] failed to mark request as converted:', requestUpdateError.message)
    Sentry.captureException(requestUpdateError, {
      tags: { area: 'request_booking_accept', flow: 'request_update' },
      extra: { requestBookingId: freshRequest.id, bookingId },
    })
  }

  await enqueueBookingCalendarSync({
    bookingId: bookingId,
    action: 'upsert_booking',
    source: 'request-booking.accept',
  })

  return { success: true, bookingId: bookingId, professionalId: professional.id }
}
