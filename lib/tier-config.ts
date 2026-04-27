/**
 * Professional tier entitlement configuration.
 * Source of truth: docs/spec/source-of-truth/part1 sections 3.10, 4.11-4.14
 */

export type ProfessionalTier = 'basic' | 'professional' | 'premium'

export type TierFeature =
  | 'manual_accept'
  | 'auto_accept'
  | 'video_intro'
  | 'whatsapp_profile'
  | 'social_links'
  | 'extended_bio'
  | 'outlook_sync'
  | 'whatsapp_notifications'
  | 'promotions'
  | 'csv_export'
  | 'pdf_export'
  | 'cover_photo'

export type TierLimits = {
  specialties: number
  tags: number
  services: number
  // TODO(P0.4): serviceOptionsPerService limit is configured but the feature
  // (service options / variants per professional_service) is not yet exposed
  // in the professional-facing UI. When built, enforce this limit at the
  // professional services write path.
  serviceOptionsPerService: number
  bookingWindowDays: number
}

export const TIER_LIMITS: Record<ProfessionalTier, TierLimits> = {
  basic: {
    specialties: 1,
    tags: 3,
    services: 1,
    serviceOptionsPerService: 1,
    bookingWindowDays: 30,
  },
  professional: {
    specialties: 3,
    tags: 4,
    services: 3,
    serviceOptionsPerService: 3,
    bookingWindowDays: 90,
  },
  premium: {
    specialties: 3,
    tags: 5,
    services: 5,
    serviceOptionsPerService: 6,
    bookingWindowDays: 180,
  },
}

export const TIER_LABELS: Record<ProfessionalTier, string> = {
  basic: 'Básico',
  professional: 'Profissional',
  premium: 'Premium',
}

const TIER_ORDER: Record<ProfessionalTier, number> = {
  basic: 0,
  professional: 1,
  premium: 2,
}

const TIER_FEATURES: Record<ProfessionalTier, TierFeature[]> = {
  basic: ['cover_photo'],
  professional: [
    'cover_photo',
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
  ],
  premium: [
    'cover_photo',
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
  ],
}

function normalizeTier(value?: string | null): ProfessionalTier {
  const tier = String(value || '').toLowerCase()
  if (tier === 'premium' || tier === 'professional' || tier === 'basic') {
    return tier
  }
  return 'basic'
}

export function isTierAtLeast(currentTier: string, requiredTier: ProfessionalTier): boolean {
  const current = normalizeTier(currentTier)
  return TIER_ORDER[current] >= TIER_ORDER[requiredTier]
}

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[normalizeTier(tier)]
}

export function isWithinTierLimit(tier: string, field: keyof TierLimits, currentCount: number): boolean {
  const limits = getTierLimits(tier)
  return currentCount < limits[field]
}

export function isFeatureAvailable(tier: string, feature: TierFeature): boolean {
  const normalizedTier = normalizeTier(tier)
  return TIER_FEATURES[normalizedTier].includes(feature)
}

export function getMinNoticeRange(tier: string): { min: number; max: number } {
  const normalizedTier = normalizeTier(tier)
  if (normalizedTier === 'premium') return { min: 0, max: 168 }
  if (normalizedTier === 'professional') return { min: 0, max: 96 }
  return { min: 0, max: 48 }
}

export function getBufferConfig(tier: string): { configurable: boolean; defaultMinutes: number } {
  if (normalizeTier(tier) === 'basic') {
    return { configurable: false, defaultMinutes: 15 }
  }
  return { configurable: true, defaultMinutes: 15 }
}

export function getBufferMaxMinutes(tier: string): number {
  return normalizeTier(tier) === 'basic' ? 15 : 120
}

export function getSocialLinksLimit(tier: string): number {
  const normalizedTier = normalizeTier(tier)
  if (normalizedTier === 'premium') return 5
  if (normalizedTier === 'professional') return 2
  return 0
}

export function getExtendedBioLimit(tier: string): number {
  const normalizedTier = normalizeTier(tier)
  if (normalizedTier === 'premium') return 5000
  if (normalizedTier === 'professional') return 2000
  return 0
}
