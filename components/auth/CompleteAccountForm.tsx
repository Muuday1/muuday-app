'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRIES } from '@/lib/utils'
import { STRIPE_CURRENCIES, ALL_TIMEZONES } from '@/lib/constants'
import { completeAccount } from '@/lib/actions/complete-account'
import { Loader2 } from 'lucide-react'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'

interface CompleteAccountFormProps {
  roleHint: string
  safeNextPath: string
}

export default function CompleteAccountForm({ roleHint, safeNextPath }: CompleteAccountFormProps) {
  const router = useRouter()
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await completeAccount({
      country,
      timezone,
      currency,
      roleHint,
    })

    setLoading(false)

    if (!result.success) {
      if (result.redirectTo) {
        router.push(result.redirectTo)
        return
      }
      setError(result.error || 'Erro ao salvar.')
      return
    }

    if (safeNextPath) {
      router.push(safeNextPath)
    } else {
      router.push(resolvePostLoginDestination(roleHint))
    }
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">Quase lá! 🎉</h1>
      <p className="text-slate-500 mb-8">
        Só precisamos de mais algumas informações para personalizar sua experiência.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* País */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1.5">
            País onde você mora
          </label>
          <select
            id="country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all"
          >
            <option value="">Selecione o país</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Fuso horário */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Fuso horário
            <span className="text-xs text-slate-400 font-normal ml-1">(preenchido automaticamente)</span>
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all"
          >
            {ALL_TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        {/* Moeda */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1.5">
            Moeda preferida
            <span className="text-xs text-slate-400 font-normal ml-1">(para exibir preços)</span>
          </label>
          <select
            id="currency"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all"
          >
            {STRIPE_CURRENCIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1.5">
            Você pode alterar isso depois nas configurações.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !country}
          className="w-full bg-[#9FE870] hover:bg-[#8ed85f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Entrar na Muuday →'}
        </button>
      </form>
    </div>
  )
}
