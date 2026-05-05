'use client'

import { TARGET_AUDIENCE_OPTIONS } from '../constants'

interface TargetAudienceSectionProps {
  identityTargetAudiences: string[]
  setIdentityTargetAudiences: React.Dispatch<React.SetStateAction<string[]>>
  targetAudiencesOpen: boolean
  setTargetAudiencesOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  toggleMultiValue: (option: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => void
}

export function TargetAudienceSection({
  identityTargetAudiences,
  setIdentityTargetAudiences,
  targetAudiencesOpen,
  setTargetAudiencesOpen,
  toggleMultiValue,
}: TargetAudienceSectionProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5">
      <p className="mb-2 text-xs font-semibold text-slate-700">Público atendido</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setTargetAudiencesOpen(previous => !previous)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
        >
          <span className="truncate">
            {identityTargetAudiences.length > 0
              ? identityTargetAudiences.join(', ')
              : 'Selecione os públicos atendidos'}
          </span>
          <span className="text-xs text-slate-400">{targetAudiencesOpen ? 'Fechar' : 'Selecionar'}</span>
        </button>
        {targetAudiencesOpen ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
            <div className="grid gap-1">
              {TARGET_AUDIENCE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleMultiValue(option, identityTargetAudiences, setIdentityTargetAudiences)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    identityTargetAudiences.includes(option)
                      ? 'bg-[#9FE870]/8 text-[#2d5016]'
                      : 'text-slate-700 hover:bg-slate-50/70'
                  }`}
                >
                  <span>{option}</span>
                  <span className="text-xs font-semibold">
                    {identityTargetAudiences.includes(option) ? 'Selecionado' : 'Selecionar'}
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
