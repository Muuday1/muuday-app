'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { sendWelcomeEmailAction } from '@/lib/actions/email'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'
import { COUNTRIES } from '@/lib/utils'
import { ALL_TIMEZONES, STRIPE_CURRENCIES } from '@/lib/constants'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

type Role = 'usuario' | 'profissional'

type FieldErrors = Record<string, string>

function sanitizeRedirectPath(value: string | null) {
  if (!value) return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

export default function CadastroPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role>('usuario')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('Europe/London')
  const [currency, setCurrency] = useState('GBP')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [requestedRole, setRequestedRole] = useState('')
  const [redirectPath, setRedirectPath] = useState('')

  const [professionalDisplayName, setProfessionalDisplayName] = useState('')
  const [professionalHeadline, setProfessionalHeadline] = useState('')
  const [professionalCategory, setProfessionalCategory] = useState('')
  const [professionalSpecialties, setProfessionalSpecialties] = useState('')
  const [professionalLanguages, setProfessionalLanguages] = useState('')
  const [professionalJurisdiction, setProfessionalJurisdiction] = useState('')
  const [professionalYearsExperience, setProfessionalYearsExperience] = useState('')
  const [professionalSessionPrice, setProfessionalSessionPrice] = useState('')
  const [professionalSessionDuration, setProfessionalSessionDuration] = useState('60')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRequestedRole(params.get('role') || '')
    setRedirectPath(sanitizeRedirectPath(params.get('redirect')))
  }, [])

  useEffect(() => {
    if (!country) return
    const selectedCountry = COUNTRIES.find(item => item.code === country)
    if (!selectedCountry) return
    if (!timezone || timezone === 'UTC') setTimezone(selectedCountry.timezone)
    setCurrency(selectedCountry.currency)
  }, [country, timezone])

  useEffect(() => {
    if (requestedRole === 'profissional') setRole('profissional')
    if (requestedRole === 'usuario') setRole('usuario')
  }, [requestedRole])

  function clearFieldError(name: string) {
    setFieldErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  function validateStep2(): FieldErrors {
    const nextErrors: FieldErrors = {}

    if (!fullName.trim()) nextErrors.fullName = 'Informe seu nome completo.'
    if (!country) nextErrors.country = 'Selecione o país.'
    if (!timezone) nextErrors.timezone = 'Selecione o fuso horário.'
    if (role === 'usuario' && !currency) nextErrors.currency = 'Selecione a moeda preferida.'
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'
    if (!password) nextErrors.password = 'Informe uma senha.'
    if (password.length > 0 && password.length < 8) {
      nextErrors.password = 'A senha deve ter pelo menos 8 caracteres.'
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
    if (!professionalSpecialties.trim()) nextErrors.professionalSpecialties = 'Informe ao menos uma especialidade.'
    if (!professionalLanguages.trim()) nextErrors.professionalLanguages = 'Informe os idiomas de atendimento.'
    if (!professionalJurisdiction.trim()) nextErrors.professionalJurisdiction = 'Informe a jurisdição de atuação.'

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

    const validationErrors = validateForCurrentStep()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Revise os campos destacados para continuar.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const signupMetadata: Record<string, unknown> = {
      full_name: fullName,
      role,
      country,
      timezone,
      currency,
    }

    if (role === 'profissional') {
      signupMetadata.professional_display_name = professionalDisplayName
      signupMetadata.professional_headline = professionalHeadline
      signupMetadata.professional_category = professionalCategory
      signupMetadata.professional_specialties = professionalSpecialties
      signupMetadata.professional_languages = professionalLanguages
      signupMetadata.professional_jurisdiction = professionalJurisdiction
      signupMetadata.professional_years_experience = Number(professionalYearsExperience || 0)
      signupMetadata.professional_session_price = Number(professionalSessionPrice || 0)
      signupMetadata.professional_session_duration_minutes = Number(professionalSessionDuration || 60)
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: signupMetadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      captureEvent('auth_signup_failed', { role, reason: signUpError.message })
      setError(signUpError.message)
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

    const destination = role === 'profissional' ? '/dashboard' : redirectPath || '/buscar'
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

  function inputClass(hasError: boolean) {
    if (hasError) {
      return 'w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'
    }
    return 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-neutral-900">Criar conta</h1>
      <p className="mb-6 text-neutral-500">Junte-se à Muuday — é grátis</p>

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
              className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
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
              className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
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
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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

          {role === 'usuario' && (
            <div>
              <label htmlFor="signup-currency" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Moeda preferida
                <span className="ml-1 text-xs font-normal text-neutral-400">(para exibir preços)</span>
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
          )}

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
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={event => {
                setPassword(event.target.value)
                clearFieldError('password')
                clearFieldError('confirmPassword')
              }}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className={inputClass(Boolean(fieldErrors.password))}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="mb-1.5 block text-sm font-medium text-neutral-700">Confirmar senha</label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={event => {
                setConfirmPassword(event.target.value)
                clearFieldError('confirmPassword')
              }}
              required
              minLength={8}
              placeholder="Repita sua senha"
              className={inputClass(Boolean(fieldErrors.confirmPassword))}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              <p className="font-semibold">{error}</p>
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
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-neutral-200 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
              {SEARCH_CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.professionalCategory && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalCategory}</p>}
          </div>

          <div>
            <label htmlFor="professional-specialties" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Especialidades (separadas por vírgula)
            </label>
            <input
              id="professional-specialties"
              type="text"
              value={professionalSpecialties}
              onChange={event => {
                setProfessionalSpecialties(event.target.value)
                clearFieldError('professionalSpecialties')
              }}
              required
              placeholder="Ex.: ansiedade, depressão, terapia online"
              className={inputClass(Boolean(fieldErrors.professionalSpecialties))}
              aria-invalid={Boolean(fieldErrors.professionalSpecialties)}
            />
            {fieldErrors.professionalSpecialties && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalSpecialties}</p>}
          </div>

          <div>
            <label htmlFor="professional-languages" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Idiomas de atendimento (separados por vírgula)
            </label>
            <input
              id="professional-languages"
              type="text"
              value={professionalLanguages}
              onChange={event => {
                setProfessionalLanguages(event.target.value)
                clearFieldError('professionalLanguages')
              }}
              required
              placeholder="Ex.: Português, Inglês"
              className={inputClass(Boolean(fieldErrors.professionalLanguages))}
              aria-invalid={Boolean(fieldErrors.professionalLanguages)}
            />
            {fieldErrors.professionalLanguages && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalLanguages}</p>}
          </div>

          <div>
            <label htmlFor="professional-jurisdiction" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Jurisdição / países onde pode atuar
            </label>
            <input
              id="professional-jurisdiction"
              type="text"
              value={professionalJurisdiction}
              onChange={event => {
                setProfessionalJurisdiction(event.target.value)
                clearFieldError('professionalJurisdiction')
              }}
              required
              placeholder="Ex.: Brasil, Portugal"
              className={inputClass(Boolean(fieldErrors.professionalJurisdiction))}
              aria-invalid={Boolean(fieldErrors.professionalJurisdiction)}
            />
            {fieldErrors.professionalJurisdiction && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalJurisdiction}</p>}
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

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              <p className="font-semibold">{error}</p>
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
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-neutral-200 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {loading ? (
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

      <p className="mt-6 text-center text-sm text-neutral-500">
        Já tem uma conta?{' '}
        <Link
          href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
