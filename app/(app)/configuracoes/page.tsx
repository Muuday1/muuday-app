'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, Bell, Lock, ChevronRight, Check } from 'lucide-react'
import { STRIPE_CURRENCIES, ALL_TIMEZONES } from '@/lib/constants'

type NotificationPreferences = {
  booking_emails: boolean
  session_reminders: boolean
  news_promotions: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  booking_emails: true,
  session_reminders: true,
  news_promotions: true,
}

const NOTIFICATION_ITEMS: {
  key: keyof NotificationPreferences
  label: string
  desc: string
}[] = [
  {
    key: 'booking_emails',
    label: 'Emails de agendamento',
    desc: 'Confirmações, cancelamentos, pagamentos e avaliações',
  },
  {
    key: 'session_reminders',
    label: 'Lembretes de sessão',
    desc: 'Lembrete 24h e 1h antes da sua sessão começar',
  },
  {
    key: 'news_promotions',
    label: 'Novidades e promoções',
    desc: 'Atualizações da plataforma, dicas e ofertas especiais',
  },
]

export default function ConfiguracoesPage() {
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS)
  const [userId, setUserId] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone, currency, notification_preferences')
        .eq('id', user.id)
        .single()

      if (profile) {
        setTimezone(profile.timezone || 'America/Sao_Paulo')
        setCurrency(profile.currency || 'BRL')
        if (profile.notification_preferences) {
          setNotifications({ ...DEFAULT_NOTIFICATIONS, ...profile.notification_preferences })
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  async function saveField(field: string, value: unknown) {
    if (!userId) return
    await supabase.from('profiles').update({ [field]: value }).eq('id', userId)
    setSavedField(field)
    setTimeout(() => setSavedField(null), 2000)
  }

  async function handleToggle(key: keyof NotificationPreferences) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    await saveField('notification_preferences', updated)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          <div className="h-32 bg-neutral-100 rounded-2xl" />
          <div className="h-48 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
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

            {/* Idioma */}
            <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-700">Idioma</p>
                <p className="text-xs text-neutral-400 mt-0.5">Português (BR)</p>
              </div>
              <span className="text-xs text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full font-medium">
                Em breve
              </span>
            </div>

            {/* Fuso horário */}
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
                  onChange={e => { setTimezone(e.target.value); saveField('timezone', e.target.value) }}
                  className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all max-w-[220px]"
                >
                  {ALL_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Moeda */}
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
                  onChange={e => { setCurrency(e.target.value); saveField('currency', e.target.value) }}
                  className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all max-w-[220px]"
                >
                  {STRIPE_CURRENCIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Notificações */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-brand-500" />
              <h2 className="font-display font-bold text-neutral-900">Notificações</h2>
            </div>
            {savedField === 'notification_preferences' && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" /> Salvo!
              </span>
            )}
          </div>
          <div className="divide-y divide-neutral-50">
            {NOTIFICATION_ITEMS.map(item => (
              <div
                key={item.key}
                className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors cursor-pointer"
                onClick={() => handleToggle(item.key)}
              >
                <div className="flex-1 mr-6">
                  <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleToggle(item.key) }}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
                    notifications[item.key] ? 'bg-brand-500' : 'bg-neutral-200'
                  }`}
                  aria-label={item.label}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
              <p className="text-sm font-medium text-neutral-700">Alterar senha</p>
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
