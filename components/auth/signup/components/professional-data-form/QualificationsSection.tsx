'use client'

import { inputClass, QUALIFICATION_APPROVED_OPTIONS } from '../../helpers'
import { isRegistrationQualification } from '../../helpers'
import type { FieldErrors, QualificationDraft } from '../../types'

interface QualificationsSectionProps {
  professionalQualifications: QualificationDraft[]
  professionalQualificationDraftName: string
  professionalQualificationDraftIsCustom: boolean
  professionalQualificationDraftSuggestionReason: string
  fieldErrors: FieldErrors
  onQualificationDraftNameChange: (value: string) => void
  onQualificationDraftCustomClick: () => void
  onQualificationDraftSuggestionChange: (value: string) => void
  onAddQualification: () => void
  onRemoveQualification: (id: string) => void
  onUpdateQualification: (id: string, updater: (item: QualificationDraft) => QualificationDraft) => void
}

export function QualificationsSection({
  professionalQualifications,
  professionalQualificationDraftName,
  professionalQualificationDraftIsCustom,
  professionalQualificationDraftSuggestionReason,
  fieldErrors,
  onQualificationDraftNameChange,
  onQualificationDraftCustomClick,
  onQualificationDraftSuggestionChange,
  onAddQualification,
  onRemoveQualification,
  onUpdateQualification,
}: QualificationsSectionProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Qualificações e certificados</h3>
      <p className="mt-1 text-xs text-slate-500">
        Se não encontrar na lista aprovada, adicione como sugestão para validação do admin. O upload de comprovantes é feito depois do login.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          list="qualification-approved-list"
          type="text"
          value={professionalQualificationDraftName}
          onChange={event => onQualificationDraftNameChange(event.target.value)}
          placeholder="Digite a qualificação"
          className={inputClass(Boolean(fieldErrors.professionalQualifications))}
        />
        <button
          type="button"
          onClick={onAddQualification}
          className="rounded-md bg-[#9FE870] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8ed85f]"
        >
          Adicionar qualificação
        </button>
      </div>
      <datalist id="qualification-approved-list">
        {QUALIFICATION_APPROVED_OPTIONS.map(option => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div className="mt-2">
        <button
          type="button"
          onClick={onQualificationDraftCustomClick}
          className="text-xs font-semibold text-amber-700 underline"
        >
          Não encontrei na lista
        </button>
      </div>

      {professionalQualificationDraftIsCustom && (
        <textarea
          value={professionalQualificationDraftSuggestionReason}
          onChange={event => onQualificationDraftSuggestionChange(event.target.value)}
          rows={2}
          placeholder="Explique por que essa qualificação precisa ser validada."
          className={`${inputClass(Boolean(fieldErrors.professionalQualifications))} mt-2`}
        />
      )}

      {professionalQualifications.length > 0 && (
        <div className="mt-4 space-y-3">
          {professionalQualifications.map(item => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <button
                  type="button"
                  onClick={() => onRemoveQualification(item.id)}
                  className="text-xs font-medium text-red-600"
                >
                  Remover
                </button>
              </div>
              {item.isCustom && item.suggestionReason ? (
                <p className="mt-1 text-xs text-amber-700">Sugestão enviada: {item.suggestionReason}</p>
              ) : null}

              {isRegistrationQualification(item.name) ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    type="text"
                    value={item.registrationNumber}
                    onChange={event =>
                      onUpdateQualification(item.id, current => ({
                        ...current,
                        registrationNumber: event.target.value,
                      }))
                    }
                    placeholder="Número de registro"
                    className={inputClass(false)}
                  />
                  <input
                    type="text"
                    value={item.issuer}
                    onChange={event =>
                      onUpdateQualification(item.id, current => ({
                        ...current,
                        issuer: event.target.value,
                      }))
                    }
                    placeholder="Órgão emissor"
                    className={inputClass(false)}
                  />
                  <input
                    type="text"
                    value={item.country}
                    onChange={event =>
                      onUpdateQualification(item.id, current => ({
                        ...current,
                        country: event.target.value,
                      }))
                    }
                    placeholder="País do registro"
                    className={inputClass(false)}
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    type="text"
                    value={item.courseName}
                    onChange={event =>
                      onUpdateQualification(item.id, current => ({
                        ...current,
                        courseName: event.target.value,
                      }))
                    }
                    placeholder="Nome do curso/formação (ex.: Enfermagem)"
                    className={inputClass(false)}
                  />
                </div>
              )}

              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-800">
                  Comprovante documental será solicitado após o login, na etapa de Identidade do tracker profissional.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {fieldErrors.professionalQualifications && (
        <p className="mt-2 text-xs text-red-600">{fieldErrors.professionalQualifications}</p>
      )}
    </div>
  )
}
