'use client'

import { X } from 'lucide-react'
import { inputClass } from '../../helpers'
import type { FieldErrors } from '../../types'

interface FocusTagsFieldProps {
  professionalFocusTags: string[]
  professionalFocusTagInput: string
  basicTagsLimit: number
  fieldErrors: FieldErrors
  onFocusTagInputChange: (value: string) => void
  onFocusTagKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onRemoveFocusTag: (tag: string) => void
}

export function FocusTagsField({
  professionalFocusTags,
  professionalFocusTagInput,
  basicTagsLimit,
  fieldErrors,
  onFocusTagInputChange,
  onFocusTagKeyDown,
  onRemoveFocusTag,
}: FocusTagsFieldProps) {
  return (
    <div>
      <label htmlFor="professional-focus-areas" className="mb-1.5 block text-sm font-medium text-slate-700">
        Foco de atuação <span className="text-slate-400">(opcional)</span>
      </label>
      <input
        id="professional-focus-areas"
        type="text"
        value={professionalFocusTagInput}
        onChange={event => onFocusTagInputChange(event.target.value)}
        onKeyDown={onFocusTagKeyDown}
        placeholder="Digite e pressione vírgula ou Enter"
        className={inputClass(Boolean(fieldErrors.professionalFocusAreas))}
        aria-invalid={Boolean(fieldErrors.professionalFocusAreas)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {professionalFocusTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[#9FE870]/8 px-3 py-1 text-xs font-medium text-[#3d6b1f]"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveFocusTag(tag)}
              className="rounded-full p-0.5 hover:bg-[#9FE870]/10"
              aria-label={`Remover tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">Plano Básico permite até {basicTagsLimit} tags nesta etapa.</p>
      {fieldErrors.professionalFocusAreas && (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalFocusAreas}</p>
      )}
    </div>
  )
}
