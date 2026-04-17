export const metadata = { title: 'Buscar Profissionais | Muuday' }
export const revalidate = 0
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, PlayCircle, MessageCircle } from 'lucide-react'
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer'
import { SearchBookingCtas } from '@/components/search/SearchBookingCtas'
import { DesktopFiltersAutoApply } from '@/components/search/DesktopFiltersAutoApply'
import { SearchQueryBar } from '@/components/search/SearchQueryBar'
import { ExpandableTags } from '@/components/search/ExpandableTags'
import {
  buildSubcategoryOptionsByCategorySlug,
  buildSpecialtyOptionsBySubcategorySlug,
  buildSpecialtyOptionsByCategorySlug,
  loadActiveTaxonomyCatalog,
  loadProfessionalSpecialtyContext,
} from '@/lib/taxonomy/professional-specialties'
import { getCachedRuntimeValue } from '@/lib/cache/runtime-cache'
import { getExchangeRates } from '@/lib/exchange-rates'
import { normalizeCurrency } from '@/lib/public-preferences'
import {
  SEARCH_CATEGORIES,
  getSearchCategoryLabel,
  matchesAvailabilityWindow,
  matchesSelectedCategory,
  normalizeSearchCategorySlug,
} from '@/lib/search-config'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import {
  filterPubliclyVisibleProfessionals,
  type ProfessionalSearchRecord,
} from '@/lib/professional/public-visibility'

type BuscarSearchParams = {
  q?: string
  categoria?: string
  subcategoria?: string
  especialidade?: string
  precoMin?: string
  precoMax?: string
  horario?: string
  localizacao?: string
  idioma?: string
  ordenar?: string
  pagina?: string
  moeda?: string
}

type AvailabilityRow = {
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type SearchQueryState = {
  q: string
  categoria: string
  subcategoria: string
  especialidade: string
  precoMin: string
  precoMax: string
  horario: string
  localizacao: string
  idioma: string
  ordenar: string
  pagina: string
  moeda: string
}

type SearchPgTrgmParams = {
  queryText: string
  selectedCategory: string
  selectedSpecialty: string
  selectedLanguage: string
  selectedLocation: string
  minPriceBrl: number | null
  maxPriceBrl: number | null
}

type SearchCandidateRow = {
  professional_id: string
}

type SpecialtyContext = Awaited<ReturnType<typeof loadProfessionalSpecialtyContext>>

type PublicSearchBaseData = {
  professionals: SearchProfessional[]
  specialtyContext: SpecialtyContext
  availabilityRows: AvailabilityRow[]
}

type SearchProfessional = ProfessionalSearchRecord & {
  user_id: string
  public_code?: string | null
  total_bookings?: number | null
  total_reviews?: number | null
  rating?: number | null
  category?: string | null
  subcategories?: string[] | null
  tags?: string[] | null
  tier?: string | null
  session_price_brl?: number | null
  session_duration_minutes?: number | null
  languages?: string[] | null
  profiles?: {
    full_name?: string | null
    country?: string | null
    avatar_url?: string | null
    role?: string | null
  } | null
}

const PAGE_SIZE = 10
const PUBLIC_SEARCH_BASE_CACHE_KEY = 'buscar:public-base:v2'
const PUBLIC_SEARCH_BASE_CACHE_TTL_MS = 180_000
const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
}
const OPEN_ENDED_MAX_USD = 50

const EMPTY_SPECIALTY_CONTEXT: SpecialtyContext = {
  byProfessionalId: new Map<string, string[]>(),
  primaryByProfessionalId: new Map<string, string>(),
  categorySlugsByProfessionalId: new Map<string, string[]>(),
  subcategoryNamesByProfessionalId: new Map<string, string[]>(),
  subcategorySlugsByProfessionalId: new Map<string, string[]>(),
}


function normalizeText(value?: string | null) {
  return (value || '').toLowerCase().trim()
}

