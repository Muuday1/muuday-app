'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, Eye, EyeOff, Loader2, User } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { sendWelcomeEmailAction } from '@/lib/actions/email'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'
import { COUNTRIES } from '@/lib/utils'
import { ALL_TIMEZONES, STRIPE_CURRENCIES } from '@/lib/constants'
import { LANGUAGE_OPTIONS, SEARCH_CATEGORIES } from '@/lib/search-config'
import { guardAuthAttempt } from '@/lib/auth/attempt-guard-client'
import {
  AUTH_MESSAGES,
  isDuplicateSignupError,
  mapSignupErrorMessage,
} from '@/lib/auth/messages'
import {
  buildSpecialtyOptionsByCategorySlug,
  loadActiveTaxonomyCatalog,
} from '@/lib/taxonomy/professional-specialties'

type Role = 'usuario' | 'profissional'

type FieldErrors = Record<string, string>

const PROFESSIONAL_TITLES = ['Sr.', 'Sra.', 'Srta.', 'Dr.', 'Dra.', 'Prof.', 'Profa.', 'Prefiro não informar']

function normalizeOption(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function parseCommaValues(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function includesNormalizedOption(options: string[], value: string) {
  const normalizedValue = normalizeOption(value)
  return options.some(option => normalizeOption(option) === normalizedValue)
}

function sanitizeRedirectPath(value: string | null) {
  if (!value) return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

function getRedirectHint(path: string) {
  if (!path) return ''
  if (path.startsWith('/agendar/')) return 'Após criar sua conta, você volta para concluir o agendamento.'
  if (path.startsWith('/solicitar/')) return 'Após criar sua conta, você volta para concluir a solicitação de horário.'
  if (path.startsWith('/profissional/')) return 'Após criar sua conta, você volta para o perfil do profissional.'
  if (path.startsWith('/buscar')) return 'Após criar sua conta, você volta para a busca.'
  return 'Após criar sua conta, você volta para a página anterior.'
}

function getPasswordPolicyStatus(password: string) {
  const hasMinLength = password.length >= 7
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const passedCount = [hasMinLength, hasNumber, hasSymbol].filter(Boolean).length
  const isValid = hasMinLength && hasNumber && hasSymbol

  return { hasMinLength, hasNumber, hasSymbol, passedCount, isValid }
}

function getPasswordStrength(password: string) {
  const policy = getPasswordPolicyStatus(password)

  if (!password) {
    return { label: 'Fraca', barClass: 'bg-neutral-200', barWidth: '0%' }
  }
  if (policy.passedCount <= 1) {
    return { label: 'Fraca', barClass: 'bg-red-500', barWidth: '33%' }
  }
  if (policy.passedCount === 2) {
    return { label: 'Média', barClass: 'bg-amber-500', barWidth: '66%' }
  }
  return { label: 'Forte', barClass: 'bg-emerald-500', barWidth: '100%' }
}

export default function CadastroPage() {
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
  const [requestedRole, setRequestedRole] = useState('')
  const [redirectPath, setRedirectPath] = useState('')

  const [professionalDisplayName, setProfessionalDisplayName] = useState('')
  const [professionalHeadline, setProfessionalHeadline] = useState('')
  const [professionalCategory, setProfessionalCategory] = useState('')
  const [professionalSpecialtyName, setProfessionalSpecialtyName] = useState('')
  const [professionalSpecialtyIsCustom, setProfessionalSpecialtyIsCustom] = useState(false)
  const [professionalSpecialtyValidationMessage, setProfessionalSpecialtyValidationMessage] = useState('')
  const [professionalFocusAreas, setProfessionalFocusAreas] = useState('')
  const [professionalPrimaryLanguage, setProfessionalPrimaryLanguage] = useState(LANGUAGE_OPTIONS[0] || 'Portugues')
  const [professionalSecondaryLanguages, setProfessionalSecondaryLanguages] = useState<string[]>([])
  const [approvedSpecialtiesByCategory, setApprovedSpecialtiesByCategory] = useState<
    Record<string, string[]>
  >({})
  const [professionalCategoryOptions, setProfessionalCategoryOptions] = useState<
    Array<{ slug: string; name: string; icon: string }>
  >(
    SEARCH_CATEGORIES.map(category => ({
      slug: category.slug,
      name: category.name,
      icon: category.icon,
    })),
  )
  const [professionalQualificationFiles, setProfessionalQualificationFiles] = useState<File[]>([])
  const [professionalQualificationNote, setProfessionalQualificationNote] = useState('')
  const [professionalYearsExperience, setProfessionalYearsExperience] = useState('')
  const [professionalSessionPrice, setProfessionalSessionPrice] = useState('')
  const [professionalSessionDuration, setProfessionalSessionDuration] = useState('60')

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

  const approvedSpecialtyOptions = useMemo(() => {
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
  }, [approvedSpecialtiesByCategory, fallbackSpecialtiesByCategory, professionalCategory])

  const isSpecialtyApproved = useMemo(
    () => includesNormalizedOption(approvedSpecialtyOptions, professionalSpecialtyName),
    [approvedSpecialtyOptions, professionalSpecialtyName],
  )

  const shouldShowCustomSpecialtyPrompt =
    professionalSpecialtyName.trim().length > 1 && !isSpecialtyApproved && !professionalSpecialtyIsCustom

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRequestedRole(params.get('role') || '')
    setRedirectPath(sanitizeRedirectPath(params.get('redirect')))
  }, [])

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
    if (role !== 'profissional') return
    let cancelled = false

    async function loadApprovedSpecialties() {
      const supabase = createClient()
      const catalog = await loadActiveTaxonomyCatalog(supabase as any)

      if (cancelled || !catalog) {
        setApprovedSpecialtiesByCategory({})
        setProfessionalCategoryOptions(
          SEARCH_CATEGORIES.map(category => ({
            slug: category.slug,
            name: category.name,
            icon: category.icon,
          })),
        )
        return
      }

      const specialtyMap = buildSpecialtyOptionsByCategorySlug(catalog)
      const mappedCategories = catalog.categories.map(category => {
        const fallbackCategory = SEARCH_CATEGORIES.find(item => item.slug === category.slug)
        return {
          slug: category.slug,
          name: category.name_pt || fallbackCategory?.name || category.slug,
          icon: fallbackCategory?.icon || '🧩',
        }
      })

      setApprovedSpecialtiesByCategory(Object.fromEntries(specialtyMap.entries()))
      setProfessionalCategoryOptions(
        mappedCategories.length > 0
          ? mappedCategories
          : SEARCH_CATEGORIES.map(category => ({
              slug: category.slug,
              name: category.name,
              icon: category.icon,
            })),
      )
    }

    loadApprovedSpecialties()

    return () => {
      cancelled = true
    }
  }, [role])

  useEffect(() => {
    if (!professionalSpecialtyName.trim()) return
    if (professionalSpecialtyIsCustom) return
    if (approvedSpecialtyOptions.length === 0) return
    if (includesNormalizedOption(approvedSpecialtyOptions, professionalSpecialtyName)) return

    setProfessionalSpecialtyName('')
  }, [approvedSpecialtyOptions, professionalCategory, professionalSpecialtyIsCustom, professionalSpecialtyName])

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

  function clearFieldError(name: string) {
    setFieldErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  function toggleSecondaryLanguage(language: string) {
    setProfessionalSecondaryLanguages(prev => {
      if (prev.includes(language)) return prev.filter(item => item !== language)
      return [...prev, language]
    })
    clearFieldError('professionalSecondaryLanguages')
  }

  function validateStep2(): FieldErrors {
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
  }

  function validateProfessionalStep(): FieldErrors {
    const nextErrors: FieldErrors = {}

    if (!professionalDisplayName.trim()) nextErrors.professionalDisplayName = 'Informe o nome público.'
    if (!professionalHeadline.trim()) nextErrors.professionalHeadline = 'Informe o título profissional.'
    if (!professionalCategory) nextErrors.professionalCategory = 'Selecione uma categoria.'

    if (!professionalSpecialtyName.trim()) {
      nextErrors.professionalSpecialtyName = 'Selecione uma especialidade da lista ou sugira uma nova.'
    } else if (!isSpecialtyApproved && !professionalSpecialtyIsCustom) {
      nextErrors.professionalSpecialtyName = 'Especialidade não encontrada. Clique em “Sugerir nova especialidade”.'
    }

    if (professionalSpecialtyIsCustom && !professionalSpecialtyValidationMessage.trim()) {
      nextErrors.professionalSpecialtyValidationMessage = 'Explique por que essa especialidade precisa ser validada.'
    }

    const focusAreas = parseCommaValues(professionalFocusAreas)
    if (focusAreas.length === 0) {
      nextErrors.professionalFocusAreas = 'Informe ao menos um foco de atuação.'
    }

    if (!professionalPrimaryLanguage) {
      nextErrors.professionalPrimaryLanguage = 'Selecione o idioma principal de atendimento.'
    }

    const years = Number(professionalYearsExperience)
    if (!professionalYearsExperience || Number.isNaN(years) || years < 0 || years > 60) {
      nextErrors.professionalYearsExperience = 'Informe anos de experiência entre 0 e 60.'
    }

    const price = Number(professionalSessionPrice)
    if (!professionalSessionPrice || Number.isNaN(price) || price < 1) {
      nextErrors.professionalSessionPrice = 'Informe um preço válido maior que zero.'
    }

    const duration = Number(professionalSessionDuration)
    if (![30, 45, 60, 90].includes(duration)) {
      nextErrors.professionalSessionDuration = 'Selecione uma duração válida.'
    }

    return nextErrors
  }

  function validateForCurrentStep() {
    const step2Errors = validateStep2()
    if (step === 2 && role === 'usuario') return step2Errors
    if (step === 2 && role === 'profissional') return step2Errors
    if (step === 3 && role === 'profissional') {
      return { ...step2Errors, ...validateProfessionalStep() }
    }
    return {}
  }

  async function handleSignUp(event: React.FormEvent) {
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

    const focusAreas = parseCommaValues(professionalFocusAreas)
    const qualificationFileNames = professionalQualificationFiles.map(file => file.name)
    const allLanguages = [professionalPrimaryLanguage, ...professionalSecondaryLanguages].filter(Boolean)

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
      signupMetadata.professional_display_name = professionalDisplayName
      signupMetadata.professional_headline = professionalHeadline
      signupMetadata.professional_category = professionalCategory
      signupMetadata.professional_specialty_name = professionalSpecialtyName.trim()
      signupMetadata.professional_specialty_is_custom = professionalSpecialtyIsCustom
      signupMetadata.professional_specialty_validation_message = professionalSpecialtyValidationMessage.trim()
      signupMetadata.professional_focus_areas = focusAreas
      signupMetadata.professional_primary_language = professionalPrimaryLanguage
      signupMetadata.professional_secondary_languages = professionalSecondaryLanguages
      signupMetadata.professional_languages = allLanguages
      signupMetadata.professional_years_experience = Number(professionalYearsExperience || 0)
      signupMetadata.professional_session_price = Number(professionalSessionPrice || 0)
      signupMetadata.professional_session_duration_minutes = Number(professionalSessionDuration || 60)
      signupMetadata.professional_qualification_files = qualificationFileNames
      signupMetadata.professional_qualification_note = professionalQualificationNote.trim()
      signupMetadata.professional_specialties = professionalSpecialtyName.trim()
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: signupMetadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
  }

  function goToStep2() {
    setStep(2)
    setFieldErrors({})
    setError('')
  }

  function handleContinueProfessionalStep(event: React.FormEvent) {
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
  }

  const totalSteps = role === 'profissional' ? 3 : 2
  const errorList = useMemo(() => {
    const unique = Array.from(new Set(Object.values(fieldErrors)))
    return unique
  }, [fieldErrors])
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  function inputClass(hasError: boolean) {
    if (hasError) {
      return 'w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200'
    }
    return 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20'
  }

  function handleSignupSuccessConfirm() {
    setShowSignupSuccessModal(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-neutral-900">Criar conta</h1>
      <p className="mb-6 text-neutral-500">Junte-se à Muuday</p>

      {redirectPath && role === 'usuario' && (
        <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700" role="status">
          {getRedirectHint(redirectPath)}
        </div>
      )}

      {step >= 1 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i + 1 <= step ? 'bg-brand-500' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-400">
            Passo {step} de {totalSteps}
            {step === 1 && ' — Escolha seu perfil'}
            {step === 2 && ' — Dados pessoais'}
            {step === 3 && ' — Dados profissionais'}
          </p>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="mb-4 text-sm font-medium text-neutral-700">Você é:</p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('usuario')}
              className={`rounded-xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 ${
                role === 'usuario'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
              aria-label="Selecionar conta de usuário"
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                <User className="h-5 w-5 text-brand-600" />
              </div>
              <div className="text-sm font-semibold text-neutral-900">Sou usuário</div>
              <div className="mt-0.5 text-xs text-neutral-500">Busco profissionais brasileiros no exterior</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('profissional')}
              className={`rounded-xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 ${
                role === 'profissional'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
              aria-label="Selecionar conta profissional"
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                <Briefcase className="h-5 w-5 text-brand-600" />
              </div>
              <div className="text-sm font-semibold text-neutral-900">Sou profissional</div>
              <div className="mt-0.5 text-xs text-neutral-500">Atendo clientes no exterior</div>
            </button>
          </div>
          <button
            onClick={goToStep2}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Continuar com e-mail
          </button>

          {role === 'usuario' && (
            <>
              <div className="relative my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs font-medium text-neutral-400">ou cadastre-se com</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
              <SocialAuthButtons redirectPath={redirectPath} roleHint="usuario" />
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <form onSubmit={role === 'profissional' ? handleContinueProfessionalStep : handleSignUp} className="space-y-4" noValidate>
          {role === 'profissional' && (
            <div>
              <label htmlFor="signup-title" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Título
              </label>
              <select
                id="signup-title"
                value={professionalTitle}
                onChange={event => {
                  setProfessionalTitle(event.target.value)
                  clearFieldError('professionalTitle')
                }}
                required
                className={inputClass(Boolean(fieldErrors.professionalTitle))}
                aria-invalid={Boolean(fieldErrors.professionalTitle)}
              >
                <option value="">Selecione o título</option>
                {PROFESSIONAL_TITLES.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {fieldErrors.professionalTitle && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalTitle}</p>}
            </div>
          )}

          <div>
            <label htmlFor="signup-fullname" className="mb-1.5 block text-sm font-medium text-neutral-700">Nome completo</label>
            <input
              id="signup-fullname"
              type="text"
              value={fullName}
              onChange={event => {
                setFullName(event.target.value)
                clearFieldError('fullName')
              }}
              required
              placeholder="Seu nome"
              className={inputClass(Boolean(fieldErrors.fullName))}
              aria-invalid={Boolean(fieldErrors.fullName)}
            />
            {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="signup-country" className="mb-1.5 block text-sm font-medium text-neutral-700">
              {role === 'usuario' ? 'País onde você mora' : 'País (base de operação)'}
            </label>
            <select
              id="signup-country"
              value={country}
              onChange={event => {
                setCountry(event.target.value)
                clearFieldError('country')
              }}
              required
              className={inputClass(Boolean(fieldErrors.country))}
              aria-invalid={Boolean(fieldErrors.country)}
            >
              <option value="">Selecione o país</option>
              {COUNTRIES.map(item => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            {fieldErrors.country && <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>}
          </div>

          <div>
            <label htmlFor="signup-timezone" className="mb-1.5 block text-sm font-medium text-neutral-700">Fuso horário</label>
            <select
              id="signup-timezone"
              value={timezone}
              onChange={event => {
                setTimezone(event.target.value)
                clearFieldError('timezone')
              }}
              required
              className={inputClass(Boolean(fieldErrors.timezone))}
              aria-invalid={Boolean(fieldErrors.timezone)}
            >
              {ALL_TIMEZONES.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.timezone && <p className="mt-1 text-xs text-red-600">{fieldErrors.timezone}</p>}
          </div>

          <div>
            <label htmlFor="signup-currency" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Moeda preferida
              <span className="ml-1 text-xs font-normal text-neutral-400">(você pode alterar depois)</span>
            </label>
            <select
              id="signup-currency"
              value={currency}
              onChange={event => {
                setCurrency(event.target.value)
                clearFieldError('currency')
              }}
              required
              className={inputClass(Boolean(fieldErrors.currency))}
              aria-invalid={Boolean(fieldErrors.currency)}
            >
              {STRIPE_CURRENCIES.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.currency && <p className="mt-1 text-xs text-red-600">{fieldErrors.currency}</p>}
          </div>

          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-neutral-700">E-mail</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={event => {
                setEmail(event.target.value)
                clearFieldError('email')
              }}
              required
              placeholder="seu@email.com"
              className={inputClass(Boolean(fieldErrors.email))}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-neutral-700">Senha</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => {
                  setPassword(event.target.value)
                  clearFieldError('password')
                  clearFieldError('confirmPassword')
                }}
                required
                minLength={7}
                placeholder="Mínimo 7 caracteres, com número e símbolo"
                className={`${inputClass(Boolean(fieldErrors.password))} pr-12`}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 transition-colors hover:text-neutral-700"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-neutral-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${passwordStrength.barClass}`}
                  style={{ width: passwordStrength.barWidth }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Força da senha: <span className="font-semibold">{passwordStrength.label}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Requisitos: 7+ caracteres, número e símbolo.
              </p>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="mb-1.5 block text-sm font-medium text-neutral-700">Confirmar senha</label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={event => {
                  setConfirmPassword(event.target.value)
                  clearFieldError('confirmPassword')
                }}
                required
                minLength={7}
                placeholder="Repita sua senha"
                className={`${inputClass(Boolean(fieldErrors.confirmPassword))} pr-12`}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 transition-colors hover:text-neutral-700"
                aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
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
              onClick={() => {
                setStep(1)
                setError('')
                setFieldErrors({})
              }}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-neutral-200 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              {role === 'profissional' ? (
                'Continuar'
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </div>
        </form>
      )}

      {step === 3 && role === 'profissional' && (
        <form onSubmit={handleSignUp} className="space-y-4" noValidate>
          <div>
            <label htmlFor="professional-display-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Nome público profissional
            </label>
            <input
              id="professional-display-name"
              type="text"
              value={professionalDisplayName}
              onChange={event => {
                setProfessionalDisplayName(event.target.value)
                clearFieldError('professionalDisplayName')
              }}
              required
              placeholder="Ex.: Dra. Ana Silva"
              className={inputClass(Boolean(fieldErrors.professionalDisplayName))}
              aria-invalid={Boolean(fieldErrors.professionalDisplayName)}
            />
            {fieldErrors.professionalDisplayName && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalDisplayName}</p>}
          </div>

          <div>
            <label htmlFor="professional-headline" className="mb-1.5 block text-sm font-medium text-neutral-700">Título profissional</label>
            <input
              id="professional-headline"
              type="text"
              value={professionalHeadline}
              onChange={event => {
                setProfessionalHeadline(event.target.value)
                clearFieldError('professionalHeadline')
              }}
              required
              placeholder="Ex.: Psicóloga clínica para brasileiros no exterior"
              className={inputClass(Boolean(fieldErrors.professionalHeadline))}
              aria-invalid={Boolean(fieldErrors.professionalHeadline)}
            />
            {fieldErrors.professionalHeadline && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalHeadline}</p>}
          </div>

          <div>
            <label htmlFor="professional-category" className="mb-1.5 block text-sm font-medium text-neutral-700">Categoria principal</label>
            <select
              id="professional-category"
              value={professionalCategory}
              onChange={event => {
                setProfessionalCategory(event.target.value)
                clearFieldError('professionalCategory')
              }}
              required
              className={inputClass(Boolean(fieldErrors.professionalCategory))}
              aria-invalid={Boolean(fieldErrors.professionalCategory)}
            >
              <option value="">Selecione uma categoria</option>
              {professionalCategoryOptions.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.professionalCategory && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalCategory}</p>}
          </div>

          <div>
            <label htmlFor="professional-specialty-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Especialidade
            </label>
            <input
              id="professional-specialty-name"
              list="professional-specialties-list"
              type="text"
              value={professionalSpecialtyName}
              onChange={event => {
                setProfessionalSpecialtyName(event.target.value)
                clearFieldError('professionalSpecialtyName')
              }}
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
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Não encontrou na lista aprovada?
                <button
                  type="button"
                  onClick={() => {
                    setProfessionalSpecialtyIsCustom(true)
                    clearFieldError('professionalSpecialtyValidationMessage')
                  }}
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
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                Mensagem para validação da especialidade
              </label>
              <textarea
                id="professional-specialty-validation-message"
                value={professionalSpecialtyValidationMessage}
                onChange={event => {
                  setProfessionalSpecialtyValidationMessage(event.target.value)
                  clearFieldError('professionalSpecialtyValidationMessage')
                }}
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
            <label htmlFor="professional-focus-areas" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Foco de atuação
            </label>
            <input
              id="professional-focus-areas"
              type="text"
              value={professionalFocusAreas}
              onChange={event => {
                setProfessionalFocusAreas(event.target.value)
                clearFieldError('professionalFocusAreas')
              }}
              required
              placeholder="Ex.: ansiedade, expatriados, terapia online"
              className={inputClass(Boolean(fieldErrors.professionalFocusAreas))}
              aria-invalid={Boolean(fieldErrors.professionalFocusAreas)}
            />
            <p className="mt-1 text-xs text-neutral-500">Separe os focos por vírgula.</p>
            {fieldErrors.professionalFocusAreas && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalFocusAreas}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="professional-primary-language" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Idioma principal de atendimento
              </label>
              <select
                id="professional-primary-language"
                value={professionalPrimaryLanguage}
                onChange={event => {
                  setProfessionalPrimaryLanguage(event.target.value)
                  clearFieldError('professionalPrimaryLanguage')
                }}
                required
                className={inputClass(Boolean(fieldErrors.professionalPrimaryLanguage))}
                aria-invalid={Boolean(fieldErrors.professionalPrimaryLanguage)}
              >
                {LANGUAGE_OPTIONS.map(option => (
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
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Idiomas secundários</label>
              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-neutral-700">
                  {LANGUAGE_OPTIONS.filter(option => option !== professionalPrimaryLanguage).map(option => (
                    <label key={option} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={professionalSecondaryLanguages.includes(option)}
                        onChange={() => toggleSecondaryLanguage(option)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="professional-years" className="mb-1.5 block text-sm font-medium text-neutral-700">Anos de experiência</label>
              <input
                id="professional-years"
                type="number"
                min={0}
                max={60}
                value={professionalYearsExperience}
                onChange={event => {
                  setProfessionalYearsExperience(event.target.value)
                  clearFieldError('professionalYearsExperience')
                }}
                required
                className={inputClass(Boolean(fieldErrors.professionalYearsExperience))}
                aria-invalid={Boolean(fieldErrors.professionalYearsExperience)}
              />
              {fieldErrors.professionalYearsExperience && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalYearsExperience}</p>}
            </div>
            <div>
              <label htmlFor="professional-price" className="mb-1.5 block text-sm font-medium text-neutral-700">Preço por sessão (BRL)</label>
              <input
                id="professional-price"
                type="number"
                min={1}
                value={professionalSessionPrice}
                onChange={event => {
                  setProfessionalSessionPrice(event.target.value)
                  clearFieldError('professionalSessionPrice')
                }}
                required
                className={inputClass(Boolean(fieldErrors.professionalSessionPrice))}
                aria-invalid={Boolean(fieldErrors.professionalSessionPrice)}
              />
              {fieldErrors.professionalSessionPrice && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalSessionPrice}</p>}
            </div>
            <div>
              <label htmlFor="professional-duration" className="mb-1.5 block text-sm font-medium text-neutral-700">Duração da sessão</label>
              <select
                id="professional-duration"
                value={professionalSessionDuration}
                onChange={event => {
                  setProfessionalSessionDuration(event.target.value)
                  clearFieldError('professionalSessionDuration')
                }}
                required
                className={inputClass(Boolean(fieldErrors.professionalSessionDuration))}
                aria-invalid={Boolean(fieldErrors.professionalSessionDuration)}
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
              {fieldErrors.professionalSessionDuration && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalSessionDuration}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="professional-qualification-files" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Qualificações e certificados
            </label>
            <input
              id="professional-qualification-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={event => {
                setProfessionalQualificationFiles(Array.from(event.target.files || []))
              }}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700"
            />
            {professionalQualificationFiles.length > 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                {professionalQualificationFiles.length} arquivo(s):{' '}
                {professionalQualificationFiles.map(file => file.name).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="professional-qualification-note" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Observações sobre qualificações (opcional)
            </label>
            <textarea
              id="professional-qualification-note"
              value={professionalQualificationNote}
              onChange={event => setProfessionalQualificationNote(event.target.value)}
              rows={3}
              placeholder="Ex.: CRP, certificações internacionais, formação complementar."
              className={inputClass(false)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
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
              onClick={() => {
                setStep(2)
                setError('')
                setFieldErrors({})
              }}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-neutral-200 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
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
      )}

      <p className="mt-6 text-center text-sm text-neutral-500">
        Já tem uma conta?{' '}
        <Link
          href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Entrar
        </Link>
      </p>

      {showSignupSuccessModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmação de cadastro"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-bold text-neutral-900">{AUTH_MESSAGES.signup.successTitle}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Enviamos um e-mail para{' '}
              <span className="font-semibold text-neutral-800">{signupSuccessEmail || email}</span>.
              {` ${AUTH_MESSAGES.signup.successDescription}`}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Se não encontrar, confira também a pasta de spam/lixo eletrônico.
            </p>
            <button
              type="button"
              onClick={handleSignupSuccessConfirm}
              className="mt-5 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
