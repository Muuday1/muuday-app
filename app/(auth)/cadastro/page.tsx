'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { sendWelcomeEmailAction } from '@/lib/actions/email'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'
import { COUNTRIES } from '@/lib/utils'
import { ALL_TIMEZONES, STRIPE_CURRENCIES } from '@/lib/constants'

type Role = 'usuario' | 'profissional'

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
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestedRole, setRequestedRole] = useState('')
  const [redirectPath, setRedirectPath] = useState('')

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

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          country,
          timezone,
          currency,
        },
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

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-neutral-900">Criar conta</h1>
      <p className="mb-8 text-neutral-500">Junte-se a Muuday - e gratis</p>

      {step === 1 && (
        <div>
          <p className="mb-4 text-sm font-medium text-neutral-700">Voce e:</p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('usuario')}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                role === 'usuario'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="mb-2 text-2xl">U</div>
              <div className="text-sm font-semibold text-neutral-900">Sou usuario</div>
              <div className="mt-0.5 text-xs text-neutral-500">Busco profissionais brasileiros</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('profissional')}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                role === 'profissional'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="mb-2 text-2xl">P</div>
              <div className="text-sm font-semibold text-neutral-900">Sou profissional</div>
              <div className="mt-0.5 text-xs text-neutral-500">Atendo clientes no exterior</div>
            </button>
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600"
          >
            Continuar com email
          </button>

          {role === 'usuario' && (
            <>
              <div className="relative my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs font-medium text-neutral-400">ou cadastre-se com</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
              <SocialAuthButtons />
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              required
              placeholder="Seu nome"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {role === 'usuario' ? 'Pais onde voce mora' : 'Pais (base de operacao)'}
            </label>
            <select
              value={country}
              onChange={event => setCountry(event.target.value)}
              required
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Selecione o pais</option>
              {COUNTRIES.map(item => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {role === 'usuario' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Fuso horario
                <span className="ml-1 text-xs font-normal text-neutral-400">(preenchido automaticamente)</span>
              </label>
              <select
                value={timezone}
                onChange={event => setTimezone(event.target.value)}
                required
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {ALL_TIMEZONES.map(item => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === 'usuario' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Moeda preferida
                <span className="ml-1 text-xs font-normal text-neutral-400">(para exibir precos)</span>
              </label>
              <select
                value={currency}
                onChange={event => setCurrency(event.target.value)}
                required
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {STRIPE_CURRENCIES.map(item => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Minimo 8 caracteres"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-neutral-200 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60"
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
        Ja tem uma conta?{' '}
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
