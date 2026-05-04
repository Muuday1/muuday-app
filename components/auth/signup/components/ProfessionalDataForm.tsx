'use client'

import Link from 'next/link'
import { ArrowLeft, Loader2, X } from 'lucide-react'
import { PROFESSIONAL_TERMS } from '@/lib/legal/professional-terms'
import {
  inputClass,
  OTHER_LANGUAGE_OPTION,
  PROFESSIONAL_LANGUAGE_OPTIONS,
  QUALIFICATION_APPROVED_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
} from '../helpers'
import { isRegistrationQualification } from '../helpers'
import type { FieldErrors, QualificationDraft } from '../types'

interface ProfessionalDataFormProps {
  professionalHeadline: string
  professionalHeadlineIsCustom: boolean
  professionalHeadlineValidationMessage: string
  selectedSubcategory: { slug: string; name: string; categorySlug: string; categoryName: string } | null
  professionalCategory: string
  professionalCategoryOptions: Array<{ slug: string; name: string; icon: string }>
  professionalSpecialtyName: string
  professionalSpecialtyIsCustom: boolean
  professionalSpecialtyValidationMessage: string
  professionalFocusTags: string[]
  professionalFocusTagInput: string
  professionalPrimaryLanguage: string
  professionalSecondaryLanguages: string[]
  professionalOtherLanguagesInput: string
  professionalTargetAudiences: string[]
  professionalQualifications: QualificationDraft[]
  professionalQualificationDraftName: string
  professionalQualificationDraftIsCustom: boolean
  professionalQualificationDraftSuggestionReason: string
  professionalYearsExperience: string
  professionalTermsAccepted: Record<string, boolean>
  approvedSubcategoryOptions: Array<{ slug: string; name: string }>
  approvedSpecialtyOptions: string[]
  shouldShowCustomSubcategoryPrompt: boolean
  shouldShowCustomSpecialtyPrompt: boolean
  basicTagsLimit: number
  loading: boolean
  error: string
  showForgotPasswordLink: boolean
  fieldErrors: FieldErrors
  email: string
  errorList: string[]
  onHeadlineChange: (value: string) => void
  onHeadlineCustomClick: () => void
  onHeadlineValidationChange: (value: string) => void
  onSpecialtyChange: (value: string) => void
  onSpecialtyCustomClick: () => void
  onSpecialtyValidationChange: (value: string) => void
  onFocusTagInputChange: (value: string) => void
  onFocusTagKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onAddFocusTag: (value: string) => void
  onRemoveFocusTag: (tag: string) => void
  onToggleTargetAudience: (audience: string) => void
  onPrimaryLanguageChange: (value: string) => void
  onToggleSecondaryLanguage: (language: string) => void
  onOtherLanguagesInputChange: (value: string) => void
  onYearsExperienceChange: (value: string) => void
  onQualificationDraftNameChange: (value: string) => void
  onQualificationDraftCustomClick: () => void
  onQualificationDraftSuggestionChange: (value: string) => void
  onAddQualification: () => void
  onRemoveQualification: (id: string) => void
  onUpdateQualification: (id: string, updater: (item: QualificationDraft) => QualificationDraft) => void
  onToggleTermsCheckbox: (key: string) => void
  onOpenTermsModal: (key: string) => void
  onBack: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function ProfessionalDataForm({
  professionalHeadline,
  professionalHeadlineIsCustom,
  professionalHeadlineValidationMessage,
  selectedSubcategory,
  professionalCategory,
  professionalCategoryOptions,
  professionalSpecialtyName,
  professionalSpecialtyIsCustom,
  professionalSpecialtyValidationMessage,
  professionalFocusTags,
  professionalFocusTagInput,
  professionalPrimaryLanguage,
  professionalSecondaryLanguages,
  professionalOtherLanguagesInput,
  professionalTargetAudiences,
  professionalQualifications,
  professionalQualificationDraftName,
  professionalQualificationDraftIsCustom,
  professionalQualificationDraftSuggestionReason,
  professionalYearsExperience,
  professionalTermsAccepted,
  approvedSubcategoryOptions,
  approvedSpecialtyOptions,
  shouldShowCustomSubcategoryPrompt,
  shouldShowCustomSpecialtyPrompt,
  basicTagsLimit,
  loading,
  error,
  showForgotPasswordLink,
  fieldErrors,
  errorList,
  onHeadlineChange,
  onHeadlineCustomClick,
  onHeadlineValidationChange,
  onSpecialtyChange,
  onSpecialtyCustomClick,
  onSpecialtyValidationChange,
  onFocusTagInputChange,
  onFocusTagKeyDown,
  onRemoveFocusTag,
  onToggleTargetAudience,
  onPrimaryLanguageChange,
  onToggleSecondaryLanguage,
  onOtherLanguagesInputChange,
  onYearsExperienceChange,
  onQualificationDraftNameChange,
  onQualificationDraftCustomClick,
  onQualificationDraftSuggestionChange,
  onAddQualification,
  onRemoveQualification,
  onUpdateQualification,
  onToggleTermsCheckbox,
  onOpenTermsModal,
  email,
  onBack,
  onSubmit,
}: ProfessionalDataFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

      <div>
        <label htmlFor="professional-category" className="mb-1.5 block text-sm font-medium text-slate-700">
          Categoria principal
        </label>
        <input
          id="professional-category"
          type="text"
          value={
            professionalCategoryOptions.find(item => item.slug === professionalCategory)?.name ||
            selectedSubcategory?.categoryName ||
            ''
          }
          readOnly
          placeholder="Selecionada automaticamente pela área"
          className={inputClass(Boolean(fieldErrors.professionalCategory))}
          aria-invalid={Boolean(fieldErrors.professionalCategory)}
        />
        {fieldErrors.professionalCategory && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalCategory}</p>}
      </div>

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="professional-years" className="mb-1.5 block text-sm font-medium text-slate-700">
            Anos de experiência
          </label>
          <input
            id="professional-years"
            type="number"
            min={0}
            max={60}
            value={professionalYearsExperience}
            onChange={event => onYearsExperienceChange(event.target.value)}
            required
            className={inputClass(Boolean(fieldErrors.professionalYearsExperience))}
            aria-invalid={Boolean(fieldErrors.professionalYearsExperience)}
          />
          {fieldErrors.professionalYearsExperience && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalYearsExperience}</p>
          )}
        </div>
      </div>

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

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Termos obrigatorios antes do envio</h3>
        <p className="mt-1 text-xs text-slate-600">
          Para enviar o cadastro, abra cada termo, leia ate o fim e clique em aceitar.
        </p>
        <div className="mt-3 space-y-2">
          {PROFESSIONAL_TERMS.map(term => {
            const accepted = professionalTermsAccepted[term.key]
            return (
              <div key={term.key} className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={() => onToggleTermsCheckbox(term.key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]"
                    />
                    <span>{term.shortLabel}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onOpenTermsModal(term.key)}
                    className="text-xs font-semibold text-[#3d6b1f] underline"
                  >
                    Abrir termo
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        {fieldErrors.professionalTerms && (
          <p className="mt-2 text-xs text-red-600">{fieldErrors.professionalTerms}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          <p className="font-semibold">{error}</p>
          {showForgotPasswordLink ? (
            <p className="mt-1 text-xs">
              Esqueceu a senha?{' '}
              <Link
                href={`/recuperar-senha?email=${encodeURIComponent(email.trim())}`}
                className="font-semibold underline"
              >
                Clique aqui.
              </Link>
            </p>
          ) : null}
          {errorList.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs">
              {errorList.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 flex-1 rounded-md border border-slate-200 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#9FE870] py-3 font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Criando...
            </>
          ) : (
            'Enviar para análise'
          )}
        </button>
      </div>
    </form>
  )
}
