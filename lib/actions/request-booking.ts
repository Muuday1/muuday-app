'use server'

import { z } from 'zod'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/security/rate-limit'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import { roundCurrency } from '@/lib/booking/cancellation-policy'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getExchangeRates } from '@/lib/exchange-rates'
import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import { hasExternalBusyConflict } from '@/lib/booking/external-calendar-conflicts'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import {
  REQUEST_BOOKING_STATUSES,
  assertRequestBookingTransition,
  type RequestBookingStatus,
} from '@/lib/booking/request-booking-state-machine'

type RequestBookingResult =
  | { success: true; requestId: string }
  | { success: false; error: string; reasonCode?: string }

type RequestBookingActionResult =
  | { success: true }
  | { success: false; error: string; reasonCode?: string }

const REQUEST_BOOKING_ALLOWED_TIERS = ['professional', 'premium']
const OFFER_EXPIRATION_HOURS = 24
const REQUEST_BOOKING_STATUS_SET = new Set<string>(REQUEST_BOOKING_STATUSES)
const ACTIVE_BOOKING_SLOT_UNIQUE_INDEX = 'bookings_unique_active_professional_start_idx'
const REQUEST_BOOKING_FIELDS =
  'id,user_id,professional_id,status,preferred_start_utc,preferred_end_utc,user_timezone,user_message,proposal_start_utc,proposal_end_utc,proposal_timezone,proposal_message,proposal_expires_at,declined_at,cancelled_at,expired_at,created_at,updated_at'

type PostgrestLikeError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

function isValidIsoLocalDateTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return false

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute
  )
}

const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Horario preferencial invalido.')
  .refine(isValidIsoLocalDateTime, 'Horario preferencial invalido.')

const createRequestSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inv?lido.'),
  preferredStartLocal: localDateTimeSchema,
  durationMinutes: z.number().int().min(15).max(240).optional(),
  userMessage: z.string().trim().max(1200, 'Mensagem muito longa.').optional(),
})

const offerRequestSchema = z.object({
  requestId: z.string().uuid('Solicita??o invalida.'),
  proposalStartLocal: localDateTimeSchema,
  proposalDurationMinutes: z.number().int().min(15).max(240).optional(),
  proposalMessage: z.string().trim().max(1200, 'Mensagem da proposta muito longa.').optional(),
})

const requestIdSchema = z.string().uuid('Solicita??o invalida.')

function hhmmToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function getMinutesInTimezone(date: Date, timezone: string) {
  return hhmmToMinutes(formatInTimeZone(date, timezone, 'HH:mm'))
}

function isUniqueConstraintError(error: unknown, constraintName: string) {
  const pgError = error as PostgrestLikeError | null
  if (!pgError || pgError.code !== '23505') return false
  const details = `${pgError.message || ''} ${pgError.details || ''} ${pgError.hint || ''}`
  return details.includes(constraintName)
}

function isActiveSlotCollision(error: unknown) {
  if (isUniqueConstraintError(error, ACTIVE_BOOKING_SLOT_UNIQUE_INDEX)) return true
  const pgError = error as PostgrestLikeError | null
  if (!pgError || pgError.code !== '23505') return false
  const details = `${pgError.message || ''} ${pgError.details || ''} ${pgError.hint || ''}`
  return details.includes('(professional_id, start_time_utc)')
}

async function getAuthenticatedContext() {
  const supabase = createClient()
  const adminSupabase = createAdminClient()
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
    adminSupabase,
    user,
    profile,
    professionalId: professional?.id ?? null,
  }
}

async function expireRequestIfNeeded(
  supabase: ReturnType<typeof createClient>,
  request: Record<string, unknown>,
) {
  if (request.status !== 'offered') return request
  if (!request.proposal_expires_at || typeof request.proposal_expires_at !== 'string') return request

  const expiresAt = new Date(request.proposal_expires_at)
  if (Number.isNaN(expiresAt.getTime())) return request
  if (expiresAt.getTime() > Date.now()) return request

  const status = toRequestBookingStatus(request.status)
  if (!status) return request
  const transition = assertRequestBookingTransition(status, 'expired')
  if (!transition.ok) return request

  const { data: expiredRequest } = await supabase
    .from('request_bookings')
    .update({
      status: 'expired',
      expired_at: new Date().toISOString(),
    })
    .eq('id', String(request.id))
    .eq('status', status)
    .select(REQUEST_BOOKING_FIELDS)
    .maybeSingle()

  return expiredRequest || { ...request, status: 'expired' }
}

