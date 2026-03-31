export const metadata = { title: 'Buscar Profissionais | Muuday' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { Search, Star, Clock, MapPin, SlidersHorizontal, Languages } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer'
import { SearchBookingCtas } from '@/components/search/SearchBookingCtas'
import { PriceRangeSlider } from '@/components/search/PriceRangeSlider'
import {
  normalizeCurrency,
  PUBLIC_CURRENCY_COOKIE,
  resolveDefaultCurrencyFromAcceptLanguage,
} from '@/lib/public-preferences'
import {
  AVAILABILITY_WINDOWS,
  SEARCH_CATEGORIES,
  getSearchCategoryLabel,
  matchesAvailabilityWindow,
  matchesSelectedCategory,
  normalizeSearchCategorySlug,
} from '@/lib/search-config'

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

const PAGE_SIZE = 10
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

function toHiddenInputs(state: SearchQueryState, keys: Array<keyof SearchQueryState>) {
  return keys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = state[key] || ''
    return acc
  }, {})
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

const TIER_BOOST: Record<string, number> = { premium: 0.15, professional: 0.08, basic: 0 }

function getRelevanceScore(pro: any): number {
  const rating = Number(pro.rating || 0)
  const reviews = Number(pro.total_reviews || 0)
  const bookings = Number(pro.total_bookings || 0)
  const tier = (pro.tier as string) || 'basic'
  const tierBoost = TIER_BOOST[tier] || 0

  // Weighted relevance: rating quality + volume signals + tier boost
  const ratingScore = rating / 5 // 0-1
  const volumeScore = Math.min(1, (reviews + bookings) / 50) // 0-1, caps at 50
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

  // Default: relevance (quality + volume + tier boost)
  return cloned.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a))
}

