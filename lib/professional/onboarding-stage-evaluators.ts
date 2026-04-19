import type { OnboardingBlocker, ProfessionalOnboardingSnapshot } from './onboarding-gates'
import type { OnboardingFieldState } from './onboarding-field-state'

export function evaluateAccountBlockers(fieldState: OnboardingFieldState): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.name) {
    blockers.push({
      code: 'missing_name',
      title: 'Nome da conta ausente',
      description: 'Defina o nome completo da conta para seguir com o onboarding.',
      stage: 'c1_account_creation',
      actionHref: '/editar-perfil',
    })
  }
  if (!fieldState.country_of_residence || !fieldState.timezone) {
    blockers.push({
      code: 'missing_country_or_timezone',
      title: 'Pais ou fuso ausente',
      description: 'Pais e fuso precisam estar preenchidos no perfil de conta.',
      stage: 'c1_account_creation',
      actionHref: '/editar-perfil',
    })
  }
  return blockers
}

export function evaluateIdentityBlockers(fieldState: OnboardingFieldState): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.category_subcategory_specialty) {
    blockers.push({
      code: 'missing_taxonomy',
      title: 'Especialidade incompleta',
      description: 'Selecione categoria e especialidade para posicionar seu perfil.',
      stage: 'c2_basic_identity',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!fieldState.display_name) {
    blockers.push({
      code: 'missing_display_name',
      title: 'Nome profissional ausente',
      description: 'Defina um nome profissional visivel para os clientes.',
      stage: 'c2_basic_identity',
      actionHref: '/editar-perfil-profissional',
    })
  }
  return blockers
}

export function evaluatePublicProfileBlockers(
  fieldState: OnboardingFieldState,
  hasCredibility: boolean,
  categorySensitive: boolean,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.headline_short_bio) {
    blockers.push({
      code: 'missing_bio',
      title: 'Bio curta ausente',
      description: 'Adicione uma bio curta para explicar sua proposta de valor.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!fieldState.profile_photo) {
    blockers.push({
      code: 'missing_profile_photo',
      title: 'Foto de perfil ausente',
      description: 'Inclua uma foto para melhorar credibilidade do perfil.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil',
    })
  }
  if (!fieldState.primary_language) {
    blockers.push({
      code: 'missing_languages',
      title: 'Idiomas ausentes',
      description: 'Defina ao menos um idioma de atendimento.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (!hasCredibility) {
    blockers.push({
      code: 'missing_credibility_summary',
      title: 'Resumo de experiencia ausente',
      description: 'Adicione anos de experiencia para o perfil publico.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (categorySensitive && !fieldState.credentials_upload) {
    blockers.push({
      code: 'missing_credentials',
      title: 'Credenciais pendentes',
      description: 'Categorias sensiveis exigem upload de qualificacao para revisao.',
      stage: 'c3_public_profile',
      actionHref: '/editar-perfil-profissional',
    })
  }
  return blockers
}

export function evaluateServiceBlockers(fieldState: OnboardingFieldState): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.at_least_one_service) {
    blockers.push({
      code: 'missing_service',
      title: 'Servico nao configurado',
      description: 'Cadastre ao menos um servico para envio a revisao.',
      stage: 'c4_service_setup',
      actionHref: '/completar-perfil',
    })
  } else if (!fieldState.service_price_and_duration) {
    blockers.push({
      code: 'missing_service_pricing_duration',
      title: 'Servico sem preco ou duracao',
      description: 'Servico precisa de preco e duracao para operar.',
      stage: 'c4_service_setup',
      actionHref: '/editar-perfil-profissional',
    })
  }
  return blockers
}

export function evaluateAvailabilityBlockers(
  fieldState: OnboardingFieldState,
  hasMinimumNotice: boolean,
  hasMaxWindow: boolean,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.availability_baseline) {
    blockers.push({
      code: 'missing_availability',
      title: 'Disponibilidade nao configurada',
      description: 'Defina dias e horarios antes de enviar o perfil para revisao.',
      stage: 'c5_availability_calendar',
      actionHref: '/disponibilidade',
    })
  }
  if (!fieldState.acceptance_mode_choice || !hasMinimumNotice || !hasMaxWindow) {
    blockers.push({
      code: 'missing_booking_rules',
      title: 'Regras de agendamento incompletas',
      description: 'Configure modo de confirmacao, antecedencia minima e janela de agenda.',
      stage: 'c5_availability_calendar',
      actionHref: '/configuracoes-agendamento',
    })
  }
  return blockers
}

export function evaluateBillingBlockers(fieldState: OnboardingFieldState): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.professional_plan_selection) {
    blockers.push({
      code: 'missing_plan_selection',
      title: 'Plano profissional nao definido',
      description: 'Selecione um plano em /planos para continuar.',
      stage: 'c6_plan_billing_setup',
      actionHref: '/planos',
    })
  }
  return blockers
}

export function evaluatePayoutSetupBlockers(
  fieldState: OnboardingFieldState,
  onboardingFinanceBypass: boolean,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.billing_card_for_professional_plan && !onboardingFinanceBypass) {
    blockers.push({
      code: 'missing_billing_card',
      title: 'Cartao nao configurado',
      description: 'Adicione um cartao para ativar trial e assinatura do plano selecionado.',
      stage: 'c7_payout_payments',
      actionHref: '/planos',
    })
  }
  if (!fieldState.payout_connected_account_minimum && !onboardingFinanceBypass) {
    blockers.push({
      code: 'missing_payout_onboarding',
      title: 'Onboarding de payout pendente',
      description: 'Conclua a conexao de recebimento (Stripe Connect) para revisao final.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  return blockers
}

export function evaluateSubmitTermsBlockers(fieldState: OnboardingFieldState): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!fieldState.terms_acceptance) {
    blockers.push({
      code: 'missing_terms_acceptance',
      title: 'Aceite de termos pendente',
      description: 'Aceite os termos obrigatorios para concluir o envio do perfil.',
      stage: 'c8_submit_review',
      actionHref: '/onboarding-profissional',
    })
  }
  return blockers
}

export function evaluateGoLiveBlockers(
  canSubmitForReview: boolean,
  fieldState: OnboardingFieldState,
  categorySensitive: boolean,
  professionalStatus: string | null | undefined,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!canSubmitForReview) {
    blockers.push({
      code: 'missing_review_requirements',
      title: 'Requisitos de revisao incompletos',
      description: 'Complete C2-C7 antes de seguir para publicacao.',
      stage: 'c9_go_live',
      actionHref: '/onboarding-profissional',
    })
  }
  if (categorySensitive && !fieldState.credentials_upload) {
    blockers.push({
      code: 'missing_credentials',
      title: 'Credenciais obrigatorias pendentes',
      description: 'Para categorias sensiveis, o go-live exige credenciais anexadas.',
      stage: 'c9_go_live',
      actionHref: '/editar-perfil-profissional',
    })
  }
  if (professionalStatus !== 'approved') {
    blockers.push({
      code: 'pending_admin_approval',
      title: 'Aprovacao administrativa pendente',
      description: 'Seu perfil precisa ser aprovado para ficar publico e ativo.',
      stage: 'c9_go_live',
      actionHref: '/onboarding-profissional',
    })
  }
  return blockers
}

