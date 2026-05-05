'use client'

import { inputClass, OTHER_LANGUAGE_OPTION, PROFESSIONAL_LANGUAGE_OPTIONS } from '../../helpers'
import type { FieldErrors } from '../../types'

interface LanguagesSectionProps {
  professionalPrimaryLanguage: string
  professionalSecondaryLanguages: string[]
  professionalOtherLanguagesInput: string
  fieldErrors: FieldErrors
  onPrimaryLanguageChange: (value: string) => void
  onToggleSecondaryLanguage: (language: string) => void
  onOtherLanguagesInputChange: (value: string) => void
}

export function LanguagesSection({
  professionalPrimaryLanguage,
  professionalSecondaryLanguages,
  professionalOtherLanguagesInput,
  fieldErrors,
  onPrimaryLanguageChange,
  onToggleSecondaryLanguage,
  onOtherLanguagesInputChange,
}: LanguagesSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="professional-primary-language" className="mb-1.5 block text-sm font-medium text-slate-700">
            Idioma principal de atendimento
          </label>
          <select
            id="professional-primary-language"
            value={professionalPrimaryLanguage}
            onChange={event => onPrimaryLanguageChange(event.target.value)}
            required
            className={inputClass(Boolean(fieldErrors.professionalPrimaryLanguage))}
            aria-invalid={Boolean(fieldErrors.professionalPrimaryLanguage)}
          >
            {PROFESSIONAL_LANGUAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.professionalPrimaryLanguage && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalPrimaryLanguage}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Idiomas secundários</label>
          <div
            id="professional-secondary-languages"
            className={`grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-3 ${
              fieldErrors.professionalSecondaryLanguages
                ? 'border-red-300 bg-red-50/40'
                : 'border-slate-200 bg-white'
            }`}
          >
            {PROFESSIONAL_LANGUAGE_OPTIONS.filter(option => option !== professionalPrimaryLanguage).map(option => {
              const selected = professionalSecondaryLanguages.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onToggleSecondaryLanguage(option)}
                  className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                    selected
                      ? 'border border-[#9FE870]/30 bg-[#9FE870]/8 text-[#3d6b1f]'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50/70'
                  }`}
                >
                  {option}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onToggleSecondaryLanguage(OTHER_LANGUAGE_OPTION)}
              className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                professionalSecondaryLanguages.includes(OTHER_LANGUAGE_OPTION)
                  ? 'border border-[#9FE870]/30 bg-[#9FE870]/8 text-[#3d6b1f]'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50/70'
              }`}
            >
              {OTHER_LANGUAGE_OPTION}
            </button>
          </div>
          {fieldErrors.professionalSecondaryLanguages && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalSecondaryLanguages}</p>
          )}
        </div>
      </div>

      {professionalSecondaryLanguages.includes(OTHER_LANGUAGE_OPTION) && (
        <div>
          <label htmlFor="professional-other-languages" className="mb-1.5 block text-sm font-medium text-slate-700">
            Outros idiomas
          </label>
          <input
            id="professional-other-languages"
            type="text"
            value={professionalOtherLanguagesInput}
            onChange={event => onOtherLanguagesInputChange(event.target.value)}
            placeholder="Ex.: Sueco, Dinamarquês"
            className={inputClass(Boolean(fieldErrors.professionalSecondaryLanguages))}
          />
          <p className="mt-1 text-xs text-slate-500">Separe por vírgula.</p>
        </div>
      )}
    </>
  )
}
