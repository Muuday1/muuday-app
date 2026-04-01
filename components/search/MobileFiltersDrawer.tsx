'use client'

import { Languages, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { AVAILABILITY_WINDOWS } from '@/lib/search-config'
import { PriceRangeSlider } from '@/components/search/PriceRangeSlider'

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

type MobileFiltersDrawerProps = {
  initialState: SearchQueryState
  hasActiveFilters: boolean
  selectedCurrencyLabel: string
  priceMax: number
  categoryOptions: Array<{ slug: string; name: string }>
  specialtyOptions: string[]
  languageOptions: string[]
}

function parseToInt(value: string, fallback: number) {
  if (value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.round(parsed)
}

function normalizeForApply(state: SearchQueryState, priceMax: number): SearchQueryState {
  const normalizedMin = Math.max(0, parseToInt(state.precoMin, 0))
  const normalizedMax = Math.max(normalizedMin, parseToInt(state.precoMax, priceMax))
  const cleanMax = Math.max(0, Math.round(priceMax))

  return {
    ...state,
    q: state.q.trim(),
    categoria: state.categoria || '',
    especialidade: state.categoria ? state.especialidade || '' : '',
    precoMin: normalizedMin <= 0 ? '' : String(normalizedMin),
    precoMax: normalizedMax >= cleanMax ? '' : String(normalizedMax),
    horario: state.horario || 'qualquer',
    idioma: state.idioma || 'qualquer',
    ordenar: state.ordenar || 'relevancia',
    pagina: '1',
  }
}

function buildBuscarHref(pathname: string, state: SearchQueryState) {
  const params = new URLSearchParams()
  const orderedEntries: Array<[keyof SearchQueryState, string]> = [
    ['q', state.q],
    ['categoria', state.categoria],
    ['especialidade', state.especialidade],
    ['precoMin', state.precoMin],
    ['precoMax', state.precoMax],
    ['horario', state.horario],
    ['localizacao', state.localizacao],
    ['idioma', state.idioma],
    ['ordenar', state.ordenar],
    ['pagina', state.pagina],
    ['moeda', state.moeda],
  ]

  orderedEntries.forEach(([key, value]) => {
    if (!value) return
    if ((key === 'horario' || key === 'idioma') && value === 'qualquer') return
    if (key === 'ordenar' && value === 'relevancia') return
    if (key === 'pagina' && value === '1') return
    params.set(key, value)
  })

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function MobileFiltersDrawer({
  initialState,
  hasActiveFilters,
  selectedCurrencyLabel,
  priceMax,
  categoryOptions,
  specialtyOptions,
  languageOptions,
}: MobileFiltersDrawerProps) {
  const router = useRouter()
  const pathname = usePathname() || '/buscar'
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<SearchQueryState>(initialState)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const sliderMin = useMemo(() => parseToInt(state.precoMin, 0), [state.precoMin])
  const sliderMax = useMemo(() => parseToInt(state.precoMax, priceMax), [state.precoMax, priceMax])

  const applyState = (nextState: SearchQueryState) => {
    const normalized = normalizeForApply(nextState, priceMax)
    setState(normalized)
    const href = buildBuscarHref(pathname, normalized)
    startTransition(() => {
      router.replace(href, { scroll: false })
    })
  }

  const applyPriceState = (nextMin: number, nextMax: number) => {
    setState(prev => {
      const normalized = normalizeForApply(
        {
          ...prev,
          precoMin: String(nextMin),
          precoMax: String(nextMax),
        },
        priceMax,
      )
      const href = buildBuscarHref(pathname, normalized)
      startTransition(() => {
        router.replace(href, { scroll: false })
      })
      return normalized
    })
  }

  const clearHref = `${pathname}${state.moeda ? `?moeda=${encodeURIComponent(state.moeda)}` : ''}`

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        aria-label="Refinar busca"
        aria-expanded={open}
        aria-controls="mobile-filters-drawer"
      >
        <SlidersHorizontal className="w-4 h-4 text-brand-500" />
        Refinar
        {hasActiveFilters ? (
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" aria-hidden="true" />
        ) : null}
      </button>

      {open ? (
        <div
          id="mobile-filters-drawer"
          className="fixed inset-0 z-40"
          role="dialog"
          aria-modal="true"
          aria-label="Refinar busca"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-neutral-900/45"
            aria-label="Fechar filtros"
          />

          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                Refinar
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Categoria</label>
                <select
                  value={state.categoria}
                  onChange={event =>
                    applyState({
                      ...state,
                      categoria: event.target.value,
                      especialidade: '',
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="">Todas as categorias</option>
                  {categoryOptions.map(category => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Especialidade</label>
                <select
                  value={state.especialidade}
                  disabled={!state.categoria}
                  onChange={event => applyState({ ...state, especialidade: event.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="">
                    {state.categoria ? 'Todas as especialidades' : 'Selecione uma categoria'}
                  </option>
                  {specialtyOptions.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
                <PriceRangeSlider
                  minLimit={0}
                  maxLimit={priceMax}
                  step={1}
                  valueMin={sliderMin}
                  valueMax={sliderMax}
                  currencyLabel={selectedCurrencyLabel}
                  onChange={(nextMin, nextMax) =>
                    setState(prev => ({
                      ...prev,
                      precoMin: String(nextMin),
                      precoMax: String(nextMax),
                      pagina: '1',
                    }))
                  }
                  onCommit={(nextMin, nextMax) =>
                    applyPriceState(nextMin, nextMax)
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Horário disponível</label>
                <select
                  value={state.horario}
                  onChange={event => applyState({ ...state, horario: event.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  {AVAILABILITY_WINDOWS.map(window => (
                    <option key={window.value} value={window.value}>
                      {window.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" />
                  Idioma secundário
                </label>
                <select
                  value={state.idioma}
                  onChange={event => applyState({ ...state, idioma: event.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="qualquer">Qualquer idioma</option>
                  {languageOptions.map(language => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Ordenar</label>
                <select
                  value={state.ordenar}
                  onChange={event => applyState({ ...state, ordenar: event.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="relevancia">Relevância</option>
                  <option value="melhor-avaliacao">Melhor avaliação</option>
                  <option value="mais-agendados">Mais agendados</option>
                  <option value="preco-menor">Menor preço</option>
                  <option value="preco-maior">Maior preço</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href={clearHref}
                  className="inline-flex items-center rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                >
                  Limpar filtros
                </Link>
                <span className="text-xs text-neutral-400" aria-live="polite">
                  {isPending ? 'Atualizando...' : 'Atualização automática'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
