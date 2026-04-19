import { PROFESSIONAL_TERMS, type ProfessionalTermKey } from '@/lib/legal/professional-terms'
import type { PlanTier } from './types'

export const WEEK_DAYS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

export const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h += 1) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

export const UI_STAGE_ORDER = [
  'c2_professional_identity',
  'c4_services',
  'c5_availability_calendar',
  'c6_plan_billing_setup_post',
  'c7_payout_receipt',
  'c8_submit_review',
] as const

export const UI_STAGE_LABELS: Record<(typeof UI_STAGE_ORDER)[number], string> = {
  c2_professional_identity: 'Identidade',
  c4_services: 'Serviços',
  c5_availability_calendar: 'Disponibilidade',
  c6_plan_billing_setup_post: 'Plano',
  c7_payout_receipt: 'Financeiro',
  c8_submit_review: 'Enviar',
}

export const UI_STAGE_BACKEND_STAGE_IDS: Record<(typeof UI_STAGE_ORDER)[number], string[]> = {
  c2_professional_identity: ['c2_basic_identity', 'c3_public_profile'],
  c4_services: ['c4_service_setup'],
  c5_availability_calendar: ['c5_availability_calendar'],
  c6_plan_billing_setup_post: ['c6_plan_billing_setup'],
  c7_payout_receipt: ['c7_payout_payments'],
  c8_submit_review: ['c8_submit_review'],
}

export const ACTIONABLE_ADJUSTMENT_STAGE_IDS = new Set<string>([
  'c2_professional_identity',
  'c4_services',
  'c5_availability_calendar',
  'c6_plan_billing_setup_post',
  'c7_payout_receipt',
  'c8_submit_review',
])

export const TERMS_KEYS = PROFESSIONAL_TERMS.map(item => item.key) as ProfessionalTermKey[]

export const PLAN_PRICE_BASE_BRL: Record<PlanTier, number> = {
  basic: 49.99,
  professional: 99.99,
  premium: 149.99,
}

export const PLAN_COMPARISON_ROWS: Array<{ label: string; basic: string; professional: string; premium: string }> = [
  { label: 'Período sem cobrança', basic: '90 dias', professional: '90 dias', premium: '90 dias' },
  { label: 'Serviços ativos', basic: '1', professional: '3', premium: '5' },
  { label: 'Especialidades no perfil', basic: '1', professional: '3', premium: '3' },
  { label: 'Tags de foco', basic: '3', professional: '4', premium: '5' },
  { label: 'Janela de agendamento', basic: '30 dias', professional: '90 dias', premium: '180 dias' },
  { label: 'Opções por serviço', basic: '1', professional: '3', premium: '6' },
  { label: 'Antecedência mínima', basic: '0h a 48h', professional: '0h a 96h', premium: '0h a 168h' },
  { label: 'Buffer configurável', basic: 'Não (fixo em 15 min)', professional: 'Sim', premium: 'Sim' },
  { label: 'Confirmação manual', basic: 'Não', professional: 'Sim', premium: 'Sim' },
  { label: 'Auto-aceite', basic: 'Não', professional: 'Sim', premium: 'Sim' },
  { label: 'Exportação PDF', basic: 'Não', professional: 'Não', premium: 'Sim' },
]

export const PLAN_ROW_BY_LABEL = PLAN_COMPARISON_ROWS.reduce<
  Record<string, { label: string; basic: string; professional: string; premium: string }>
>((acc, row) => {
  acc[row.label] = row
  return acc
}, {})

export const PLAN_TIER_LABELS: Record<string, string> = {
  basic: 'Básico',
  professional: 'Profissional',
  premium: 'Premium',
}

export const LANGUAGE_OPTIONS = [
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Italiano',
  'Alemão',
  'Holandês',
  'Árabe',
  'Mandarim',
  'Japonês',
  'Coreano',
  'Hindi',
  'Russo',
  'Ucraniano',
  'Hebraico',
]

export const PROFESSIONAL_TITLES = ['Sr.', 'Sra.', 'Srta.', 'Dr.', 'Dra.', 'Prof.', 'Profa.', 'Prefiro não informar']
export const TARGET_AUDIENCE_OPTIONS = ['Adultos', 'Crianças', 'Casais', 'Empresas', 'Estudantes', 'Imigrantes']
export const QUALIFICATION_APPROVED_OPTIONS = [
  'Diploma de graduação',
  'Registro profissional',
  'Certificação técnica',
  'Especialização',
  'Mestrado',
  'Doutorado',
]
export const QUALIFICATION_FILE_MAX_SIZE_BYTES = 2 * 1024 * 1024
export const QUALIFICATION_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
