'use client'

import { Languages, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { AVAILABILITY_WINDOWS } from '@/lib/search-config'

type HiddenInputs = Record<string, string>

type MobileFiltersDrawerProps = {
  action: string
  hiddenInputs: HiddenInputs
  hasActiveFilters: boolean
  selectedCategory: string
  selectedSpecialty: string
  selectedAvailability: string
  selectedLocation: string
  selectedLanguage: string
  minPrice: string
  maxPrice: string
  selectedCurrencyLabel: string
  categoryOptions: Array<{ slug: string; name: string }>
  specialtyOptions: string[]
  locationOptions: string[]
  languageOptions: string[]
}

export function MobileFiltersDrawer({
  action,
  hiddenInputs,
  hasActiveFilters,
  selectedCategory,
  selectedSpecialty,
  selectedAvailability,
  selectedLocation,
  selectedLanguage,
  minPrice,
  maxPrice,
  selectedCurrencyLabel,
  categoryOptions,
  specialtyOptions,
  locationOptions,
  languageOptions,
}: MobileFiltersDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800"
        aria-label="Abrir filtros"
      >
        <SlidersHorizontal className="w-4 h-4 text-brand-500" />
        Filtros
        {hasActiveFilters && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Filtros de busca">
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
                Filtros
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500"
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
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Categoria</label>
                <select
                  name="categoria"
                  defaultValue={selectedCategory}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedCategory ? 'Todas as especialidades' : 'Selecione uma categoria primeiro'}</option>
                  {specialtyOptions.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Preço mín ({selectedCurrencyLabel})</label>
                  <input
                    type="number"
                    name="precoMin"
                    min={0}
                    step="10"
                    defaultValue={minPrice}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Preço máx ({selectedCurrencyLabel})</label>
                  <input
                    type="number"
                    name="precoMax"
                    min={0}
                    step="10"
                    defaultValue={maxPrice}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Horário disponível</label>
                <select
                  name="horario"
                  defaultValue={selectedAvailability}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
                >
                  {AVAILABILITY_WINDOWS.map(window => (
                    <option key={window.value} value={window.value}>{window.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Localização</label>
                <select
                  name="localizacao"
                  defaultValue={selectedLocation}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800"
                >
                  <option value="">Todos os países</option>
                  {locationOptions.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
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
                  {languageOptions.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all"
                >
                  Aplicar filtros
                </button>
                <Link
                  href="/buscar"
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-2.5 px-5 rounded-xl text-sm text-center transition-all"
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
