import * as Sentry from '@sentry/nextjs'
import { parseBookingSlot } from '@/lib/booking/slot-parsing'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  extractProfessionalTimezone,
  loadProfessionalSettings,
} from '@/lib/booking/settings'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'
import { assertRequestBookingTransition } from '@/lib/booking/request-booking-state-machine'
import {
  createRequestSchema,
  offerRequestSchema,
  requestIdSchema,
} from '@/lib/booking/request-validation'
import {
  REQUEST_BOOKING_FIELDS,
  toRequestBookingStatus,
  expireRequestIfNeeded,
} from '@/lib/booking/request-helpers'
import {
  professionalCanReceiveRequestBooking,
} from '@/lib/booking/request-eligibility'
import type { RequestBookingResult, RequestBookingActionResult } from '@/lib/booking/types'

export type { RequestBookingResult, RequestBookingActionResult }
export { acceptRequestBookingService } from '@/lib/booking/request-booking/accept-request'

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
    Sentry.captureException(error, { tags: { area: 'request_booking_detail' }, extra: { requestBookingId: parsed.data } })
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

  const professionalTimezoneFallback = extractProfessionalTimezone(professional)
  const settings = await loadProfessionalSettings(supabase, professional.id, professionalTimezoneFallback)

  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const durationMinutes =
    parsed.data.durationMinutes || settings.sessionDurationMinutes || professional.session_duration_minutes || 60

  const parsedSlot = parseBookingSlot(parsed.data.preferredStartLocal, userTimezone, durationMinutes)
  if (!parsedSlot.ok) {
    return { success: false, error: parsedSlot.error }
  }
  const { startUtc: preferredStartUtc, endUtc: preferredEndUtc } = parsedSlot.slot

  const validation = await validateSlotAvailability({
    supabase,
    professionalId: professional.id,
    startUtc: preferredStartUtc,
    endUtc: preferredEndUtc,
    timezone: settings.timezone,
    bufferMinutes: settings.bufferMinutes,
    minimumNoticeHours: settings.minimumNoticeHours,
    maxBookingWindowDays: settings.maxBookingWindowDays,
    errorMessages: {
      minimumNotice: `Selecione um horário com pelo menos ${settings.minimumNoticeHours} horas de antecedência.`,
      maxWindow: `Solicitacoes devem estar dentro de ${settings.maxBookingWindowDays} dias.`,
      workingHours: 'Horário não está disponível para este profissional.',
      exception: 'Horário bloqueado por indisponibilidade excepcional.',
      internalConflict: 'Horário já está reservado. Escolha outro.',
      externalConflict: 'Horário conflita com agenda externa conectada do profissional.',
    },
  })
  if (!validation.valid) {
    return { success: false, error: validation.error! }
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
    Sentry.captureException(requestError || new Error('request-booking/create insert failed'), {
      tags: { area: 'request_booking_create', flow: 'insert' },
      extra: { professionalId: professional.id, userId },
    })
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

  const professionalTimezoneFallback = extractProfessionalTimezone(professional)
  const settings = await loadProfessionalSettings(supabase, professional.id, professionalTimezoneFallback)

  const durationMinutes =
    parsedInput.data.proposalDurationMinutes || settings.sessionDurationMinutes || professional.session_duration_minutes

  const parsedSlot = parseBookingSlot(parsedInput.data.proposalStartLocal, settings.timezone, durationMinutes)
  if (!parsedSlot.ok) {
    return { success: false, error: parsedSlot.error }
  }
  const { startUtc: proposalStartUtc, endUtc: proposalEndUtc } = parsedSlot.slot

  const validation = await validateSlotAvailability({
    supabase,
    professionalId: professional.id,
    startUtc: proposalStartUtc,
    endUtc: proposalEndUtc,
    timezone: settings.timezone,
    bufferMinutes: settings.bufferMinutes,
    minimumNoticeHours: settings.minimumNoticeHours,
    maxBookingWindowDays: settings.maxBookingWindowDays,
    errorMessages: {
      minimumNotice: `Proposta deve respeitar mínimo de ${settings.minimumNoticeHours}h de antecedência.`,
      maxWindow: `Proposta deve estar dentro de ${settings.maxBookingWindowDays} dias.`,
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

