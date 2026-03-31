import type { SupabaseClient } from '@supabase/supabase-js'
import {
  evaluateProfessionalOnboarding,
  type ProfessionalOnboardingEvaluation,
  type ProfessionalOnboardingSnapshot,
} from '@/lib/professional/onboarding-gates'

type ProfessionalSearchProfile = {
  full_name?: string | null
  country?: string | null
  avatar_url?: string | null
}

type ProfessionalSearchRecord = {
  id: string
  status?: string | null
  tier?: string | null
  first_booking_enabled?: boolean | null
  bio?: string | null
  category?: string | null
  subcategories?: string[] | null
  languages?: string[] | null
  years_experience?: number | null
  session_price_brl?: number | null
  session_duration_minutes?: number | null
  profiles?: ProfessionalSearchProfile | null
}

type PublicVisibilityEvaluation = {
  canGoLive: boolean
  evaluation: ProfessionalOnboardingEvaluation
}

type SettingsRow = {
  professional_id: string
  confirmation_mode?: string | null
  minimum_notice_hours?: number | null
  max_booking_window_days?: number | null
  billing_card_on_file?: boolean | null
  payout_onboarding_started?: boolean | null
  payout_kyc_completed?: boolean | null
}

type ServiceRow = {
  professional_id: string
  price_brl?: number | null
  duration_minutes?: number | null
}

type CountMap = Map<string, number>

function asId(value: unknown) {
  return String(value || '').trim()
}

function asText(value: unknown) {
  return String(value || '').trim()
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(item => asText(item)).filter(Boolean)
}

function createCountMap(rows: Array<{ professional_id?: string | null }> | null | undefined): CountMap {
  const counts = new Map<string, number>()
  ;(rows || []).forEach(row => {
    const professionalId = asId(row.professional_id)
    if (!professionalId) return
    counts.set(professionalId, (counts.get(professionalId) || 0) + 1)
  })
  return counts
}

function buildSnapshot(
  professional: ProfessionalSearchRecord,
  settingsMap: Map<string, SettingsRow>,
  availabilityRulesCounts: CountMap,
  availabilityLegacyCounts: CountMap,
  specialtyCounts: CountMap,
  serviceCounts: CountMap,
  serviceWithPricingCounts: CountMap,
): ProfessionalOnboardingSnapshot {
  const professionalId = asId(professional.id)
  const settings = settingsMap.get(professionalId)
  const availabilityRulesCount = availabilityRulesCounts.get(professionalId) || 0
  const availabilityLegacyCount = availabilityLegacyCounts.get(professionalId) || 0
  const hasServicePricingAndDuration = (serviceWithPricingCounts.get(professionalId) || 0) > 0
  const serviceCount = serviceCounts.get(professionalId) || 0

  return {
    account: {
      fullName: asText(professional.profiles?.full_name),
      country: asText(professional.profiles?.country),
      avatarUrl: asText(professional.profiles?.avatar_url),
      primaryLanguage: asStringArray(professional.languages)[0] || null,
    },
    professional: {
      id: professionalId,
      status: asText(professional.status),
      tier: asText(professional.tier),
      firstBookingEnabled: Boolean(professional.first_booking_enabled),
      bio: asText(professional.bio),
      category: asText(professional.category),
      subcategories: asStringArray(professional.subcategories),
      languages: asStringArray(professional.languages),
      yearsExperience: Number(professional.years_experience || 0),
    },
    settings: {
      confirmationMode: asText(settings?.confirmation_mode),
      minimumNoticeHours: Number(settings?.minimum_notice_hours || 0),
      maxBookingWindowDays: Number(settings?.max_booking_window_days || 0),
      billingCardOnFile:
        settings?.billing_card_on_file === null || settings?.billing_card_on_file === undefined
          ? Boolean(professional.first_booking_enabled)
          : Boolean(settings.billing_card_on_file),
      payoutOnboardingStarted:
        settings?.payout_onboarding_started === null || settings?.payout_onboarding_started === undefined
          ? Boolean(professional.first_booking_enabled)
          : Boolean(settings.payout_onboarding_started),
      payoutKycCompleted:
        settings?.payout_kyc_completed === null || settings?.payout_kyc_completed === undefined
          ? Boolean(professional.first_booking_enabled)
          : Boolean(settings.payout_kyc_completed),
    },
    serviceCount,
    hasServicePricingAndDuration:
      hasServicePricingAndDuration ||
      (serviceCount === 0 &&
        Number(professional.session_price_brl || 0) > 0 &&
        Number(professional.session_duration_minutes || 0) > 0),
    availabilityCount: availabilityRulesCount > 0 ? availabilityRulesCount : availabilityLegacyCount,
    specialtyCount: specialtyCounts.get(professionalId) || 0,
    sensitiveCategory: false,
  }
}

