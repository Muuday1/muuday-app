'use client'

import Link from 'next/link'
import { useSignupForm } from './signup/hooks/use-signup-form'
import { SignupStepIndicator } from './signup/components/SignupStepIndicator'
import { RoleSelectorStep } from './signup/components/RoleSelectorStep'
import { PersonalDataForm } from './signup/components/PersonalDataForm'
import { ProfessionalDataForm } from './signup/components/ProfessionalDataForm'
import { TermsModal } from './signup/components/TermsModal'
import { SignupSuccessModal } from './signup/components/SignupSuccessModal'
import { getRedirectHint } from './signup/helpers'
import type { SignupFormProps } from './signup/types'

export default function SignupForm({ initialCatalog, redirectPath, requestedRole, origin }: SignupFormProps) {
  const form = useSignupForm({ initialCatalog, redirectPath, requestedRole, origin })

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-slate-900">Criar conta</h1>
      <p className="mb-6 text-slate-500">Junte-se à Muuday</p>

      {redirectPath && form.role === 'usuario' && (
        <div className="mb-5 rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8 px-4 py-3 text-sm text-[#3d6b1f]" role="status">
          {getRedirectHint(redirectPath)}
        </div>
      )}

      {form.step >= 1 && (
        <SignupStepIndicator step={form.step} totalSteps={form.totalSteps} />
      )}

      {form.step === 1 && (
        <RoleSelectorStep
          role={form.role}
          redirectPath={redirectPath}
          onSelectRole={form.setRole}
          onContinue={form.goToStep2}
        />
      )}

      {form.step === 2 && (
        <PersonalDataForm
          role={form.role}
          professionalTitle={form.professionalTitle}
          fullName={form.fullName}
          country={form.country}
          timezone={form.timezone}
          currency={form.currency}
          email={form.email}
          password={form.password}
          confirmPassword={form.confirmPassword}
          showPassword={form.showPassword}
          showConfirmPassword={form.showConfirmPassword}
          loading={form.loading}
          error={form.error}
          showForgotPasswordLink={form.showForgotPasswordLink}
          fieldErrors={form.fieldErrors}
          errorList={form.errorList}
          passwordStrength={form.passwordStrength}
          onProfessionalTitleChange={value => {
            form.setProfessionalTitle(value)
            form.clearFieldError('professionalTitle')
          }}
          onFullNameChange={value => {
            form.setFullName(value)
            form.clearFieldError('fullName')
          }}
          onCountryChange={value => {
            form.setCountry(value)
            form.clearFieldError('country')
          }}
          onTimezoneChange={value => {
            form.setTimezone(value)
            form.clearFieldError('timezone')
          }}
          onCurrencyChange={value => {
            form.setCurrency(value)
            form.clearFieldError('currency')
          }}
          onEmailChange={value => {
            form.setEmail(value)
            form.clearFieldError('email')
          }}
          onPasswordChange={value => {
            form.setPassword(value)
            form.clearFieldError('password')
            form.clearFieldError('confirmPassword')
          }}
          onConfirmPasswordChange={value => {
            form.setConfirmPassword(value)
            form.clearFieldError('confirmPassword')
          }}
          onToggleShowPassword={() => form.setShowPassword(prev => !prev)}
          onToggleShowConfirmPassword={() => form.setShowConfirmPassword(prev => !prev)}
          onBack={() => {
            form.setStep(1)
            form.setError('')
            form.setFieldErrors({})
          }}
          onSubmit={form.role === 'profissional' ? form.handleContinueProfessionalStep : form.handleSignUp}
        />
      )}

      {form.step === 3 && form.role === 'profissional' && (
        <ProfessionalDataForm
          professionalHeadline={form.professionalHeadline}
          professionalHeadlineIsCustom={form.professionalHeadlineIsCustom}
          professionalHeadlineValidationMessage={form.professionalHeadlineValidationMessage}
          selectedSubcategory={form.selectedSubcategory}
          professionalCategory={form.professionalCategory}
          professionalCategoryOptions={form.professionalCategoryOptions}
          professionalSpecialtyName={form.professionalSpecialtyName}
          professionalSpecialtyIsCustom={form.professionalSpecialtyIsCustom}
          professionalSpecialtyValidationMessage={form.professionalSpecialtyValidationMessage}
          professionalFocusTags={form.professionalFocusTags}
          professionalFocusTagInput={form.professionalFocusTagInput}
          professionalPrimaryLanguage={form.professionalPrimaryLanguage}
          professionalSecondaryLanguages={form.professionalSecondaryLanguages}
          professionalOtherLanguagesInput={form.professionalOtherLanguagesInput}
          professionalTargetAudiences={form.professionalTargetAudiences}
          professionalQualifications={form.professionalQualifications}
          professionalQualificationDraftName={form.professionalQualificationDraftName}
          professionalQualificationDraftIsCustom={form.professionalQualificationDraftIsCustom}
          professionalQualificationDraftSuggestionReason={form.professionalQualificationDraftSuggestionReason}
          professionalYearsExperience={form.professionalYearsExperience}
          professionalTermsAccepted={form.professionalTermsAccepted}
          approvedSubcategoryOptions={form.approvedSubcategoryOptions}
          approvedSpecialtyOptions={form.approvedSpecialtyOptions}
          shouldShowCustomSubcategoryPrompt={form.shouldShowCustomSubcategoryPrompt}
          shouldShowCustomSpecialtyPrompt={form.shouldShowCustomSpecialtyPrompt}
          basicTagsLimit={form.basicTagsLimit}
          loading={form.loading}
          error={form.error}
          showForgotPasswordLink={form.showForgotPasswordLink}
          fieldErrors={form.fieldErrors}
          errorList={form.errorList}
          email={form.email}
          onHeadlineChange={value => {
            form.setProfessionalHeadline(value)
            form.clearFieldError('professionalHeadline')
          }}
          onHeadlineCustomClick={() => {
            form.setProfessionalHeadlineIsCustom(true)
            form.clearFieldError('professionalHeadlineValidationMessage')
          }}
          onHeadlineValidationChange={value => {
            form.setProfessionalHeadlineValidationMessage(value)
            form.clearFieldError('professionalHeadlineValidationMessage')
          }}
          onSpecialtyChange={value => {
            form.setProfessionalSpecialtyName(value)
            form.clearFieldError('professionalSpecialtyName')
          }}
          onSpecialtyCustomClick={() => {
            form.setProfessionalSpecialtyIsCustom(true)
            form.clearFieldError('professionalSpecialtyValidationMessage')
          }}
          onSpecialtyValidationChange={value => {
            form.setProfessionalSpecialtyValidationMessage(value)
            form.clearFieldError('professionalSpecialtyValidationMessage')
          }}
          onFocusTagInputChange={value => {
            form.setProfessionalFocusTagInput(value)
            form.clearFieldError('professionalFocusAreas')
          }}
          onFocusTagKeyDown={event => {
            if (event.key === ',' || event.key === 'Enter') {
              event.preventDefault()
              form.addFocusTag(form.professionalFocusTagInput.replace(',', ''))
              form.setProfessionalFocusTagInput('')
            }
            if (event.key === 'Backspace' && !form.professionalFocusTagInput && form.professionalFocusTags.length > 0) {
              form.removeFocusTag(form.professionalFocusTags[form.professionalFocusTags.length - 1] || '')
            }
          }}
          onAddFocusTag={form.addFocusTag}
          onRemoveFocusTag={form.removeFocusTag}
          onToggleTargetAudience={form.toggleTargetAudience}
          onPrimaryLanguageChange={value => {
            form.setProfessionalPrimaryLanguage(value)
            form.clearFieldError('professionalPrimaryLanguage')
          }}
          onToggleSecondaryLanguage={form.toggleSecondaryLanguage}
          onOtherLanguagesInputChange={value => {
            form.setProfessionalOtherLanguagesInput(value)
            form.clearFieldError('professionalSecondaryLanguages')
          }}
          onYearsExperienceChange={value => {
            form.setProfessionalYearsExperience(value)
            form.clearFieldError('professionalYearsExperience')
          }}
          onQualificationDraftNameChange={value => {
            form.setProfessionalQualificationDraftName(value)
            form.setProfessionalQualificationDraftIsCustom(false)
            form.clearFieldError('professionalQualifications')
          }}
          onQualificationDraftCustomClick={() => form.setProfessionalQualificationDraftIsCustom(true)}
          onQualificationDraftSuggestionChange={value => form.setProfessionalQualificationDraftSuggestionReason(value)}
          onAddQualification={form.addQualificationDraft}
          onRemoveQualification={form.removeQualificationDraft}
          onUpdateQualification={form.updateQualificationDraft}
          onToggleTermsCheckbox={form.toggleTermsCheckbox}
          onOpenTermsModal={form.openTermsModal}
          onBack={() => {
            form.setStep(2)
            form.setError('')
            form.setFieldErrors({})
          }}
          onSubmit={form.handleSignUp}
        />
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem uma conta?{' '}
        <Link
          href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
          className="font-medium text-[#3d6b1f] hover:text-[#3d6b1f]"
        >
          Entrar
        </Link>
      </p>

      <TermsModal
        activeTermKey={form.activeTermsModalKey}
        scrolledToEnd={form.termsModalScrolledToEnd}
        onClose={() => form.setActiveTermsModalKey(null)}
        onAccept={form.acceptTermsFromModal}
        onScroll={event => {
          const el = event.currentTarget
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
            form.setTermsModalScrolledToEnd(true)
          }
        }}
      />

      {form.showSignupSuccessModal && (
        <SignupSuccessModal
          role={form.role}
          email={form.email}
          signupSuccessEmail={form.signupSuccessEmail}
          onConfirm={form.handleSignupSuccessConfirm}
        />
      )}
    </div>
  )
}
