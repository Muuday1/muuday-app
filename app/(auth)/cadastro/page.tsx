'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { COUNTRIES } from '@/lib/utils'
import { STRIPE_CURRENCIES, ALL_TIMEZONES } from '@/lib/constants'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { sendWelcomeEmailAction } from '@/lib/actions/email'

type Role = 'usuario' | 'profissional'

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

  // Auto-fill timezone and currency when country changes
  useEffect(() => {
    if (!country) return
    const selectedCountry = COUNTRIES.find(c => c.code === country)
    if (selectedCountry) {
      setTimezone(selectedCountry.timezone)
      setCurrency(selectedCountry.currency)
    }
  }, [country])

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
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

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmailAction(email, fullName)

    router.push('/buscar')
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Criar conta</h1>
      <p className="text-neutral-500 mb-8">Junte-se à Muuday — é grátis</p>

      {/* Step 1: Choose role */}
      {step === 1 && (
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-4">Você é:</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('usuario')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === 'usuario'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="text-2xl mb-2">🌎</div>
              <div className="font-semibold text-sm text-neutral-900">Sou usuário</div>
              <div className="text-xs text-neutral-500 mt-0.5">Busco profissionais brasileiros</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('profissional')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === 'profissional'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="text-2xl mb-2">💼</div>
              <div className="font-semibold text-sm text-neutral-900">Sou profissional</div>
              <div className="text-xs text-neutral-500 mt-0.5">Atendo clientes no exterior</div>
            </button>
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Continuar com email
          </button>

          {role === 'usuario' && (
            <>
              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400 font-medium">ou cadastre-se com</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <SocialAuthButtons />
            </>
          )}
        </div>
      )}

      {/* Step 2: Account info */}
      {step === 2 && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="Seu nome"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {role === 'usuario' ? 'País onde você mora' : 'País (base de operação)'}
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="">Selecione o país</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Timezone — only for usuario */}
          {role === 'usuario' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Fuso horário
                <span className="text-xs text-neutral-400 font-normal ml-1">(preenchido automaticamente)</span>
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {ALL_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Currency — only for usuario */}
          {role === 'usuario' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Moeda preferida
                <span className="text-xs text-neutral-400 font-normal ml-1">(para exibir preços)</span>
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {STRIPE_CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold py-3 rounded-xl transition-all"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : 'Criar conta'}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-neutral-500 mt-6">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}
