'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/utils'
import { STRIPE_CURRENCIES, ALL_TIMEZONES } from '@/lib/constants'
import { sendWelcomeEmailAction } from '@/lib/actions/email'
import { Loader2 } from 'lucide-react'

export default function CompletarContaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roleParam = searchParams.get('role')
  const roleHint = roleParam === 'profissional' ? 'profissional' : 'usuario'
  const nextParam = searchParams.get('next') || ''
  const safeNextPath =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && nextParam !== '/'
      ? nextParam
      : ''

  // Auto-fill timezone and currency when country changes
  useEffect(() => {
    if (!country) return
    const selectedCountry = COUNTRIES.find(c => c.code === country)
    if (selectedCountry) {
      setTimezone(selectedCountry.timezone)
      setCurrency(selectedCountry.currency)
    }
  }, [country])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const currentRole = String(currentProfile?.role || '').toLowerCase()
    const finalRole =
      currentRole === 'admin' || currentRole === 'profissional'
        ? currentRole
        : roleHint

    const { error } = await supabase
      .from('profiles')
      .update({
        role: finalRole,
        country,
        timezone,
        currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
      return
    }

    // Send welcome email (non-blocking)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser?.email) {
      const displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'por aí'
      sendWelcomeEmailAction(currentUser.email, displayName)
    }

    if (safeNextPath) {
      router.push(safeNextPath)
    } else {
      router.push(finalRole === 'profissional' ? '/dashboard' : '/buscar')
    }
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Quase lá! 🎉</h1>
      <p className="text-neutral-500 mb-8">
        Só precisamos de mais algumas informações para personalizar sua experiência.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            País onde você mora
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

        {/* Fuso horário */}
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

        {/* Moeda */}
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
          <p className="text-xs text-neutral-400 mt-1.5">
            Você pode alterar isso depois nas configurações.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !country}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Entrar na Muuday →'}
        </button>
      </form>
    </div>
  )
}