function parseOptionalNumber(value?: string) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePage(value?: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

function buildSearchQueryState(input: SearchQueryState): SearchQueryState {
  return {
    ...input,
    q: input.q || '',
    categoria: input.categoria || '',
    subcategoria: input.subcategoria || '',
    especialidade: input.especialidade || '',
    precoMin: input.precoMin || '',
    precoMax: input.precoMax || '',
    horario: input.horario || 'qualquer',
    localizacao: input.localizacao || '',
    idioma: input.idioma || 'qualquer',
    ordenar: input.ordenar || 'relevancia',
    pagina: input.pagina || '1',
    moeda: input.moeda || '',
  }
}

function getCountryDisplayName(countryCodeOrName?: string | null) {
  if (!countryCodeOrName) return 'Online'
  const normalized = countryCodeOrName.trim()
  if (!normalized) return 'Online'

  if (/^[A-Za-z]{2}$/.test(normalized)) {
    try {
      const displayNames = new Intl.DisplayNames(['pt-BR', 'en'], { type: 'region' })
      const resolved = displayNames.of(normalized.toUpperCase())
      if (resolved) return resolved
    } catch {}
  }

  return normalized
}

function formatSearchPrice(
  amountBRL: number,
  currency = 'BRL',
  locale = 'pt-BR',
  exchangeRates?: Record<string, number>,
): string {
  const rate = exchangeRates?.[currency] || 1
  const converted = Math.ceil(Number(amountBRL || 0) * rate)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted)
  } catch {
    return `${currency} ${converted}`
  }
}

function getPrimarySpecialty(professional: SearchProfessional, primarySpecialty?: string | null) {
  if (primarySpecialty && String(primarySpecialty).trim()) {
    return String(primarySpecialty)
  }

  const subcategory = (professional.subcategories || []).find((entry: string) =>
    String(entry || '').trim(),
  )
  if (subcategory) return String(subcategory)

  const tag = (professional.tags || []).find((entry: string) => String(entry || '').trim())
  if (tag) return String(tag)

  return getSearchCategoryLabel(professional.category)
}

function getNameInitial(name?: string | null, fallback = 'P') {
  const normalized = String(name || '').trim()
  if (!normalized) return fallback
  return normalized.charAt(0).toUpperCase()
}

const TIER_BOOST: Record<string, number> = { premium: 0.15, professional: 0.08, basic: 0 }

function getRelevanceScore(pro: SearchProfessional): number {
  const rating = Number(pro.rating || 0)
  const reviews = Number(pro.total_reviews || 0)
  const bookings = Number(pro.total_bookings || 0)
  const tier = (pro.tier as string) || 'basic'
  const tierBoost = TIER_BOOST[tier] || 0

  const ratingScore = rating / 5
  const volumeScore = Math.min(1, (reviews + bookings) / 50)
  const base = ratingScore * 0.5 + volumeScore * 0.35
  return base + tierBoost
}

function getSortedProfessionals(list: SearchProfessional[], sort: string) {
  const cloned = [...list]

  if (sort === 'preco-menor') {
    return cloned.sort((a, b) => Number(a.session_price_brl || 0) - Number(b.session_price_brl || 0))
  }

  if (sort === 'preco-maior') {
    return cloned.sort((a, b) => Number(b.session_price_brl || 0) - Number(a.session_price_brl || 0))
  }

  if (sort === 'melhor-avaliacao') {
    return cloned.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
  }

  if (sort === 'mais-agendados') {
    return cloned.sort((a, b) => Number(b.total_bookings || 0) - Number(a.total_bookings || 0))
  }

  return cloned.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a))
}

