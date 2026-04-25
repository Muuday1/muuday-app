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

  const [
    { data: profile, error: profileError },
    { data: professional, error: professionalError },
    { data: settingsRow, error: settingsError },
    eligibility,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency, timezone')
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
  ])

  if (profileError) {
    console.error('[booking/create] profile query error:', profileError.message, profileError.code)
  }

  if (professionalError) {
    console.error('[booking/create] professional query error:', professionalError.message, professionalError.code)
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

  return {
    profile,
    professional,
    settings: bookingSettings,
    eligibility,
  }
}
