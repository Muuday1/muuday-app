import { stage } from './onboarding-helpers'
import { computeOnboardingFieldState } from './onboarding-field-state'
import { buildOnboardingMatrix } from './onboarding-matrix'
import {
  evaluateAccountBlockers,
  evaluateIdentityBlockers,
  evaluatePublicProfileBlockers,
  evaluateServiceBlockers,
  evaluateAvailabilityBlockers,
  evaluateBillingBlockers,
  evaluatePayoutSetupBlockers,
  evaluateSubmitTermsBlockers,
  evaluateGoLiveBlockers,
  evaluateFirstBookingBlockers,
  evaluatePayoutReceiptBlockers,
} from './onboarding-stage-evaluators'

export type OnboardingStageId =
  | 'c1_account_creation'
  | 'c2_basic_identity'
  | 'c3_public_profile'
  | 'c4_service_setup'
  | 'c5_availability_calendar'
  | 'c6_plan_billing_setup'
  | 'c7_payout_payments'
  | 'c8_submit_review'
  | 'c9_go_live'

export type OnboardingGateId =
  | 'review_submission'
  | 'go_live'
  | 'first_booking_acceptance'
  | 'payout_receipt'

export type OnboardingBlocker = {
  code: string
  title: string
  description: string
  stage: OnboardingStageId
  actionHref?: string
}

export type OnboardingGateReasonCode =
  | 'missing_name'
  | 'missing_country_or_timezone'
  | 'missing_taxonomy'
  | 'missing_display_name'
  | 'missing_bio'
  | 'missing_profile_photo'
  | 'missing_languages'
  | 'missing_credibility_summary'
  | 'missing_service'
  | 'missing_service_pricing_duration'
  | 'missing_availability'
  | 'missing_booking_rules'
  | 'missing_cancellation_policy'
  | 'missing_plan_selection'
  | 'missing_terms_acceptance'
  | 'missing_billing_card'
  | 'missing_payout_onboarding'
  | 'missing_payout_setup'
  | 'missing_payout_kyc'
  | 'missing_credentials'
  | 'missing_review_requirements'
  | 'pending_admin_approval'
  | 'first_booking_gate_disabled'
  | 'unknown_gate_blocker'

export type OnboardingStageStatus = {
  id: OnboardingStageId
  title: string
  complete: boolean
  blockers: OnboardingBlocker[]
}

export type OnboardingGateStatus = {
  id: OnboardingGateId
  title: string
  passed: boolean
  blockers: OnboardingBlocker[]
}

export type OnboardingFieldMatrixRow = {
  field: string
  required_at_account_creation: boolean
  required_for_valid_profile_draft: boolean
  required_for_review_submission: boolean
  required_for_go_live: boolean
  required_for_first_booking_acceptance: boolean
  required_for_payout: boolean
  met: boolean
}

export type ProfessionalOnboardingSnapshot = {
  account: {
    fullName?: string | null
    email?: string | null
    country?: string | null
    timezone?: string | null
    primaryLanguage?: string | null
    avatarUrl?: string | null
  }
  professional: {
    id: string
    displayName?: string | null
    status?: string | null
    tier?: string | null
    firstBookingEnabled?: boolean | null
    bio?: string | null
    category?: string | null
    subcategories?: string[] | null
    languages?: string[] | null
    yearsExperience?: number | null
    whatsappNumber?: string | null
    coverPhotoUrl?: string | null
    videoIntroUrl?: string | null
    socialLinks?: Record<string, string> | null
  }
  settings: {
    confirmationMode?: string | null
    minimumNoticeHours?: number | null
    maxBookingWindowDays?: number | null
    billingCardOnFile?: boolean | null
    payoutOnboardingStarted?: boolean | null
    payoutKycCompleted?: boolean | null
    calendarSyncProvider?: string | null
    cancellationPolicyAccepted?: boolean
    termsAcceptedAt?: string | null
    termsVersion?: string | null
    bufferTimeMinutes?: number | null
    notificationPreferences?: { email: boolean; push: boolean; whatsapp: boolean } | null
    onboardingFinanceBypass?: boolean | null
  }
  serviceCount: number
  hasServicePricingAndDuration: boolean
  availabilityCount: number
  specialtyCount: number
  sensitiveCategory: boolean
  credentialUploadCount: number
}

export type ProfessionalOnboardingEvaluation = {
  stages: OnboardingStageStatus[]
  gates: Record<OnboardingGateId, OnboardingGateStatus>
  matrix: OnboardingFieldMatrixRow[]
  summary: {
    canSubmitForReview: boolean
    canGoLive: boolean
    canAcceptFirstBooking: boolean
    canReceivePayout: boolean
  }
}

