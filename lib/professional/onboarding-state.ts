import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import {
  evaluateOnboardingGates,
  firstBookingGateErrorMessage,
  getPrimaryGateBlockerReasonCode,
  type OnboardingGateReasonCode,
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
    credentialUploadCount: 0,
  }
}

function hasMinimumServiceData(row: { session_price_brl?: number | null; session_duration_minutes?: number | null }) {
  return Number(row.session_price_brl || 0) > 0 && Number(row.session_duration_minutes || 0) > 0
}

function isSensitiveCategory(category: string | null | undefined) {
  const normalized = String(category || '').toLowerCase()
  return (
    normalized.includes('saude') ||
    normalized.includes('mental') ||
    normalized.includes('medic') ||
    normalized.includes('jurid') ||
    normalized.includes('direito')
  )
}

function inferCountryFromTimezone(timezone: string | null | undefined) {
  const normalized = String(timezone || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'america/sao_paulo') return 'Brasil'
  if (normalized === 'europe/london') return 'Reino Unido'
  if (normalized === 'europe/lisbon') return 'Portugal'
  if (normalized === 'europe/madrid') return 'Espanha'
  if (normalized === 'america/new_york' || normalized === 'america/chicago' || normalized === 'america/los_angeles')
    return 'Estados Unidos'
  if (normalized === 'europe/paris') return 'Franca'
  if (normalized === 'europe/berlin') return 'Alemanha'
  if (normalized === 'europe/rome') return 'Italia'
  return ''
}

export async function loadProfessionalOnboardingState(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<OnboardingStateResult | null> {
  const { data: professionalRow } = await supabase
    .from('professionals')
    .select(
      'id, user_id, status, tier, first_booking_enabled, bio, category, subcategories, languages, years_experience, session_price_brl, session_duration_minutes, whatsapp_number, cover_photo_url, video_intro_url, social_links',
    )
    .eq('id', professionalId)
    .maybeSingle()

  if (!professionalRow?.id) return null

  const snapshot = defaultSnapshot(professionalId)
  snapshot.professional = {
    id: String(professionalRow.id),
    status: String(professionalRow.status || ''),
    tier: String(professionalRow.tier || '').toLowerCase(),
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
    whatsappNumber: String(professionalRow.whatsapp_number || ''),
    coverPhotoUrl: String(professionalRow.cover_photo_url || ''),
    videoIntroUrl: String(professionalRow.video_intro_url || ''),
    socialLinks:
      professionalRow.social_links && typeof professionalRow.social_links === 'object'
        ? (professionalRow.social_links as Record<string, string>)
        : null,
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('full_name, email, country, timezone, avatar_url')
    .eq('id', String(professionalRow.user_id))
    .maybeSingle()

  const { data: applicationRow } = await supabase
    .from('professional_applications')
    .select(
      'display_name,category,specialty_name,primary_language,secondary_languages,focus_areas,years_experience,taxonomy_suggestions',
    )
    .eq('user_id', String(professionalRow.user_id))
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  snapshot.account = {
    fullName: String(profileRow?.full_name || ''),
    email: String(profileRow?.email || ''),
    country: String(profileRow?.country || ''),
    timezone: String(profileRow?.timezone || ''),
    avatarUrl: String(profileRow?.avatar_url || professionalRow.cover_photo_url || ''),
    primaryLanguage:
      Array.isArray(professionalRow.languages) && professionalRow.languages.length > 0
        ? String(professionalRow.languages[0] || '')
        : String(applicationRow?.primary_language || ''),
  }

  if (!snapshot.professional.category) {
    snapshot.professional.category = String(applicationRow?.category || '')
  }

  if (!snapshot.professional.yearsExperience) {
    snapshot.professional.yearsExperience = Number(applicationRow?.years_experience || 0)
  }

  snapshot.professional.displayName = String(applicationRow?.display_name || profileRow?.full_name || '')

  if ((snapshot.professional.subcategories || []).length === 0) {
    const taxonomySuggestions =
      applicationRow?.taxonomy_suggestions && typeof applicationRow.taxonomy_suggestions === 'object'
        ? (applicationRow.taxonomy_suggestions as Record<string, unknown>)
        : null

    const suggestedSubcategory = [
      taxonomySuggestions?.subcategory_slug,
      taxonomySuggestions?.subcategory,
      taxonomySuggestions?.subcategoria,
    ]
      .map(value => String(value || '').trim())
      .find(Boolean)

    if (suggestedSubcategory) {
      snapshot.professional.subcategories = [suggestedSubcategory]
    }
  }

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, buffer_time_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, cancellation_policy_accepted, require_session_purpose, billing_card_on_file, payout_onboarding_started, payout_kyc_completed, terms_accepted_at, terms_version, calendar_sync_provider, notification_email, notification_push, notification_whatsapp, onboarding_finance_bypass',
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
    billingCardOnFile: Boolean((settingsRow as Record<string, unknown> | null)?.billing_card_on_file),
    payoutOnboardingStarted: Boolean(
      (settingsRow as Record<string, unknown> | null)?.payout_onboarding_started,
    ),
    payoutKycCompleted: Boolean((settingsRow as Record<string, unknown> | null)?.payout_kyc_completed),
    calendarSyncProvider: normalizedSettings.calendarSyncProvider || null,
    cancellationPolicyAccepted: Boolean(normalizedSettings.cancellationPolicyAccepted),
    termsAcceptedAt: normalizedSettings.termsAcceptedAt || null,
    termsVersion: normalizedSettings.termsVersion || null,
    bufferTimeMinutes: normalizedSettings.bufferMinutes,
    notificationPreferences: {
      email: Boolean(normalizedSettings.notificationEmail),
      push: Boolean(normalizedSettings.notificationPush),
      whatsapp: Boolean(normalizedSettings.notificationWhatsapp),
    },
    onboardingFinanceBypass: Boolean(
      (settingsRow as Record<string, unknown> | null)?.onboarding_finance_bypass,
    ),
  }

  if (!snapshot.account.timezone && normalizedSettings.timezone) {
    snapshot.account.timezone = normalizedSettings.timezone
  }

  if (!snapshot.account.country && snapshot.account.timezone) {
    snapshot.account.country = inferCountryFromTimezone(snapshot.account.timezone)
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
  snapshot.specialtyCount =
    specialtiesCount || (String(applicationRow?.specialty_name || '').trim() ? 1 : 0)

  const { count: credentialsCount } = await supabase
    .from('professional_credentials')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
  snapshot.credentialUploadCount = credentialsCount || 0

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

  snapshot.sensitiveCategory = isSensitiveCategory(
    String(professionalRow.category || applicationRow?.category || ''),
  )
  const evaluation = evaluateOnboardingGates(snapshot)
  return { snapshot, evaluation }
}

export async function evaluateFirstBookingEligibility(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<
  | { ok: true }
  | {
      ok: false
      message: string
      reasonCode: OnboardingGateReasonCode
      evaluation?: ProfessionalOnboardingEvaluation
    }
> {
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
      reasonCode: 'unknown_gate_blocker',
    }
  }

  if (onboardingState.evaluation.summary.canAcceptFirstBooking) {
    return { ok: true }
  }

  return {
    ok: false,
    message: firstBookingGateErrorMessage(onboardingState.evaluation),
    reasonCode: getPrimaryGateBlockerReasonCode(
      onboardingState.evaluation,
      'first_booking_acceptance',
    ),
    evaluation: onboardingState.evaluation,
  }
}