function buildHref(basePath: string, state: SearchQueryState, overrides: Partial<Record<keyof BuscarSearchParams, string>>) {
  const merged: Partial<Record<keyof BuscarSearchParams, string>> = { ...state, ...overrides }
  const params = new URLSearchParams()
  Object.entries(merged).forEach(([key, value]) => {
    if (!value) return
    if ((key === 'horario' || key === 'idioma') && value === 'qualquer') return
    if (key === 'ordenar' && value === 'relevancia') return
    if (key === 'pagina' && value === '1') return
    params.set(key, value)
  })
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

function buildPublicSearchVariantCacheKey(args: {
  queryText: string
  selectedCategory: string
  selectedSpecialty: string
  selectedLanguage: string
  selectedLocation: string
  minPriceBrl: number | null
  maxPriceBrl: number | null
}) {
  const parts = [
    args.queryText,
    args.selectedCategory,
    args.selectedSpecialty,
    args.selectedLanguage,
    args.selectedLocation,
    args.minPriceBrl === null ? '' : String(args.minPriceBrl),
    args.maxPriceBrl === null ? '' : String(args.maxPriceBrl),
  ]
  return `buscar:public-variant:v2:${parts.map(value => normalizeText(value)).join('|')}`
}

async function loadPublicSearchBaseData(readClient: SupabaseClient): Promise<PublicSearchBaseData> {
  return loadPublicSearchBaseDataByIds(readClient, null)
}

async function loadPublicSearchBaseDataByIds(
  readClient: SupabaseClient,
  candidateIds: string[] | null,
): Promise<PublicSearchBaseData> {
  if (candidateIds && candidateIds.length === 0) {
    return {
      professionals: [],
      specialtyContext: EMPTY_SPECIALTY_CONTEXT,
      availabilityRows: [],
    }
  }

  const buildQuery = (useVisibilityColumn: boolean) => {
    let query = readClient
      .from('professionals')
      .select(
        'id,user_id,public_code,status,bio,category,subcategories,tags,languages,years_experience,session_price_brl,session_duration_minutes,rating,total_reviews,total_bookings,tier,first_booking_enabled,cover_photo_url,video_intro_url,whatsapp_number,social_links,profiles!inner(full_name,country,avatar_url,role)',
      )
      .eq('status', 'approved')
      .eq('profiles.role', 'profissional')

    if (useVisibilityColumn) {
      query = query.eq('is_publicly_visible', true)
    }

    if (candidateIds && candidateIds.length > 0) {
      query = query.in('id', candidateIds)
    } else {
      query = query.order('rating', { ascending: false }).limit(250)
    }

    return query
  }

  let { data: professionalsRaw, error: professionalsError } = await buildQuery(true)
  let professionals = (professionalsRaw || []) as SearchProfessional[]
  if (professionalsError?.message?.includes('is_publicly_visible')) {
    const fallbackResult = await buildQuery(false)
    professionals = (fallbackResult.data || []) as SearchProfessional[]
    if (professionals.length > 0) {
      professionals = (await filterPubliclyVisibleProfessionals(
        readClient,
        professionals,
      )) as SearchProfessional[]
    }
  }

  const professionalIds = professionals.map((professional: SearchProfessional) => String(professional.id))
  let specialtyContext: SpecialtyContext = EMPTY_SPECIALTY_CONTEXT
  let availabilityRows: AvailabilityRow[] = []
  if (professionalIds.length > 0) {
    const [resolvedSpecialtyContext, availabilityResult] = await Promise.all([
      loadProfessionalSpecialtyContext(readClient, professionalIds),
      readClient
        .from('availability')
        .select('professional_id,day_of_week,start_time,end_time')
        .in('professional_id', professionalIds)
        .eq('is_active', true),
    ])

    specialtyContext = resolvedSpecialtyContext
    availabilityRows = (availabilityResult.data || []) as AvailabilityRow[]
  }

  return {
    professionals,
    specialtyContext,
    availabilityRows,
  }
}

async function fetchSearchCandidateIdsPgTrgm(
  readClient: SupabaseClient,
  params: SearchPgTrgmParams,
): Promise<string[] | null> {
  const shouldUsePgSearch = Boolean(
    params.queryText ||
      params.selectedCategory ||
      params.selectedSpecialty ||
      params.selectedLanguage !== 'qualquer' ||
      params.selectedLocation ||
      params.minPriceBrl !== null ||
      params.maxPriceBrl !== null,
  )

  if (!shouldUsePgSearch) {
    return null
  }

  try {
    const { data, error } = await readClient.rpc('search_public_professionals_pgtrgm', {
      p_query: params.queryText || null,
      p_category: params.selectedCategory || null,
      p_specialty: params.selectedSpecialty || null,
      p_language: params.selectedLanguage !== 'qualquer' ? params.selectedLanguage : null,
      p_location: params.selectedLocation || null,
      p_min_price_brl: params.minPriceBrl,
      p_max_price_brl: params.maxPriceBrl,
      p_limit: 1200,
    })

    if (error) return null

    return Array.from(
      new Set(
        ((data || []) as SearchCandidateRow[])
          .map(row => String(row.professional_id || '').trim())
          .filter(Boolean),
      ),
    )
  } catch {
    return null
  }
}

export async function BuscarPageContent({
  searchParams,
  isLoggedIn = false,
  basePath = '/buscar',
}: {
  searchParams: BuscarSearchParams
  isLoggedIn?: boolean
  basePath?: string
}) {
  const readClient = createAdminClient()
  const exchangeRates = await getExchangeRates(readClient || undefined)

  const queryText = (searchParams.q || '').trim()
  const selectedCategory = searchParams.categoria || ''
  const selectedSubcategory = selectedCategory ? searchParams.subcategoria || '' : ''
  const selectedSpecialty =
    selectedCategory && selectedSubcategory ? searchParams.especialidade || '' : ''
  const selectedAvailability = searchParams.horario || 'qualquer'
  const rawSelectedLocation = (searchParams.localizacao || '').trim()
  const selectedLocation = rawSelectedLocation ? getCountryDisplayName(rawSelectedLocation) : ''
  const selectedLanguage = searchParams.idioma || 'qualquer'
  const selectedSort = searchParams.ordenar || 'relevancia'
  const selectedPage = String(parsePage(searchParams.pagina))
  const requestedCurrency = searchParams.moeda || ''
  const minPrice = parseOptionalNumber(searchParams.precoMin)
  const maxPrice = parseOptionalNumber(searchParams.precoMax)

  const selectedCurrency = normalizeCurrency(requestedCurrency) || 'BRL'
  const selectedCurrencyRate = exchangeRates[selectedCurrency] || 1
  const selectedCurrencyLabel = CURRENCY_LABELS[selectedCurrency] || selectedCurrency
  const minPriceBrl = minPrice === null ? null : minPrice / selectedCurrencyRate
  const maxPriceBrl = maxPrice === null ? null : maxPrice / selectedCurrencyRate

  const queryState = buildSearchQueryState({
    q: queryText,
    categoria: selectedCategory,
    subcategoria: selectedSubcategory,
    especialidade: selectedSpecialty,
    precoMin: searchParams.precoMin || '',
    precoMax: searchParams.precoMax || '',
    horario: selectedAvailability,
    localizacao: selectedLocation,
    idioma: selectedLanguage,
    ordenar: selectedSort,
    pagina: selectedPage,
    moeda: selectedCurrency,
  })
  let professionals: SearchProfessional[] = []
  let specialtyContext: SpecialtyContext = EMPTY_SPECIALTY_CONTEXT
  let cachedAvailabilityRows: AvailabilityRow[] = []
  if (readClient) {
    try {
      const candidateIds = await fetchSearchCandidateIdsPgTrgm(readClient, {
        queryText,
        selectedCategory,
        selectedSpecialty,
        selectedLanguage,
        selectedLocation: rawSelectedLocation,
        minPriceBrl,
        maxPriceBrl,
      })
      const variantCacheKey = buildPublicSearchVariantCacheKey({
        queryText,
        selectedCategory,
        selectedSpecialty,
        selectedLanguage,
        selectedLocation: rawSelectedLocation,
        minPriceBrl,
        maxPriceBrl,
      })

      if (candidateIds === null) {
        const cached = await getCachedRuntimeValue(
          PUBLIC_SEARCH_BASE_CACHE_KEY,
          PUBLIC_SEARCH_BASE_CACHE_TTL_MS,
          () => loadPublicSearchBaseData(readClient),
        )
        professionals = cached.professionals
        specialtyContext = cached.specialtyContext
        cachedAvailabilityRows = cached.availabilityRows
      } else {
        const cached = await getCachedRuntimeValue(
          variantCacheKey,
          PUBLIC_SEARCH_BASE_CACHE_TTL_MS,
          () => loadPublicSearchBaseDataByIds(readClient, candidateIds),
        )
        professionals = cached.professionals
        specialtyContext = cached.specialtyContext
        cachedAvailabilityRows = cached.availabilityRows
      }
    } catch {
      professionals = []
      specialtyContext = EMPTY_SPECIALTY_CONTEXT
      cachedAvailabilityRows = []
    }
  }

  const specialtiesByProfessionalId = specialtyContext.byProfessionalId
  const primarySpecialtyByProfessionalId = specialtyContext.primaryByProfessionalId
  const categorySlugsByProfessionalId = specialtyContext.categorySlugsByProfessionalId
  const subcategoryNamesByProfessionalId = specialtyContext.subcategoryNamesByProfessionalId
  const subcategorySlugsByProfessionalId = specialtyContext.subcategorySlugsByProfessionalId
  let taxonomySubcategoriesByCategory = new Map<string, Array<{ slug: string; name: string }>>()
  let taxonomySpecialtiesByCategory = new Map<string, string[]>()
  let taxonomySpecialtiesBySubcategory = new Map<string, string[]>()

  if (readClient) {
    const taxonomyCatalog = await loadActiveTaxonomyCatalog(readClient)
    if (taxonomyCatalog) {
      taxonomySubcategoriesByCategory = buildSubcategoryOptionsByCategorySlug(taxonomyCatalog)
      taxonomySpecialtiesByCategory = buildSpecialtyOptionsByCategorySlug(taxonomyCatalog)
      taxonomySpecialtiesBySubcategory = buildSpecialtyOptionsBySubcategorySlug(taxonomyCatalog)
    }
  }

  const categorySlugsWithProfessionals = new Set(
    professionals
      .map((professional: SearchProfessional) => normalizeSearchCategorySlug(professional.category))
      .filter(Boolean),
  )
  professionals.forEach((professional: SearchProfessional) => {
    ;(categorySlugsByProfessionalId.get(String(professional.id)) || []).forEach(slug =>
      categorySlugsWithProfessionals.add(slug),
    )
  })
  const categoryOptionsFromData = SEARCH_CATEGORIES.filter(category =>
    categorySlugsWithProfessionals.has(category.slug),
  )
  const categoryOptions = categoryOptionsFromData.length > 0 ? categoryOptionsFromData : SEARCH_CATEGORIES

  const professionalMatchesSelectedCategory = (professional: SearchProfessional) => {
    if (!selectedCategory) return true
    if (matchesSelectedCategory(professional.category, selectedCategory)) return true

    const categorySlugs = categorySlugsByProfessionalId.get(String(professional.id)) || []
    return categorySlugs.includes(selectedCategory)
  }

  const selectedSubcategoryName = selectedCategory
    ? taxonomySubcategoriesByCategory
        .get(selectedCategory)
        ?.find(subcategory => subcategory.slug === selectedSubcategory)?.name || ''
    : ''

  const professionalMatchesSelectedSubcategory = (professional: SearchProfessional) => {
    if (!selectedSubcategory) return true

    const subcategorySlugs = subcategorySlugsByProfessionalId.get(String(professional.id)) || []
    if (subcategorySlugs.includes(selectedSubcategory)) return true

    const acceptedSubcategoryNames = [selectedSubcategoryName, selectedSubcategory]
      .map(value => normalizeText(value))
      .filter(Boolean)
    const subcategoryNames = [
      ...(subcategoryNamesByProfessionalId.get(String(professional.id)) || []),
      ...((professional.subcategories || []) as string[]),
    ]

    return subcategoryNames.some(subcategory =>
      acceptedSubcategoryNames.includes(normalizeText(subcategory)),
    )
  }

  const optionBaseProfessionals = selectedCategory
    ? professionals.filter((professional: SearchProfessional) =>
        professionalMatchesSelectedCategory(professional),
      )
    : professionals

  const subcategoryOptionBaseProfessionals = selectedSubcategory
    ? optionBaseProfessionals.filter((professional: SearchProfessional) =>
        professionalMatchesSelectedSubcategory(professional),
      )
    : optionBaseProfessionals

  const availableSubcategorySlugs = new Set<string>()
  optionBaseProfessionals.forEach((professional: SearchProfessional) => {
    const subcategorySlugs = subcategorySlugsByProfessionalId.get(String(professional.id)) || []
    subcategorySlugs.forEach(slug => {
      const normalized = normalizeText(slug)
      if (normalized) availableSubcategorySlugs.add(normalized)
    })
  })

  const subcategoriesForSelectedCategory =
    (selectedCategory && taxonomySubcategoriesByCategory.get(selectedCategory)) || []
  const subcategoriesFilteredByAvailability = subcategoriesForSelectedCategory.filter(subcategory =>
    availableSubcategorySlugs.has(normalizeText(subcategory.slug)),
  )
  const subcategoryOptions = selectedCategory
    ? (
        subcategoriesFilteredByAvailability.length > 0
          ? subcategoriesFilteredByAvailability
          : subcategoriesForSelectedCategory
      )
    : []

  const availableCanonicalSpecialties = new Set<string>()
  subcategoryOptionBaseProfessionals.forEach((professional: SearchProfessional) => {
    const canonicalSpecialties = specialtiesByProfessionalId.get(String(professional.id)) || []
    canonicalSpecialties.forEach((specialty: string) => {
      const normalized = normalizeText(specialty)
      if (normalized) availableCanonicalSpecialties.add(normalized)
    })
  })

  const fallbackCategorySpecialties = selectedSubcategory
    ? taxonomySpecialtiesByCategory.get(selectedCategory) || []
    : []
  const specialtiesForSelectedSubcategory =
    (selectedSubcategory && taxonomySpecialtiesBySubcategory.get(selectedSubcategory)) ||
    fallbackCategorySpecialties
  const categorySpecialtiesFilteredByAvailability = specialtiesForSelectedSubcategory.filter(specialty =>
    availableCanonicalSpecialties.has(normalizeText(specialty)),
  )
  const specialtyOptions = selectedSubcategory
    ? (
        categorySpecialtiesFilteredByAvailability.length > 0
          ? categorySpecialtiesFilteredByAvailability
          : specialtiesForSelectedSubcategory
      )
    : []

  const languageSet = new Map<string, string>()
  optionBaseProfessionals.forEach((professional: SearchProfessional) => {
    ;(professional.languages || []).forEach((language: string) => {
      const trimmed = String(language || '').trim()
      if (!trimmed) return
      const key = normalizeText(trimmed)
      if (!languageSet.has(key)) languageSet.set(key, trimmed)
    })
  })
  const languageOptions = Array.from(languageSet.values()).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  )

  let filteredProfessionals = professionals.filter((pro: SearchProfessional) => {
    if (selectedCategory && !professionalMatchesSelectedCategory(pro)) return false
    if (selectedSubcategory && !professionalMatchesSelectedSubcategory(pro)) return false
    if (minPriceBrl !== null && Number(pro.session_price_brl) < minPriceBrl) return false
    if (maxPriceBrl !== null && Number(pro.session_price_brl) > maxPriceBrl) return false

    if (selectedLanguage !== 'qualquer') {
      const languages = (pro.languages || []).map((language: string) => normalizeText(language))
      if (!languages.includes(normalizeText(selectedLanguage))) return false
    }

    if (selectedLocation) {
      const countryName = getCountryDisplayName(pro.profiles?.country)
      const locationHaystack = `${countryName} ${pro.bio || ''}`
      if (!normalizeText(locationHaystack).includes(normalizeText(selectedLocation))) return false
    }

    if (selectedSpecialty) {
      const canonicalSpecialties = specialtiesByProfessionalId.get(String(pro.id)) || []
      const hasSelectedSpecialty = canonicalSpecialties.some(
        specialty => normalizeText(specialty) === normalizeText(selectedSpecialty),
      )
      if (!hasSelectedSpecialty) return false
    }

    if (queryText) {
      const canonicalSpecialties = specialtiesByProfessionalId.get(String(pro.id)) || []
      const queryHaystack = [
        pro.profiles?.full_name || '',
        pro.bio || '',
        pro.category || '',
        ...canonicalSpecialties,
        ...(pro.tags || []),
        ...(pro.subcategories || []),
      ]
        .join(' ')
        .toLowerCase()
      if (!queryHaystack.includes(normalizeText(queryText))) return false
    }

    return true
  })

  if (readClient && selectedAvailability !== 'qualquer' && filteredProfessionals.length > 0) {
    const ids = filteredProfessionals.map((pro: SearchProfessional) => pro.id)
    const idsSet = new Set(ids)
    let availabilityRows: AvailabilityRow[] = []
    let availabilityError = false

    if (!isLoggedIn && cachedAvailabilityRows.length > 0) {
      availabilityRows = cachedAvailabilityRows.filter(row => idsSet.has(row.professional_id))
    } else {
      const availabilityResult = await readClient
        .from('availability')
        .select('professional_id,day_of_week,start_time,end_time')
        .in('professional_id', ids)
        .eq('is_active', true)
      availabilityRows = (availabilityResult.data || []) as AvailabilityRow[]
      availabilityError = Boolean(availabilityResult.error)
    }

    if (!availabilityError) {
      const availabilityMap = new Map<string, AvailabilityRow[]>()
      ;(availabilityRows || []).forEach((row: AvailabilityRow) => {
        const rows = availabilityMap.get(row.professional_id) || []
        rows.push(row)
        availabilityMap.set(row.professional_id, rows)
      })

      filteredProfessionals = filteredProfessionals.filter((pro: SearchProfessional) =>
        matchesAvailabilityWindow(availabilityMap.get(pro.id) || [], selectedAvailability),
      )
    }
  }

  const hasActiveFilters = Boolean(
    queryText ||
      selectedCategory ||
      selectedSubcategory ||
      selectedSpecialty ||
      minPrice !== null ||
      maxPrice !== null ||
      selectedAvailability !== 'qualquer' ||
      selectedLocation ||
      selectedLanguage !== 'qualquer',
  )

  const baseDisplayProfessionals = hasActiveFilters
    ? filteredProfessionals
    : (() => {
        const grouped = new Map<string, SearchProfessional[]>()
        filteredProfessionals.forEach((professional: SearchProfessional) => {
          const normalizedCategory = normalizeSearchCategorySlug(professional.category)
          const current = grouped.get(normalizedCategory) || []
          current.push(professional)
          grouped.set(normalizedCategory, current)
        })

        const varied: SearchProfessional[] = []
        categoryOptions.forEach(category => {
          const picks = (grouped.get(category.slug) || []).slice(0, 3)
          varied.push(...picks)
        })

        const uniqueById = new Map<string, SearchProfessional>()
        varied.forEach(item => uniqueById.set(item.id, item))
        return uniqueById.size > 0 ? Array.from(uniqueById.values()) : filteredProfessionals
      })()

  const sortedProfessionals = getSortedProfessionals(baseDisplayProfessionals, selectedSort)
  const totalResults = sortedProfessionals.length
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  const currentPage = Math.min(parsePage(searchParams.pagina), totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const pagedProfessionals = sortedProfessionals.slice(startIndex, endIndex)

  const usdRate = exchangeRates.USD || 1
  const openEndedCapInSelectedCurrency = Math.ceil(
    OPEN_ENDED_MAX_USD * (selectedCurrencyRate / usdRate),
  )
  const priceSliderMax = Math.max(50, openEndedCapInSelectedCurrency)

  const pageRangeStart = Math.max(1, currentPage - 2)
  const pageRangeEnd = Math.min(totalPages, currentPage + 2)
  const pageNumbers = Array.from(
    { length: pageRangeEnd - pageRangeStart + 1 },
    (_, i) => pageRangeStart + i,
  )
  const selectedCategoryLabel = selectedCategory
    ? categoryOptions.find(category => category.slug === selectedCategory)?.name || null
    : null
  const selectedSubcategoryLabel = selectedSubcategoryName || null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-neutral-900 md:text-4xl">
          Buscar profissionais
        </h1>
      </div>

      <SearchQueryBar key={`query-${queryState.q}`} initialState={queryState} />

      <div className="z-20 mb-4 rounded-2xl border border-neutral-200 bg-white shadow-sm lg:sticky lg:top-24">
        <div className="px-3 py-2.5 md:hidden">
          <MobileFiltersDrawer
            initialState={queryState}
            hasActiveFilters={hasActiveFilters}
            selectedCurrencyLabel={selectedCurrencyLabel}
            priceMax={priceSliderMax}
            categoryOptions={categoryOptions.map(category => ({ slug: category.slug, name: category.name }))}
            subcategoryOptions={subcategoryOptions}
            specialtyOptions={specialtyOptions}
            languageOptions={languageOptions}
          />
        </div>

        <DesktopFiltersAutoApply
          key={JSON.stringify(queryState)}
          initialState={queryState}
          selectedCurrencyLabel={selectedCurrencyLabel}
          priceMax={priceSliderMax}
          categoryOptions={categoryOptions.map(category => ({ slug: category.slug, name: category.name }))}
          subcategoryOptions={subcategoryOptions}
          specialtyOptions={specialtyOptions}
          languageOptions={languageOptions}
        />
      </div>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold text-neutral-900">
            {hasActiveFilters
              ? `${totalResults} profissionais disponíveis para os filtros selecionados`
              : `${totalResults} profissionais disponíveis`}
          </p>
          {selectedCategoryLabel || selectedSubcategoryLabel || selectedSpecialty ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCategoryLabel ? (
                <span className="rounded-full border border-[#d8e6f7] bg-[#eef6ff] px-3 py-1 text-[11px] font-medium text-[#0f4fa8]">
                  Categoria: {selectedCategoryLabel}
                </span>
              ) : null}
              {selectedSubcategoryLabel ? (
                <span className="rounded-full border border-[#f1d29a] bg-[#fff7e4] px-3 py-1 text-[11px] font-medium text-[#9a5b00]">
                  Subcategoria: {selectedSubcategoryLabel}
                </span>
              ) : null}
              {selectedSpecialty ? (
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700">
                  Especialidade: {selectedSpecialty}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">Sugestões iniciais variadas para te ajudar a começar.</p>
          )}
        </div>

        {pagedProfessionals.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="mb-1 text-base font-semibold text-neutral-900">Nenhum profissional encontrado</p>
            <p className="mx-auto max-w-md text-sm text-neutral-500">
              Ajuste categoria, subcategoria, especialidade ou faixa de preço para ver mais resultados.
            </p>
            {hasActiveFilters ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                <Link
                  href={
                    queryState.moeda
                      ? `${basePath}?moeda=${encodeURIComponent(queryState.moeda)}`
                      : basePath
                  }
                  className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {pagedProfessionals.map((professional: SearchProfessional) => (
                <div
                  key={professional.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 md:p-5"
                >
                  <Link
                    href={buildProfessionalProfilePath({
                      id: professional.id,
                      fullName: professional.profiles?.full_name,
                      publicCode: professional.public_code,
                    })}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 rounded-2xl"
                  >
                    {professional.cover_photo_url ? (
                      <div className="mb-3 h-20 w-full overflow-hidden rounded-xl border border-neutral-200">
                        <Image
                          src={professional.cover_photo_url}
                          alt={`Capa de ${professional.profiles?.full_name || 'Profissional'}`}
                          width={800}
                          height={240}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={70}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-start gap-4">
                      {professional.profiles?.avatar_url ? (
                        <Image
                          src={professional.profiles.avatar_url}
                          alt={`Foto de ${professional.profiles?.full_name || 'Profissional'}`}
                          width={56}
                          height={56}
                          sizes="56px"
                          quality={70}
                          className="h-14 w-14 rounded-2xl border border-neutral-200 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0">
                          {getNameInitial(professional.profiles?.full_name)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-neutral-900 leading-tight">
                              {professional.profiles?.full_name || 'Profissional'}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-1">
                              {getPrimarySpecialty(
                                professional,
                                primarySpecialtyByProfessionalId.get(String(professional.id)),
                              )}
                            </p>
                            <ExpandableTags tags={professional.tags || []} />
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-neutral-900">
                              {formatSearchPrice(
                                Number(professional.session_price_brl || 0),
                                selectedCurrency,
                                'pt-BR',
                                exchangeRates,
                              )}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              por sessão de {Math.max(1, Number(professional.session_duration_minutes || 60))} min
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
                          {professional.bio || 'Profissional verificado pronto para te atender.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-neutral-500">
                          {professional.tier && professional.tier !== 'basic' ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
                                professional.tier === 'premium'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {professional.tier === 'premium' ? 'Premium' : 'Profissional'}
                            </span>
                          ) : null}
                          {professional.video_intro_url ? (
                            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                              <PlayCircle className="w-3 h-3" />
                              Vídeo
                            </span>
                          ) : null}
                          {professional.tier !== 'basic' && professional.whatsapp_number ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {Number(professional.rating || 0) > 0
                              ? Number(professional.rating).toFixed(1)
                              : 'Novo'}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">
                            <MapPin className="w-3 h-3" />
                            {getCountryDisplayName(professional.profiles?.country)}
                          </span>
                        </div>

                        {(professional.languages || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {(professional.languages || []).map((language: string) => (
                              <span
                                key={language}
                                className="text-[11px] bg-brand-50 text-brand-700 px-2 py-1 rounded-full"
                              >
                                {language}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <SearchBookingCtas
                    isLoggedIn={isLoggedIn}
                    bookHref={`/agendar/${professional.id}`}
                    messageHref={`/mensagens?profissional=${professional.id}`}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                <Link
                  href={buildHref(basePath, queryState, { pagina: String(Math.max(1, currentPage - 1)) })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    currentPage === 1
                      ? 'pointer-events-none border-neutral-100 text-neutral-300 bg-neutral-50'
                      : 'border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20`}
                >
                  Anterior
                </Link>

                {pageNumbers.map(pageNumber => (
                  <Link
                    key={pageNumber}
                    href={buildHref(basePath, queryState, { pagina: String(pageNumber) })}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      pageNumber === currentPage
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20`}
                  >
                    {pageNumber}
                  </Link>
                ))}

                <Link
                  href={buildHref(basePath, queryState, { pagina: String(Math.min(totalPages, currentPage + 1)) })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    currentPage === totalPages
                      ? 'pointer-events-none border-neutral-100 text-neutral-300 bg-neutral-50'
                      : 'border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20`}
                >
                  Proxima
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}

export default async function BuscarPage({ searchParams }: { searchParams: BuscarSearchParams }) {
  return (
    <PublicPageLayout>
      {await BuscarPageContent({ searchParams, isLoggedIn: false, basePath: '/buscar' })}
    </PublicPageLayout>
  )
}