export function evaluateFirstBookingBlockers(
  canGoLive: boolean,
  goLiveBlockers: OnboardingBlocker[],
  fieldState: OnboardingFieldState,
  onboardingFinanceBypass: boolean,
  firstBookingEnabled: boolean | null | undefined,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!canGoLive) blockers.push(...goLiveBlockers)
  if (!fieldState.payout_connected_account_minimum && !onboardingFinanceBypass) {
    blockers.push({
      code: 'missing_payout_setup',
      title: 'Payout nao iniciado',
      description: 'Inicie onboarding de payout para aceitar o primeiro booking.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  if (!fieldState.payout_kyc_complete && !onboardingFinanceBypass) {
    blockers.push({
      code: 'missing_payout_kyc',
      title: 'KYC de payout incompleto',
      description: 'Finalize KYC para liberar o primeiro booking.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  if (!firstBookingEnabled) {
    blockers.push({
      code: 'first_booking_gate_disabled',
      title: 'Gate operacional do primeiro booking bloqueado',
      description: 'Primeiro booking depende de liberacao operacional/admin.',
      stage: 'c9_go_live',
      actionHref: '/onboarding-profissional',
    })
  }
  return blockers
}

export function evaluatePayoutReceiptBlockers(
  canGoLive: boolean,
  goLiveBlockers: OnboardingBlocker[],
  fieldState: OnboardingFieldState,
  onboardingFinanceBypass: boolean,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = []
  if (!canGoLive) blockers.push(...goLiveBlockers)
  if (!fieldState.payout_connected_account_minimum && !onboardingFinanceBypass) {
    blockers.push({
      code: 'missing_payout_setup',
      title: 'Payout nao iniciado',
      description: 'Inicie onboarding de payout para liberar recebimentos.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  if (!fieldState.payout_kyc_complete && !onboardingFinanceBypass) {
    blockers.push({
      code: 'missing_payout_kyc',
      title: 'KYC de payout incompleto',
      description: 'Finalize KYC para liberar recebimentos.',
      stage: 'c7_payout_payments',
      actionHref: '/configuracoes',
    })
  }
  return blockers
}
