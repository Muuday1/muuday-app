'use client'

import { LANGUAGE_OPTIONS } from '../constants'

interface LanguageSelectorSectionProps {
  identitySecondaryLanguages: string[]
  identityPrimaryLanguage: string
  toggleMultiValue: (option: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => void
  setIdentitySecondaryLanguages: React.Dispatch<React.SetStateAction<string[]>>
  secondaryLanguagesOpen: boolean
  setSecondaryLanguagesOpen: (value: boolean | ((prev: boolean) => boolean)) => void
}

export function LanguageSelectorSection({
  identitySecondaryLanguages,
  identityPrimaryLanguage,
  toggleMultiValue,
  setIdentitySecondaryLanguages,
  secondaryLanguagesOpen,
  setSecondaryLanguagesOpen,
}: LanguageSelectorSectionProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5">
      <p className="mb-2 text-xs font-semibold text-slate-700">Idiomas secundários</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setSecondaryLanguagesOpen(previous => !previous)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
        >
          <span className="truncate">
            {identitySecondaryLanguages.length > 0
              ? identitySecondaryLanguages.join(', ')
              : 'Selecione idiomas secundários'}
          </span>
          <span className="text-xs text-slate-400">{secondaryLanguagesOpen ? 'Fechar' : 'Selecionar'}</span>
        </button>
        {secondaryLanguagesOpen ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
            <div className="grid gap-1">
              {LANGUAGE_OPTIONS.filter(item => item !== identityPrimaryLanguage).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleMultiValue(option, identitySecondaryLanguages, setIdentitySecondaryLanguages)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    identitySecondaryLanguages.includes(option)
                      ? 'bg-[#9FE870]/8 text-[#2d5016]'
                      : 'text-slate-700 hover:bg-slate-50/70'
                  }`}
                >
                  <span>{option}</span>
                  <span className="text-xs font-semibold">
                    {identitySecondaryLanguages.includes(option) ? 'Selecionado' : 'Selecionar'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