function toRequestBookingStatus(value: unknown): RequestBookingStatus | null {
  if (typeof value !== 'string') return null
  if (!REQUEST_BOOKING_STATUS_SET.has(value)) return null
  return value as RequestBookingStatus
}

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

  return (legacyAvailabilityRows || []).map((row: Record<string, unknown>) => ({
    weekday: row.day_of_week,
    start_time_local: row.start_time,
    end_time_local: row.end_time,
    timezone,
    is_active: true,
  }))
}

function isSlotWithinRules(
  startUtc: Date,
  endUtc: Date,
  timezone: string,
  rules: Array<Record<string, unknown>>,
) {
  const weekdayIso = Number(formatInTimeZone(startUtc, timezone, 'i'))
  const weekday = weekdayIso % 7
  const slotStartMinutes = getMinutesInTimezone(startUtc, timezone)
  const slotEndMinutes = getMinutesInTimezone(endUtc, timezone)

  return rules.some(rule => {
    if (!rule || Number(rule.weekday) !== weekday) return false
    const start = String(rule.start_time_local || '').slice(0, 5)
    const end = String(rule.end_time_local || '').slice(0, 5)
    if (!start || !end) return false
    const startMinutes = hhmmToMinutes(start)
    const endMinutes = hhmmToMinutes(end)
    return slotStartMinutes >= startMinutes && slotEndMinutes <= endMinutes
  })
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

  const slotStartMinutes = getMinutesInTimezone(startUtc, timezone)
  const slotEndMinutes = getMinutesInTimezone(endUtc, timezone)
  const exceptions = (exceptionRows || []) as Array<{
    is_available: boolean
    start_time_local: string | null
    end_time_local: string | null
  }>

  if (exceptions.length === 0) return true

  const overlaps = (row: { start_time_local: string | null; end_time_local: string | null }) => {
    if (!row.start_time_local || !row.end_time_local) return true
    const start = hhmmToMinutes(row.start_time_local)
    const end = hhmmToMinutes(row.end_time_local)
    return slotStartMinutes < end && slotEndMinutes > start
  }

  const hasBlockedException = exceptions.some(row => row.is_available === false && overlaps(row))
  if (hasBlockedException) return false

  const allowedWindows = exceptions.filter(row => row.is_available)
  if (allowedWindows.length === 0) return true

  return allowedWindows.some(window => {
    if (!window.start_time_local || !window.end_time_local) return false
    const start = hhmmToMinutes(window.start_time_local)
    const end = hhmmToMinutes(window.end_time_local)
    return slotStartMinutes >= start && slotEndMinutes <= end
  })
}

async function hasInternalConflict(
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
      `and(start_time_utc.gte.${conflictWindowStart},start_time_utc.lte.${conflictWindowEnd}),and(scheduled_at.gte.${conflictWindowStart},scheduled_at.lte.${conflictWindowEnd})`,
    )

  if (ignoreBookingId) query = query.neq('id', ignoreBookingId)

  const { data: candidateConflicts } = await query

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

