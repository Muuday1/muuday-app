import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import {
  evaluateProfessionalOnboarding,
  firstBookingGateErrorMessage,
  type ProfessionalOnboardingEvaluation,
  type ProfessionalOnboardingSnapshot,
} from './onboarding-gates'

const FIRST_BOOKING_RELEVANT_STATUSES = [
  'pending',
  'pending_confirmation',
  'confirmed',
  'completed',
  'no_show',
  'rescheduled',
]

type OnboardingStateResult = {
  snapshot: ProfessionalOnboardingSnapshot
  evaluation: ProfessionalOnboardingEvaluation
}

function defaultSnapshot(professionalId: string): ProfessionalOnboardingSnapshot {
  return {
    account: {},
    professional: { id: professionalId },
    settings: {},
    serviceCount: 0,
    hasServicePricingAndDuration: false,
    availabilityCount: 0,
    specialtyCount: 0,
    sensitiveCategory: false,
  }
}

function hasMinimumServiceData(row: { session_price_brl?: number | null; session_duration_minutes?: number | null }) {
  return Number(row.session_price_brl || 0) > 0 && Number(row.session_duration_minutes || 0) > 0
}

export async function loadProfessionalOnboardingState(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<OnboardingStateResult | null> {
  const { data: professionalRow } = await supabase
    .from('professionals')
    .select(
      'id, user_id, status, tier, first_booking_enabled, bio, category, subcategories, languages, years_experience, session_price_brl, session_duration_minutes',
    )
    .eq('id', professionalId)
    .maybeSingle()

  if (!professionalRow?.id) return null

  const snapshot = defaultSnapshot(professionalId)
  snapshot.professional = {
    id: String(professionalRow.id),
    status: String(professionalRow.status || ''),
    tier: String(professionalRow.tier || ''),
    firstBookingEnabled: Boolean(professionalRow.first_booking_enabled),
    bio: String(professionalRow.bio || ''),
    category: String(professionalRow.category || ''),
    subcategories: Array.isArray(professionalRow.subcategories)
      ? (professionalRow.subcategories as string[])
      : [],
    languages: Array.isArray(professionalRow.languages)
      ? (professionalRow.languages as string[])
      : [],
    yearsExperience: Number(professionalRow.years_experience || 0),
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('full_name, email, country, timezone, avatar_url')
    .eq('id', String(professionalRow.user_id))
    .maybeSingle()

  snapshot.account = {
    fullName: String(profileRow?.full_name || ''),
    email: String(profileRow?.email || ''),
    country: String(profileRow?.country || ''),
    timezone: String(profileRow?.timezone || ''),
    avatarUrl: String(profileRow?.avatar_url || ''),
    primaryLanguage:
      Array.isArray(professionalRow.languages) && professionalRow.languages.length > 0
        ? String(professionalRow.languages[0] || '')
        : null,
  }

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
    )
    .eq('professional_id', professionalId)
    .maybeSingle()

  const normalizedSettings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    snapshot.account.timezone || 'America/Sao_Paulo',
  )

  snapshot.settings = {
    confirmationMode: normalizedSettings.confirmationMode,
    minimumNoticeHours: normalizedSettings.minimumNoticeHours,
    maxBookingWindowDays: normalizedSettings.maxBookingWindowDays,
  }

  // Optional C6/C7 flags from migration 015.
  // If columns do not exist yet, we keep backward compatibility by mirroring
  // first_booking_enabled behavior.
  const { data: readinessRow, error: readinessError } = await supabase
    .from('professional_settings')
    .select('billing_card_on_file, payout_onboarding_started, payout_kyc_completed')
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (!readinessError && readinessRow) {
    snapshot.settings.billingCardOnFile = Boolean(readinessRow.billing_card_on_file)
    snapshot.settings.payoutOnboardingStarted = Boolean(readinessRow.payout_onboarding_started)
    snapshot.settings.payoutKycCompleted = Boolean(readinessRow.payout_kyc_completed)
  } else {
    const mirrored = Boolean(professionalRow.first_booking_enabled)
    snapshot.settings.billingCardOnFile = mirrored
    snapshot.settings.payoutOnboardingStarted = mirrored
    snapshot.settings.payoutKycCompleted = mirrored
  }

  const { count: availabilityRulesCount } = await supabase
    .from('availability_rules')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if ((availabilityRulesCount || 0) > 0) {
    snapshot.availabilityCount = availabilityRulesCount || 0
  } else {
    const { count: availabilityLegacyCount } = await supabase
      .from('availability')
      .select('id', { head: true, count: 'exact' })
      .eq('professional_id', professionalId)
      .eq('is_active', true)
    snapshot.availabilityCount = availabilityLegacyCount || 0
  }

  const { count: specialtiesCount } = await supabase
    .from('professional_specialties')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
  snapshot.specialtyCount = specialtiesCount || 0

  const { count: servicesCount, error: servicesCountError } = await supabase
    .from('professional_services')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if (!servicesCountError) {
    snapshot.serviceCount = servicesCount || 0
    const { count: validServiceCount } = await supabase
      .from('professional_services')
      .select('id', { head: true, count: 'exact' })
      .eq('professional_id', professionalId)
      .eq('is_active', true)
      .gt('price_brl', 0)
      .gt('duration_minutes', 0)
    snapshot.hasServicePricingAndDuration = (validServiceCount || 0) > 0
  } else {
    snapshot.serviceCount = hasMinimumServiceData(professionalRow) ? 1 : 0
    snapshot.hasServicePricingAndDuration = hasMinimumServiceData(professionalRow)
  }

  snapshot.sensitiveCategory = false
  const evaluation = evaluateProfessionalOnboarding(snapshot)
  return { snapshot, evaluation }
}

export async function evaluateFirstBookingEligibility(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<{ ok: true } | { ok: false; message: string; evaluation?: ProfessionalOnboardingEvaluation }> {
  const { count: existingAcceptedBookingsCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .in('status', FIRST_BOOKING_RELEVANT_STATUSES)

  const hasAcceptedBookings = (existingAcceptedBookingsCount || 0) > 0
  if (hasAcceptedBookings) return { ok: true }

  const onboardingState = await loadProfessionalOnboardingState(supabase, professionalId)
  if (!onboardingState) {
    return {
      ok: false,
      message: 'Este profissional ainda nao esta habilitado para aceitar o primeiro agendamento.',
    }
  }

  if (onboardingState.evaluation.summary.canAcceptFirstBooking) {
    return { ok: true }
  }

  return {
    ok: false,
    message: firstBookingGateErrorMessage(onboardingState.evaluation),
    evaluation: onboardingState.evaluation,
  }
}
