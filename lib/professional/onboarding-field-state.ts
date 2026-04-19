import { isFeatureAvailable, type ProfessionalTier } from '@/lib/tier-config'
import {
  hasText,
  uniqueTexts,
  isSensitiveCategory,
  toTier,
  hasCredibilitySummary,
  hasAcceptanceMode,
} from './onboarding-helpers'
import type { ProfessionalOnboardingSnapshot } from './onboarding-gates'

export type OnboardingFieldState = Record<string, boolean>

export function computeOnboardingFieldState(
  snapshot: ProfessionalOnboardingSnapshot,
): {
  fieldState: OnboardingFieldState
  tier: ProfessionalTier
  categorySensitive: boolean
  hasMinimumNotice: boolean
  hasMaxWindow: boolean
  hasCredibility: boolean
  onboardingFinanceBypass: boolean
} {
  const tier = toTier(snapshot.professional.tier)

  const hasPrimaryLanguage =
    hasText(snapshot.account.primaryLanguage) || uniqueTexts(snapshot.professional.languages).length > 0
  const hasSubcategory = uniqueTexts(snapshot.professional.subcategories).length > 0
  const hasSpecialty = snapshot.specialtyCount > 0 || hasSubcategory
  const hasProfileBio = hasText(snapshot.professional.bio)
  const credibility = hasCredibilitySummary(snapshot.professional.yearsExperience)
  const hasPlanSelection = ['basic', 'professional', 'premium'].includes(
    String(snapshot.professional.tier || '').toLowerCase(),
  )
  const confirmationMode = String(
    snapshot.settings.confirmationMode || (tier === 'basic' ? 'auto_accept' : ''),
  )
  const acceptanceMode = hasAcceptanceMode(tier, confirmationMode)
  const hasMinimumNotice = Number(snapshot.settings.minimumNoticeHours || 0) > 0
  const hasMaxWindow = Number(snapshot.settings.maxBookingWindowDays || 0) > 0
  const hasAvailability = snapshot.availabilityCount > 0
  const hasService = snapshot.serviceCount > 0 && snapshot.hasServicePricingAndDuration
  const billingCardOnFile = Boolean(snapshot.settings.billingCardOnFile)
  const payoutOnboardingStarted = Boolean(snapshot.settings.payoutOnboardingStarted)
  const payoutKycCompleted = Boolean(snapshot.settings.payoutKycCompleted)
  const onboardingFinanceBypass = Boolean(snapshot.settings.onboardingFinanceBypass)
  const cancellationPolicyAccepted = Boolean(snapshot.settings.cancellationPolicyAccepted)
  const termsAccepted = hasText(snapshot.settings.termsAcceptedAt) || hasText(snapshot.settings.termsVersion)
  const categorySensitive = snapshot.sensitiveCategory || isSensitiveCategory(snapshot.professional.category)
  const hasCredentials = snapshot.credentialUploadCount > 0

  const fieldState: OnboardingFieldState = {
    name: hasText(snapshot.account.fullName),
    email: hasText(snapshot.account.email),
    country_of_residence: hasText(snapshot.account.country),
    timezone: hasText(snapshot.account.timezone),
    primary_language: hasPrimaryLanguage,
    display_name: hasText(snapshot.professional.displayName),
    category_subcategory_specialty: hasText(snapshot.professional.category) && hasSpecialty,
    headline_short_bio: hasProfileBio,
    profile_photo: hasText(snapshot.account.avatarUrl),
    at_least_one_service: hasService,
    service_price_and_duration: snapshot.hasServicePricingAndDuration,
    availability_baseline: hasAvailability,
    acceptance_mode_choice: acceptanceMode,
    cancellation_policy_acceptance: cancellationPolicyAccepted,
    professional_plan_selection: hasPlanSelection,
    terms_acceptance: termsAccepted,
    billing_card_for_professional_plan: billingCardOnFile,
    payout_connected_account_minimum: payoutOnboardingStarted,
    payout_kyc_complete: payoutKycCompleted,
    credentials_upload: !categorySensitive || hasCredentials,
    video_intro_optional:
      !isFeatureAvailable(tier, 'video_intro') || hasText(snapshot.professional.videoIntroUrl),
    social_links_optional:
      !isFeatureAvailable(tier, 'social_links') ||
      Boolean(
        snapshot.professional.socialLinks && Object.keys(snapshot.professional.socialLinks).length > 0,
      ),
  }

  return {
    fieldState,
    tier,
    categorySensitive,
    hasMinimumNotice,
    hasMaxWindow,
    hasCredibility: credibility,
    onboardingFinanceBypass,
  }
}
