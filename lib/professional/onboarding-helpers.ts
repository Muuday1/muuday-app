import { isFeatureAvailable, type ProfessionalTier } from '@/lib/tier-config'
import type { OnboardingStageId, OnboardingStageStatus, OnboardingBlocker } from './onboarding-gates'

export const SENSITIVE_CATEGORY_KEYWORDS = ['saude', 'mental', 'medic', 'direito', 'jurid', 'legal']

export function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0)
}

export function uniqueTexts(values: Array<string | null | undefined> | null | undefined) {
  if (!values) return []
  return values.map(v => (v || '').trim()).filter(Boolean)
}

export function isSensitiveCategory(category: string | null | undefined) {
  if (!category) return false
  const normalized = category.toLowerCase()
  return SENSITIVE_CATEGORY_KEYWORDS.some(keyword => normalized.includes(keyword))
}

export function toTier(value: string | null | undefined): ProfessionalTier {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'professional' || normalized === 'premium') return normalized
  return 'basic'
}

export function stage(
  id: OnboardingStageId,
  title: string,
  blockers: OnboardingBlocker[],
): OnboardingStageStatus {
  return {
    id,
    title,
    complete: blockers.length === 0,
    blockers,
  }
}

export function hasCredibilitySummary(yearsExperience: number | null | undefined) {
  return (
    yearsExperience !== null &&
    yearsExperience !== undefined &&
    Number.isFinite(Number(yearsExperience)) &&
    Number(yearsExperience) >= 0
  )
}

export function hasAcceptanceMode(tier: ProfessionalTier, confirmationMode: string | null | undefined) {
  if (tier === 'basic') return true
  const mode = String(confirmationMode || '')
  return ['auto_accept', 'manual'].includes(mode)
}
