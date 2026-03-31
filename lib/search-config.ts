export type SearchCategoryOption = {
  slug: string
  name: string
  description: string
  icon: string
  legacySlugs: string[]
  specialties: string[]
}

export const SEARCH_CATEGORIES: SearchCategoryOption[] = [
  {
    slug: 'saude-mental-bem-estar',
    name: 'Saude Mental e Bem-estar Emocional',
    description: 'Psicologia, terapia e saude emocional.',
    icon: '🧠',
    legacySlugs: ['psicologia'],
    specialties: [
      'Psicólogo Clínico',
      'Neuropsicólogo',
      'Psicólogo Infantil',
      'Psicoterapeuta Cognitivo-Comportamental',
      'Psicoterapeuta Psicanalítico',
      'Terapeuta de Casal e Família',
      'Psiquiatra',
      'Psiquiatra Infantil',
      'Terapeuta Ocupacional em Saúde Mental',
      'Arteterapeuta',
    ],
  },
  {
    slug: 'saude-corpo-movimento',
    name: 'Saude, Corpo e Movimento',
    description: 'Cuidado fisico, nutricional e bem-estar geral.',
    icon: '💪',
    legacySlugs: ['medicina', 'nutricao', 'fisioterapia'],
    specialties: [
      'Médico Clínico Geral',
      'Pediatra',
      'Ginecologista',
      'Endocrinologista',
      'Nutricionista Clínico',
      'Nutricionista Esportivo',
      'Fisioterapeuta Ortopédico',
      'Fisioterapeuta Neurológico',
      'Fonoaudiólogo',
      'Personal Trainer Certificado',
    ],
  },
  {
    slug: 'educacao-desenvolvimento',
    name: 'Educacao e Desenvolvimento',
    description: 'Aulas, reforco, mentoria academica e aprendizado.',
    icon: '📚',
    legacySlugs: ['educacao'],
    specialties: [
      'Professor de Matemática',
      'Professor de Português',
      'Professor de Ciências',
      'Professor de Inglês',
      'Professor de Espanhol',
      'Professor de Francês',
      'Pedagogo',
      'Psicopedagogo',
      'Tutor para Vestibular e ENEM',
      'Mentor Acadêmico',
    ],
  },
  {
    slug: 'contabilidade-financas',
    name: 'Contabilidade, Impostos e Financas',
    description: 'Planejamento financeiro, impostos e regularizacao.',
    icon: '📊',
    legacySlugs: ['contabilidade'],
    specialties: [
      'Contador(a) CRC',
      'Auditor Contábil',
      'Controller Financeiro',
      'Perito Contábil',
      'Consultor Tributário',
      'Especialista em Imposto de Renda PF',
      'Especialista em Imposto de Renda PJ',
      'Especialista em MEI e Simples Nacional',
      'Planejador Financeiro CFP',
      'Consultor de Investimentos CEA',
    ],
  },
  {
    slug: 'direito-suporte-juridico',
    name: 'Direito e Suporte Juridico',
    description: 'Consultoria juridica para demandas no Brasil e exterior.',
    icon: '⚖️',
    legacySlugs: ['direito'],
    specialties: [
      'Advogado Cível',
      'Advogado de Família e Sucessões',
      'Advogado do Consumidor',
      'Advogado Trabalhista',
      'Advogado Empresarial',
      'Advogado Contratual',
      'Advogado Tributário',
      'Advogado de Imigração',
      'Consultor em Regularização Migratória',
      'Paralegal Documental',
    ],
  },
  {
    slug: 'carreira-negocios-desenvolvimento',
    name: 'Carreira, Negocios e Desenvolvimento Profissional',
    description: 'Evolucao de carreira, consultoria de negocios e produtividade.',
    icon: '🚀',
    legacySlugs: ['coaching'],
    specialties: [
      'Consultor de Carreira',
      'Headhunter / Recruiter',
      'Especialista em RH Estratégico',
      'Mentor de Liderança',
      'Consultor de Gestão Empresarial',
      'Consultor de Estratégia',
      'Consultor de Product Management',
      'Consultor de Marketing Digital',
      'Consultor de Vendas B2B',
      'Especialista em CRM e Funil de Vendas',
    ],
  },
  {
    slug: 'traducao-suporte-documental',
    name: 'Traducao e Suporte Documental',
    description: 'Traducao, revisao e suporte para documentacao oficial.',
    icon: '🌐',
    legacySlugs: [],
    specialties: [
      'Tradutor Juramentado',
      'Tradutor Jurídico',
      'Tradutor Técnico',
      'Tradutor Médico-Científico',
      'Intérprete de Conferência',
      'Intérprete Comunitário',
      'Revisor de Texto Profissional',
      'Consultor de Documentação para Imigração',
      'Especialista em Apostilamento de Haia',
      'Consultor de Equivalência de Diploma',
    ],
  },
  {
    slug: 'outro',
    name: 'Outro',
    description: 'Outros servicos especializados.',
    icon: '🧩',
    legacySlugs: [],
    specialties: [
      'Desenvolvedor de Software',
      'Engenheiro de Dados',
      'Cientista de Dados',
      'Analista de Segurança da Informação',
      'Arquiteto de Soluções Cloud',
      'Designer UX/UI',
      'Designer Gráfico',
      'Gestor de Projetos (PMP)',
      'Product Manager',
      'Scrum Master',
    ],
  },
]

