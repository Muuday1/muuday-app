import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import type { BookingContext, CreateBookingInput } from './types'

export async function lookupBookingContext(
  supabase: SupabaseClient,
  userId: string,
  bookingInput: CreateBookingInput,
): Promise<BookingContext | { success: false; error: string; reasonCode?: string }> {
  const professionalId = bookingInput.professionalId

  const serviceId = bookingInput.serviceId

  const [
    { data: profile, error: profileError },
    { data: professional, error: professionalError },
    { data: settingsRow, error: settingsError },
    eligibility,
    { data: serviceRow },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency, timezone, full_name, language')
      .eq('id', userId)
      .single(),
    supabase
      .from('professionals')
      .select(
        'id, user_id, tier, session_price_brl, session_duration_minutes, status, first_booking_enabled, profiles!professionals_user_id_fkey(timezone, email, full_name)',
      )
      .eq('id', professionalId)
      .single(),
    supabase
      .from('professional_settings')
      .select(
        'timezone, session_duration_minutes, buffer_minutes, buffer_time_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
      )
      .eq('professional_id', professionalId)
      .maybeSingle(),
    evaluateFirstBookingEligibility(supabase, professionalId),
    serviceId
      ? supabase
          .from('professional_services')
          .select('id, name, price_brl, duration_minutes, enable_recurring, enable_batch')
          .eq('id', serviceId)
          .eq('professional_id', professionalId)
          .eq('is_active', true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (profileError) {
    Sentry.captureException(profileError, { tags: { area: 'booking_create', subArea: 'profile_query' } })
  }

  if (professionalError) {
    Sentry.captureException(professionalError, { tags: { area: 'booking_create', subArea: 'professional_query' } })
  }

  if (!professional || professional.status !== 'approved') {
    return { success: false, error: 'Profissional não disponível.' }
  }

  if (professional.user_id === userId) {
    return { success: false, error: 'Não é permitido agendar sessão com seu próprio perfil.' }
  }

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

  // Validate service belongs to professional when provided
  if (serviceId && !serviceRow) {
    return { success: false, error: 'Serviço não encontrado ou não pertence a este profissional.' }
  }

  const service = serviceRow
    ? {
        id: serviceRow.id,
        name: serviceRow.name,
        price_brl: Number(serviceRow.price_brl),
        duration_minutes: Number(serviceRow.duration_minutes),
        enable_recurring: Boolean(serviceRow.enable_recurring),
        enable_batch: Boolean(serviceRow.enable_batch),
      }
    : null

  return {
    profile,
    professional,
    settings: bookingSettings,
    eligibility,
    service,
  }
}
