'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

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

type SearchQueryBarProps = {
  initialState: SearchQueryState
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

export function SearchQueryBar({ initialState }: SearchQueryBarProps) {
  const router = useRouter()
  const pathname = usePathname() || '/buscar'
  const [isPending, startTransition] = useTransition()
  const [queryText, setQueryText] = useState(initialState.q || '')

  const applyQuery = (rawValue: string) => {
    const next = {
      ...initialState,
      q: rawValue.trim(),
      pagina: '1',
    }
    const href = buildBuscarHref(pathname, next)
    startTransition(() => {
      router.replace(href, { scroll: false })
    })
  }

  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm md:p-4">
      <label className="mb-1.5 block text-xs font-medium text-neutral-500" htmlFor="buscar-query-input">
        Buscar profissionais
      </label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          id="buscar-query-input"
          type="text"
          value={queryText}
          placeholder="Nome, especialidade ou palavra-chave"
          onChange={event => setQueryText(event.target.value)}
          onBlur={event => applyQuery(event.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
        />
      </div>
      <div className="mt-1.5 h-4 text-[11px] text-neutral-400" aria-live="polite">
        {isPending ? 'Atualizando resultados...' : ''}
      </div>
    </div>
  )
}
