import type { SupabaseClient } from '@supabase/supabase-js'
import {
  evaluateOnboardingGates,
  type ProfessionalOnboardingEvaluation,
  type ProfessionalOnboardingSnapshot,
} from '@/lib/professional/onboarding-gates'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'

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
  whatsapp_number?: string | null
  cover_photo_url?: string | null
  video_intro_url?: string | null
  social_links?: Record<string, string> | null
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
  calendar_sync_provider?: string | null
  cancellation_policy_accepted?: boolean | null
  terms_accepted_at?: string | null
  terms_version?: string | null
  buffer_time_minutes?: number | null
  notification_email?: boolean | null
  notification_push?: boolean | null
  notification_whatsapp?: boolean | null
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
  credentialCounts: CountMap,
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
          ? false
          : Boolean(settings.billing_card_on_file),
      payoutOnboardingStarted:
        settings?.payout_onboarding_started === null || settings?.payout_onboarding_started === undefined
          ? false
          : Boolean(settings.payout_onboarding_started),
      payoutKycCompleted:
        settings?.payout_kyc_completed === null || settings?.payout_kyc_completed === undefined
          ? false
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
    credentialUploadCount: credentialCounts.get(professionalId) || 0,
  } as unknown as ProfessionalOnboardingSnapshot
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

  const [
    settingsMap,
    availabilityRulesCounts,
    availabilityLegacyCounts,
    specialtyCounts,
    credentialCounts,
    serviceData,
  ] = await Promise.all([
    (async () => {
      try {
        const { data: settingsRows } = await supabase
          .from('professional_settings')
          .select(
            'professional_id,confirmation_mode,minimum_notice_hours,max_booking_window_days,billing_card_on_file,payout_onboarding_started,payout_kyc_completed,calendar_sync_provider,cancellation_policy_accepted,terms_accepted_at,terms_version,buffer_time_minutes,notification_email,notification_push,notification_whatsapp',
          )
          .in('professional_id', professionalIds)

        return new Map(
          (settingsRows || []).map((row: SettingsRow) => [asId(row.professional_id), row]),
        )
      } catch {
        return new Map<string, SettingsRow>()
      }
    })(),
    (async () => {
      try {
        const { data: availabilityRuleRows } = await supabase
          .from('availability_rules')
          .select('professional_id')
          .in('professional_id', professionalIds)
          .eq('is_active', true)
        return createCountMap(
          availabilityRuleRows as Array<{ professional_id?: string | null }>,
        )
      } catch {
        return new Map<string, number>()
      }
    })(),
    (async () => {
      try {
        const { data: availabilityLegacyRows } = await supabase
          .from('availability')
          .select('professional_id')
          .in('professional_id', professionalIds)
          .eq('is_active', true)
        return createCountMap(
          availabilityLegacyRows as Array<{ professional_id?: string | null }>,
        )
      } catch {
        return new Map<string, number>()
      }
    })(),
    (async () => {
      try {
        const { data: professionalSpecialtyRows } = await supabase
          .from('professional_specialties')
          .select('professional_id')
          .in('professional_id', professionalIds)
        return createCountMap(
          professionalSpecialtyRows as Array<{ professional_id?: string | null }>,
        )
      } catch {
        return new Map<string, number>()
      }
    })(),
    (async () => {
      try {
        const { data: credentialRows } = await supabase
          .from('professional_credentials')
          .select('professional_id')
          .in('professional_id', professionalIds)
        return createCountMap(credentialRows as Array<{ professional_id?: string | null }>)
      } catch {
        return new Map<string, number>()
      }
    })(),
    (async () => {
      try {
        const { data: serviceRows } = await supabase
          .from('professional_services')
          .select('professional_id,price_brl,duration_minutes')
          .in('professional_id', professionalIds)
          .eq('is_active', true)

        const serviceCounts = createCountMap(
          serviceRows as Array<{ professional_id?: string | null }>,
        )
        const serviceWithPricingCounts: CountMap = new Map()
        ;(serviceRows as ServiceRow[] | null | undefined || []).forEach(row => {
          const professionalId = asId(row.professional_id)
          if (!professionalId) return
          if (Number(row.price_brl || 0) <= 0 || Number(row.duration_minutes || 0) <= 0) return
          serviceWithPricingCounts.set(
            professionalId,
            (serviceWithPricingCounts.get(professionalId) || 0) + 1,
          )
        })

        return { serviceCounts, serviceWithPricingCounts }
      } catch {
        return {
          serviceCounts: new Map<string, number>(),
          serviceWithPricingCounts: new Map<string, number>(),
        }
      }
    })(),
  ])

  const { serviceCounts, serviceWithPricingCounts } = serviceData

  professionals.forEach(professional => {
    const professionalId = asId(professional.id)
    if (!professionalId) return
    const snapshot = buildSnapshot(
      professional,
      settingsMap,
      availabilityRulesCounts,
      availabilityLegacyCounts,
      specialtyCounts,
      credentialCounts,
      serviceCounts,
      serviceWithPricingCounts,
    )
    const evaluation = evaluateOnboardingGates(snapshot)
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

export async function recomputeProfessionalVisibility(
  supabase: SupabaseClient,
  professionalId: string,
) {
  const normalizedProfessionalId = asId(professionalId)
  if (!normalizedProfessionalId) {
    return {
      ok: false as const,
      professionalId: normalizedProfessionalId,
      isPubliclyVisible: false,
      reason: 'invalid_professional_id',
    }
  }

  const onboardingState = await loadProfessionalOnboardingState(supabase, normalizedProfessionalId)
  const isPubliclyVisible = Boolean(onboardingState?.evaluation.summary.canGoLive)
  const visibilityCheckedAt = new Date().toISOString()

  const { error } = await supabase
    .from('professionals')
    .update({
      is_publicly_visible: isPubliclyVisible,
      visibility_checked_at: visibilityCheckedAt,
    })
    .eq('id', normalizedProfessionalId)

  if (error) {
    return {
      ok: false as const,
      professionalId: normalizedProfessionalId,
      isPubliclyVisible,
      reason: error.message || 'update_failed',
    }
  }

  return {
    ok: true as const,
    professionalId: normalizedProfessionalId,
    isPubliclyVisible,
    visibilityCheckedAt,
  }
}

export async function recomputeApprovedProfessionalsVisibility(
  supabase: SupabaseClient,
  options?: {
    limit?: number
    offset?: number
  },
) {
  const limit = Math.max(1, Math.min(options?.limit || 500, 5000))
  const offset = Math.max(0, options?.offset || 0)

  const { data: rows, error } = await supabase
    .from('professionals')
    .select(
      'id,status,tier,first_booking_enabled,bio,category,subcategories,languages,years_experience,session_price_brl,session_duration_minutes,whatsapp_number,cover_photo_url,video_intro_url,social_links,profiles!professionals_user_id_fkey(full_name,country,avatar_url)',
    )
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return {
      ok: false as const,
      total: 0,
      updated: 0,
      failed: 0,
      failures: [error.message || 'load_professionals_failed'],
    }
  }

  const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(
    supabase,
    (rows || []) as ProfessionalSearchRecord[],
  )

  let updated = 0
  let failed = 0
  const failures: string[] = []
  const visibilityCheckedAt = new Date().toISOString()

  for (const row of rows || []) {
    const professionalId = asId(row.id)
    const isPubliclyVisible = Boolean(visibilityByProfessionalId.get(professionalId)?.canGoLive)
    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        is_publicly_visible: isPubliclyVisible,
        visibility_checked_at: visibilityCheckedAt,
      })
      .eq('id', professionalId)

    if (updateError) {
      failed += 1
      failures.push(`${professionalId}:${updateError.message || 'update_failed'}`)
      continue
    }

    updated += 1
  }

  return {
    ok: failed === 0,
    total: rows?.length || 0,
    updated,
    failed,
    failures,
  }
}
