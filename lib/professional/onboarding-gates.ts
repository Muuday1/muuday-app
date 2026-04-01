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
  | 'missing_plan_selection'
  | 'missing_payout_onboarding'
  | 'missing_review_requirements'
  | 'pending_admin_approval'
  | 'missing_billing_card'
  | 'missing_payout_setup'
  | 'missing_payout_kyc'
  | 'first_booking_gate_disabled'
  | 'sensitive_disclaimer_missing'
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
    status?: string | null
    tier?: string | null
    firstBookingEnabled?: boolean | null
    bio?: string | null
    category?: string | null
    subcategories?: string[] | null
    languages?: string[] | null
    yearsExperience?: number | null
  }
  settings: {
    confirmationMode?: string | null
    minimumNoticeHours?: number | null
    maxBookingWindowDays?: number | null
    billingCardOnFile?: boolean | null
    payoutOnboardingStarted?: boolean | null
    payoutKycCompleted?: boolean | null
  }
  serviceCount: number
  hasServicePricingAndDuration: boolean
  availabilityCount: number
  specialtyCount: number
  sensitiveCategory: boolean
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

const SENSITIVE_CATEGORY_KEYWORDS = [
  'saude',
  'mental',
  'medic',
  'direito',
  'jurid',
  'legal',
]

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0)
}

function uniqueTexts(values: Array<string | null | undefined> | null | undefined) {
  if (!values) return []
  return values.map(v => (v || '').trim()).filter(Boolean)
}

function isSensitiveCategory(category: string | null | undefined) {
  if (!category) return false
  const normalized = category.toLowerCase()
  return SENSITIVE_CATEGORY_KEYWORDS.some(keyword => normalized.includes(keyword))
}