const legacyToSearchCategorySlug: Record<string, string> = {
  // Portuguese legacy slugs (professionals.category text field)
  psicologia: 'saude-mental-bem-estar',
  nutricao: 'saude-corpo-movimento',
  fisioterapia: 'saude-corpo-movimento',
  medicina: 'saude-corpo-movimento',
  educacao: 'educacao-desenvolvimento',
  contabilidade: 'contabilidade-financas',
  direito: 'direito-suporte-juridico',
  coaching: 'carreira-negocios-desenvolvimento',
  // English legacy slugs (old categories table)
  psychology: 'saude-mental-bem-estar',
  wellness: 'saude-corpo-movimento',
  nutrition: 'saude-corpo-movimento',
  education: 'educacao-desenvolvimento',
  accounting: 'contabilidade-financas',
  law: 'direito-suporte-juridico',
  other: 'outro',
}

export const LANGUAGE_OPTIONS = [
  'Portugues',
  'English',
  'Espanol',
  'Frances',
  'Italiano',
  'Alemao',
]

export const AVAILABILITY_WINDOWS = [
  { value: 'qualquer', label: 'Qualquer horario' },
  { value: 'manha', label: 'Manha (06:00-12:00)' },
  { value: 'tarde', label: 'Tarde (12:00-18:00)' },
  { value: 'noite', label: 'Noite (18:00-23:00)' },
  { value: 'fim-semana', label: 'Fim de semana' },
]

export function normalizeSearchCategorySlug(rawCategory?: string | null): string {
  if (!rawCategory) return 'outro'
  if (SEARCH_CATEGORIES.some(category => category.slug === rawCategory)) return rawCategory
  return legacyToSearchCategorySlug[rawCategory] || 'outro'
}

export function getSearchCategoryBySlug(slug?: string | null) {
  if (!slug) return null
  return SEARCH_CATEGORIES.find(category => category.slug === slug) || null
}

export function getSearchCategoryLabel(rawCategory?: string | null) {
  const normalized = normalizeSearchCategorySlug(rawCategory)
  return getSearchCategoryBySlug(normalized)?.name || 'Outro'
}

export function matchesSelectedCategory(rawCategory: string | null | undefined, selectedCategory?: string) {
  if (!selectedCategory) return true
  const normalized = normalizeSearchCategorySlug(rawCategory)
  return normalized === selectedCategory
}

export function getSpecialtyOptions(selectedCategory?: string) {
  if (selectedCategory) {
    return getSearchCategoryBySlug(selectedCategory)?.specialties || []
  }
  const options = SEARCH_CATEGORIES.flatMap(category => category.specialties)
  return Array.from(new Set(options)).sort((a, b) => a.localeCompare(b))
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
}

function timeToMinutes(value: string) {
  const [hourStr, minuteStr] = value.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  return hour * 60 + minute
}

function overlapsRange(startMinutes: number, endMinutes: number, rangeStart: number, rangeEnd: number) {
  return startMinutes < rangeEnd && endMinutes > rangeStart
}

export function matchesAvailabilityWindow(rows: AvailabilityRow[], windowValue?: string) {
  if (!windowValue || windowValue === 'qualquer') return true
  if (!rows || rows.length === 0) return false

  if (windowValue === 'fim-semana') {
    return rows.some(row => row.day_of_week === 0 || row.day_of_week === 6)
  }

  const ranges: Record<string, [number, number]> = {
    manha: [6 * 60, 12 * 60],
    tarde: [12 * 60, 18 * 60],
    noite: [18 * 60, 23 * 60],
  }

  const range = ranges[windowValue]
  if (!range) return true

  return rows.some(row => {
    const start = timeToMinutes(row.start_time)
    const end = timeToMinutes(row.end_time)
    return overlapsRange(start, end, range[0], range[1])
  })
}
