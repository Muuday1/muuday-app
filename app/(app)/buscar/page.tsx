export const metadata = { title: 'Buscar Profissionais | Muuday' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { cookies, headers } from 'next/headers'
import { Star, MapPin } from 'lucide-react'
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer'
import { SearchBookingCtas } from '@/components/search/SearchBookingCtas'
import { DesktopFiltersAutoApply } from '@/components/search/DesktopFiltersAutoApply'
import { SearchQueryBar } from '@/components/search/SearchQueryBar'
import { ExpandableTags } from '@/components/search/ExpandableTags'
import { loadProfessionalSpecialtyContext } from '@/lib/taxonomy/professional-specialties'
import { getCachedRuntimeValue } from '@/lib/cache/runtime-cache'
import {
  normalizeCurrency,
  PUBLIC_CURRENCY_COOKIE,
  resolveDefaultCurrencyFromAcceptLanguage,
} from '@/lib/public-preferences'
import {
  SEARCH_CATEGORIES,
  getSearchCategoryLabel,
  matchesAvailabilityWindow,
  matchesSelectedCategory,
  normalizeSearchCategorySlug,
} from '@/lib/search-config'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import { filterPubliclyVisibleProfessionals } from '@/lib/professional/public-visibility'

type BuscarSearchParams = {
  q?: string
  categoria?: string
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

type SpecialtyContext = Awaited<ReturnType<typeof loadProfessionalSpecialtyContext>>

type PublicSearchBaseData = {
  professionals: any[]
  specialtyContext: SpecialtyContext
  availabilityRows: AvailabilityRow[]
}

const PAGE_SIZE = 10
const PUBLIC_SEARCH_BASE_CACHE_KEY = 'buscar:public-base:v2'
const PUBLIC_SEARCH_BASE_CACHE_TTL_MS = 180_000
const CURRENCY_RATES: Record<string, number> = {
  BRL: 1,
  USD: 0.19,
  EUR: 0.17,
  GBP: 0.15,
  CAD: 0.26,
  AUD: 0.29,
}
const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
}

const EMPTY_SPECIALTY_CONTEXT: SpecialtyContext = {
  byProfessionalId: new Map<string, string[]>(),
  primaryByProfessionalId: new Map<string, string>(),
  categorySlugsByProfessionalId: new Map<string, string[]>(),
}

function hasSupabaseSessionCookie(
  cookieStore: ReturnType<typeof cookies>,
) {
  return cookieStore
    .getAll()
    .some(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))
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

function formatSearchPrice(amountBRL: number, currency = 'BRL', locale = 'pt-BR'): string {
  const rate = CURRENCY_RATES[currency] || 1
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

function getPrimarySpecialty(professional: any, primarySpecialty?: string | null) {
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

function getRelevanceScore(pro: any): number {
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

function getSortedProfessionals(list: any[], sort: string) {
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

async function loadPublicSearchBaseData(readClient: any): Promise<PublicSearchBaseData> {
  const { data: professionalsRaw } = await readClient
    .from('professionals')
    .select('*,profiles!inner(full_name,country,avatar_url,role)')
    .eq('status', 'approved')
    .eq('profiles.role', 'profissional')
    .order('rating', { ascending: false })
    .limit(250)

  let professionals = professionalsRaw || []
  if (professionals.length > 0) {
    professionals = await filterPubliclyVisibleProfessionals(readClient as any, professionals)
  }

  const professionalIds = professionals.map((professional: any) => String(professional.id))
  let specialtyContext: SpecialtyContext = EMPTY_SPECIALTY_CONTEXT
  let availabilityRows: AvailabilityRow[] = []
  if (professionalIds.length > 0) {
    const [resolvedSpecialtyContext, availabilityResult] = await Promise.all([
      loadProfessionalSpecialtyContext(readClient as any, professionalIds),
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

export default async function BuscarPage({ searchParams }: { searchParams: BuscarSearchParams }) {
  const cookieStore = cookies()
  const acceptLanguage = headers().get('accept-language')
  const hasAuthCookie = hasSupabaseSessionCookie(cookieStore)

  let supabase: any = null
  let user: any = null
  let isLoggedIn = false
  try {
    if (
      hasAuthCookie &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      supabase = createClient()
      user = (await supabase.auth.getUser()).data.user
      isLoggedIn = Boolean(user)
    }
  } catch {
    supabase = null
    user = null
    isLoggedIn = false
  }

  const adminSupabase = !user ? createAdminClient() : null
  const readClient = adminSupabase || supabase

  const queryText = (searchParams.q || '').trim()
  const selectedCategory = searchParams.categoria || ''
  const selectedSpecialty = selectedCategory ? searchParams.especialidade || '' : ''
  const selectedAvailability = searchParams.horario || 'qualquer'
  const rawSelectedLocation = (searchParams.localizacao || '').trim()
  const selectedLocation = rawSelectedLocation ? getCountryDisplayName(rawSelectedLocation) : ''
  const selectedLanguage = searchParams.idioma || 'qualquer'
  const selectedSort = searchParams.ordenar || 'relevancia'
  const selectedPage = String(parsePage(searchParams.pagina))
  const requestedCurrency = searchParams.moeda || ''
  const minPrice = parseOptionalNumber(searchParams.precoMin)
  const maxPrice = parseOptionalNumber(searchParams.precoMax)

  let selectedCurrency = 'BRL'
  if (user && supabase) {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .single()
      selectedCurrency = (userProfile?.currency || 'BRL').toUpperCase()
    } catch {
      selectedCurrency = 'BRL'
    }
  } else {
    const queryCurrency = normalizeCurrency(requestedCurrency)
    const cookieCurrency = normalizeCurrency(cookieStore.get(PUBLIC_CURRENCY_COOKIE)?.value)
    selectedCurrency =
      queryCurrency ||
      cookieCurrency ||
      resolveDefaultCurrencyFromAcceptLanguage(acceptLanguage)
  }
  const selectedCurrencyRate = CURRENCY_RATES[selectedCurrency] || 1
  const selectedCurrencyLabel = CURRENCY_LABELS[selectedCurrency] || selectedCurrency
  const minPriceBrl = minPrice === null ? null : minPrice / selectedCurrencyRate
  const maxPriceBrl = maxPrice === null ? null : maxPrice / selectedCurrencyRate

  const queryState = buildSearchQueryState({
    q: queryText,
    categoria: selectedCategory,
    especialidade: selectedSpecialty,
    precoMin: searchParams.precoMin || '',
    precoMax: searchParams.precoMax || '',
    horario: selectedAvailability,
    localizacao: selectedLocation,
    idioma: selectedLanguage,
    ordenar: selectedSort,
    pagina: selectedPage,
    moeda: user ? '' : selectedCurrency,
  })

  let professionals: any[] = []
  let specialtyContext: SpecialtyContext = EMPTY_SPECIALTY_CONTEXT
  let cachedAvailabilityRows: AvailabilityRow[] = []
  if (readClient) {
    try {
      if (!isLoggedIn && adminSupabase) {
        const cached = await getCachedRuntimeValue(
          PUBLIC_SEARCH_BASE_CACHE_KEY,
          PUBLIC_SEARCH_BASE_CACHE_TTL_MS,
          () => loadPublicSearchBaseData(readClient),
        )
        professionals = cached.professionals
        specialtyContext = cached.specialtyContext
        cachedAvailabilityRows = cached.availabilityRows
      } else {
        const uncached = await loadPublicSearchBaseData(readClient)
        professionals = uncached.professionals
        specialtyContext = uncached.specialtyContext
        cachedAvailabilityRows = uncached.availabilityRows
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

  const categorySlugsWithProfessionals = new Set(
    professionals
      .map((professional: any) => normalizeSearchCategorySlug(professional.category))
      .filter(Boolean),
  )
  professionals.forEach((professional: any) => {
    ;(categorySlugsByProfessionalId.get(String(professional.id)) || []).forEach(slug =>
      categorySlugsWithProfessionals.add(slug),
    )
  })
  const categoryOptionsFromData = SEARCH_CATEGORIES.filter(category =>
    categorySlugsWithProfessionals.has(category.slug),
  )
  const categoryOptions = categoryOptionsFromData.length > 0 ? categoryOptionsFromData : SEARCH_CATEGORIES

  const professionalMatchesSelectedCategory = (professional: any) => {
    if (!selectedCategory) return true
    if (matchesSelectedCategory(professional.category, selectedCategory)) return true

    const categorySlugs = categorySlugsByProfessionalId.get(String(professional.id)) || []
    return categorySlugs.includes(selectedCategory)
  }

  const optionBaseProfessionals = selectedCategory
    ? professionals.filter((professional: any) => professionalMatchesSelectedCategory(professional))
    : professionals

  const specialtySet = new Map<string, string>()
  optionBaseProfessionals.forEach((professional: any) => {
    const canonicalSpecialties = specialtiesByProfessionalId.get(String(professional.id)) || []
    ;[
      ...canonicalSpecialties,
      ...(professional.subcategories || []),
      ...(professional.tags || []),
    ].forEach((specialty: string) => {
      const trimmed = String(specialty || '').trim()
      if (!trimmed) return
      const key = normalizeText(trimmed)
      if (!specialtySet.has(key)) specialtySet.set(key, trimmed)
    })
  })
  const specialtyOptions = Array.from(specialtySet.values()).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  )

  const languageSet = new Map<string, string>()
  optionBaseProfessionals.forEach((professional: any) => {
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

  let filteredProfessionals = professionals.filter((pro: any) => {
    if (selectedCategory && !professionalMatchesSelectedCategory(pro)) return false
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
      const specialtyHaystack = [
        ...canonicalSpecialties,
        ...(pro.tags || []),
        ...(pro.subcategories || []),
        pro.bio || '',
      ]
        .join(' ')
        .toLowerCase()
      if (!specialtyHaystack.includes(normalizeText(selectedSpecialty))) return false
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
    const ids = filteredProfessionals.map((pro: any) => pro.id)
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

      filteredProfessionals = filteredProfessionals.filter((pro: any) =>
        matchesAvailabilityWindow(availabilityMap.get(pro.id) || [], selectedAvailability),
      )
    }
  }

  const hasActiveFilters = Boolean(
    queryText ||
      selectedCategory ||
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
        const grouped = new Map<string, any[]>()
        filteredProfessionals.forEach((professional: any) => {
          const normalizedCategory = normalizeSearchCategorySlug(professional.category)
          const current = grouped.get(normalizedCategory) || []
          current.push(professional)
          grouped.set(normalizedCategory, current)
        })

        const varied: any[] = []
        categoryOptions.forEach(category => {
          const picks = (grouped.get(category.slug) || []).slice(0, 3)
          varied.push(...picks)
        })

        const uniqueById = new Map<string, any>()
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

  const maxPriceCurrency = Math.max(
    0,
    ...professionals.map((pro: any) => Number(pro.session_price_brl || 0) * selectedCurrencyRate),
  )
  const priceSliderMax = Math.max(50, Math.ceil(maxPriceCurrency))

  const pageRangeStart = Math.max(1, currentPage - 2)
  const pageRangeEnd = Math.min(totalPages, currentPage + 2)
  const pageNumbers = Array.from(
    { length: pageRangeEnd - pageRangeStart + 1 },
    (_, i) => pageRangeStart + i,
  )
  const selectedCategoryLabel = selectedCategory
    ? categoryOptions.find(category => category.slug === selectedCategory)?.name || null
    : null

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
          {selectedCategoryLabel || selectedSpecialty ? (
            <p className="text-xs text-neutral-500 mt-0.5">
              {selectedCategoryLabel ? `Categoria: ${selectedCategoryLabel}` : null}
              {selectedCategoryLabel && selectedSpecialty ? ' • ' : null}
              {selectedSpecialty ? `Especialidade: ${selectedSpecialty}` : null}
            </p>
          ) : (
            <p className="text-xs text-neutral-500 mt-0.5">
                Sugestões iniciais variadas para te ajudar a começar.
            </p>
          )}
        </div>

        {pagedProfessionals.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="mb-1 text-base font-semibold text-neutral-900">Nenhum profissional encontrado</p>
            <p className="mx-auto max-w-md text-sm text-neutral-500">
              Ajuste os filtros para ver mais resultados.
            </p>
            {hasActiveFilters ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                <Link
                  href={queryState.moeda ? `/buscar?moeda=${encodeURIComponent(queryState.moeda)}` : '/buscar'}
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
              {pagedProfessionals.map((professional: any) => (
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
                    <div className="flex items-start gap-4">
                      {professional.profiles?.avatar_url ? (
                        <Image
                          src={professional.profiles.avatar_url}
                          alt={`Foto de ${professional.profiles?.full_name || 'Profissional'}`}
                          width={56}
                          height={56}
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
                              {formatSearchPrice(professional.session_price_brl, selectedCurrency)}
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
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {professional.rating > 0 ? professional.rating.toFixed(1) : 'Novo'}
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
                  href={buildHref('/buscar', queryState, { pagina: String(Math.max(1, currentPage - 1)) })}
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
                    href={buildHref('/buscar', queryState, { pagina: String(pageNumber) })}
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
                  href={buildHref('/buscar', queryState, { pagina: String(Math.min(totalPages, currentPage + 1)) })}
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
