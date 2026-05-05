export const metadata = { title: 'Buscar Profissionais | Muuday' }
export const revalidate = 0
export const runtime = 'nodejs'


import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { Star, PlayCircle, MessageCircle } from 'lucide-react'
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
import { getExchangeRates } from '@/lib/exchange-rates'
import {
  normalizeCurrency,
  PUBLIC_CURRENCY_COOKIE,
  resolveDefaultCurrencyFromAcceptLanguage,
} from '@/lib/public-preferences'
import {
  SEARCH_CATEGORIES,
  matchesAvailabilityWindow,
  matchesSelectedCategory,
  normalizeSearchCategorySlug,
} from '@/lib/search-config'
import { mergeAvailabilitySources } from '@/lib/search/availability-merge'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import {
  filterPubliclyVisibleProfessionals,
  type ProfessionalSearchRecord,
} from '@/lib/professional/public-visibility'
import { emitUserSearched } from '@/lib/email/resend-events'

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

type ProfessionalServiceSearchRow = {
  professional_id: string
  price_brl?: number | null
  duration_minutes?: number | null
  created_at?: string | null
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
        'id,user_id,public_code,status,bio,category,subcategories,tags,languages,years_experience,session_price_brl,session_duration_minutes,rating,total_reviews,total_bookings,tier,first_booking_enabled,cover_photo_url,video_intro_url,whatsapp_number,social_links,profiles!professionals_user_id_fkey(full_name,country,avatar_url,role)',
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
    const [resolvedSpecialtyContext, modernAvailabilityResult, legacyAvailabilityResult, servicesResult] =
      await Promise.all([
        loadProfessionalSpecialtyContext(readClient, professionalIds),
        readClient
          .from('availability_rules')
          .select('professional_id,weekday,start_time_local,end_time_local')
          .in('professional_id', professionalIds)
          .eq('is_active', true),
        readClient
          .from('availability')
          .select('professional_id,day_of_week,start_time,end_time')
          .in('professional_id', professionalIds)
          .eq('is_active', true),
        readClient
          .from('professional_services')
          .select('professional_id,price_brl,duration_minutes,created_at')
          .in('professional_id', professionalIds)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
      ])

    specialtyContext = resolvedSpecialtyContext
    availabilityRows = mergeAvailabilitySources(
      (modernAvailabilityResult.data || []) as Array<{
        professional_id: string
        weekday: number
        start_time_local: string
        end_time_local: string
      }>,
      (legacyAvailabilityResult.data || []) as AvailabilityRow[],
    )

    const primaryServiceByProfessionalId = new Map<string, ProfessionalServiceSearchRow>()
    ;((servicesResult.data || []) as ProfessionalServiceSearchRow[]).forEach(service => {
      const professionalId = String(service.professional_id || '').trim()
      if (!professionalId || primaryServiceByProfessionalId.has(professionalId)) return
      primaryServiceByProfessionalId.set(professionalId, service)
    })

    professionals = professionals.map(professional => {
      const primaryService = primaryServiceByProfessionalId.get(String(professional.id || ''))
      if (!primaryService) return professional
      return {
        ...professional,
        session_price_brl: Number(primaryService.price_brl || 0),
        session_duration_minutes: Math.max(1, Number(primaryService.duration_minutes || 60)),
      }
    })
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
      params.selectedLocation,
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
      // Price filtering is applied after loading the primary active service price.
      p_min_price_brl: null,
      p_max_price_brl: null,
      p_limit: 1200,
      p_market: 'BR',
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
  defaultCurrency = 'BRL',
}: {
  searchParams: Promise<BuscarSearchParams>
  isLoggedIn?: boolean
  basePath?: string
  defaultCurrency?: string
}) {
  const readClient = await createClient()
  const {
    data: { user: searchUser },
  } = await readClient.auth.getUser()
  const exchangeRates = await getExchangeRates(readClient)
  const {
    q,
    categoria,
    subcategoria,
    especialidade,
    horario,
    localizacao,
    idioma,
    ordenar,
    pagina,
    moeda,
    precoMin,
    precoMax,
  } = await searchParams

  const queryText = (q || '').trim()
  const selectedCategory = categoria || ''
  const selectedSubcategory = selectedCategory ? subcategoria || '' : ''
  const selectedSpecialty =
    selectedCategory && selectedSubcategory ? especialidade || '' : ''
  const selectedAvailability = horario || 'qualquer'
  const rawSelectedLocation = (localizacao || '').trim()
  const selectedLocation = rawSelectedLocation ? getCountryDisplayName(rawSelectedLocation) : ''
  const selectedLanguage = idioma || 'qualquer'
  const selectedSort = ordenar || 'relevancia'
  const selectedPage = String(parsePage(pagina))
  const requestedCurrency = moeda || ''
  const minPrice = parseOptionalNumber(precoMin)
  const maxPrice = parseOptionalNumber(precoMax)

  const selectedCurrency = normalizeCurrency(requestedCurrency) || defaultCurrency
  const selectedCurrencyRate = exchangeRates[selectedCurrency] || 1
  const selectedCurrencyLabel = CURRENCY_LABELS[selectedCurrency] || selectedCurrency
  const minPriceBrl = minPrice === null ? null : minPrice / selectedCurrencyRate
  const maxPriceBrl = maxPrice === null ? null : maxPrice / selectedCurrencyRate

  // Emit Resend automation event for logged-in users performing searches (non-blocking)
  if (searchUser?.email && (queryText || selectedCategory || selectedSubcategory)) {
    const filters = [
      selectedCategory || '',
      selectedSubcategory || '',
      selectedSpecialty || '',
      selectedAvailability !== 'qualquer' ? selectedAvailability : '',
      selectedLocation || '',
      selectedLanguage !== 'qualquer' ? selectedLanguage : '',
    ].filter(Boolean).join(', ')
    emitUserSearched(searchUser.email, {
      query: queryText,
      filters: filters || undefined,
    })
  }

  const queryState = buildSearchQueryState({
    q: queryText,
    categoria: selectedCategory,
    subcategoria: selectedSubcategory,
    especialidade: selectedSpecialty,
    precoMin: precoMin || '',
    precoMax: precoMax || '',
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
        const liveData = await loadPublicSearchBaseData(readClient)
        professionals = liveData.professionals
        specialtyContext = liveData.specialtyContext
        cachedAvailabilityRows = liveData.availabilityRows
      } else {
        const liveData = await loadPublicSearchBaseDataByIds(readClient, candidateIds)
        professionals = liveData.professionals
        specialtyContext = liveData.specialtyContext
        cachedAvailabilityRows = liveData.availabilityRows
      }
    } catch {
      professionals = []
      specialtyContext = EMPTY_SPECIALTY_CONTEXT
      cachedAvailabilityRows = []
    }
  }

  // Persist search session for logged-in users to enable abandoned-search recovery
  if (searchUser?.id && readClient && (queryText || selectedCategory || selectedSubcategory)) {
    void (async () => {
      try {
        await readClient.from('search_sessions').insert({
          user_id: searchUser.id,
          query: queryText || null,
          filters: {
            category: selectedCategory || undefined,
            subcategory: selectedSubcategory || undefined,
            specialty: selectedSpecialty || undefined,
            availability: selectedAvailability !== 'qualquer' ? selectedAvailability : undefined,
            location: selectedLocation || undefined,
            language: selectedLanguage !== 'qualquer' ? selectedLanguage : undefined,
            minPrice: minPriceBrl ?? undefined,
            maxPrice: maxPriceBrl ?? undefined,
          },
          result_count: professionals.length,
          searched_at: new Date().toISOString(),
        })
      } catch {
        // Silently fail — search session tracking must not break search UX
      }
    })()
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

  if (readClient && filteredProfessionals.length > 0) {
    const filteredIds = filteredProfessionals.map((pro: SearchProfessional) => String(pro.id))
    const { data: liveVisibleRows, error: liveVisibleError } = await readClient
      .from('professionals')
      .select('id,profiles!professionals_user_id_fkey(role)')
      .in('id', filteredIds)
      .eq('status', 'approved')
      .eq('is_publicly_visible', true)
      .eq('profiles.role', 'profissional')

    if (!liveVisibleError) {
      const liveVisibleSet = new Set(
        (liveVisibleRows || []).map(row => String((row as { id?: string | null }).id || '')),
      )
      filteredProfessionals = filteredProfessionals.filter((pro: SearchProfessional) =>
        liveVisibleSet.has(String(pro.id)),
      )
    }
  }

  if (readClient && selectedAvailability !== 'qualquer' && filteredProfessionals.length > 0) {
    const ids = filteredProfessionals.map((pro: SearchProfessional) => pro.id)
    const idsSet = new Set(ids)
    let availabilityRows: AvailabilityRow[] = []
    let availabilityError = false

    if (!isLoggedIn && cachedAvailabilityRows.length > 0) {
      availabilityRows = cachedAvailabilityRows.filter(row => idsSet.has(row.professional_id))
    } else {
      const [modernResult, legacyResult] = await Promise.all([
        readClient
          .from('availability_rules')
          .select('professional_id,weekday,start_time_local,end_time_local')
          .in('professional_id', ids)
          .eq('is_active', true),
        readClient
          .from('availability')
          .select('professional_id,day_of_week,start_time,end_time')
          .in('professional_id', ids)
          .eq('is_active', true),
      ])
      availabilityRows = mergeAvailabilitySources(
        (modernResult.data || []) as Array<{
          professional_id: string
          weekday: number
          start_time_local: string
          end_time_local: string
        }>,
        (legacyResult.data || []) as AvailabilityRow[],
      )
      availabilityError = Boolean(modernResult.error) || Boolean(legacyResult.error)
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
  const currentPage = Math.min(parsePage(pagina), totalPages)
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
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="mb-4 md:mb-5 lg:mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">
          Buscar profissionais
        </h1>
      </div>

      <SearchQueryBar key={`query-${queryState.q}`} initialState={queryState} />

      <div className="z-20 mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
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
          <p className="text-sm font-semibold text-slate-900">
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
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700">
                  Especialidade: {selectedSpecialty}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Sugestões iniciais variadas para te ajudar a começar.</p>
          )}
        </div>

        {pagedProfessionals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="mb-1 text-base font-semibold text-slate-900">Nenhum profissional encontrado</p>
            <p className="mx-auto max-w-md text-sm text-slate-500">
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
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4">
              {pagedProfessionals.map((professional: SearchProfessional) => {
                const subcategories = subcategoryNamesByProfessionalId.get(String(professional.id)) || []
                const subcategory = subcategories[0] || (professional.subcategories || [])[0] || ''
                const specialty = primarySpecialtyByProfessionalId.get(String(professional.id)) || ''
                const profileHref = buildProfessionalProfilePath({
                  id: professional.id,
                  fullName: professional.profiles?.full_name,
                  publicCode: professional.public_code,
                })
                return (
                  <div
                    key={professional.id}
                    className="group rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:border-[#9FE870]/40 hover:shadow-lg md:p-4 lg:p-5"
                  >
                    <Link
                      href={profileHref}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20 rounded-xl"
                    >
                      {professional.cover_photo_url ? (
                        <div className="mb-3 h-24 w-full overflow-hidden rounded-lg border border-slate-100">
                          <Image
                            src={professional.cover_photo_url}
                            alt={`Capa de ${professional.profiles?.full_name || 'Profissional'}`}
                            width={800}
                            height={240}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            quality={70}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                            className="h-14 w-14 rounded-xl border-2 border-white object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#9FE870] to-[#7bc85a] flex items-center justify-center text-white font-display font-bold text-xl shadow-sm flex-shrink-0">
                            {getNameInitial(professional.profiles?.full_name)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-display font-bold text-slate-900 leading-tight truncate">
                                {professional.profiles?.full_name || 'Profissional'}
                              </h3>
                              {subcategory ? (
                                <p className="text-xs font-medium text-slate-600 mt-0.5 truncate">
                                  {subcategory}
                                </p>
                              ) : null}
                              {specialty && specialty !== subcategory ? (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                  {specialty}
                                </p>
                              ) : null}
                              <ExpandableTags tags={professional.tags || []} />
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-display font-bold text-[#3d6b1f]">
                                {formatSearchPrice(
                                  Number(professional.session_price_brl || 0),
                                  selectedCurrency,
                                  'pt-BR',
                                  exchangeRates,
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                / {Math.max(1, Number(professional.session_duration_minutes || 60))} min
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                            {professional.bio || 'Profissional verificado pronto para te atender.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {professional.tier && professional.tier !== 'basic' ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                  professional.tier === 'premium'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {professional.tier === 'premium' ? '★ Premium' : 'Profissional'}
                              </span>
                            ) : null}
                            {professional.video_intro_url ? (
                              <span className="inline-flex items-center gap-1 bg-[#9FE870]/10 text-[#3d6b1f] px-2 py-0.5 rounded-md text-[11px] font-semibold border border-[#9FE870]/20">
                                <PlayCircle className="w-3 h-3" />
                                Vídeo
                              </span>
                            ) : null}
                            {professional.tier !== 'basic' && professional.whatsapp_number ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-100">
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-amber-100">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {Number(professional.rating || 0) > 0
                                ? Number(professional.rating).toFixed(1)
                                : 'Novo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-start gap-4 mt-3">
                      <div className="w-14 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <SearchBookingCtas
                          isLoggedIn={isLoggedIn}
                          bookHref={`/agendar/${professional.id}`}
                          messageHref={`/mensagens?profissional=${professional.id}`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                <Link
                  href={buildHref(basePath, queryState, { pagina: String(Math.max(1, currentPage - 1)) })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    currentPage === 1
                      ? 'pointer-events-none border-slate-100 text-slate-300 bg-slate-50'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20`}
                >
                  Anterior
                </Link>

                {pageNumbers.map(pageNumber => (
                  <Link
                    key={pageNumber}
                    href={buildHref(basePath, queryState, { pagina: String(pageNumber) })}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      pageNumber === currentPage
                        ? 'bg-[#9FE870] border-[#9FE870] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20`}
                  >
                    {pageNumber}
                  </Link>
                ))}

                <Link
                  href={buildHref(basePath, queryState, { pagina: String(Math.min(totalPages, currentPage + 1)) })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    currentPage === totalPages
                      ? 'pointer-events-none border-slate-100 text-slate-300 bg-slate-50'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20`}
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

export default async function BuscarPage({ searchParams }: { searchParams: Promise<BuscarSearchParams> }) {
  const cookieStore = await cookies()
  const cookieCurrency = normalizeCurrency(cookieStore.get(PUBLIC_CURRENCY_COOKIE)?.value)
  const acceptLanguage = (await headers()).get('accept-language')
  const defaultCurrency = cookieCurrency || resolveDefaultCurrencyFromAcceptLanguage(acceptLanguage) || 'BRL'

  return (
    <PublicPageLayout>
      {await BuscarPageContent({ searchParams, isLoggedIn: false, basePath: '/buscar', defaultCurrency })}
    </PublicPageLayout>
  )
}





