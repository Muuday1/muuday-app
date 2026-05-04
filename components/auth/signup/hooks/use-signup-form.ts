'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import { sendWelcomeEmailAction } from '@/lib/actions/email'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'
import { COUNTRIES } from '@/lib/utils'
import { ALL_TIMEZONES, STRIPE_CURRENCIES } from '@/lib/constants'
import { SEARCH_CATEGORIES } from '@/lib/search-config'
import { guardAuthAttempt } from '@/lib/auth/attempt-guard-client'
import {
  AUTH_MESSAGES,
  isDuplicateSignupError,
  mapSignupErrorMessage,
} from '@/lib/auth/messages'
import { getTierLimits } from '@/lib/tier-config'
import {
  buildInitialTermsState,
  getPasswordPolicyStatus,
  getPasswordStrength,
  includesNormalizedOption,
  isRegistrationQualification,
  normalizeOption,
  PROFESSIONAL_LANGUAGE_OPTIONS,
  PROFESSIONAL_TERM_KEYS,
  QUALIFICATION_APPROVED_OPTIONS,
} from '../helpers'
import { PROFESSIONAL_TERMS_VERSION } from '@/lib/legal/professional-terms'
import type { Role, FieldErrors, QualificationDraft, SignupFormProps } from '../types'

export function useSignupForm({ initialCatalog, redirectPath, requestedRole, origin }: SignupFormProps) {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role>('usuario')
  const [professionalTitle, setProfessionalTitle] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('Europe/London')
  const [currency, setCurrency] = useState('GBP')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPasswordLink, setShowForgotPasswordLink] = useState(false)
  const [showSignupSuccessModal, setShowSignupSuccessModal] = useState(false)
  const [signupSuccessEmail, setSignupSuccessEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [professionalHeadline, setProfessionalHeadline] = useState('')
  const [professionalHeadlineIsCustom, setProfessionalHeadlineIsCustom] = useState(false)
  const [professionalHeadlineValidationMessage, setProfessionalHeadlineValidationMessage] = useState('')
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState('')
  const [professionalCategory, setProfessionalCategory] = useState('')
  const [professionalSpecialtyName, setProfessionalSpecialtyName] = useState('')
  const [professionalSpecialtyIsCustom, setProfessionalSpecialtyIsCustom] = useState(false)
  const [professionalSpecialtyValidationMessage, setProfessionalSpecialtyValidationMessage] = useState('')
  const [professionalFocusTags, setProfessionalFocusTags] = useState<string[]>([])
  const [professionalFocusTagInput, setProfessionalFocusTagInput] = useState('')
  const [professionalPrimaryLanguage, setProfessionalPrimaryLanguage] = useState(
    PROFESSIONAL_LANGUAGE_OPTIONS[0] || 'Português',
  )
  const [professionalSecondaryLanguages, setProfessionalSecondaryLanguages] = useState<string[]>([])
  const [professionalOtherLanguagesInput, setProfessionalOtherLanguagesInput] = useState('')
  const [professionalTargetAudiences, setProfessionalTargetAudiences] = useState<string[]>([])
  const [approvedSpecialtiesByCategory, setApprovedSpecialtiesByCategory] = useState<
    Record<string, string[]>
  >({})
  const [approvedSubcategoriesByCategory, setApprovedSubcategoriesByCategory] = useState<
    Record<string, Array<{ slug: string; name: string }>>
  >({})
  const [approvedSpecialtiesBySubcategory, setApprovedSpecialtiesBySubcategory] = useState<
    Record<string, string[]>
  >({})
  const [subcategoryDirectory, setSubcategoryDirectory] = useState<
    Array<{ slug: string; name: string; categorySlug: string; categoryName: string }>
  >([])
  const [professionalCategoryOptions, setProfessionalCategoryOptions] = useState<
    Array<{ slug: string; name: string; icon: string }>
  >(
    SEARCH_CATEGORIES.map(category => ({
      slug: category.slug,
      name: category.name,
      icon: category.icon,
    })),
  )
  const [professionalQualifications, setProfessionalQualifications] = useState<QualificationDraft[]>([])
  const [professionalQualificationDraftName, setProfessionalQualificationDraftName] = useState('')
  const [professionalQualificationDraftIsCustom, setProfessionalQualificationDraftIsCustom] = useState(false)
  const [professionalQualificationDraftSuggestionReason, setProfessionalQualificationDraftSuggestionReason] =
    useState('')
  const [professionalYearsExperience, setProfessionalYearsExperience] = useState('')
  const [professionalTermsAccepted, setProfessionalTermsAccepted] =
    useState(buildInitialTermsState())
  const [activeTermsModalKey, setActiveTermsModalKey] = useState<string | null>(null)
  const [termsModalScrolledToEnd, setTermsModalScrolledToEnd] = useState(false)

  const fallbackSpecialtiesByCategory = useMemo(() => {
    const map = new Map<string, string[]>()
    SEARCH_CATEGORIES.forEach(category => {
      map.set(
        category.slug,
        Array.from(new Set(category.specialties)).sort((a, b) =>
          a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
        ),
      )
    })
    return map
  }, [])

  const selectedSubcategory = useMemo(() => {
    if (!selectedSubcategorySlug) return null
    return (
      subcategoryDirectory.find(item => item.slug === selectedSubcategorySlug) ||
      null
    )
  }, [selectedSubcategorySlug, subcategoryDirectory])

  const approvedSubcategoryOptions = useMemo(() => {
    const all = subcategoryDirectory.map(item => ({ slug: item.slug, name: item.name }))
    return Array.from(new Map(all.map(item => [item.slug, item])).values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [subcategoryDirectory])

  const approvedSpecialtyOptions = useMemo(() => {
    if (selectedSubcategorySlug) {
      return approvedSpecialtiesBySubcategory[selectedSubcategorySlug] || []
    }

    const categoryKey = professionalCategory || ''
    if (categoryKey) {
      const dbOptions = approvedSpecialtiesByCategory[categoryKey] || []
      if (dbOptions.length > 0) return dbOptions
      return fallbackSpecialtiesByCategory.get(categoryKey) || []
    }

    const allDbOptions = Array.from(
      new Set(Object.values(approvedSpecialtiesByCategory).flatMap(options => options)),
    )
    if (allDbOptions.length > 0) {
      return allDbOptions.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    }

    const fallbackAll = SEARCH_CATEGORIES.flatMap(category => category.specialties)
    return Array.from(new Set(fallbackAll)).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [
    selectedSubcategorySlug,
    approvedSpecialtiesBySubcategory,
    professionalCategory,
    approvedSpecialtiesByCategory,
    fallbackSpecialtiesByCategory,
  ])

  const isSpecialtyApproved = useMemo(
    () => includesNormalizedOption(approvedSpecialtyOptions, professionalSpecialtyName),
    [approvedSpecialtyOptions, professionalSpecialtyName],
  )

  const matchedSubcategory = useMemo(
    () =>
      approvedSubcategoryOptions.find(option =>
        normalizeOption(option.name) === normalizeOption(professionalHeadline),
      ) || null,
    [approvedSubcategoryOptions, professionalHeadline],
  )

  const shouldShowCustomSubcategoryPrompt =
    professionalHeadline.trim().length > 1 && !matchedSubcategory && !professionalHeadlineIsCustom

  const shouldShowCustomSpecialtyPrompt =
    professionalSpecialtyName.trim().length > 1 && !isSpecialtyApproved && !professionalSpecialtyIsCustom

  const basicTagsLimit = useMemo(() => getTierLimits('basic').tags, [])

  useEffect(() => {
    if (!country) return
    const selectedCountry = COUNTRIES.find(item => item.code === country)
    if (!selectedCountry) return
    setTimezone(selectedCountry.timezone)
    setCurrency(selectedCountry.currency)
  }, [country])

  useEffect(() => {
    if (requestedRole === 'profissional') setRole('profissional')
    if (requestedRole === 'usuario') setRole('usuario')
  }, [requestedRole])

  useEffect(() => {
    if (role === 'profissional') return
    setProfessionalTermsAccepted(buildInitialTermsState())
    setActiveTermsModalKey(null)
    setTermsModalScrolledToEnd(false)
  }, [role])

  useEffect(() => {
    if (role !== 'profissional') return
    if (!initialCatalog) return

    setApprovedSpecialtiesByCategory(initialCatalog.specialtyOptionsByCategory)
    setApprovedSubcategoriesByCategory(initialCatalog.subcategoryOptionsByCategory)
    setApprovedSpecialtiesBySubcategory(initialCatalog.specialtyOptionsBySubcategory)
    setSubcategoryDirectory(initialCatalog.subcategoryDirectory)
    setProfessionalCategoryOptions(
      initialCatalog.categories.length > 0
        ? initialCatalog.categories
        : SEARCH_CATEGORIES.map(category => ({
            slug: category.slug,
            name: category.name,
            icon: category.icon,
          })),
    )
  }, [role, initialCatalog])

  useEffect(() => {
    if (!professionalSpecialtyName.trim()) return
    if (professionalSpecialtyIsCustom) return
    if (approvedSpecialtyOptions.length === 0) return
    if (includesNormalizedOption(approvedSpecialtyOptions, professionalSpecialtyName)) return

    setProfessionalSpecialtyName('')
  }, [approvedSpecialtyOptions, professionalCategory, professionalSpecialtyIsCustom, professionalSpecialtyName])

  useEffect(() => {
    if (!professionalHeadline.trim()) {
      setSelectedSubcategorySlug('')
      if (!professionalHeadlineIsCustom) setProfessionalCategory('')
      return
    }

    if (matchedSubcategory) {
      setSelectedSubcategorySlug(matchedSubcategory.slug)
      setProfessionalCategory(
        subcategoryDirectory.find(item => item.slug === matchedSubcategory.slug)?.categorySlug || '',
      )
      setProfessionalHeadlineIsCustom(false)
      setProfessionalHeadlineValidationMessage('')
      return
    }

    setSelectedSubcategorySlug('')
    if (!professionalHeadlineIsCustom) {
      setProfessionalCategory('')
    } else {
      setProfessionalCategory('outro')
    }
  }, [matchedSubcategory, professionalHeadline, professionalHeadlineIsCustom, subcategoryDirectory])

  useEffect(() => {
    if (!professionalPrimaryLanguage) return
    setProfessionalSecondaryLanguages(prev => prev.filter(language => language !== professionalPrimaryLanguage))
  }, [professionalPrimaryLanguage])

  useEffect(() => {
    if (isSpecialtyApproved && professionalSpecialtyIsCustom) {
      setProfessionalSpecialtyIsCustom(false)
      setProfessionalSpecialtyValidationMessage('')
    }
  }, [isSpecialtyApproved, professionalSpecialtyIsCustom])

  const clearFieldError = useCallback((name: string) => {
    setFieldErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const addFocusTag = useCallback((rawValue: string) => {
    const value = rawValue.trim()
    if (!value) return
    setProfessionalFocusTags(prev => {
      if (prev.some(tag => normalizeOption(tag) === normalizeOption(value))) return prev
      if (prev.length >= basicTagsLimit) {
        setFieldErrors(fieldErrs => ({
          ...fieldErrs,
          professionalFocusAreas: `Plano Básico permite até ${basicTagsLimit} tags nesta etapa.`,
        }))
        return prev
      }
      setFieldErrors(fieldErrs => {
        const next = { ...fieldErrs }
        delete next.professionalFocusAreas
        return next
      })
      return [...prev, value]
    })
  }, [basicTagsLimit])

  const removeFocusTag = useCallback((tagValue: string) => {
    setProfessionalFocusTags(prev => prev.filter(tag => tag !== tagValue))
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.professionalFocusAreas
      return next
    })
  }, [])

  const parseOtherLanguagesInput = useCallback((value: string) => {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }, [])

  const toggleTargetAudience = useCallback((audience: string) => {
    setProfessionalTargetAudiences(prev =>
      prev.includes(audience) ? prev.filter(item => item !== audience) : [...prev, audience],
    )
  }, [])

  const toggleSecondaryLanguage = useCallback((language: string) => {
    setProfessionalSecondaryLanguages(prev => {
      if (prev.includes(language)) return prev.filter(item => item !== language)
      return [...prev, language]
    })
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.professionalSecondaryLanguages
      return next
    })
  }, [])

  const openTermsModal = useCallback((key: string) => {
    setActiveTermsModalKey(key)
    setTermsModalScrolledToEnd(false)
  }, [])

  const acceptTermsFromModal = useCallback(() => {
    if (!activeTermsModalKey || !termsModalScrolledToEnd) return
    setProfessionalTermsAccepted(prev => ({
      ...prev,
      [activeTermsModalKey]: true,
    }))
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.professionalTerms
      return next
    })
    setActiveTermsModalKey(null)
    setTermsModalScrolledToEnd(false)
  }, [activeTermsModalKey, termsModalScrolledToEnd])

  const toggleTermsCheckbox = useCallback((key: string) => {
    setProfessionalTermsAccepted(prev => {
      const isAccepted = prev[key as keyof typeof prev]
      if (!isAccepted) {
        setActiveTermsModalKey(key)
        setTermsModalScrolledToEnd(false)
        return prev
      }
      return { ...prev, [key]: false }
    })
  }, [])

  const addQualificationDraft = useCallback(() => {
    const name = professionalQualificationDraftName.trim()
    if (!name) return

    const approved = QUALIFICATION_APPROVED_OPTIONS.some(
      option => normalizeOption(option) === normalizeOption(name),
    )
    const isCustom = !approved || professionalQualificationDraftIsCustom

    if (isCustom && !professionalQualificationDraftSuggestionReason.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        professionalQualifications: 'Explique por que a qualificação não está na lista aprovada.',
      }))
      return
    }

    const entry: QualificationDraft = {
      id: crypto.randomUUID(),
      name,
      isCustom,
      suggestionReason: professionalQualificationDraftSuggestionReason.trim(),
      courseName: '',
      registrationNumber: '',
      issuer: '',
      country: '',
    }

    setProfessionalQualifications(prev => [...prev, entry])
    setProfessionalQualificationDraftName('')
    setProfessionalQualificationDraftIsCustom(false)
    setProfessionalQualificationDraftSuggestionReason('')
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.professionalQualifications
      return next
    })
  }, [professionalQualificationDraftName, professionalQualificationDraftIsCustom, professionalQualificationDraftSuggestionReason])

  const removeQualificationDraft = useCallback((id: string) => {
    setProfessionalQualifications(prev => prev.filter(item => item.id !== id))
  }, [])

  const updateQualificationDraft = useCallback((id: string, updater: (item: QualificationDraft) => QualificationDraft) => {
    setProfessionalQualifications(prev => prev.map(item => (item.id === id ? updater(item) : item)))
  }, [])

  const validateStep2 = useCallback((): FieldErrors => {
    const nextErrors: FieldErrors = {}

    if (role === 'profissional' && !professionalTitle) nextErrors.professionalTitle = 'Selecione seu título.'
    if (!fullName.trim()) nextErrors.fullName = 'Informe seu nome completo.'
    if (!country) nextErrors.country = 'Selecione o país.'
    if (!timezone) nextErrors.timezone = 'Selecione o fuso horário.'
    if (!currency) nextErrors.currency = 'Selecione a moeda preferida.'
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'
    if (!password) nextErrors.password = 'Informe uma senha.'
    if (password.length > 0 && !getPasswordPolicyStatus(password).isValid) {
      nextErrors.password = 'A senha deve ter no mínimo 7 caracteres, incluindo número e símbolo.'
    }
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirme a senha.'
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = 'As senhas não coincidem.'
    }

    return nextErrors
  }, [role, professionalTitle, fullName, country, timezone, currency, email, password, confirmPassword])

  const validateProfessionalStep = useCallback((): FieldErrors => {
    const nextErrors: FieldErrors = {}

    if (!professionalHeadline.trim()) nextErrors.professionalHeadline = 'Informe a área de atuação específica.'
    if (!matchedSubcategory && !professionalHeadlineIsCustom) {
      nextErrors.professionalHeadline = 'Selecione uma área da lista aprovada ou sugira uma nova.'
    }
    if (professionalHeadlineIsCustom && !professionalHeadlineValidationMessage.trim()) {
      nextErrors.professionalHeadlineValidationMessage = 'Explique por que essa área precisa ser validada.'
    }
    if (!professionalCategory) nextErrors.professionalCategory = 'Selecione uma categoria.'

    if (!professionalSpecialtyName.trim()) {
      nextErrors.professionalSpecialtyName = 'Selecione uma especialidade da lista ou sugira uma nova.'
    } else if (!isSpecialtyApproved && !professionalSpecialtyIsCustom) {
      nextErrors.professionalSpecialtyName = 'Especialidade não encontrada. Clique em "Sugerir nova especialidade".'
    }

    if (professionalSpecialtyIsCustom && !professionalSpecialtyValidationMessage.trim()) {
      nextErrors.professionalSpecialtyValidationMessage = 'Explique por que essa especialidade precisa ser validada.'
    }

    if (professionalFocusTags.length > basicTagsLimit) {
      nextErrors.professionalFocusAreas = `Plano Básico permite até ${basicTagsLimit} tags nesta etapa.`
    }

    if (!professionalPrimaryLanguage) {
      nextErrors.professionalPrimaryLanguage = 'Selecione o idioma principal de atendimento.'
    }
    if (
      professionalSecondaryLanguages.includes('Outros') &&
      parseOtherLanguagesInput(professionalOtherLanguagesInput).length === 0
    ) {
      nextErrors.professionalSecondaryLanguages = 'Preencha o campo de idiomas em "Outros".'
    }

    if (professionalQualifications.length === 0) {
      nextErrors.professionalQualifications = 'Adicione ao menos uma qualificação/certificado.'
    }
    for (const item of professionalQualifications) {
      const requiresRegistrationData = isRegistrationQualification(item.name)
      if (requiresRegistrationData) {
        if (!item.registrationNumber.trim() || !item.issuer.trim() || !item.country.trim()) {
          nextErrors.professionalQualifications =
            'Registro profissional exige número, órgão emissor e país do registro.'
          break
        }
      } else if (!item.courseName.trim()) {
        nextErrors.professionalQualifications =
          'Para certificados e cursos, informe o nome do curso/formação.'
        break
      }
    }

    const years = Number(professionalYearsExperience)
    if (!professionalYearsExperience || Number.isNaN(years) || years < 0 || years > 60) {
      nextErrors.professionalYearsExperience = 'Informe anos de experiencia entre 0 e 60.'
    }

    const allTermsAccepted = PROFESSIONAL_TERM_KEYS.every(key => professionalTermsAccepted[key])
    if (!allTermsAccepted) {
      nextErrors.professionalTerms =
        'Para enviar para analise, abra, leia ate o fim e aceite todos os termos obrigatorios.'
    }

    return nextErrors
  }, [
    professionalHeadline,
    matchedSubcategory,
    professionalHeadlineIsCustom,
    professionalHeadlineValidationMessage,
    professionalCategory,
    professionalSpecialtyName,
    isSpecialtyApproved,
    professionalSpecialtyIsCustom,
    professionalSpecialtyValidationMessage,
    professionalFocusTags,
    basicTagsLimit,
    professionalPrimaryLanguage,
    professionalSecondaryLanguages,
    parseOtherLanguagesInput,
    professionalOtherLanguagesInput,
    professionalQualifications,
    professionalYearsExperience,
    professionalTermsAccepted,
  ])

  const validateForCurrentStep = useCallback(() => {
    const step2Errors = validateStep2()
    if (step === 2 && role === 'usuario') return step2Errors
    if (step === 2 && role === 'profissional') return step2Errors
    if (step === 3 && role === 'profissional') {
      return { ...step2Errors, ...validateProfessionalStep() }
    }
    return {}
  }, [step, role, validateStep2, validateProfessionalStep])

  const handleSignUp = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setShowForgotPasswordLink(false)

    const validationErrors = validateForCurrentStep()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Revise os campos destacados para continuar.')
      setLoading(false)
      return
    }

    const focusAreas = professionalFocusTags
    const otherLanguages = parseOtherLanguagesInput(professionalOtherLanguagesInput)
    const secondaryLanguages = professionalSecondaryLanguages
      .filter(language => language !== 'Outros')
      .concat(otherLanguages)
      .filter(language => language !== professionalPrimaryLanguage)
    const allLanguages = Array.from(new Set([professionalPrimaryLanguage, ...secondaryLanguages].filter(Boolean)))
    const qualificationFileNames: string[] = []
    const taxonomySuggestionsPayload = {
      subcategory: professionalHeadlineIsCustom
        ? {
            name: professionalHeadline.trim(),
            reason: professionalHeadlineValidationMessage.trim(),
          }
        : null,
      specialty: professionalSpecialtyIsCustom
        ? {
            name: professionalSpecialtyName.trim(),
            reason: professionalSpecialtyValidationMessage.trim(),
          }
        : null,
      terms_acceptance: {
        platform_terms: professionalTermsAccepted.platform_terms,
        privacy_terms: professionalTermsAccepted.privacy_terms,
        regulated_scope_terms: professionalTermsAccepted.regulated_scope_terms,
        terms_version: PROFESSIONAL_TERMS_VERSION,
        accepted_at: new Date().toISOString(),
      },
    }
    const qualificationsStructuredPayload = professionalQualifications.map(item => ({
      name: item.name,
      is_custom: item.isCustom,
      suggestion_reason: item.suggestionReason,
      requires_registration: isRegistrationQualification(item.name),
      course_name: item.courseName || null,
      registration_number: item.registrationNumber || null,
      issuer: item.issuer || null,
      country: item.country || null,
      evidence_file_names: [],
    }))

    const supabase = createClient()
    captureEvent('auth_signup_started', { role, country, timezone, currency })

    const guard = await guardAuthAttempt('signup', email)
    if (!guard.allowed) {
      captureEvent('auth_signup_rate_limited', { role })
      setError(guard.error || AUTH_MESSAGES.signup.rateLimited)
      setLoading(false)
      return
    }

    const signupMetadata: Record<string, unknown> = {
      full_name: fullName,
      role,
      country,
      timezone,
      currency,
    }

    if (role === 'profissional') {
      signupMetadata.professional_title = professionalTitle
      signupMetadata.professional_display_name = fullName.trim()
      signupMetadata.professional_headline = professionalHeadline
      signupMetadata.professional_category = professionalCategory || 'outro'
      signupMetadata.professional_subcategory = selectedSubcategorySlug
      signupMetadata.professional_specialty_name = professionalSpecialtyName.trim()
      signupMetadata.professional_specialty_is_custom = professionalSpecialtyIsCustom
      signupMetadata.professional_specialty_validation_message = professionalSpecialtyValidationMessage.trim()
      signupMetadata.professional_focus_areas = focusAreas
      signupMetadata.professional_primary_language = professionalPrimaryLanguage
      signupMetadata.professional_secondary_languages = secondaryLanguages
      signupMetadata.professional_languages = allLanguages
      signupMetadata.professional_other_languages = otherLanguages
      signupMetadata.professional_target_audiences = professionalTargetAudiences
      signupMetadata.professional_years_experience = Number(professionalYearsExperience || 0)
      signupMetadata.professional_session_price = 0
      signupMetadata.professional_session_duration_minutes = 60
      signupMetadata.professional_qualification_files = qualificationFileNames
      signupMetadata.professional_taxonomy_suggestions = JSON.stringify(taxonomySuggestionsPayload)
      signupMetadata.professional_qualifications_structured = JSON.stringify(qualificationsStructuredPayload)
      signupMetadata.professional_specialties = professionalSpecialtyName.trim()
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: signupMetadata,
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    const createdIdentityCount = signUpData?.user?.identities?.length ?? 0
    const duplicateByIdentitySignal = !signUpError && createdIdentityCount === 0

    if (signUpError) {
      captureEvent('auth_signup_failed', { role, reason: signUpError.message })
      Sentry.captureMessage('auth_signup_failed', {
        level: 'warning',
        tags: { area: 'auth', flow: 'signup' },
        extra: {
          role,
          reason: signUpError.message || 'unknown',
        },
      })
      const normalizedMessage = signUpError.message || ''
      setError(mapSignupErrorMessage(normalizedMessage))
      setShowForgotPasswordLink(isDuplicateSignupError(normalizedMessage))
      setLoading(false)
      return
    }

    if (duplicateByIdentitySignal) {
      captureEvent('auth_signup_failed', { role, reason: 'email_already_registered' })
      Sentry.captureMessage('auth_signup_failed_duplicate_email', {
        level: 'warning',
        tags: { area: 'auth', flow: 'signup' },
        extra: {
          role,
          reason: 'email_already_registered',
        },
      })
      setError(AUTH_MESSAGES.signup.duplicateEmail)
      setShowForgotPasswordLink(true)
      setLoading(false)
      return
    }

    sendWelcomeEmailAction(email, fullName)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      identifyEventUser(user.id, { email: user.email || email, role })
    }

    captureEvent('auth_signup_succeeded', { role, country, timezone, currency })

    if (role === 'usuario') {
      try {
        await supabase.auth.signOut()
      } catch {}
      setSignupSuccessEmail(email.trim())
      setShowSignupSuccessModal(true)
      setLoading(false)
      return
    }

    const destination = '/cadastro/profissional-em-analise'
    router.push(destination)
    router.refresh()
  }, [
    validateForCurrentStep,
    professionalFocusTags,
    parseOtherLanguagesInput,
    professionalOtherLanguagesInput,
    professionalSecondaryLanguages,
    professionalPrimaryLanguage,
    professionalHeadlineIsCustom,
    professionalHeadline,
    professionalHeadlineValidationMessage,
    professionalSpecialtyIsCustom,
    professionalSpecialtyName,
    professionalSpecialtyValidationMessage,
    professionalTermsAccepted,
    professionalQualifications,
    role,
    country,
    timezone,
    currency,
    email,
    password,
    fullName,
    professionalTitle,
    professionalCategory,
    selectedSubcategorySlug,
    professionalTargetAudiences,
    professionalYearsExperience,
    origin,
    router,
  ])

  const goToStep2 = useCallback(() => {
    setStep(2)
    setFieldErrors({})
    setError('')
  }, [])

  const handleContinueProfessionalStep = useCallback((event: React.FormEvent) => {
    event.preventDefault()
    const step2Errors = validateStep2()
    if (Object.keys(step2Errors).length > 0) {
      setFieldErrors(step2Errors)
      setError('Revise os campos destacados para continuar.')
      return
    }

    setFieldErrors({})
    setError('')
    setStep(3)
  }, [validateStep2])

  const totalSteps = role === 'profissional' ? 3 : 2
  const errorList = useMemo(() => {
    const unique = Array.from(new Set(Object.values(fieldErrors)))
    return unique
  }, [fieldErrors])
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  const handleSignupSuccessConfirm = useCallback(() => {
    setShowSignupSuccessModal(false)
    router.push('/')
    router.refresh()
  }, [router])

  return {
    // Navigation
    step,
    setStep,
    totalSteps,
    goToStep2,
    handleContinueProfessionalStep,

    // Role
    role,
    setRole,

    // Personal fields
    professionalTitle,
    setProfessionalTitle,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    country,
    setCountry,
    timezone,
    setTimezone,
    currency,
    setCurrency,

    // Loading / Error
    loading,
    setLoading,
    error,
    setError,
    showForgotPasswordLink,
    setShowForgotPasswordLink,
    fieldErrors,
    setFieldErrors,
    errorList,
    clearFieldError,

    // Password strength
    passwordStrength,

    // Professional fields
    professionalHeadline,
    setProfessionalHeadline,
    professionalHeadlineIsCustom,
    setProfessionalHeadlineIsCustom,
    professionalHeadlineValidationMessage,
    setProfessionalHeadlineValidationMessage,
    selectedSubcategorySlug,
    setSelectedSubcategorySlug,
    professionalCategory,
    setProfessionalCategory,
    professionalSpecialtyName,
    setProfessionalSpecialtyName,
    professionalSpecialtyIsCustom,
    setProfessionalSpecialtyIsCustom,
    professionalSpecialtyValidationMessage,
    setProfessionalSpecialtyValidationMessage,
    professionalFocusTags,
    setProfessionalFocusTags,
    professionalFocusTagInput,
    setProfessionalFocusTagInput,
    professionalPrimaryLanguage,
    setProfessionalPrimaryLanguage,
    professionalSecondaryLanguages,
    setProfessionalSecondaryLanguages,
    professionalOtherLanguagesInput,
    setProfessionalOtherLanguagesInput,
    professionalTargetAudiences,
    setProfessionalTargetAudiences,
    professionalQualifications,
    setProfessionalQualifications,
    professionalQualificationDraftName,
    setProfessionalQualificationDraftName,
    professionalQualificationDraftIsCustom,
    setProfessionalQualificationDraftIsCustom,
    professionalQualificationDraftSuggestionReason,
    setProfessionalQualificationDraftSuggestionReason,
    professionalYearsExperience,
    setProfessionalYearsExperience,
    professionalTermsAccepted,
    setProfessionalTermsAccepted,
    activeTermsModalKey,
    setActiveTermsModalKey,
    termsModalScrolledToEnd,
    setTermsModalScrolledToEnd,

    // Derived professional
    selectedSubcategory,
    approvedSubcategoryOptions,
    approvedSpecialtyOptions,
    isSpecialtyApproved,
    matchedSubcategory,
    shouldShowCustomSubcategoryPrompt,
    shouldShowCustomSpecialtyPrompt,
    basicTagsLimit,

    // Catalog
    professionalCategoryOptions,

    // Handlers
    addFocusTag,
    removeFocusTag,
    parseOtherLanguagesInput,
    toggleTargetAudience,
    toggleSecondaryLanguage,
    openTermsModal,
    acceptTermsFromModal,
    toggleTermsCheckbox,
    addQualificationDraft,
    removeQualificationDraft,
    updateQualificationDraft,

    // Submit
    handleSignUp,

    // Success modal
    showSignupSuccessModal,
    setShowSignupSuccessModal,
    signupSuccessEmail,
    setSignupSuccessEmail,
    handleSignupSuccessConfirm,

    // Router needed for footer link
    redirectPath,
  }
}
