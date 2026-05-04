'use client'

import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { COUNTRIES } from '@/lib/utils'
import { ALL_TIMEZONES, STRIPE_CURRENCIES } from '@/lib/constants'
import { inputClass, PROFESSIONAL_TITLES } from '../helpers'
import type { Role, FieldErrors } from '../types'

interface PersonalDataFormProps {
  role: Role
  professionalTitle: string
  fullName: string
  country: string
  timezone: string
  currency: string
  email: string
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
  loading: boolean
  error: string
  showForgotPasswordLink: boolean
  fieldErrors: FieldErrors
  errorList: string[]
  passwordStrength: { label: string; barClass: string; barWidth: string }
  onProfessionalTitleChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onCountryChange: (value: string) => void
  onTimezoneChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onToggleShowPassword: () => void
  onToggleShowConfirmPassword: () => void
  onBack: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function PersonalDataForm({
  role,
  professionalTitle,
  fullName,
  country,
  timezone,
  currency,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  loading,
  error,
  showForgotPasswordLink,
  fieldErrors,
  errorList,
  passwordStrength,
  onProfessionalTitleChange,
  onFullNameChange,
  onCountryChange,
  onTimezoneChange,
  onCurrencyChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onBack,
  onSubmit,
}: PersonalDataFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {role === 'profissional' && (
        <div>
          <label htmlFor="signup-title" className="mb-1.5 block text-sm font-medium text-slate-700">
            Título
          </label>
          <select
            id="signup-title"
            value={professionalTitle}
            onChange={event => onProfessionalTitleChange(event.target.value)}
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
        <label htmlFor="signup-fullname" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
        <input
          id="signup-fullname"
          type="text"
          value={fullName}
          onChange={event => onFullNameChange(event.target.value)}
          required
          placeholder="Seu nome"
          className={inputClass(Boolean(fieldErrors.fullName))}
          aria-invalid={Boolean(fieldErrors.fullName)}
        />
        {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="signup-country" className="mb-1.5 block text-sm font-medium text-slate-700">
          {role === 'usuario' ? 'País onde você mora' : 'País (base de operação)'}
        </label>
        <select
          id="signup-country"
          value={country}
          onChange={event => onCountryChange(event.target.value)}
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
        <label htmlFor="signup-timezone" className="mb-1.5 block text-sm font-medium text-slate-700">Fuso horário</label>
        <select
          id="signup-timezone"
          value={timezone}
          onChange={event => onTimezoneChange(event.target.value)}
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
        <label htmlFor="signup-currency" className="mb-1.5 block text-sm font-medium text-slate-700">
          Moeda preferida
          <span className="ml-1 text-xs font-normal text-slate-400">(você pode alterar depois)</span>
        </label>
        <select
          id="signup-currency"
          value={currency}
          onChange={event => onCurrencyChange(event.target.value)}
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
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={event => onEmailChange(event.target.value)}
          required
          placeholder="seu@email.com"
          className={inputClass(Boolean(fieldErrors.email))}
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-slate-700">Senha</label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={event => onPasswordChange(event.target.value)}
            required
            minLength={7}
            placeholder="Mínimo 7 caracteres, com número e símbolo"
            className={`${inputClass(Boolean(fieldErrors.password))} pr-12`}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-slate-700"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className={`h-1.5 rounded-full transition-all ${passwordStrength.barClass}`}
              style={{ width: passwordStrength.barWidth }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Força da senha: <span className="font-semibold">{passwordStrength.label}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Requisitos: 7+ caracteres, número e símbolo.
          </p>
        </div>
        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="signup-confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">Confirmar senha</label>
        <div className="relative">
          <input
            id="signup-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={event => onConfirmPasswordChange(event.target.value)}
            required
            minLength={7}
            placeholder="Repita sua senha"
            className={`${inputClass(Boolean(fieldErrors.confirmPassword))} pr-12`}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
          />
          <button
            type="button"
            onClick={onToggleShowConfirmPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-slate-700"
            aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
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
  )
}