export function evaluateOnboardingGates(
  snapshot: ProfessionalOnboardingSnapshot,
): ProfessionalOnboardingEvaluation {
  const hasPrimaryLanguage =
    hasText(snapshot.account.primaryLanguage) || uniqueTexts(snapshot.professional.languages).length > 0
  const hasSubcategory = uniqueTexts(snapshot.professional.subcategories).length > 0
  const hasSpecialty = snapshot.specialtyCount > 0 || hasSubcategory
  const hasProfileBio = hasText(snapshot.professional.bio)
  const hasCredibilitySummary = Number(snapshot.professional.yearsExperience || 0) >= 0
  const hasPlanSelection = ['basic', 'professional', 'premium'].includes(
    String(snapshot.professional.tier || '').toLowerCase(),
  )
  const hasAcceptanceMode = ['auto_accept', 'manual'].includes(
    String(snapshot.settings.confirmationMode || ''),
  )
  const hasMinimumNotice = Number(snapshot.settings.minimumNoticeHours || 0) > 0
  const hasMaxWindow = Number(snapshot.settings.maxBookingWindowDays || 0) > 0
  const hasAvailability = snapshot.availabilityCount > 0
  const hasService = snapshot.serviceCount > 0 && snapshot.hasServicePricingAndDuration
  const billingCardOnFile = Boolean(snapshot.settings.billingCardOnFile)
  const payoutOnboardingStarted = Boolean(snapshot.settings.payoutOnboardingStarted)
  const payoutKycCompleted = Boolean(snapshot.settings.payoutKycCompleted)
  const categoryValue = snapshot.professional.category || ''
  const categorySensitive = snapshot.sensitiveCategory || isSensitiveCategory(categoryValue)

  const fieldState = {
    name: hasText(snapshot.account.fullName),
    email: hasText(snapshot.account.email),
    country_of_residence: hasText(snapshot.account.country),
    timezone: hasText(snapshot.account.timezone),
    primary_language: hasPrimaryLanguage,
    display_name: hasText(snapshot.account.fullName),
    category_subcategory_specialty: hasText(categoryValue) && hasSpecialty,
    headline_short_bio: hasProfileBio,
    profile_photo: hasText(snapshot.account.avatarUrl),
    at_least_one_service: hasService,
    service_price_and_duration: snapshot.hasServicePricingAndDuration,
    availability_baseline: hasAvailability,
    acceptance_mode_choice: hasAcceptanceMode,
    professional_plan_selection: hasPlanSelection,
    billing_card_for_professional_plan: billingCardOnFile,
    payout_connected_account_minimum: payoutOnboardingStarted,
    payout_kyc_complete: payoutKycCompleted,
    sensitive_category_disclaimer_fields: !categorySensitive || hasText(snapshot.professional.bio),
  }

  const matrix: OnboardingFieldMatrixRow[] = [
    {
      field: 'name',
      required_at_account_creation: true,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.name,
    },
    {
      field: 'email',
      required_at_account_creation: true,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.email,
    },
    {
      field: 'country_of_residence',
      required_at_account_creation: true,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.country_of_residence,
    },
    {
      field: 'timezone',
      required_at_account_creation: true,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.timezone,
    },
    {
      field: 'primary_language',
      required_at_account_creation: true,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.primary_language,
    },
    {
      field: 'display_name',
      required_at_account_creation: false,
      required_for_valid_profile_draft: true,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.display_name,
    },
    {
      field: 'category_subcategory_specialty',
      required_at_account_creation: false,
      required_for_valid_profile_draft: true,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.category_subcategory_specialty,
    },
    {
      field: 'headline_short_bio',
      required_at_account_creation: false,
      required_for_valid_profile_draft: true,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.headline_short_bio,
    },
    {
      field: 'profile_photo',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.profile_photo,
    },
    {
      field: 'at_least_one_service',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.at_least_one_service,
    },
    {
      field: 'service_price_and_duration',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.service_price_and_duration,
    },
    {
      field: 'availability_baseline',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.availability_baseline,
    },
    {
      field: 'acceptance_mode_choice',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.acceptance_mode_choice,
    },
    {
      field: 'professional_plan_selection',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.professional_plan_selection,
    },
    {
      field: 'billing_card_for_professional_plan',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.billing_card_for_professional_plan,
    },
    {
      field: 'payout_connected_account_minimum',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: true,
      required_for_payout: true,
      met: fieldState.payout_connected_account_minimum,
    },
    {
      field: 'payout_kyc_complete',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: true,
      met: fieldState.payout_kyc_complete,
    },
    {
      field: 'sensitive_category_disclaimer_fields',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: categorySensitive,
      required_for_go_live: categorySensitive,
      required_for_first_booking_acceptance: categorySensitive,
      required_for_payout: false,
      met: fieldState.sensitive_category_disclaimer_fields,
    },
  ]

  const stage = (
    id: OnboardingStageId,
    title: string,
    blockers: OnboardingBlocker[],
  ): OnboardingStageStatus => ({
    id,
    title,
    complete: blockers.length === 0,
    blockers,
  })

  const accountBlockers: OnboardingBlocker[] = []
  if (!fieldState.name) {
    accountBlockers.push({
      code: 'missing_name',
      title: 'Nome de conta ausente',
      description: 'Defina o nome completo da conta para seguir com onboarding.',
      stage: 'c1_account_creation',
      actionHref: '/editar-perfil',
    })
  }
  if (!fieldState.country_of_residence || !fieldState.timezone) {
    accountBlockers.push({
      code: 'missing_country_or_timezone',
      title: 'Pais/fuso ausente',
      description: 'Pais e fuso precisam estar preenchidos no perfil de conta.',
      stage: 'c1_account_creation',
      actionHref: '/configuracoes',
    })
  }

  const identityBlockers: OnboardingBlocker[] = []
  if (!fieldState.category_subcategory_specialty) {
    identityBlockers.push({
      code: 'missing_taxonomy',
      title: 'Taxonomia incompleta',
      description: 'Selecione categoria e especialidade para posicionar seu perfil.',
      stage: 'c2_basic_identity',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!fieldState.display_name) {
    identityBlockers.push({
      code: 'missing_display_name',
      title: 'Nome profissional ausente',
      description: 'Defina um nome profissional visivel para os usuarios.',
      stage: 'c2_basic_identity',
      actionHref: '/editar-perfil-profissional',
    })
  }

  const publicProfileBlockers: OnboardingBlocker[] = []
  if (!fieldState.headline_short_bio) {
    publicProfileBlockers.push({
      code: 'missing_bio',
      title: 'Bio curta ausente',
      description: 'Adicione uma bio curta para explicar sua proposta de valor.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!fieldState.profile_photo) {
    publicProfileBlockers.push({
      code: 'missing_profile_photo',
      title: 'Foto de perfil ausente',
      description: 'Inclua uma foto para melhorar credibilidade do perfil.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil',
    })
  }
  if (!fieldState.primary_language) {
    publicProfileBlockers.push({
      code: 'missing_languages',
      title: 'Idiomas ausentes',
      description: 'Defina ao menos um idioma de atendimento.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!hasCredibilitySummary) {
    publicProfileBlockers.push({
      code: 'missing_credibility_summary',
      title: 'Resumo de experiencia ausente',
      description: 'Adicione dados basicos de experiencia para publicar com confianca.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }

  const serviceBlockers: OnboardingBlocker[] = []
  if (!fieldState.at_least_one_service) {
    serviceBlockers.push({
      code: 'missing_service',
      title: 'Servico nao configurado',
      description: 'Cadastre ao menos um servico para envio a revisao.',
      stage: 'c4_service_setup',
      actionHref: '/completar-perfil',
    })
  } else if (!fieldState.service_price_and_duration) {
    serviceBlockers.push({
      code: 'missing_service_pricing_duration',
      title: 'Servico sem preco/duracao',
      description: 'Servico precisa de preco e duracao para entrar em operacao.',
      stage: 'c4_service_setup',
      actionHref: '/editar-perfil-profissional',
    })
  }

  const availabilityBlockers: OnboardingBlocker[] = []
  if (!fieldState.availability_baseline) {
    availabilityBlockers.push({
      code: 'missing_availability',
      title: 'Disponibilidade nao configurada',
      description: 'Defina dias/horarios antes de enviar perfil para revisao.',
      stage: 'c5_availability_calendar',
      actionHref: '/disponibilidade',
    })
  }
  if (!fieldState.acceptance_mode_choice || !hasMinimumNotice || !hasMaxWindow) {
    availabilityBlockers.push({
      code: 'missing_booking_rules',
      title: 'Regras de booking incompletas',
      description: 'Configure modo de confirmacao, antecedencia minima e janela maxima.',
      stage: 'c5_availability_calendar',
      actionHref: '/configuracoes-agendamento',
    })
  }

  const billingBlockers: OnboardingBlocker[] = []
  if (!fieldState.professional_plan_selection) {
    billingBlockers.push({
      code: 'missing_plan_selection',
      title: 'Plano profissional nao definido',
      description: 'Selecione tier (Basic/Professional/Premium) para finalizar setup.',
      stage: 'c6_plan_billing_setup',
      actionHref: '/configuracoes',
    })
  }

  const payoutBlockers: OnboardingBlocker[] = []
  if (!fieldState.payout_connected_account_minimum) {
    payoutBlockers.push({
      code: 'missing_payout_onboarding',
      title: 'Onboarding de repasse pendente',
      description: 'Inicie o onboarding de payout antes do primeiro booking.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }

  const stages: OnboardingStageStatus[] = [
    stage('c1_account_creation', 'C1 Account creation', accountBlockers),
    stage('c2_basic_identity', 'C2 Basic professional identity', identityBlockers),
    stage('c3_public_profile', 'C3 Public profile', publicProfileBlockers),
    stage('c4_service_setup', 'C4 Service setup', serviceBlockers),
    stage('c5_availability_calendar', 'C5 Availability / calendar', availabilityBlockers),
    stage('c6_plan_billing_setup', 'C6 Plan selection / billing setup', billingBlockers),
    stage('c7_payout_payments', 'C7 Payout / payments onboarding', payoutBlockers),
    stage('c8_submit_review', 'C8 Submit for review', []),
    stage('c9_go_live', 'C9 Go live', []),
  ]

  const reviewSubmissionBlockers = [
    ...identityBlockers,
    ...publicProfileBlockers,
    ...serviceBlockers,
    ...availabilityBlockers,
    ...billingBlockers,
  ]
  const canSubmitForReview = reviewSubmissionBlockers.length === 0

  const goLiveBlockers: OnboardingBlocker[] = []
  if (!canSubmitForReview) {
    goLiveBlockers.push({
      code: 'missing_review_requirements',
      title: 'Requisitos de revisao incompletos',
      description: 'Complete C2-C6 antes de ir para publicacao.',
      stage: 'c9_go_live',
      actionHref: '/completar-perfil',
    })
  }
  if (snapshot.professional.status !== 'approved') {
    goLiveBlockers.push({
      code: 'pending_admin_approval',
      title: 'Aprovacao administrativa pendente',
      description: 'Perfil precisa estar aprovado para aparecer publicamente.',
      stage: 'c9_go_live',
      actionHref: '/perfil',
    })
  }
  const canGoLive = goLiveBlockers.length === 0

  const firstBookingBlockers: OnboardingBlocker[] = []
  if (!canGoLive) {
    firstBookingBlockers.push(...goLiveBlockers)
  }
  if (!fieldState.billing_card_for_professional_plan) {
    firstBookingBlockers.push({
      code: 'missing_billing_card',
      title: 'Cartao de cobranca ausente',
      description: 'Inclua cartao para ativar o primeiro booking.',
      stage: 'c6_plan_billing_setup',
      actionHref: '/configuracoes',
    })
  }
  if (!fieldState.payout_connected_account_minimum) {
    firstBookingBlockers.push({
      code: 'missing_payout_setup',
      title: 'Payout nao iniciado',
      description: 'Inicie onboarding de payout para aceitar o primeiro booking.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  if (!snapshot.professional.firstBookingEnabled) {
    firstBookingBlockers.push({
      code: 'first_booking_gate_disabled',
      title: 'Gate operacional do primeiro booking bloqueado',
      description: 'Primeiro booking depende de liberacao operacional/admin.',
      stage: 'c9_go_live',
      actionHref: '/configuracoes',
    })
  }
  const canAcceptFirstBooking = firstBookingBlockers.length === 0

  const payoutBlockersGate = [...firstBookingBlockers]
  if (!fieldState.payout_kyc_complete) {
    payoutBlockersGate.push({
      code: 'missing_payout_kyc',
      title: 'KYC de payout incompleto',
      description: 'Finalize KYC para receber repasses.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  const canReceivePayout = payoutBlockersGate.length === 0

  stages[7] = stage(
    'c8_submit_review',
    'C8 Submit for review',
    canSubmitForReview
      ? []
      : [
            {
            code: 'missing_review_requirements',
            title: 'Envio para revisao bloqueado',
            description: 'Complete os campos obrigatorios de C2 a C6.',
            stage: 'c8_submit_review',
            actionHref: '/completar-perfil',
          },
        ],
  )
  stages[8] = stage('c9_go_live', 'C9 Go live', goLiveBlockers)

  const gates: Record<OnboardingGateId, OnboardingGateStatus> = {
    review_submission: {
      id: 'review_submission',
      title: 'Review submission gate',
      passed: canSubmitForReview,
      blockers: reviewSubmissionBlockers,
    },
    go_live: {
      id: 'go_live',
      title: 'Go-live gate',
      passed: canGoLive,
      blockers: goLiveBlockers,
    },
    first_booking_acceptance: {
      id: 'first_booking_acceptance',
      title: 'First-booking acceptance gate',
      passed: canAcceptFirstBooking,
      blockers: firstBookingBlockers,
    },
    payout_receipt: {
      id: 'payout_receipt',
      title: 'Payout receipt gate',
      passed: canReceivePayout,
      blockers: payoutBlockersGate,
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
