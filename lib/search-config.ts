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
      'Terapia Cognitivo-Comportamental',
      'Terapia de Casal',
      'Terapia Familiar',
      'Ansiedade',
      'Depressao',
      'Burnout',
      'Mindfulness',
      'Orientacao Parental',
      'Psicanalise',
      'Coaching Emocional',
    ],
  },
  {
    slug: 'saude-corpo-movimento',
    name: 'Saude, Corpo e Movimento',
    description: 'Cuidado fisico, nutricional e bem-estar geral.',
    icon: '💪',
    legacySlugs: ['medicina', 'nutricao', 'fisioterapia'],
    specialties: [
      'Clinica Geral',
      'Nutricao Clinica',
      'Emagrecimento Saudavel',
      'Saude da Mulher',
      'Reabilitacao Fisica',
      'Fisioterapia Esportiva',
      'Dor Cronica',
      'Postura e Ergonomia',
      'Preparacao Fisica',
      'Saude Preventiva',
    ],
  },
  {
    slug: 'educacao-desenvolvimento',
    name: 'Educacao e Desenvolvimento',
    description: 'Aulas, reforco, mentoria academica e aprendizado.',
    icon: '📚',
    legacySlugs: ['educacao'],
    specialties: [
      'Reforco Escolar',
      'Preparacao para Vestibular',
      'Aulas de Idiomas',
      'Aulas de Matematica',
      'Aulas de Ciencias',
      'Mentoria Universitaria',
      'Tecnicas de Estudo',
      'Alfabetizacao',
      'Educacao Infantil',
      'Acompanhamento Pedagogico',
    ],
  },
  {
    slug: 'contabilidade-financas',
    name: 'Contabilidade, Impostos e Financas',
    description: 'Planejamento financeiro, impostos e regularizacao.',
    icon: '📊',
    legacySlugs: ['contabilidade'],
    specialties: [
      'Imposto de Renda',
      'Planejamento Tributario',
      'Abertura de Empresa',
      'MEI e Simples Nacional',
      'Contabilidade para Expatriados',
      'BPO Financeiro',
      'Controle de Caixa',
      'Declaracoes Fiscais',
      'Planejamento Financeiro Pessoal',
      'Investimentos Basicos',
    ],
  },
  {
    slug: 'direito-suporte-juridico',
    name: 'Direito e Suporte Juridico',
    description: 'Consultoria juridica para demandas no Brasil e exterior.',
    icon: '⚖️',
    legacySlugs: ['direito'],
    specialties: [
      'Imigracao',
      'Direito de Familia',
      'Direito Trabalhista',
      'Direito Contratual',
      'Direito Empresarial',
      'Direito do Consumidor',
      'Regularizacao Documental',
      'Apostilamento',
      'Procuracoes',
      'Consultoria Preventiva',
    ],
  },
  {
    slug: 'carreira-negocios-desenvolvimento',
    name: 'Carreira, Negocios e Desenvolvimento Profissional',
    description: 'Evolucao de carreira, consultoria de negocios e produtividade.',
    icon: '🚀',
    legacySlugs: ['coaching'],
    specialties: [
      'Mentoria de Carreira',
      'Transicao de Carreira',
      'Curriculo e LinkedIn',
      'Preparacao para Entrevistas',
      'Estrategia de Negocios',
      'Marketing para Profissionais',
      'Vendas e Negociacao',
      'Lideranca',
      'Produtividade',
      'Planejamento de Metas',
    ],
  },
  {
    slug: 'traducao-suporte-documental',
    name: 'Traducao e Suporte Documental',
    description: 'Traducao, revisao e suporte para documentacao oficial.',
    icon: '🌐',
    legacySlugs: [],
    specialties: [
      'Traducao Juramentada',
      'Traducao Simples',
      'Revisao de Textos',
      'Documentos Academicos',
      'Documentos para Imigracao',
      'Curriculo Internacional',
      'Carta de Motivacao',
      'Apostilamento e Legalizacao',
      'Formulario e Burocracia',
      'Interpretacao Remota',
    ],
  },
  {
    slug: 'outro',
    name: 'Outro',
    description: 'Outros servicos especializados.',
    icon: '🧩',
    legacySlugs: [],
    specialties: [
      'Consultoria Personalizada',
      'Suporte Tecnico',
      'Projetos Especiais',
      'Orientacao Geral',
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