export default async function BuscarPage({ searchParams }: { searchParams: BuscarSearchParams }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = Boolean(user)
  const adminSupabase = !user ? createAdminClient() : null
  const readClient = adminSupabase || supabase
  const cookieStore = cookies()
  const acceptLanguage = headers().get('accept-language')

  const queryText = (searchParams.q || '').trim()
  const selectedCategory = searchParams.categoria || ''
  const selectedSpecialty = selectedCategory ? (searchParams.especialidade || '') : ''
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
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('currency')
      .eq('id', user.id)
      .single()
    selectedCurrency = (userProfile?.currency || 'BRL').toUpperCase()
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

  const { data: professionalsRaw } = await readClient
    .from('professionals')
    .select(
      [
        '*',
        // Limit profile fields to public-safe data (avoid emails).
        'profiles!inner(full_name, country, avatar_url, role)',
      ].join(', '),
    )
    .eq('status', 'approved')
    .eq('profiles.role', 'profissional')
    .order('rating', { ascending: false })
    .limit(250)

  const professionals = professionalsRaw || []

  const categorySlugsWithProfessionals = new Set(
    professionals
      .map((professional: any) => normalizeSearchCategorySlug(professional.category))
      .filter(Boolean),
  )

  const categoryOptionsFromData = SEARCH_CATEGORIES.filter(category =>
    categorySlugsWithProfessionals.has(category.slug),
  )
  const categoryOptions = categoryOptionsFromData.length > 0 ? categoryOptionsFromData : SEARCH_CATEGORIES

  const optionBaseProfessionals = selectedCategory
    ? professionals.filter((professional: any) => matchesSelectedCategory(professional.category, selectedCategory))
    : professionals

  const specialtySet = new Map<string, string>()
  optionBaseProfessionals.forEach((professional: any) => {
    ;[...(professional.subcategories || []), ...(professional.tags || [])].forEach((specialty: string) => {
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

  const locationSet = new Map<string, string>()
  optionBaseProfessionals.forEach((professional: any) => {
    const countryRaw = professional.profiles?.country
    if (!countryRaw) return
    const countryName = getCountryDisplayName(countryRaw)
    const key = normalizeText(countryName)
    if (!locationSet.has(key)) locationSet.set(key, countryName)
  })
  const locationOptions = Array.from(locationSet.values()).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  )

  let filteredProfessionals = professionals.filter((pro: any) => {
    if (selectedCategory && !matchesSelectedCategory(pro.category, selectedCategory)) return false

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
      const specialtyHaystack = [
        ...(pro.tags || []),
        ...(pro.subcategories || []),
        pro.bio || '',
      ]
        .join(' ')
        .toLowerCase()
      if (!specialtyHaystack.includes(normalizeText(selectedSpecialty))) return false
    }

    if (queryText) {
      const queryHaystack = [
        pro.profiles?.full_name || '',
        pro.bio || '',
        pro.category || '',
        ...(pro.tags || []),
        ...(pro.subcategories || []),
      ]
        .join(' ')
        .toLowerCase()
      if (!queryHaystack.includes(normalizeText(queryText))) return false
    }

    return true
  })

  if (selectedAvailability !== 'qualquer' && filteredProfessionals.length > 0) {
    const ids = filteredProfessionals.map((pro: any) => pro.id)
    const { data: availabilityRows } = await supabase
      .from('availability')
      .select('professional_id, day_of_week, start_time, end_time')
      .in('professional_id', ids)
      .eq('is_active', true)

    const availabilityMap = new Map<string, AvailabilityRow[]>()
    ;(availabilityRows || []).forEach((row: AvailabilityRow) => {
      const rows = availabilityMap.get(row.professional_id) || []
      rows.push(row)
      availabilityMap.set(row.professional_id, rows)
    })

    filteredProfessionals = filteredProfessionals.filter((pro: any) =>
      matchesAvailabilityWindow(availabilityMap.get(pro.id) || [], selectedAvailability)
    )
  }

  const hasActiveFilters = Boolean(
    queryText ||
      selectedCategory ||
      selectedSpecialty ||
      minPrice !== null ||
      maxPrice !== null ||
      selectedAvailability !== 'qualquer' ||
      selectedLocation ||
      selectedLanguage !== 'qualquer'
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
  const priceSliderMax = Math.max(50, Math.ceil(maxPriceCurrency / 10) * 10)

  const buildHref = (overrides: Partial<Record<keyof BuscarSearchParams, string>>) => {
    const merged: Partial<Record<keyof BuscarSearchParams, string>> = { ...queryState, ...overrides }

    const params = new URLSearchParams()
    Object.entries(merged).forEach(([key, value]) => {
      if (!value) return
      if ((key === 'horario' || key === 'idioma') && value === 'qualquer') return
      if (key === 'ordenar' && value === 'relevancia') return
      if (key === 'pagina' && value === '1') return
      params.set(key, value)
    })

    const query = params.toString()
    return query ? `/buscar?${query}` : '/buscar'
  }

  const pageRangeStart = Math.max(1, currentPage - 2)
  const pageRangeEnd = Math.min(totalPages, currentPage + 2)
  const pageNumbers = Array.from({ length: pageRangeEnd - pageRangeStart + 1 }, (_, i) => pageRangeStart + i)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-bold text-neutral-900 md:text-4xl">Buscar profissionais</h1>
        <p className="text-neutral-500">
          Encontre o profissional ideal para você.
        </p>
      </div>

      <form action="/buscar" method="get" className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
        {Object.entries(
          toHiddenInputs(
            { ...queryState, pagina: '1' },
            ['categoria', 'especialidade', 'precoMin', 'precoMax', 'horario', 'localizacao', 'idioma', 'ordenar', 'pagina', 'moeda'],
          ),
        ).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              name="q"
              defaultValue={queryState.q}
              placeholder="Busque por profissional, categoria ou especialidade..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-neutral-900 placeholder-neutral-400 transition focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="z-20 mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm lg:sticky lg:top-24">

        <div className="px-4 py-3 md:hidden">
          <MobileFiltersDrawer
            action="/buscar"
            hiddenInputs={toHiddenInputs({ ...queryState, pagina: '1' }, ['pagina', 'moeda', 'localizacao'])}
            hasActiveFilters={hasActiveFilters}
            queryText={queryText}
            selectedCategory={selectedCategory}
            selectedSpecialty={selectedSpecialty}
            selectedAvailability={selectedAvailability}
            selectedLanguage={selectedLanguage}
            selectedSort={selectedSort}
            minPrice={searchParams.precoMin || ''}
            maxPrice={searchParams.precoMax || ''}
            selectedCurrencyLabel={selectedCurrencyLabel}
            priceMax={priceSliderMax}
            categoryOptions={categoryOptions.map(category => ({ slug: category.slug, name: category.name }))}
            specialtyOptions={specialtyOptions}
            languageOptions={languageOptions}
          />
        </div>

        {/* Desktop: always visible filters */}
        <form action="/buscar" method="get" className="hidden md:block p-4 md:p-5">
          {Object.entries(
            toHiddenInputs({ ...queryState, pagina: '1' }, ['q', 'ordenar', 'pagina', 'moeda']),
          ).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <div className="grid grid-cols-2 xl:grid-cols-12 gap-3 items-end">
            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Categoria</label>
              <select name="categoria" defaultValue={selectedCategory} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
                <option value="">Todas as categorias</option>
                {categoryOptions.map(category => (
                  <option key={category.slug} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Especialidade</label>
              <select name="especialidade" defaultValue={selectedSpecialty} disabled={!selectedCategory} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
                <option value="">{selectedCategory ? 'Todas as especialidades' : 'Selecione uma categoria primeiro'}</option>
                {specialtyOptions.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-4">
              <PriceRangeSlider
                minLimit={0}
                maxLimit={priceSliderMax}
                step={10}
                initialMin={parseOptionalNumber(searchParams.precoMin) ?? 0}
                initialMax={parseOptionalNumber(searchParams.precoMax) ?? priceSliderMax}
                currencyLabel={selectedCurrencyLabel}
                nameMin="precoMin"
                nameMax="precoMax"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Horário disponível</label>
              <select name="horario" defaultValue={selectedAvailability} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
                {AVAILABILITY_WINDOWS.map(window => (
                  <option key={window.value} value={window.value}>{window.label}</option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                Idioma secundário
              </label>
              <select name="idioma" defaultValue={selectedLanguage} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
                <option value="qualquer">Qualquer idioma</option>
                {languageOptions.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Ordenar</label>
              <select
                name="ordenar"
                defaultValue={selectedSort}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
              >
                <option value="relevancia">Relevância</option>
                <option value="melhor-avaliacao">Melhor avaliação</option>
                <option value="mais-agendados">Mais agendados</option>
                <option value="preco-menor">Menor preço</option>
                <option value="preco-maior">Maior preço</option>
              </select>
            </div>

            <div className="xl:col-span-12 flex items-center justify-end gap-2 pt-1">
              <button type="submit" className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
                Aplicar
              </button>
              <Link href="/buscar" className="rounded-xl bg-neutral-100 px-5 py-2.5 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
                Limpar
              </Link>
            </div>
          </div>
        </form>
      </div>

      <section>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{totalResults} profissionais</p>
              <p className="text-xs text-neutral-500">
                {hasActiveFilters
                  ? 'Resultados filtrados com base na sua busca.'
                  : 'Sugestões iniciais variadas para te ajudar a começar.'}
              </p>
            </div>

          </div>

          {pagedProfessionals.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <Search className="h-5 w-5" />
              </div>
              <p className="mb-1 text-base font-semibold text-neutral-900">Nenhum profissional encontrado</p>
              <p className="mx-auto max-w-md text-sm text-neutral-500">
                Ajuste os filtros ou tente uma busca mais ampla para ver mais resultados.
              </p>
              {hasActiveFilters && (
                <div className="mt-5 flex items-center justify-center gap-2">
                  <Link
                    href="/buscar"
                    className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                  >
                    Limpar filtros
                  </Link>
                </div>
              )}
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
                      href={`/profissional/${professional.id}`}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 rounded-2xl"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0">
                          {professional.profiles?.full_name?.charAt(0) || 'P'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-neutral-900 leading-tight">
                                {professional.profiles?.full_name || 'Profissional'}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-1">
                                {getSearchCategoryLabel(professional.category)}
                              </p>
                              {professional.tier && professional.tier !== 'basic' && (
                                <span
                                  className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                    professional.tier === 'premium'
                                      ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700'
                                      : 'border-blue-200 bg-blue-50 text-blue-700'
                                  }`}
                                >
                                  {professional.tier === 'premium' ? '⭐ Premium' : '✓ Profissional'}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-neutral-900">
                                {formatCurrency(professional.session_price_brl, selectedCurrency)}
                              </p>
                              <p className="text-[11px] text-neutral-400">por sessão</p>
                            </div>
                          </div>

                          <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
                            {professional.bio || 'Profissional verificado pronto para te atender.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-neutral-500">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {professional.rating > 0 ? professional.rating.toFixed(1) : 'Novo'}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">
                              <Clock className="w-3 h-3" />
                              {professional.session_duration_minutes || 60} min
                            </span>
                            <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">
                              <MapPin className="w-3 h-3" />
                              {getCountryDisplayName(professional.profiles?.country)}
                            </span>
                          </div>

                          {(professional.languages || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(professional.languages || []).slice(0, 3).map((language: string) => (
                                <span key={language} className="text-[11px] bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
                                  {language}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>

                    <SearchBookingCtas
                      isLoggedIn={isLoggedIn}
                      bookHref={`/agendar/${professional.id}`}
                      requestHref={`/solicitar/${professional.id}`}
                      requestEnabled={['professional', 'premium'].includes(String(professional.tier || 'basic'))}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                  <Link
                    href={buildHref({ pagina: String(Math.max(1, currentPage - 1)) })}
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
                      href={buildHref({ pagina: String(pageNumber) })}
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
                    href={buildHref({ pagina: String(Math.min(totalPages, currentPage + 1)) })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      currentPage === totalPages
                        ? 'pointer-events-none border-neutral-100 text-neutral-300 bg-neutral-50'
                        : 'border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20`}
                  >
                    Proxima
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
    </div>
  )
}
