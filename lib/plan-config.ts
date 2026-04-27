import { createAdminClient } from '@/lib/supabase/admin'
import type { ProfessionalTier, TierFeature, TierLimits } from '@/lib/tier-config'
import {
  getBufferConfig,
  getBufferMaxMinutes,
  getExtendedBioLimit,
  getMinNoticeRange,
  getSocialLinksLimit,
  getTierLimits,
  isFeatureAvailable,
} from '@/lib/tier-config'

type PlanConfigRow = {
  tier: ProfessionalTier
  specialties_limit: number
  tags_limit: number
  services_limit: number
  service_options_per_service_limit: number
  booking_window_days_limit: number
  min_notice_hours_min: number
  min_notice_hours_max: number
  buffer_configurable: boolean
  buffer_default_minutes: number
  buffer_max_minutes: number
  social_links_limit: number
  extended_bio_limit: number
  features: string[] | null
}

export type PlanConfig = {
  tier: ProfessionalTier
  limits: TierLimits
  minNoticeRange: { min: number; max: number }
  bufferConfig: { configurable: boolean; defaultMinutes: number; maxMinutes: number }
  socialLinksLimit: number
  extendedBioLimit: number
  features: TierFeature[]
}

export type PlanConfigMap = Record<ProfessionalTier, PlanConfig>

const TIERS: ProfessionalTier[] = ['basic', 'professional', 'premium']

const ALLOWED_FEATURES: TierFeature[] = [
  'manual_accept',
  'auto_accept',
  'video_intro',
  'whatsapp_profile',
  'social_links',
  'extended_bio',
  'outlook_sync',
  'whatsapp_notifications',
  'promotions',
  'csv_export',
  'pdf_export',
  'cover_photo',
]

function normalizeTier(tierRaw?: string | null): ProfessionalTier {
  const normalized = String(tierRaw || '').trim().toLowerCase()
  if (normalized === 'premium' || normalized === 'professional' || normalized === 'basic') {
    return normalized
  }
  return 'basic'
}

function defaultConfigForTier(tier: ProfessionalTier): PlanConfig {
  const notice = getMinNoticeRange(tier)
  const buffer = getBufferConfig(tier)
  return {
    tier,
    limits: getTierLimits(tier),
    minNoticeRange: notice,
    bufferConfig: {
      configurable: buffer.configurable,
      defaultMinutes: buffer.defaultMinutes,
      maxMinutes: getBufferMaxMinutes(tier),
    },
    socialLinksLimit: getSocialLinksLimit(tier),
    extendedBioLimit: getExtendedBioLimit(tier),
    features: ALLOWED_FEATURES.filter(feature => isFeatureAvailable(tier, feature)),
  }
}

export function getDefaultPlanConfigMap(): PlanConfigMap {
  return {
    basic: defaultConfigForTier('basic'),
    professional: defaultConfigForTier('professional'),
    premium: defaultConfigForTier('premium'),
  }
}

function parseFeatureList(value: string[] | null | undefined, fallback: TierFeature[]): TierFeature[] {
  if (!Array.isArray(value) || value.length === 0) return fallback
  const normalized = value
    .map(item => String(item || '').trim())
    .filter((item): item is TierFeature => ALLOWED_FEATURES.includes(item as TierFeature))
  if (normalized.length === 0) return fallback
  return Array.from(new Set(normalized))
}

function toPositiveInt(value: unknown, fallback: number, min = 0): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.floor(parsed))
}

function toPlanConfig(row: Partial<PlanConfigRow>, fallback: PlanConfig): PlanConfig {
  const limits = {
    specialties: toPositiveInt(row.specialties_limit, fallback.limits.specialties, 0),
    tags: toPositiveInt(row.tags_limit, fallback.limits.tags, 0),
    services: toPositiveInt(row.services_limit, fallback.limits.services, 0),
    // TODO(P0.4): serviceOptionsPerService is stored but not enforced because
    // the service options/variants feature is not yet built.
    serviceOptionsPerService: toPositiveInt(
      row.service_options_per_service_limit,
      fallback.limits.serviceOptionsPerService,
      0,
    ),
    bookingWindowDays: toPositiveInt(row.booking_window_days_limit, fallback.limits.bookingWindowDays, 1),
  }

  const minNotice = toPositiveInt(row.min_notice_hours_min, fallback.minNoticeRange.min, 0)
  const maxNoticeRaw = toPositiveInt(row.min_notice_hours_max, fallback.minNoticeRange.max, minNotice)
  const maxNotice = Math.max(minNotice, maxNoticeRaw)

  const bufferDefault = toPositiveInt(
    row.buffer_default_minutes,
    fallback.bufferConfig.defaultMinutes,
    0,
  )
  const bufferMaxRaw = toPositiveInt(row.buffer_max_minutes, fallback.bufferConfig.maxMinutes, bufferDefault)
  const bufferMax = Math.max(bufferDefault, bufferMaxRaw)

  return {
    tier: fallback.tier,
    limits,
    minNoticeRange: { min: minNotice, max: maxNotice },
    bufferConfig: {
      configurable:
        typeof row.buffer_configurable === 'boolean'
          ? row.buffer_configurable
          : fallback.bufferConfig.configurable,
      defaultMinutes: bufferDefault,
      maxMinutes: bufferMax,
    },
    socialLinksLimit: toPositiveInt(row.social_links_limit, fallback.socialLinksLimit, 0),
    extendedBioLimit: toPositiveInt(row.extended_bio_limit, fallback.extendedBioLimit, 0),
    features: parseFeatureList(row.features, fallback.features),
  }
}

export async function loadPlanConfigMap(): Promise<PlanConfigMap> {
  const defaults = getDefaultPlanConfigMap()
  const adminClient = createAdminClient()
  if (!adminClient) return defaults

  const { data, error } = await adminClient
    .from('plan_configs')
    .select(
      'tier,specialties_limit,tags_limit,services_limit,service_options_per_service_limit,booking_window_days_limit,min_notice_hours_min,min_notice_hours_max,buffer_configurable,buffer_default_minutes,buffer_max_minutes,social_links_limit,extended_bio_limit,features',
    )
    .in('tier', TIERS)

  if (error || !Array.isArray(data)) return defaults

  const map: PlanConfigMap = { ...defaults }
  for (const row of data as PlanConfigRow[]) {
    const tier = normalizeTier(row.tier)
    map[tier] = toPlanConfig(row, defaults[tier])
  }
  return map
}

export function getPlanConfigForTier(map: PlanConfigMap, tierRaw?: string | null): PlanConfig {
  return map[normalizeTier(tierRaw)]
}

