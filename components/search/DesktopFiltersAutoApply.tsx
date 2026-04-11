'use client'

import { Languages } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { AVAILABILITY_WINDOWS } from '@/lib/search-config'
import { PriceRangeSlider } from '@/components/search/PriceRangeSlider'

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

type DesktopFiltersAutoApplyProps = {
  initialState: SearchQueryState
  selectedCurrencyLabel: string
  priceMax: number
  categoryOptions: Array<{ slug: string; name: string }>
  subcategoryOptions: Array<{ slug: string; name: string }>
  specialtyOptions: string[]
  languageOptions: string[]
}

function buildBuscarHref(pathname: string, state: SearchQueryState) {
  const params = new URLSearchParams()
  const orderedEntries: Array<[keyof SearchQueryState, string]> = [
    ['q', state.q],
    ['categoria', state.categoria],
    ['subcategoria', state.subcategoria],
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
    subcategoria: state.categoria ? state.subcategoria || '' : '',
    especialidade: state.categoria && state.subcategoria ? state.especialidade || '' : '',
    precoMin: normalizedMin <= 0 ? '' : String(normalizedMin),
    precoMax: normalizedMax >= cleanMax ? '' : String(normalizedMax),
    horario: state.horario || 'qualquer',
    idioma: state.idioma || 'qualquer',
    ordenar: state.ordenar || 'relevancia',
    pagina: '1',
  }
}

export function DesktopFiltersAutoApply({
  initialState,
  selectedCurrencyLabel,
  priceMax,
  categoryOptions,
  subcategoryOptions,
  specialtyOptions,
  languageOptions,
}: DesktopFiltersAutoApplyProps) {
  const router = useRouter()
  const pathname = usePathname() || '/buscar'
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<SearchQueryState>(initialState)

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

  return (
    <div className="hidden md:block p-3 md:p-4">
      <div className="grid grid-cols-2 lg:grid-cols-6 xl:grid-cols-12 gap-2.5 items-end">
        <div className="lg:col-span-2 xl:col-span-2">
          <label className="block text-[11px] font-medium text-neutral-500 mb-1">Categoria</label>
          <select
            value={state.categoria}
            onChange={event =>
              applyState({
                ...state,
                categoria: event.target.value,
                subcategoria: '',
                especialidade: '',
              })
            }
            className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
          >
            <option value="">Todas as categorias</option>
            {categoryOptions.map(category => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 xl:col-span-2">
          <label className="block text-[11px] font-medium text-neutral-500 mb-1">Subcategoria</label>
          <select
            value={state.subcategoria}
            disabled={!state.categoria}
            onChange={event =>
              applyState({
                ...state,
                subcategoria: event.target.value,
                especialidade: '',
              })
            }
            className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
          >
            <option value="">
              {state.categoria ? 'Todas as subcategorias' : 'Selecione uma categoria'}
            </option>
            {subcategoryOptions.map(subcategory => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 xl:col-span-2">
          <label className="block text-[11px] font-medium text-neutral-500 mb-1">Especialidade</label>
          <select
            value={state.especialidade}
            disabled={!state.subcategoria}
            onChange={event => applyState({ ...state, especialidade: event.target.value })}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
          >
            <option value="">
              {state.subcategoria ? 'Todas as especialidades' : 'Selecione uma subcategoria'}
            </option>
            {specialtyOptions.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 xl:col-span-2 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5">
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
            compact
          />
        </div>

        <div className="lg:col-span-1 xl:col-span-1">
          <label className="block text-[11px] font-medium text-neutral-500 mb-1">Horário</label>
          <select
            value={state.horario}
            onChange={event => applyState({ ...state, horario: event.target.value })}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
          >
            {AVAILABILITY_WINDOWS.map(window => (
              <option key={window.value} value={window.value}>
                {window.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1 xl:col-span-1">
          <label className="block text-[11px] font-medium text-neutral-500 mb-1 flex items-center gap-1">
            <Languages className="w-3 h-3" />
            Idioma
          </label>
          <select
            value={state.idioma}
            onChange={event => applyState({ ...state, idioma: event.target.value })}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
          >
            <option value="qualquer">Qualquer</option>
            {languageOptions.map(language => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 xl:col-span-2">
          <label className="block text-[11px] font-medium text-neutral-500 mb-1">Ordenar</label>
          <select
            value={state.ordenar}
            onChange={event => applyState({ ...state, ordenar: event.target.value })}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
          >
            <option value="relevancia">Relevância</option>
            <option value="melhor-avaliacao">Melhor avaliação</option>
            <option value="mais-agendados">Mais agendados</option>
            <option value="preco-menor">Menor preço</option>
            <option value="preco-maior">Maior preço</option>
          </select>
        </div>
      </div>

      <div className="mt-2 h-4 text-[11px] text-neutral-400">
        {isPending ? 'Atualizando resultados...' : ''}
      </div>
    </div>
  )
}