export function evaluateOnboardingGates(
  snapshot: ProfessionalOnboardingSnapshot,
): ProfessionalOnboardingEvaluation {
  const {
    fieldState,
    categorySensitive,
    hasMinimumNotice,
    hasMaxWindow,
    hasCredibility,
    onboardingFinanceBypass,
  } = computeOnboardingFieldState(snapshot)

  const matrix = buildOnboardingMatrix(fieldState, categorySensitive)

  const accountBlockers = evaluateAccountBlockers(fieldState)
  const identityBlockers = evaluateIdentityBlockers(fieldState)
  const publicProfileBlockers = evaluatePublicProfileBlockers(fieldState, hasCredibility, categorySensitive)
  const serviceBlockers = evaluateServiceBlockers(fieldState)
  const availabilityBlockers = evaluateAvailabilityBlockers(fieldState, hasMinimumNotice, hasMaxWindow)
  const billingBlockers = evaluateBillingBlockers(fieldState)
  const payoutSetupBlockers = evaluatePayoutSetupBlockers(fieldState, onboardingFinanceBypass)
  const submitTermsBlockers = evaluateSubmitTermsBlockers(fieldState)

  const reviewSubmissionBlockers = [
    ...identityBlockers,
    ...publicProfileBlockers,
    ...serviceBlockers,
    ...availabilityBlockers,
    ...submitTermsBlockers,
  ]

  const canSubmitForReview = reviewSubmissionBlockers.length === 0
  const submitReviewBlockers: OnboardingBlocker[] = canSubmitForReview
    ? []
    : [
        {
          code: 'missing_review_requirements',
          title: 'Envio para revisao bloqueado',
          description: 'Complete as etapas obrigatorias de perfil antes de enviar para analise.',
          stage: 'c8_submit_review',
          actionHref: '/onboarding-profissional',
        },
      ]

  const goLiveBlockers = evaluateGoLiveBlockers(
    canSubmitForReview,
    fieldState,
    categorySensitive,
    snapshot.professional.status,
  )
  const canGoLive = goLiveBlockers.length === 0

  const firstBookingBlockers = evaluateFirstBookingBlockers(
    canGoLive,
    goLiveBlockers,
    fieldState,
    onboardingFinanceBypass,
    snapshot.professional.firstBookingEnabled,
  )
  const canAcceptFirstBooking = firstBookingBlockers.length === 0

  const payoutReceiptBlockers = evaluatePayoutReceiptBlockers(
    canGoLive,
    goLiveBlockers,
    fieldState,
    onboardingFinanceBypass,
  )
  const canReceivePayout = payoutReceiptBlockers.length === 0

  const stages: OnboardingStageStatus[] = [
    stage('c1_account_creation', 'C1 Conta', accountBlockers),
    stage('c2_basic_identity', 'C2 Identidade profissional', identityBlockers),
    stage('c3_public_profile', 'C3 Perfil publico', publicProfileBlockers),
    stage('c4_service_setup', 'C4 Servico', serviceBlockers),
    stage('c5_availability_calendar', 'C5 Disponibilidade e calendario', availabilityBlockers),
    stage('c6_plan_billing_setup', 'C6 Plano, termos e cobranca', billingBlockers),
    stage('c7_payout_payments', 'C7 Payout Stripe', payoutSetupBlockers),
    stage('c8_submit_review', 'C8 Submit review', submitReviewBlockers),
    stage('c9_go_live', 'C9 Go live', goLiveBlockers),
  ]

  const gates: Record<OnboardingGateId, OnboardingGateStatus> = {
    review_submission: {
      id: 'review_submission',
      title: 'Gate de envio para revisao',
      passed: canSubmitForReview,
      blockers: reviewSubmissionBlockers,
    },
    go_live: {
      id: 'go_live',
      title: 'Gate de go-live',
      passed: canGoLive,
      blockers: goLiveBlockers,
    },
    first_booking_acceptance: {
      id: 'first_booking_acceptance',
      title: 'Gate de primeiro booking',
      passed: canAcceptFirstBooking,
      blockers: firstBookingBlockers,
    },
    payout_receipt: {
      id: 'payout_receipt',
      title: 'Gate de recebimento',
      passed: canReceivePayout,
      blockers: payoutReceiptBlockers,
    },
  }

  return {
    stages,
    gates,
    matrix,
    summary: {
      canSubmitForReview,
      canGoLive,
      canAcceptFirstBooking,
      canReceivePayout,
    },
  }
}

export function evaluateProfessionalOnboarding(
  snapshot: ProfessionalOnboardingSnapshot,
): ProfessionalOnboardingEvaluation {
  return evaluateOnboardingGates(snapshot)
}

export function getPrimaryGateBlockerReasonCode(
  evaluation: ProfessionalOnboardingEvaluation,
  gateId: OnboardingGateId,
): OnboardingGateReasonCode {
  const primary = evaluation.gates[gateId].blockers[0]
  if (!primary?.code) return 'unknown_gate_blocker'
  return primary.code as OnboardingGateReasonCode
}

export function firstBookingGateErrorMessage(evaluation: ProfessionalOnboardingEvaluation) {
  const firstBlocker = evaluation.gates.first_booking_acceptance.blockers[0]
  if (!firstBlocker) return 'Este profissional ainda nao esta habilitado para aceitar o primeiro agendamento.'
  return `${firstBlocker.title}. ${firstBlocker.description}`
}
