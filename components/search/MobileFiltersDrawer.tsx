'use client'

import { Languages, Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AVAILABILITY_WINDOWS } from '@/lib/search-config'
import { PriceRangeSlider } from '@/components/search/PriceRangeSlider'

type HiddenInputs = Record<string, string>

type MobileFiltersDrawerProps = {
  action: string
  hiddenInputs: HiddenInputs
  hasActiveFilters: boolean
  queryText: string
  selectedCategory: string
  selectedSpecialty: string
  selectedAvailability: string
  selectedLanguage: string
  selectedSort: string
  minPrice: string
  maxPrice: string
  selectedCurrencyLabel: string
  priceMax: number
  categoryOptions: Array<{ slug: string; name: string }>
  specialtyOptions: string[]
  languageOptions: string[]
}

export function MobileFiltersDrawer({
  action,
  hiddenInputs,
  hasActiveFilters,
  queryText,
  selectedCategory,
  selectedSpecialty,
  selectedAvailability,
  selectedLanguage,
  selectedSort,
  minPrice,
  maxPrice,
  selectedCurrencyLabel,
  priceMax,
  categoryOptions,
  specialtyOptions,
  languageOptions,
}: MobileFiltersDrawerProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

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
        {hasActiveFilters && (
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" aria-hidden="true">
          </span>
        )}
      </button>

      {open && (
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

          <div className="absolute right-0 top-0 h-full w-[90%] max-w-sm overflow-y-auto bg-white p-4 shadow-xl">
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

            <form action={action} method="get" className="space-y-3">
              {Object.entries(hiddenInputs).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={queryText}
                    placeholder="Nome, especialidade, categoria…"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Categoria</label>
                <select
                  name="categoria"
                  defaultValue={selectedCategory}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="">Todas as categorias</option>
                  {categoryOptions.map(category => (
                    <option key={category.slug} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Especialidade</label>
                <select
                  name="especialidade"
                  defaultValue={selectedSpecialty}
                  disabled={!selectedCategory}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="">{selectedCategory ? 'Todas as especialidades' : 'Selecione uma categoria primeiro'}</option>
                  {specialtyOptions.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
                <PriceRangeSlider
                  minLimit={0}
                  maxLimit={priceMax}
                  step={10}
                  initialMin={Number(minPrice || 0)}
                  initialMax={Number(maxPrice || priceMax)}
                  currencyLabel={selectedCurrencyLabel}
                  nameMin="precoMin"
                  nameMax="precoMax"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Horário disponível</label>
                <select
                  name="horario"
                  defaultValue={selectedAvailability}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  {AVAILABILITY_WINDOWS.map(window => (
                    <option key={window.value} value={window.value}>{window.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" />
                  Idioma secundário
                </label>
                <select
                  name="idioma"
                  defaultValue={selectedLanguage}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="qualquer">Qualquer idioma</option>
                  {languageOptions.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Ordenar</label>
                <select
                  name="ordenar"
                  defaultValue={selectedSort}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500"
                >
                  <option value="relevancia">Relevância</option>
                  <option value="melhor-avaliacao">Melhor avaliação</option>
                  <option value="mais-agendados">Mais agendados</option>
                  <option value="preco-menor">Menor preço</option>
                  <option value="preco-maior">Maior preço</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                >
                  Ver resultados
                </button>
                <Link
                  href="/buscar"
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-2.5 px-5 rounded-xl text-sm text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                >
                  Limpar
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
