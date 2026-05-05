'use client'

import type { FieldErrors, QualificationDraft } from '../types'
import { HeadlineSection } from './professional-data-form/HeadlineSection'
import { CategoryField } from './professional-data-form/CategoryField'
import { SpecialtySection } from './professional-data-form/SpecialtySection'
import { FocusTagsField } from './professional-data-form/FocusTagsField'
import { TargetAudienceField } from './professional-data-form/TargetAudienceField'
import { LanguagesSection } from './professional-data-form/LanguagesSection'
import { ExperienceField } from './professional-data-form/ExperienceField'
import { QualificationsSection } from './professional-data-form/QualificationsSection'
import { TermsSection } from './professional-data-form/TermsSection'
import { FormFooter } from './professional-data-form/FormFooter'

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

export function ProfessionalDataForm(props: ProfessionalDataFormProps) {
  const {
    onSubmit,
    onBack,
    loading,
    error,
    showForgotPasswordLink,
    email,
    errorList,
    professionalHeadline,
    professionalHeadlineIsCustom,
    professionalHeadlineValidationMessage,
    approvedSubcategoryOptions,
    shouldShowCustomSubcategoryPrompt,
    fieldErrors,
    onHeadlineChange,
    onHeadlineCustomClick,
    onHeadlineValidationChange,
    selectedSubcategory,
    professionalCategory,
    professionalCategoryOptions,
    professionalSpecialtyName,
    professionalSpecialtyIsCustom,
    professionalSpecialtyValidationMessage,
    approvedSpecialtyOptions,
    shouldShowCustomSpecialtyPrompt,
    onSpecialtyChange,
    onSpecialtyCustomClick,
    onSpecialtyValidationChange,
    professionalFocusTags,
    professionalFocusTagInput,
    basicTagsLimit,
    onFocusTagInputChange,
    onFocusTagKeyDown,
    onRemoveFocusTag,
    professionalTargetAudiences,
    onToggleTargetAudience,
    professionalPrimaryLanguage,
    professionalSecondaryLanguages,
    professionalOtherLanguagesInput,
    onPrimaryLanguageChange,
    onToggleSecondaryLanguage,
    onOtherLanguagesInputChange,
    professionalYearsExperience,
    onYearsExperienceChange,
    professionalQualifications,
    professionalQualificationDraftName,
    professionalQualificationDraftIsCustom,
    professionalQualificationDraftSuggestionReason,
    onQualificationDraftNameChange,
    onQualificationDraftCustomClick,
    onQualificationDraftSuggestionChange,
    onAddQualification,
    onRemoveQualification,
    onUpdateQualification,
    professionalTermsAccepted,
    onToggleTermsCheckbox,
    onOpenTermsModal,
  } = props

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <HeadlineSection
        professionalHeadline={professionalHeadline}
        professionalHeadlineIsCustom={professionalHeadlineIsCustom}
        professionalHeadlineValidationMessage={professionalHeadlineValidationMessage}
        approvedSubcategoryOptions={approvedSubcategoryOptions}
        shouldShowCustomSubcategoryPrompt={shouldShowCustomSubcategoryPrompt}
        fieldErrors={fieldErrors}
        onHeadlineChange={onHeadlineChange}
        onHeadlineCustomClick={onHeadlineCustomClick}
        onHeadlineValidationChange={onHeadlineValidationChange}
      />

      <CategoryField
        professionalCategory={professionalCategory}
        professionalCategoryOptions={professionalCategoryOptions}
        selectedSubcategory={selectedSubcategory}
        fieldErrors={fieldErrors}
      />

      <SpecialtySection
        professionalSpecialtyName={professionalSpecialtyName}
        professionalSpecialtyIsCustom={professionalSpecialtyIsCustom}
        professionalSpecialtyValidationMessage={professionalSpecialtyValidationMessage}
        approvedSpecialtyOptions={approvedSpecialtyOptions}
        shouldShowCustomSpecialtyPrompt={shouldShowCustomSpecialtyPrompt}
        fieldErrors={fieldErrors}
        onSpecialtyChange={onSpecialtyChange}
        onSpecialtyCustomClick={onSpecialtyCustomClick}
        onSpecialtyValidationChange={onSpecialtyValidationChange}
      />

      <FocusTagsField
        professionalFocusTags={professionalFocusTags}
        professionalFocusTagInput={professionalFocusTagInput}
        basicTagsLimit={basicTagsLimit}
        fieldErrors={fieldErrors}
        onFocusTagInputChange={onFocusTagInputChange}
        onFocusTagKeyDown={onFocusTagKeyDown}
        onRemoveFocusTag={onRemoveFocusTag}
      />

      <TargetAudienceField
        professionalTargetAudiences={professionalTargetAudiences}
        onToggleTargetAudience={onToggleTargetAudience}
      />

      <LanguagesSection
        professionalPrimaryLanguage={professionalPrimaryLanguage}
        professionalSecondaryLanguages={professionalSecondaryLanguages}
        professionalOtherLanguagesInput={professionalOtherLanguagesInput}
        fieldErrors={fieldErrors}
        onPrimaryLanguageChange={onPrimaryLanguageChange}
        onToggleSecondaryLanguage={onToggleSecondaryLanguage}
        onOtherLanguagesInputChange={onOtherLanguagesInputChange}
      />

      <ExperienceField
        professionalYearsExperience={professionalYearsExperience}
        fieldErrors={fieldErrors}
        onYearsExperienceChange={onYearsExperienceChange}
      />

      <QualificationsSection
        professionalQualifications={professionalQualifications}
        professionalQualificationDraftName={professionalQualificationDraftName}
        professionalQualificationDraftIsCustom={professionalQualificationDraftIsCustom}
        professionalQualificationDraftSuggestionReason={professionalQualificationDraftSuggestionReason}
        fieldErrors={fieldErrors}
        onQualificationDraftNameChange={onQualificationDraftNameChange}
        onQualificationDraftCustomClick={onQualificationDraftCustomClick}
        onQualificationDraftSuggestionChange={onQualificationDraftSuggestionChange}
        onAddQualification={onAddQualification}
        onRemoveQualification={onRemoveQualification}
        onUpdateQualification={onUpdateQualification}
      />

      <TermsSection
        professionalTermsAccepted={professionalTermsAccepted}
        fieldErrors={fieldErrors}
        onToggleTermsCheckbox={onToggleTermsCheckbox}
        onOpenTermsModal={onOpenTermsModal}
      />

      <FormFooter
        loading={loading}
        error={error}
        showForgotPasswordLink={showForgotPasswordLink}
        email={email}
        errorList={errorList}
        onBack={onBack}
      />
    </form>
  )
}
