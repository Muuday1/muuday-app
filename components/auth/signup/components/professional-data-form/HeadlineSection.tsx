'use client'

import { inputClass } from '../../helpers'
import type { FieldErrors } from '../../types'

interface HeadlineSectionProps {
  professionalHeadline: string
  professionalHeadlineIsCustom: boolean
  professionalHeadlineValidationMessage: string
  approvedSubcategoryOptions: Array<{ slug: string; name: string }>
  shouldShowCustomSubcategoryPrompt: boolean
  fieldErrors: FieldErrors
  onHeadlineChange: (value: string) => void
  onHeadlineCustomClick: () => void
  onHeadlineValidationChange: (value: string) => void
}

export function HeadlineSection({
  professionalHeadline,
  professionalHeadlineIsCustom,
  professionalHeadlineValidationMessage,
  approvedSubcategoryOptions,
  shouldShowCustomSubcategoryPrompt,
  fieldErrors,
  onHeadlineChange,
  onHeadlineCustomClick,
  onHeadlineValidationChange,
}: HeadlineSectionProps) {
  return (
    <>
      <div>
        <label htmlFor="professional-headline" className="mb-1.5 block text-sm font-medium text-slate-700">
          Área de atuação específica
        </label>
        <input
          id="professional-headline"
          list="professional-subcategories-list"
          type="text"
          value={professionalHeadline}
          onChange={event => onHeadlineChange(event.target.value)}
          required
          placeholder="Digite para buscar subcategoria"
          className={inputClass(Boolean(fieldErrors.professionalHeadline))}
          aria-invalid={Boolean(fieldErrors.professionalHeadline)}
        />
        <datalist id="professional-subcategories-list">
          {approvedSubcategoryOptions.map(option => (
            <option key={option.slug} value={option.name} />
          ))}
        </datalist>
        {fieldErrors.professionalHeadline && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalHeadline}</p>}
        {shouldShowCustomSubcategoryPrompt && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Não encontrou na lista aprovada?
            <button
              type="button"
              onClick={onHeadlineCustomClick}
              className="ml-1 font-semibold underline"
            >
              Sugerir nova área
            </button>
          </div>
        )}
      </div>

      {professionalHeadlineIsCustom && (
        <div>
          <label
            htmlFor="professional-headline-validation-message"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Mensagem para validação da área
          </label>
          <textarea
            id="professional-headline-validation-message"
            value={professionalHeadlineValidationMessage}
            onChange={event => onHeadlineValidationChange(event.target.value)}
            rows={3}
            placeholder="Explique por que essa área precisa ser validada pelo admin."
            className={inputClass(Boolean(fieldErrors.professionalHeadlineValidationMessage))}
            aria-invalid={Boolean(fieldErrors.professionalHeadlineValidationMessage)}
          />
          {fieldErrors.professionalHeadlineValidationMessage && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalHeadlineValidationMessage}</p>
          )}
        </div>
      )}
    </>
  )
}
