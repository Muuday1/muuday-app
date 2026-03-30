/**
 * Professional tier entitlement configuration.
 * Source of truth: docs/spec/source-of-truth/part1 sections 3.10, 4.11-4.13
 */

export type ProfessionalTier = 'basic' | 'professional' | 'premium'

export type TierLimits = {
  specialties: number
  tags: number
  services: number
  serviceOptionsPerService: number
  bookingWindowDays: number
}

export const TIER_LIMITS: Record<ProfessionalTier, TierLimits> = {
  basic: {
    specialties: 2,
    tags: 3,
    services: 3,
    serviceOptionsPerService: 3,
    bookingWindowDays: 60,
  },
  professional: {
    specialties: 3,
    tags: 5,
    services: 10,
    serviceOptionsPerService: 6,
    bookingWindowDays: 90,
  },
  premium: {
    specialties: 5,
    tags: 10,
    services: 20,
    serviceOptionsPerService: 10,
    bookingWindowDays: 180,
  },
}

export const TIER_LABELS: Record<ProfessionalTier, string> = {
  basic: 'Básico',
  professional: 'Profissional',
  premium: 'Premium',
}

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[(tier as ProfessionalTier)] || TIER_LIMITS.basic
}

export function isWithinTierLimit(tier: string, field: keyof TierLimits, currentCount: number): boolean {
  const limits = getTierLimits(tier)
  return currentCount < limits[field]
}
