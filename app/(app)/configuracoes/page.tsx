'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, Bell, Lock, ChevronRight, Check } from 'lucide-react'

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Toronto', label: 'America/Toronto (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Lisbon', label: 'Europe/Lisbon (WET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
]

const CURRENCIES = [
  { value: 'BRL', label: 'BRL - Real Brasileiro' },
  { value: 'USD', label: 'USD - Dólar Americano' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Libra Esterlina' },
  { value: 'CAD', label: 'CAD - Dólar Canadense' },
  { value: 'AUD', label: 'AUD - Dólar Australiano' },
]

export default function ConfiguracoesPage() {
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [userId, setUserId] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone, currency')
        .eq('id', user.id)
        .single()

      if (profile) {
        setTimezone(profile.timezone || 'America/Sao_Paulo')
        setCurrency(profile.currency || 'BRL')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  async function saveField(field: 'timezone' | 'currency', value: string) {
    if (!userId) return
    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId)

    setSavedField(field)
    setTimeout(() => setSavedField(null), 2000)
  }

  async function handleTimezoneChange(value: string) {
    setTimezone(value)
    await saveField('timezone', value)
  }

  async function handleCurrencyChange(value: string) {
    setCurrency(value)
    await saveField('currency', value)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          <div className="h-32 bg-neutral-100 rounded-2xl" />
          <div className="h-32 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Configurações</h1>
        <p className="text-neutral-500">Personalize sua experiência na Muuday</p>
      </div>

      <div className="space-y-6">
        {/* Idioma e região */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-50 flex items-center gap-3">
            <Globe className="w-4 h-4 text-brand-500" />
            <h2 className="font-display font-bold text-neutral-900">Idioma e região</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            {/* Idioma - still coming soon */}
            <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-700">Idioma</p>
                <p className="text-xs text-neutral-400 mt-0.5">Português (BR)</p>
              </div>
              <span className="text-xs text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full font-medium">
                Em breve
              </span>
            </div>

            {/* Timezone - functional */}
            <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-neutral-700">Fuso horário</p>
              </div>
              <div className="flex items-center gap-2">
                {savedField === 'timezone' && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" /> Salvo!
                  </span>
                )}
                <select
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency - functional */}
            <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-neutral-700">Moeda preferida</p>
              </div>
              <div className="flex items-center gap-2">
                {savedField === 'currency' && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" /> Salvo!
                  </span>
                )}
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notificações - Em breve */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-50 flex items-center gap-3">
            <Bell className="w-4 h-4 text-brand-500" />
            <h2 className="font-display font-bold text-neutral-900">Notificações</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            {[
              { label: 'Emails de agendamento', value: 'Ativado' },
              { label: 'Lembretes de sessão', value: 'Ativado' },
              { label: 'Novidades e promoções', value: 'Ativado' },
            ].map(item => (
              <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.value}</p>
                </div>
                <span className="text-xs text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full font-medium">
                  Em breve
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-50 flex items-center gap-3">
            <Lock className="w-4 h-4 text-brand-500" />
            <h2 className="font-display font-bold text-neutral-900">Segurança</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-700">Alterar senha</p>
              </div>
              <a
                href="/recuperar-senha"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
              >
                Alterar <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-700">Autenticação de dois fatores</p>
                <p className="text-xs text-neutral-400 mt-0.5">Desativado</p>
              </div>
              <span className="text-xs text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full font-medium">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-8 bg-white rounded-2xl border border-red-100 p-6">
        <h3 className="font-display font-bold text-red-700 mb-2">Zona de risco</h3>
        <p className="text-sm text-neutral-500 mb-4">Ações irreversíveis para sua conta.</p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-4 py-2 rounded-xl border border-red-200 transition-all"
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}
