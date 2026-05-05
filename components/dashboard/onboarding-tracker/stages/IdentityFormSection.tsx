'use client'

import {
  PROFESSIONAL_TITLES,
  LANGUAGE_OPTIONS,
} from '../constants'
import { resolveTaxonomyLabel } from '../helpers'
import type { TierLimits } from '@/lib/tier-config'

interface IdentityFormSectionProps {
  identityTitle: string
  setIdentityTitle: (value: string) => void
  identityDisplayName: string
  setIdentityDisplayName: (value: string) => void
  identityDisplayNameLocked: boolean
  identityCategory: string
  identitySubcategory: string
  categoryNameBySlug: Record<string, string>
  subcategoryNameBySlug: Record<string, string>
  identityFocusAreas: string[]
  focusAreaInput: string
  setFocusAreaInput: (value: string) => void
  removeFocusArea: (tag: string) => void
  addFocusArea: (value: string) => void
  tierLimits: TierLimits
  bio: string
  setBio: (value: string) => void
  identityYearsExperience: string
  setIdentityYearsExperience: (value: string) => void
  identityPrimaryLanguage: string
  setIdentityPrimaryLanguage: (value: string) => void
}

export function IdentityFormSection({
  identityTitle,
  setIdentityTitle,
  identityDisplayName,
  setIdentityDisplayName,
  identityDisplayNameLocked,
  identityCategory,
  identitySubcategory,
  categoryNameBySlug,
  subcategoryNameBySlug,
  identityFocusAreas,
  focusAreaInput,
  setFocusAreaInput,
  removeFocusArea,
  addFocusArea,
  tierLimits,
  bio,
  setBio,
  identityYearsExperience,
  setIdentityYearsExperience,
  identityPrimaryLanguage,
  setIdentityPrimaryLanguage,
}: IdentityFormSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-3.5 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Título</label>
        <select
          value={identityTitle}
          onChange={event => setIdentityTitle(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {PROFESSIONAL_TITLES.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Nome público profissional</label>
        <input
          type="text"
          value={identityDisplayName}
          onChange={event => setIdentityDisplayName(event.target.value)}
          disabled={identityDisplayNameLocked}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />
        {identityDisplayNameLocked ? (
          <p className="mt-1 text-[11px] text-slate-500">
            Esse nome foi definido no cadastro inicial e não pode ser alterado aqui.
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Categoria principal</label>
        <input
          type="text"
          value={resolveTaxonomyLabel(identityCategory, categoryNameBySlug)}
          readOnly
          className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Área de atuação específica</label>
        <input
          type="text"
          value={resolveTaxonomyLabel(identitySubcategory, subcategoryNameBySlug)}
          readOnly
          className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-700">Tags de foco</label>
        <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
          {identityFocusAreas.length > 0 ? (
            identityFocusAreas.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => removeFocusArea(tag)}
                className="rounded-full border border-[#9FE870]/30 bg-[#9FE870]/8 px-2.5 py-1 text-[11px] font-medium text-[#2d5016]"
              >
                {tag} ×
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-500">Nenhuma tag registrada ainda.</span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={focusAreaInput}
            onChange={event => {
              const nextValue = event.target.value
              if (nextValue.endsWith(',')) {
                addFocusArea(nextValue)
                return
              }
              setFocusAreaInput(nextValue)
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault()
                addFocusArea(focusAreaInput)
              }
              if (event.key === 'Backspace' && !focusAreaInput && identityFocusAreas.length > 0) {
                removeFocusArea(identityFocusAreas[identityFocusAreas.length - 1]!)
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder={`Adicione tags de foco (${identityFocusAreas.length}/${tierLimits.tags})`}
          />
          <button
            type="button"
            onClick={() => addFocusArea(focusAreaInput)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
          >
            Adicionar tag
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Pressione vírgula ou Enter para adicionar. Clique na tag para remover.
        </p>
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-900">Sobre você</label>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">Resumo público exibido no perfil</span>
          <span className="text-xs text-slate-500">{bio.length}/500</span>
        </div>
        <textarea
          value={bio}
          onChange={event => setBio(event.target.value.slice(0, 500))}
          rows={5}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
          placeholder="Descreva sua atuação profissional em linguagem clara e objetiva."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Anos de experiência</label>
        <input
          type="number"
          min={0}
          max={60}
          value={identityYearsExperience}
          onChange={event => setIdentityYearsExperience(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Idioma principal</label>
        <select
          value={identityPrimaryLanguage}
          onChange={event => setIdentityPrimaryLanguage(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {LANGUAGE_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
