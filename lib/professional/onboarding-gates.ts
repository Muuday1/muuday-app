import { isFeatureAvailable, isTierAtLeast, type ProfessionalTier } from '@/lib/tier-config'

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

const SENSITIVE_CATEGORY_KEYWORDS = ['saude', 'mental', 'medic', 'direito', 'jurid', 'legal']

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

function toTier(value: string | null | undefined): ProfessionalTier {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'professional' || normalized === 'premium') return normalized
  return 'basic'
}

function stage(
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

export function evaluateOnboardingGates(
  snapshot: ProfessionalOnboardingSnapshot,
): ProfessionalOnboardingEvaluation {
  const tier = toTier(snapshot.professional.tier)

  const hasPrimaryLanguage =
    hasText(snapshot.account.primaryLanguage) || uniqueTexts(snapshot.professional.languages).length > 0
  const hasSubcategory = uniqueTexts(snapshot.professional.subcategories).length > 0
  const hasSpecialty = snapshot.specialtyCount > 0 || hasSubcategory
  const hasProfileBio = hasText(snapshot.professional.bio)
  const hasCredibilitySummary = Number(snapshot.professional.yearsExperience ?? 0) >= 0
  const hasPlanSelection = ['basic', 'professional', 'premium'].includes(
    String(snapshot.professional.tier || '').toLowerCase(),
  )
  const confirmationMode = String(
    snapshot.settings.confirmationMode || (tier === 'basic' ? 'auto_accept' : ''),
  )
  const hasAcceptanceMode =
    tier === 'basic' ? true : ['auto_accept', 'manual'].includes(confirmationMode)
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

  const fieldState = {
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
    acceptance_mode_choice: hasAcceptanceMode,
    cancellation_policy_acceptance: cancellationPolicyAccepted,
    professional_plan_selection: hasPlanSelection,
    terms_acceptance: termsAccepted,
    billing_card_for_professional_plan: billingCardOnFile,
    payout_connected_account_minimum: payoutOnboardingStarted,
    payout_kyc_complete: payoutKycCompleted,
    credentials_upload: !categorySensitive || hasCredentials,
    video_intro_optional: !isFeatureAvailable(tier, 'video_intro') || hasText(snapshot.professional.videoIntroUrl),
    social_links_optional:
      !isFeatureAvailable(tier, 'social_links') ||
      Boolean(
        snapshot.professional.socialLinks &&
          Object.keys(snapshot.professional.socialLinks).length > 0,
      ),
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
      required_for_valid_profile_draft: true,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.profile_photo,
    },
    {
      field: 'credentials_upload',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: categorySensitive,
      required_for_go_live: categorySensitive,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.credentials_upload,
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
      field: 'cancellation_policy_acceptance',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.cancellation_policy_acceptance,
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
      field: 'terms_acceptance',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.terms_acceptance,
    },
    {
      field: 'billing_card_for_professional_plan',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
      required_for_first_booking_acceptance: true,
      required_for_payout: false,
      met: fieldState.billing_card_for_professional_plan,
    },
    {
      field: 'payout_connected_account_minimum',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: true,
      required_for_go_live: true,
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
      required_for_first_booking_acceptance: true,
      required_for_payout: true,
      met: fieldState.payout_kyc_complete,
    },
    {
      field: 'video_intro_optional',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.video_intro_optional,
    },
    {
      field: 'social_links_optional',
      required_at_account_creation: false,
      required_for_valid_profile_draft: false,
      required_for_review_submission: false,
      required_for_go_live: false,
      required_for_first_booking_acceptance: false,
      required_for_payout: false,
      met: fieldState.social_links_optional,
    },
  ]

  const accountBlockers: OnboardingBlocker[] = []
  if (!fieldState.name) {
    accountBlockers.push({
      code: 'missing_name',
      title: 'Nome da conta ausente',
      description: 'Defina o nome completo da conta para seguir com o onboarding.',
      stage: 'c1_account_creation',
      actionHref: '/editar-perfil',
    })
  }
  if (!fieldState.country_of_residence || !fieldState.timezone) {
    accountBlockers.push({
      code: 'missing_country_or_timezone',
      title: 'Pais ou fuso ausente',
      description: 'Pais e fuso precisam estar preenchidos no perfil de conta.',
      stage: 'c1_account_creation',
      actionHref: '/perfil',
    })
  }

  const identityBlockers: OnboardingBlocker[] = []
  if (!fieldState.category_subcategory_specialty) {
    identityBlockers.push({
      code: 'missing_taxonomy',
      title: 'Especialidade incompleta',
      description: 'Selecione categoria e especialidade para posicionar seu perfil.',
      stage: 'c2_basic_identity',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!fieldState.display_name) {
    identityBlockers.push({
      code: 'missing_display_name',
      title: 'Nome profissional ausente',
      description: 'Defina um nome profissional visivel para os clientes.',
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
      description: 'Adicione anos de experiencia para o perfil publico.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (categorySensitive && !fieldState.credentials_upload) {
    publicProfileBlockers.push({
      code: 'missing_credentials',
      title: 'Credenciais pendentes',
      description: 'Categorias sensiveis exigem upload de qualificacao para revisao.',
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
      title: 'Servico sem preco ou duracao',
      description: 'Servico precisa de preco e duracao para operar.',
      stage: 'c4_service_setup',
      actionHref: '/editar-perfil-profissional',
    })
  }

  const availabilityBlockers: OnboardingBlocker[] = []
  if (!fieldState.availability_baseline) {
    availabilityBlockers.push({
      code: 'missing_availability',
      title: 'Disponibilidade nao configurada',
      description: 'Defina dias e horarios antes de enviar o perfil para revisao.',
      stage: 'c5_availability_calendar',
      actionHref: '/disponibilidade',
    })
  }
  if (!fieldState.acceptance_mode_choice || !hasMinimumNotice || !hasMaxWindow) {
    availabilityBlockers.push({
      code: 'missing_booking_rules',
      title: 'Regras de agendamento incompletas',
      description: 'Configure modo de confirmacao, antecedencia minima e janela de agenda.',
      stage: 'c5_availability_calendar',
      actionHref: '/configuracoes-agendamento',
    })
  }
  if (!fieldState.cancellation_policy_acceptance) {
    availabilityBlockers.push({
      code: 'missing_cancellation_policy',
      title: 'Politica de cancelamento pendente',
      description: 'Voce precisa aceitar a politica de cancelamento padrao da plataforma.',
      stage: 'c5_availability_calendar',
      actionHref: '/configuracoes-agendamento',
    })
  }

  const billingBlockers: OnboardingBlocker[] = []
  if (!fieldState.professional_plan_selection) {
    billingBlockers.push({
      code: 'missing_plan_selection',
      title: 'Plano profissional nao definido',
      description: 'Selecione um plano em /planos para continuar.',
      stage: 'c6_plan_billing_setup',
      actionHref: '/planos',
    })
  }
  if (!fieldState.terms_acceptance) {
    billingBlockers.push({
      code: 'missing_terms_acceptance',
      title: 'Aceite de termos pendente',
      description: 'Aceite os termos da plataforma para concluir a etapa C6.',
      stage: 'c6_plan_billing_setup',
      actionHref: '/planos',
    })
  }
  if (!fieldState.billing_card_for_professional_plan && !onboardingFinanceBypass) {
    billingBlockers.push({
      code: 'missing_billing_card',
      title: 'Cartao nao configurado',
      description: 'Adicione um cartao para ativar trial e assinatura do plano selecionado.',
      stage: 'c6_plan_billing_setup',
      actionHref: '/planos',
    })
  }

  const payoutSetupBlockers: OnboardingBlocker[] = []
  if (!fieldState.payout_connected_account_minimum && !onboardingFinanceBypass) {
    payoutSetupBlockers.push({
      code: 'missing_payout_onboarding',
      title: 'Onboarding de payout pendente',
      description: 'Conclua a conexao de recebimento (Stripe Connect) para revisao final.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }

  const reviewSubmissionBlockers = [
    ...identityBlockers,
    ...publicProfileBlockers,
    ...serviceBlockers,
    ...availabilityBlockers,
    ...billingBlockers,
    ...payoutSetupBlockers,
  ]

  const canSubmitForReview = reviewSubmissionBlockers.length === 0
  const submitReviewBlockers: OnboardingBlocker[] = canSubmitForReview
    ? []
    : [
        {
          code: 'missing_review_requirements',
          title: 'Envio para revisao bloqueado',
          description: 'Complete os campos obrigatorios de C2 a C7.',
          stage: 'c8_submit_review',
          actionHref: '/onboarding-profissional',
        },
      ]

  const goLiveBlockers: OnboardingBlocker[] = []
  if (!canSubmitForReview) {
    goLiveBlockers.push({
      code: 'missing_review_requirements',
      title: 'Requisitos de revisao incompletos',
      description: 'Complete C2-C7 antes de seguir para publicacao.',
      stage: 'c9_go_live',
      actionHref: '/onboarding-profissional',
    })
  }
  if (categorySensitive && !fieldState.credentials_upload) {
    goLiveBlockers.push({
      code: 'missing_credentials',
      title: 'Credenciais obrigatorias pendentes',
      description: 'Para categorias sensiveis, o go-live exige credenciais anexadas.',
      stage: 'c9_go_live',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (snapshot.professional.status !== 'approved') {
    goLiveBlockers.push({
      code: 'pending_admin_approval',
      title: 'Aprovacao administrativa pendente',
      description: 'Seu perfil precisa ser aprovado para ficar publico e ativo.',
      stage: 'c9_go_live',
      actionHref: '/onboarding-profissional',
    })
  }

  const canGoLive = goLiveBlockers.length === 0

  const firstBookingBlockers: OnboardingBlocker[] = []
  if (!canGoLive) firstBookingBlockers.push(...goLiveBlockers)
  if (!fieldState.payout_connected_account_minimum && !onboardingFinanceBypass) {
    firstBookingBlockers.push({
      code: 'missing_payout_setup',
      title: 'Payout nao iniciado',
      description: 'Inicie onboarding de payout para aceitar o primeiro booking.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  if (!fieldState.payout_kyc_complete && !onboardingFinanceBypass) {
    firstBookingBlockers.push({
      code: 'missing_payout_kyc',
      title: 'KYC de payout incompleto',
      description: 'Finalize KYC para liberar o primeiro booking.',
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
      actionHref: '/onboarding-profissional',
    })
  }

  const canAcceptFirstBooking = firstBookingBlockers.length === 0

  const payoutReceiptBlockers: OnboardingBlocker[] = []
  if (!canGoLive) payoutReceiptBlockers.push(...goLiveBlockers)
  if (!fieldState.payout_connected_account_minimum && !onboardingFinanceBypass) {
    payoutReceiptBlockers.push({
      code: 'missing_payout_setup',
      title: 'Payout nao iniciado',
      description: 'Inicie onboarding de payout para liberar recebimentos.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  if (!fieldState.payout_kyc_complete && !onboardingFinanceBypass) {
    payoutReceiptBlockers.push({
      code: 'missing_payout_kyc',
      title: 'KYC de payout incompleto',
      description: 'Finalize KYC para liberar recebimentos.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
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