async function professionalCanReceiveRequestBooking(
  supabase: ReturnType<typeof createClient>,
  professional: Record<string, any>,
): Promise<{ ok: true } | { ok: false; error: string; reasonCode?: string }> {
  if (professional.status !== 'approved') {
    return { ok: false, error: 'Profissional n?o dispon?vel.', reasonCode: 'pending_admin_approval' }
  }

  if (!REQUEST_BOOKING_ALLOWED_TIERS.includes(String(professional.tier))) {
    return {
      ok: false,
      error: 'Solicitacoes de hor?rio estao dispon?veis apenas para planos Professional/Premium.',
      reasonCode: 'missing_plan_selection',
    }
  }

  const eligibility = await evaluateFirstBookingEligibility(supabase, String(professional.id))
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.message, reasonCode: eligibility.reasonCode }
  }

  return { ok: true }
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
      error: parsed.error.issues[0]?.message || 'Dados inv?lidos para solicita??o.',
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

  if (!professional) return { success: false, error: 'Profissional n?o encontrado.' }
  if (professional.user_id === user.id) {
    return { success: false, error: 'N?o e permitido solicitar hor?rio para seu pr?prio perfil.' }
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
    return { success: false, error: 'Hor?rio preferencial inv?lido.' }
  }

  if (Number.isNaN(preferredStartUtc.getTime())) {
    return { success: false, error: 'Hor?rio preferencial inv?lido.' }
  }

  const preferredEndUtc = new Date(preferredStartUtc.getTime() + durationMinutes * 60 * 1000)
  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (preferredStartUtc.getTime() < minimumStartTime) {
    return {
      success: false,
      error: `Selecione um hor?rio com pelo menos ${settings.minimumNoticeHours} horas de anteced?ncia.`,
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
    return { success: false, error: 'N?o foi poss?vel criar a solicita??o. Tente novamente.' }
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
      error: parsed.error.issues[0]?.message || 'Dados inv?lidos para proposta.',
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

  if (!request) return { success: false, error: 'Solicita??o n?o encontrada.' }

  const freshRequest = await expireRequestIfNeeded(
    supabase,
    request as unknown as Record<string, unknown>,
  )
  if (freshRequest.status === 'expired') {
    return { success: false, error: 'Esta solicita??o expirou e precisa ser recriada pelo usuario.' }
  }
  if (!['open', 'offered'].includes(String(freshRequest.status))) {
    return { success: false, error: 'Esta solicita??o n?o pode receber nova proposta.' }
  }
  const currentStatus = toRequestBookingStatus(freshRequest.status)
  if (!currentStatus) {
    return { success: false, error: 'Estado atual da solicita??o inv?lido.' }
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

  if (!professional) return { success: false, error: 'Profissional n?o encontrado.' }
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
    return { success: false, error: 'Hor?rio proposto inv?lido.' }
  }
  if (Number.isNaN(proposalStartUtc.getTime())) {
    return { success: false, error: 'Hor?rio proposto inv?lido.' }
  }
  const proposalEndUtc = new Date(proposalStartUtc.getTime() + durationMinutes * 60 * 1000)

  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (proposalStartUtc.getTime() < minimumStartTime) {
    return {
      success: false,
      error: `Proposta deve respeitar m?nimo de ${settings.minimumNoticeHours}h de anteced?ncia.`,
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

  const rules = await loadAvailabilityRules(supabase, professional.id, settings.timezone)
  const fitsAvailability = isSlotWithinRules(
    proposalStartUtc,
    proposalEndUtc,
    settings.timezone,
    rules,
  )
  if (!fitsAvailability) {
    return { success: false, error: 'Hor?rio fora da disponibilidade configurada.' }
  }

  const allowedByException = await isSlotAllowedByExceptions(
    supabase,
    professional.id,
    settings.timezone,
    proposalStartUtc,
    proposalEndUtc,
  )
  if (!allowedByException) {
    return { success: false, error: 'Hor?rio bloqueado por indisponibilidade excepcional.' }
  }

  const conflict = await hasInternalConflict(
    supabase,
    professional.id,
    proposalStartUtc,
    proposalEndUtc,
    settings.bufferMinutes,
  )
  if (conflict) {
    return { success: false, error: 'Hor?rio indispon?vel por conflito com outro agendamento.' }
  }

  const externalConflict = await hasExternalBusyConflict(
    supabase as any,
    professional.id,
    proposalStartUtc.toISOString(),
    proposalEndUtc.toISOString(),
  )
  if (externalConflict) {
    return {
      success: false,
      error: 'Horário proposto conflita com agenda externa conectada do profissional.',
    }
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
    return { success: false, error: 'N?o foi poss?vel enviar a proposta. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function declineRequestBookingByProfessional(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicita??o invalida.' }

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

  if (!request) return { success: false, error: 'Solicita??o n?o encontrada.' }
  if (!['open', 'offered'].includes(String(request.status))) {
    return { success: false, error: 'Esta solicita??o n?o pode ser recusada no estado atual.' }
  }
  const currentStatus = toRequestBookingStatus(request.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicita??o inv?lido.' }
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

  if (error) return { success: false, error: 'N?o foi poss?vel recusar a solicita??o.' }
  revalidatePath('/agenda')
  return { success: true }
}

export async function cancelRequestBookingByUser(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicita??o invalida.' }

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { success: false, error: 'Solicita??o n?o encontrada.' }
  if (!['open', 'offered'].includes(String(request.status))) {
    return { success: false, error: 'Esta solicita??o n?o pode ser cancelada no estado atual.' }
  }
  const currentStatus = toRequestBookingStatus(request.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicita??o inv?lido.' }
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

  if (error) return { success: false, error: 'N?o foi poss?vel cancelar a solicita??o.' }
  revalidatePath('/agenda')
  return { success: true }
}

export async function declineRequestBookingByUser(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicita??o invalida.' }

  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select('id, status')
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { success: false, error: 'Solicita??o n?o encontrada.' }
  if (request.status !== 'offered') {
    return { success: false, error: 'Apenas propostas recebidas podem ser recusadas.' }
  }
  const currentStatus = toRequestBookingStatus(request.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicita??o inv?lido.' }
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

  if (error) return { success: false, error: 'N?o foi poss?vel recusar a proposta.' }
  revalidatePath('/agenda')
  return { success: true }
}

export async function acceptRequestBooking(
  requestId: string,
): Promise<
  { success: true; bookingId: string } | { success: false; error: string; reasonCode?: string }
> {
  const parsed = requestIdSchema.safeParse(requestId)
  if (!parsed.success) return { success: false, error: 'Solicita??o invalida.' }

  const { supabase, adminSupabase, user, profile } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: request } = await supabase
    .from('request_bookings')
    .select(REQUEST_BOOKING_FIELDS)
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { success: false, error: 'Solicita??o n?o encontrada.' }

  const freshRequest = await expireRequestIfNeeded(
    supabase,
    request as unknown as Record<string, unknown>,
  )
  if (freshRequest.status === 'expired') {
    return { success: false, error: 'A proposta expirou. Solicite um novo hor?rio.' }
  }
  if (freshRequest.status !== 'offered') {
    return { success: false, error: 'Esta solicita??o n?o possui proposta ativa para aceitar.' }
  }
  const currentStatus = toRequestBookingStatus(freshRequest.status)
  if (!currentStatus) return { success: false, error: 'Estado atual da solicita??o inv?lido.' }
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

  if (!professional) return { success: false, error: 'Profissional n?o encontrado.' }
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
    return { success: false, error: 'Hor?rio proposto inv?lido.' }
  }

  const minimumStartTime = Date.now() + settings.minimumNoticeHours * 60 * 60 * 1000
  if (startUtc.getTime() < minimumStartTime) {
    return { success: false, error: 'A proposta venceu a janela minima de anteced?ncia.' }
  }
  const maximumDate = new Date()
  maximumDate.setDate(maximumDate.getDate() + settings.maxBookingWindowDays)
  if (startUtc.getTime() > maximumDate.getTime()) {
    return { success: false, error: 'A proposta saiu da janela maxima de agendamento.' }
  }

  const rules = await loadAvailabilityRules(supabase, professional.id, settings.timezone)
  const fitsAvailability = isSlotWithinRules(startUtc, endUtc, settings.timezone, rules)
  if (!fitsAvailability) {
    return { success: false, error: 'O hor?rio proposto n?o est? mais dispon?vel.' }
  }

  const allowedByException = await isSlotAllowedByExceptions(
    supabase,
    professional.id,
    settings.timezone,
    startUtc,
    endUtc,
  )
  if (!allowedByException) {
    return { success: false, error: 'Hor?rio bloqueado por indisponibilidade excepcional.' }
  }

  const conflict = await hasInternalConflict(
    supabase,
    professional.id,
    startUtc,
    endUtc,
    settings.bufferMinutes,
  )
  if (conflict) {
    return { success: false, error: 'Outro agendamento ocupou este hor?rio. Solicite nova proposta.' }
  }

  const externalConflict = await hasExternalBusyConflict(
    supabase as any,
    professional.id,
    startUtc.toISOString(),
    endUtc.toISOString(),
  )
  if (externalConflict) {
    return {
      success: false,
      error: 'A proposta conflita com agenda externa do profissional. Solicite novo horário.',
    }
  }

  const userCurrency = profile?.currency || 'BRL'
  const sessionPriceBrl = Number(professional.session_price_brl) || 0
  const exchangeRates = await getExchangeRates(supabase as any)
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
    if (isActiveSlotCollision(bookingInsertError)) {
      return { success: false, error: 'Outro agendamento ocupou este horario. Solicite nova proposta.' }
    }
    return { success: false, error: 'N?o foi poss?vel converter a proposta em agendamento.' }
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

    if (requestRecoveryError && adminSupabase) {
      await adminSupabase
        .from('request_bookings')
        .update(requestRecoveryPatch)
        .eq('id', String(freshRequest.id))
        .eq('status', currentStatus)
    }

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

  if (requestUpdateError && adminSupabase) {
    await adminSupabase
      .from('request_bookings')
      .update({
        status: 'converted',
        accepted_at: new Date().toISOString(),
        converted_booking_id: booking.id,
        proposal_expires_at: null,
      })
      .eq('id', String(freshRequest.id))
      .eq('status', currentStatus)
  }

  await enqueueBookingCalendarSync({
    bookingId: booking.id,
    action: 'upsert_booking',
    source: 'request-booking.accept',
  })
  revalidatePath('/agenda')
  revalidatePath(`/profissional/${professional.id}`)
  return { success: true, bookingId: booking.id }
}
