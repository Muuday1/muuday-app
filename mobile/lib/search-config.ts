export type SearchCategoryOption = {
  slug: string
  name: string
  description: string
  icon: string
  legacySlugs: string[]
}

export const SEARCH_CATEGORIES: SearchCategoryOption[] = [
  {
    slug: 'saude-mental-bem-estar',
    name: 'Saúde Mental e Bem-estar Emocional',
    description: 'Psicologia, terapia e saúde emocional.',
    icon: '🧠',
    legacySlugs: ['psicologia'],
  },
  {
    slug: 'saude-corpo-movimento',
    name: 'Saúde, Corpo e Movimento',
    description: 'Cuidado físico, nutricional e bem-estar geral.',
    icon: '💪',
    legacySlugs: ['medicina', 'nutricao', 'fisioterapia'],
  },
  {
    slug: 'educacao-desenvolvimento',
    name: 'Educação e Desenvolvimento',
    description: 'Aulas, reforço, mentoria acadêmica.',
    icon: '📚',
    legacySlugs: ['educacao'],
  },
  {
    slug: 'contabilidade-financas',
    name: 'Contabilidade, Impostos e Finanças',
    description: 'Planejamento financeiro e impostos.',
    icon: '📊',
    legacySlugs: ['contabilidade'],
  },
  {
    slug: 'direito-suporte-juridico',
    name: 'Direito e Suporte Jurídico',
    description: 'Consultoria jurídica.',
    icon: '⚖️',
    legacySlugs: ['direito'],
  },
  {
    slug: 'carreira-negocios-desenvolvimento',
    name: 'Carreira, Negócios e Desenvolvimento Profissional',
    description: 'Evolução de carreira e consultoria.',
    icon: '🚀',
    legacySlugs: ['coaching'],
  },
  {
    slug: 'traducao-suporte-documental',
    name: 'Tradução e Suporte Documental',
    description: 'Tradução, revisão e documentação.',
    icon: '🌐',
    legacySlugs: [],
  },
  {
    slug: 'outro',
    name: 'Outro',
    description: 'Outros serviços especializados.',
    icon: '🧩',
    legacySlugs: [],
  },
]

const legacyToSearchCategorySlug: Record<string, string> = {
  psicologia: 'saude-mental-bem-estar',
  nutricao: 'saude-corpo-movimento',
  fisioterapia: 'saude-corpo-movimento',
  medicina: 'saude-corpo-movimento',
  educacao: 'educacao-desenvolvimento',
  contabilidade: 'contabilidade-financas',
  direito: 'direito-suporte-juridico',
  coaching: 'carreira-negocios-desenvolvimento',
  psychology: 'saude-mental-bem-estar',
  wellness: 'saude-corpo-movimento',
  nutrition: 'saude-corpo-movimento',
  education: 'educacao-desenvolvimento',
  accounting: 'contabilidade-financas',
  law: 'direito-suporte-juridico',
  other: 'outro',
}

export function normalizeSearchCategorySlug(rawCategory?: string | null): string {
  if (!rawCategory) return 'outro'
  if (SEARCH_CATEGORIES.some((category) => category.slug === rawCategory)) return rawCategory
  return legacyToSearchCategorySlug[rawCategory] || 'outro'
}

export function getSearchCategoryBySlug(slug?: string | null) {
  if (!slug) return null
  return SEARCH_CATEGORIES.find((category) => category.slug === slug) || null
}

export function getSearchCategoryLabel(rawCategory?: string | null): string {
  const normalized = normalizeSearchCategorySlug(rawCategory)
  return getSearchCategoryBySlug(normalized)?.name || 'Outro'
}
