'use client'

import { TARGET_AUDIENCE_OPTIONS } from '../../helpers'

interface TargetAudienceFieldProps {
  professionalTargetAudiences: string[]
  onToggleTargetAudience: (audience: string) => void
}

export function TargetAudienceField({
  professionalTargetAudiences,
  onToggleTargetAudience,
}: TargetAudienceFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">Público atendido</label>
      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-3">
        {TARGET_AUDIENCE_OPTIONS.map(option => {
          const selected = professionalTargetAudiences.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggleTargetAudience(option)}
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
      </div>
      <p className="mt-1 text-xs text-slate-500">Toque em cada opção para marcar/desmarcar.</p>
    </div>
  )
}