export async function getPublicVisibilityByProfessionalId(
  supabase: SupabaseClient,
  professionals: ProfessionalSearchRecord[],
): Promise<Map<string, PublicVisibilityEvaluation>> {
  const results = new Map<string, PublicVisibilityEvaluation>()
  if (!professionals.length) return results

  const professionalIds = Array.from(
    new Set(
      professionals
        .map(professional => asId(professional.id))
        .filter(Boolean),
    ),
  )

  if (!professionalIds.length) return results

  let settingsMap = new Map<string, SettingsRow>()
  try {
    const { data: settingsRows } = await supabase
      .from('professional_settings')
      .select(
        'professional_id,confirmation_mode,minimum_notice_hours,max_booking_window_days,billing_card_on_file,payout_onboarding_started,payout_kyc_completed',
      )
      .in('professional_id', professionalIds)

    settingsMap = new Map(
      (settingsRows || []).map((row: SettingsRow) => [asId(row.professional_id), row]),
    )
  } catch {}

  let availabilityRulesCounts: CountMap = new Map()
  try {
    const { data: availabilityRuleRows } = await supabase
      .from('availability_rules')
      .select('professional_id')
      .in('professional_id', professionalIds)
      .eq('is_active', true)
    availabilityRulesCounts = createCountMap(availabilityRuleRows as Array<{ professional_id?: string | null }>)
  } catch {}

  let availabilityLegacyCounts: CountMap = new Map()
  try {
    const { data: availabilityLegacyRows } = await supabase
      .from('availability')
      .select('professional_id')
      .in('professional_id', professionalIds)
      .eq('is_active', true)
    availabilityLegacyCounts = createCountMap(availabilityLegacyRows as Array<{ professional_id?: string | null }>)
  } catch {}

  let specialtyCounts: CountMap = new Map()
  try {
    const { data: professionalSpecialtyRows } = await supabase
      .from('professional_specialties')
      .select('professional_id')
      .in('professional_id', professionalIds)
    specialtyCounts = createCountMap(
      professionalSpecialtyRows as Array<{ professional_id?: string | null }>,
    )
  } catch {}

  let serviceCounts: CountMap = new Map()
  let serviceWithPricingCounts: CountMap = new Map()
  try {
    const { data: serviceRows } = await supabase
      .from('professional_services')
      .select('professional_id,price_brl,duration_minutes')
      .in('professional_id', professionalIds)
      .eq('is_active', true)

    serviceCounts = createCountMap(serviceRows as Array<{ professional_id?: string | null }>)
    ;(serviceRows as ServiceRow[] | null | undefined || []).forEach(row => {
      const professionalId = asId(row.professional_id)
      if (!professionalId) return
      if (Number(row.price_brl || 0) <= 0 || Number(row.duration_minutes || 0) <= 0) return
      serviceWithPricingCounts.set(
        professionalId,
        (serviceWithPricingCounts.get(professionalId) || 0) + 1,
      )
    })
  } catch {}

  professionals.forEach(professional => {
    const professionalId = asId(professional.id)
    if (!professionalId) return
    const snapshot = buildSnapshot(
      professional,
      settingsMap,
      availabilityRulesCounts,
      availabilityLegacyCounts,
      specialtyCounts,
      serviceCounts,
      serviceWithPricingCounts,
    )
    const evaluation = evaluateProfessionalOnboarding(snapshot)
    results.set(professionalId, {
      canGoLive: evaluation.summary.canGoLive,
      evaluation,
    })
  })

  return results
}

export async function filterPubliclyVisibleProfessionals(
  supabase: SupabaseClient,
  professionals: ProfessionalSearchRecord[],
) {
  const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(supabase, professionals)
  return professionals.filter(professional =>
    visibilityByProfessionalId.get(asId(professional.id))?.canGoLive,
  )
}
