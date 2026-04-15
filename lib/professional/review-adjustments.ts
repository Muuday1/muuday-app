export type ReviewAdjustmentSeverity = 'low' | 'medium' | 'high'

export type ReviewAdjustmentStageId =
  | 'c2_professional_identity'
  | 'c4_services'
  | 'c5_availability_calendar'
  | 'c6_plan_billing_setup_post'
  | 'c7_payout_receipt'
  | 'c8_submit_review'

export type ReviewAdjustmentItemInput = {
  stageId: ReviewAdjustmentStageId
  fieldKey: string
  message: string
  severity: ReviewAdjustmentSeverity
}

export type ReviewAdjustmentItem = ReviewAdjustmentItemInput & {
  id: string
  status: 'open' | 'resolved_by_professional' | 'resolved_by_admin' | 'reopened'
  createdAt: string
  resolvedAt: string | null
}

export const REVIEW_ADJUSTMENT_STAGE_LABELS: Record<ReviewAdjustmentStageId, string> = {
  c2_professional_identity: 'Identidade',
  c4_services: 'Serviços',
  c5_availability_calendar: 'Disponibilidade',
  c6_plan_billing_setup_post: 'Plano',
  c7_payout_receipt: 'Financeiro',
  c8_submit_review: 'Enviar',
}

export const REVIEW_ADJUSTMENT_PRESET_FIELDS: Array<{
  stageId: ReviewAdjustmentStageId
  fieldKey: string
  label: string
}> = [
  { stageId: 'c2_professional_identity', fieldKey: 'photo', label: 'Foto de perfil' },
  { stageId: 'c2_professional_identity', fieldKey: 'display_name', label: 'Nome público' },
  { stageId: 'c2_professional_identity', fieldKey: 'taxonomy', label: 'Categoria / subcategoria' },
  { stageId: 'c2_professional_identity', fieldKey: 'focus_tags', label: 'Tags de foco' },
  { stageId: 'c2_professional_identity', fieldKey: 'experience', label: 'Anos de experiência' },
  { stageId: 'c2_professional_identity', fieldKey: 'languages', label: 'Idiomas' },
  { stageId: 'c2_professional_identity', fieldKey: 'audience', label: 'Público atendido' },
  { stageId: 'c2_professional_identity', fieldKey: 'qualifications', label: 'Cursos e credenciamentos' },
  { stageId: 'c4_services', fieldKey: 'service_title', label: 'Título do serviço' },
  { stageId: 'c4_services', fieldKey: 'service_description', label: 'Descrição do serviço' },
  { stageId: 'c4_services', fieldKey: 'service_price', label: 'Preço / duração' },
  { stageId: 'c5_availability_calendar', fieldKey: 'weekly_schedule', label: 'Agenda semanal' },
  { stageId: 'c5_availability_calendar', fieldKey: 'booking_rules', label: 'Regras de agendamento' },
  { stageId: 'c5_availability_calendar', fieldKey: 'calendar_sync', label: 'Integração de calendário' },
  { stageId: 'c6_plan_billing_setup_post', fieldKey: 'plan_selection', label: 'Seleção de plano' },
  { stageId: 'c6_plan_billing_setup_post', fieldKey: 'plan_terms', label: 'Termos do plano' },
  { stageId: 'c7_payout_receipt', fieldKey: 'billing_card', label: 'Cartão para cobrança' },
  { stageId: 'c7_payout_receipt', fieldKey: 'payout_data', label: 'Dados de recebimento' },
  { stageId: 'c8_submit_review', fieldKey: 'required_terms', label: 'Termos obrigatórios' },
]

export const SECTION_TO_REVIEW_STAGES: Record<string, ReviewAdjustmentStageId[]> = {
  identity: ['c2_professional_identity'],
  public_profile: ['c2_professional_identity'],
  service: ['c4_services'],
  availability: ['c5_availability_calendar'],
}

export const SECTION_TO_REVIEW_FIELD_KEYS: Record<string, string[]> = {
  identity: [
    'display_name',
    'taxonomy',
    'focus_tags',
    'experience',
    'languages',
    'audience',
    'qualifications',
  ],
  public_profile: ['photo'],
  service: ['service_title', 'service_description', 'service_price'],
  availability: ['weekly_schedule', 'booking_rules', 'calendar_sync'],
}
