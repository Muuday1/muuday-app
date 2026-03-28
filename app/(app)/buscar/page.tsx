export const metadata = { title: 'Buscar Profissionais | Muuday' }

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Star, Clock, MapPin, SlidersHorizontal, Languages } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  AVAILABILITY_WINDOWS,
  LANGUAGE_OPTIONS,
  SEARCH_CATEGORIES,
  getSearchCategoryLabel,
  getSpecialtyOptions,
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
}

type AvailabilityRow = {
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

const PAGE_SIZE = 10

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

  return cloned
}

export default async function BuscarPage({ searchParams }: { searchParams: BuscarSearchParams }) {
  const supabase = createClient()

  const queryText = (searchParams.q || '').trim()
  const selectedCategory = searchParams.categoria || ''
  const selectedSpecialty = searchParams.especialidade || ''
  const selectedAvailability = searchParams.horario || 'qualquer'
  const selectedLocation = (searchParams.localizacao || '').trim()
  const selectedLanguage = searchParams.idioma || 'qualquer'
  const selectedSort = searchParams.ordenar || 'relevancia'
  const minPrice = parseOptionalNumber(searchParams.precoMin)
  const maxPrice = parseOptionalNumber(searchParams.precoMax)

  const { data: professionalsRaw } = await supabase
    .from('professionals')
    .select('*, profiles(*)')
    .eq('status', 'approved')
    .order('rating', { ascending: false })
    .limit(250)

  const professionals = professionalsRaw || []

  let filteredProfessionals = professionals.filter((pro: any) => {
    if (selectedCategory && !matchesSelectedCategory(pro.category, selectedCategory)) return false

    if (minPrice !== null && Number(pro.session_price_brl) < minPrice) return false
    if (maxPrice !== null && Number(pro.session_price_brl) > maxPrice) return false

    if (selectedLanguage !== 'qualquer') {
      const languages = (pro.languages || []).map((language: string) => normalizeText(language))
      if (!languages.includes(normalizeText(selectedLanguage))) return false
    }

    if (selectedLocation) {
      const locationHaystack = `${pro.profiles?.country || ''} ${pro.bio || ''}`
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
        SEARCH_CATEGORIES.forEach(category => {
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

  const specialtyOptions = getSpecialtyOptions(selectedCategory)

  const locationOptions = Array.from(
    new Set(
      professionals
        .map((pro: any) => pro.profiles?.country)
        .filter(Boolean)
    )
  ) as string[]

  const buildHref = (overrides: Partial<Record<keyof BuscarSearchParams, string>>) => {
    const merged: Partial<Record<keyof BuscarSearchParams, string>> = {
      q: queryText,
      categoria: selectedCategory,
      especialidade: selectedSpecialty,
      precoMin: searchParams.precoMin,
      precoMax: searchParams.precoMax,
      horario: selectedAvailability,
      localizacao: selectedLocation,
      idioma: selectedLanguage,
      ordenar: selectedSort,
      pagina: String(currentPage),
      ...overrides,
    }

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Buscar profissionais</h1>
        <p className="text-neutral-500">
          Estilo marketplace: busca rapida, filtros fixos e comparacao clara de perfis.
        </p>
      </div>

      <form action="/buscar" method="get" className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 shadow-sm mb-6">
        <input type="hidden" name="categoria" value={selectedCategory} />
        <input type="hidden" name="especialidade" value={selectedSpecialty} />
        <input type="hidden" name="precoMin" value={searchParams.precoMin || ''} />
        <input type="hidden" name="precoMax" value={searchParams.precoMax || ''} />
        <input type="hidden" name="horario" value={selectedAvailability} />
        <input type="hidden" name="localizacao" value={selectedLocation} />
        <input type="hidden" name="idioma" value={selectedLanguage} />
        <input type="hidden" name="ordenar" value={selectedSort} />
        <input type="hidden" name="pagina" value="1" />

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              name="q"
              defaultValue={queryText}
              placeholder="Busque por profissional, categoria ou especialidade..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-all"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6 items-start">
        <aside className="lg:sticky lg:top-24">
          <form action="/buscar" method="get" className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm">
            <input type="hidden" name="q" value={queryText} />
            <input type="hidden" name="ordenar" value={selectedSort} />
            <input type="hidden" name="pagina" value="1" />

            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <SlidersHorizontal className="w-4 h-4 text-brand-500" />
              Filtros
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Categoria</label>
              <select
                name="categoria"
                defaultValue={selectedCategory}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
              >
                <option value="">Todas as categorias</option>
                {SEARCH_CATEGORIES.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Especialidade</label>
              <select
                name="especialidade"
                defaultValue={selectedSpecialty}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
              >
                <option value="">Todas as especialidades</option>
                {specialtyOptions.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Preco min (R$)</label>
                <input
                  type="number"
                  name="precoMin"
                  min={0}
                  step="10"
                  defaultValue={searchParams.precoMin || ''}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Preco max (R$)</label>
                <input
                  type="number"
                  name="precoMax"
                  min={0}
                  step="10"
                  defaultValue={searchParams.precoMax || ''}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Horario disponivel</label>
              <select
                name="horario"
                defaultValue={selectedAvailability}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
              >
                {AVAILABILITY_WINDOWS.map(window => (
                  <option key={window.value} value={window.value}>
                    {window.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Localizacao</label>
              <input
                type="text"
                name="localizacao"
                list="locations"
                defaultValue={selectedLocation}
                placeholder="Pais, cidade ou regiao"
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm"
              />
              <datalist id="locations">
                {locationOptions.map(location => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                Idiomas falados
              </label>
              <select
                name="idioma"
                defaultValue={selectedLanguage}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
              >
                <option value="qualquer">Qualquer idioma</option>
                {LANGUAGE_OPTIONS.map(language => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                Aplicar
              </button>
              <Link
                href="/buscar"
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl text-sm text-center transition-all"
              >
                Limpar
              </Link>
            </div>
          </form>
        </aside>

        <section>
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={buildHref({ categoria: '', especialidade: '', pagina: '1' })}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                !selectedCategory
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              Todas
            </Link>
            {SEARCH_CATEGORIES.map(category => (
              <Link
                key={category.slug}
                href={buildHref({ categoria: category.slug, especialidade: '', pagina: '1' })}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === category.slug
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {category.icon} {category.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{totalResults} profissionais</p>
              <p className="text-xs text-neutral-500">
                {hasActiveFilters
                  ? 'Resultados filtrados com base na sua busca.'
                  : 'Sugestoes iniciais variadas para te ajudar a comecar.'}
              </p>
            </div>

            <form action="/buscar" method="get" className="flex items-center gap-2">
              <input type="hidden" name="q" value={queryText} />
              <input type="hidden" name="categoria" value={selectedCategory} />
              <input type="hidden" name="especialidade" value={selectedSpecialty} />
              <input type="hidden" name="precoMin" value={searchParams.precoMin || ''} />
              <input type="hidden" name="precoMax" value={searchParams.precoMax || ''} />
              <input type="hidden" name="horario" value={selectedAvailability} />
              <input type="hidden" name="localizacao" value={selectedLocation} />
              <input type="hidden" name="idioma" value={selectedLanguage} />
              <input type="hidden" name="pagina" value="1" />

              <select
                name="ordenar"
                defaultValue={selectedSort}
                className="px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
              >
                <option value="relevancia">Ordenar: Relevancia</option>
                <option value="melhor-avaliacao">Ordenar: Melhor avaliacao</option>
                <option value="mais-agendados">Ordenar: Mais agendados</option>
                <option value="preco-menor">Ordenar: Menor preco</option>
                <option value="preco-maior">Ordenar: Maior preco</option>
              </select>
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                Aplicar
              </button>
            </form>
          </div>

          {pagedProfessionals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
              <div className="text-5xl mb-4">🔎</div>
              <p className="font-semibold text-neutral-900 mb-2">Nenhum profissional encontrado</p>
              <p className="text-neutral-500 text-sm">Ajuste os filtros para ampliar os resultados.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {pagedProfessionals.map((professional: any) => (
                  <Link
                    key={professional.id}
                    href={`/profissional/${professional.id}`}
                    className="bg-white rounded-2xl border border-neutral-100 hover:shadow-md transition-all p-4 md:p-5"
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
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-neutral-900">
                              {formatCurrency(professional.session_price_brl)}
                            </p>
                            <p className="text-[11px] text-neutral-400">por sessao</p>
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
                            {professional.profiles?.country || 'Online'}
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
                    }`}
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
                      }`}
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
                    }`}
                  >
                    Proxima
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
