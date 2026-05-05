'use client'

import { inputClass } from '../../helpers'
import type { FieldErrors } from '../../types'

interface SpecialtySectionProps {
  professionalSpecialtyName: string
  professionalSpecialtyIsCustom: boolean
  professionalSpecialtyValidationMessage: string
  approvedSpecialtyOptions: string[]
  shouldShowCustomSpecialtyPrompt: boolean
  fieldErrors: FieldErrors
  onSpecialtyChange: (value: string) => void
  onSpecialtyCustomClick: () => void
  onSpecialtyValidationChange: (value: string) => void
}

export function SpecialtySection({
  professionalSpecialtyName,
  professionalSpecialtyIsCustom,
  professionalSpecialtyValidationMessage,
  approvedSpecialtyOptions,
  shouldShowCustomSpecialtyPrompt,
  fieldErrors,
  onSpecialtyChange,
  onSpecialtyCustomClick,
  onSpecialtyValidationChange,
}: SpecialtySectionProps) {
  return (
    <>
      <div>
        <label htmlFor="professional-specialty-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Especialidade
        </label>
        <input
          id="professional-specialty-name"
          list="professional-specialties-list"
          type="text"
          value={professionalSpecialtyName}
          onChange={event => onSpecialtyChange(event.target.value)}
          required
          placeholder="Digite para buscar especialidade"
          className={inputClass(Boolean(fieldErrors.professionalSpecialtyName))}
          aria-invalid={Boolean(fieldErrors.professionalSpecialtyName)}
        />
        <datalist id="professional-specialties-list">
          {approvedSpecialtyOptions.map(option => (
            <option key={option} value={option} />
          ))}
        </datalist>
        {fieldErrors.professionalSpecialtyName && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalSpecialtyName}</p>
        )}
        {shouldShowCustomSpecialtyPrompt && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Não encontrou na lista aprovada?
            <button
              type="button"
              onClick={onSpecialtyCustomClick}
              className="ml-1 font-semibold underline"
            >
              Sugerir nova especialidade
            </button>
          </div>
        )}
      </div>

      {professionalSpecialtyIsCustom && (
        <div>
          <label
            htmlFor="professional-specialty-validation-message"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Mensagem para validação da especialidade
          </label>
          <textarea
            id="professional-specialty-validation-message"
            value={professionalSpecialtyValidationMessage}
            onChange={event => onSpecialtyValidationChange(event.target.value)}
            rows={3}
            placeholder="Explique por que esta especialidade precisa ser validada pelo admin."
            className={inputClass(Boolean(fieldErrors.professionalSpecialtyValidationMessage))}
            aria-invalid={Boolean(fieldErrors.professionalSpecialtyValidationMessage)}
          />
          {fieldErrors.professionalSpecialtyValidationMessage && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalSpecialtyValidationMessage}</p>
          )}
        </div>
      )}
    </>
  )
}
