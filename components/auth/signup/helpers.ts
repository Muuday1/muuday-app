import {
  PROFESSIONAL_TERMS,
  PROFESSIONAL_TERMS_VERSION,
  type ProfessionalTermKey,
} from '@/lib/legal/professional-terms'

export const PROFESSIONAL_TITLES = [
  'Sr.',
  'Sra.',
  'Srta.',
  'Dr.',
  'Dra.',
  'Prof.',
  'Profa.',
  'Prefiro não informar',
]

export const TARGET_AUDIENCE_OPTIONS = ['Adultos', 'Crianças', 'Casais', 'Empresas', 'Estudantes', 'Imigrantes']

export const PROFESSIONAL_LANGUAGE_OPTIONS = [
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

export const OTHER_LANGUAGE_OPTION = 'Outros'

export const QUALIFICATION_APPROVED_OPTIONS = [
  'Diploma de graduação',
  'Registro profissional',
  'Certificação técnica',
  'Especialização',
  'Mestrado',
  'Doutorado',
]

export const PROFESSIONAL_TERM_KEYS = PROFESSIONAL_TERMS.map(item => item.key) as ProfessionalTermKey[]

export function buildInitialTermsState(): Record<ProfessionalTermKey, boolean> {
  return {
    platform_terms: false,
    payment_terms: false,
    privacy_terms: false,
    regulated_scope_terms: false,
  }
}

export function normalizeOption(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function includesNormalizedOption(options: string[], value: string) {
  const normalizedValue = normalizeOption(value)
  return options.some(option => normalizeOption(option) === normalizedValue)
}

export function isRegistrationQualification(name: string) {
  return normalizeOption(name) === normalizeOption('Registro profissional')
}

export function sanitizeRedirectPath(value: string | null) {
  if (!value) return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

export function getRedirectHint(path: string) {
  if (!path) return ''
  if (path.startsWith('/agendar/')) return 'Após criar sua conta, você volta para concluir o agendamento.'
  if (path.startsWith('/solicitar/')) return 'Após criar sua conta, você volta para concluir a solicitação de horário.'
  if (path.startsWith('/profissional/')) return 'Após criar sua conta, você volta para o perfil do profissional.'
  if (path.startsWith('/buscar')) return 'Após criar sua conta, você volta para a busca.'
  return 'Após criar sua conta, você volta para a página anterior.'
}

export function getPasswordPolicyStatus(password: string) {
  const hasMinLength = password.length >= 7
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const passedCount = [hasMinLength, hasNumber, hasSymbol].filter(Boolean).length
  const isValid = hasMinLength && hasNumber && hasSymbol

  return { hasMinLength, hasNumber, hasSymbol, passedCount, isValid }
}

export function getPasswordStrength(password: string) {
  const policy = getPasswordPolicyStatus(password)

  if (!password) {
    return { label: 'Fraca', barClass: 'bg-slate-200', barWidth: '0%' }
  }
  if (policy.passedCount <= 1) {
    return { label: 'Fraca', barClass: 'bg-red-500', barWidth: '33%' }
  }
  if (policy.passedCount === 2) {
    return { label: 'Média', barClass: 'bg-amber-500', barWidth: '66%' }
  }
  return { label: 'Forte', barClass: 'bg-emerald-500', barWidth: '100%' }
}

export function inputClass(hasError: boolean) {
  if (hasError) {
    return 'w-full rounded-md border border-red-300 bg-red-50/40 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200'
  }
  return 'w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus-visible:border-[#9FE870] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20'
}
