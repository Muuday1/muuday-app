import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import type { ProfessionalTermKey } from '@/lib/legal/professional-terms'
import type { PlanConfigMap } from '@/lib/plan-config'
import type { ExchangeRateMap } from '@/lib/exchange-rates'

export type Blocker = {
  code: string
  title: string
  description: string
  actionHref?: string
}

export type Stage = {
  id: string
  title: string
  complete: boolean
  blockers: Blocker[]
}

export type QualificationStructured = {
  id: string
  name: string
  requires_registration: boolean
  course_name: string
  registration_number: string
  issuer: string
  country: string
  evidence_files: Array<{
    id: string
    file_name: string
    file_url: string
    scan_status: string
    verified: boolean
    credential_type: string | null
  }>
}

export type AvailabilityDayState = {
  is_available: boolean
  start_time: string
  end_time: string
}

export type OnboardingTrackerModalProps = {
  professionalId: string
  tier: string
  professionalStatus: string
  onboardingEvaluation: ProfessionalOnboardingEvaluation
  initialReviewAdjustments: ReviewAdjustmentItem[]
  initialTermsAcceptanceByKey: Record<string, boolean>
  initialBio: string
  initialCoverPhotoUrl: string
  autoOpen?: boolean
  onTrackerStateChange?: (state: {
    evaluation: ProfessionalOnboardingEvaluation
    professionalStatus: string
    reviewAdjustments?: ReviewAdjustmentItem[]
  }) => void
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type BillingCycle = 'monthly' | 'annual'
export type PlanTier = 'basic' | 'professional' | 'premium'
export type TrackerViewMode = 'editing' | 'submitted_waiting' | 'approved' | 'needs_changes' | 'rejected'
export type PendingPhoto = {
  file: File
  previewUrl: string
  width: number
  height: number
}

export type ProfileSummary = {
  currency?: string | null
  full_name?: string | null
  timezone?: string | null
  avatar_url?: string | null
}

export type ModalContextPayload = {
  professional?: {
    user_id?: string | null
    category?: string | null
    subcategories?: string[] | null
    focus_areas?: string[] | null
    years_experience?: number | null
    tier?: string | null
    cover_photo_url?: string | null
  } | null
  services?: Array<{ id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }> | null
  settings?: Record<string, unknown> | null
  availability?: Array<Record<string, unknown>> | null
  application?: Record<string, unknown> | null
  credentials?: Array<Record<string, unknown>> | null
  profile?: ProfileSummary | null
}

export type ModalOptionalContextPayload = {
  categories?: Array<Record<string, unknown>> | null
  subcategories?: Array<Record<string, unknown>> | null
  planConfigs?: PlanConfigMap
  exchangeRates?: ExchangeRateMap
  planPricing?: {
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
    fallback?: boolean
    mode?: string
  } | null
  pricingError?: string
}

export type ProfessionalServiceItem = {
  id: string
  name: string
  description: string | null
  price_brl: number
  duration_minutes: number
}

export type ModalContextResponse = {
  scope?: 'critical' | 'optional'
  evaluation?: ProfessionalOnboardingEvaluation
  professionalStatus?: string
  reviewAdjustments?: ReviewAdjustmentItem[]
  termsAcceptanceByKey?: Record<string, boolean>
  servicesLoadState?: 'loaded' | 'degraded' | 'failed'
  servicesLoadError?: string
  critical?: ModalContextPayload
  optional?: ModalOptionalContextPayload
  error?: string
  servicesLoadFailed?: boolean
}

export type PhotoValidationStatus = 'pass' | 'fail' | 'unknown'
export type PhotoValidationChecks = {
  format: PhotoValidationStatus
  size: PhotoValidationStatus
  minResolution: PhotoValidationStatus
  faceCentered: PhotoValidationStatus
  neutralBackground: PhotoValidationStatus
}

export type BlockerCta =
  | { kind: 'internal'; label: string; stageId: string }
  | { kind: 'external'; label: string; href: string }
