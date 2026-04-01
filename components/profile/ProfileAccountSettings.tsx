'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Check, Globe, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ALL_TIMEZONES, STRIPE_CURRENCIES } from '@/lib/constants'

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
  description: string
}[] = [
  {
    key: 'booking_emails',
    label: 'Emails de agendamento',
    description: 'Confirmações, cancelamentos, pagamentos e avaliações',
  },
  {
    key: 'session_reminders',
    label: 'Lembretes de sessão',
    description: 'Lembrete 24h e 1h antes da sessão',
  },
  {
    key: 'news_promotions',
    label: 'Novidades e promoções',
    description: 'Atualizações da plataforma, dicas e ofertas',
  },
]

const EDITABLE_PROFILE_FIELDS = ['currency', 'timezone', 'notification_preferences'] as const

export function ProfileAccountSettings() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string>('N/A')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS)
  const [savedField, setSavedField] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone, currency, notification_preferences, created_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        setTimezone(profile.timezone || 'America/Sao_Paulo')
        setCurrency(profile.currency || 'BRL')
        if (profile.notification_preferences) {
          setNotifications({ ...DEFAULT_NOTIFICATIONS, ...profile.notification_preferences })
        }
        if (profile.created_at) {
          setMemberSince(
            new Date(profile.created_at).toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            }),
          )
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  async function saveField(
    field: (typeof EDITABLE_PROFILE_FIELDS)[number],
    value: unknown,
  ) {
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
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 animate-pulse">
        <div className="h-5 w-28 bg-neutral-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-neutral-100 rounded-xl" />
          <div className="h-16 bg-neutral-100 rounded-xl" />
          <div className="h-16 bg-neutral-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h3 className="font-display font-bold text-lg text-neutral-900 mb-4">Conta</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-neutral-50">
            <div>
              <p className="text-sm font-medium text-neutral-700">Membro desde</p>
              <p className="text-xs text-neutral-400">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
        <div className="flex items-center gap-3 border-b border-neutral-50 px-6 py-4">
          <Globe className="h-4 w-4 text-brand-500" />
          <h3 className="font-display font-bold text-neutral-900">Idioma e região</h3>
        </div>
        <div className="divide-y divide-neutral-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-neutral-700">Idioma</p>
              <p className="mt-0.5 text-xs text-neutral-400">Português (BR)</p>
            </div>
            <span className="rounded-full bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-400">
              Em breve
            </span>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div className="mr-4 flex-1">
              <p className="text-sm font-medium text-neutral-700">Fuso horário</p>
            </div>
            <div className="flex items-center gap-2">
              {savedField === 'timezone' && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3 w-3" /> Salvo!
                </span>
              )}
              <select
                value={timezone}
                onChange={e => {
                  setTimezone(e.target.value)
                  saveField('timezone', e.target.value)
                }}
                className="max-w-[220px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ALL_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div className="mr-4 flex-1">
              <p className="text-sm font-medium text-neutral-700">Moeda preferida</p>
            </div>
            <div className="flex items-center gap-2">
              {savedField === 'currency' && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3 w-3" /> Salvo!
                </span>
              )}
              <select
                value={currency}
                onChange={e => {
                  setCurrency(e.target.value)
                  saveField('currency', e.target.value)
                }}
                className="max-w-[220px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {STRIPE_CURRENCIES.map(item => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-brand-500" />
            <h3 className="font-display font-bold text-neutral-900">Notificações</h3>
          </div>
          {savedField === 'notification_preferences' && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3 w-3" /> Salvo!
            </span>
          )}
        </div>
        <div className="divide-y divide-neutral-50">
          {NOTIFICATION_ITEMS.map(item => (
            <div
              key={item.key}
              className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50"
              onClick={() => handleToggle(item.key)}
            >
              <div className="mr-6 flex-1">
                <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  handleToggle(item.key)
                }}
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

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
        <div className="flex items-center gap-3 border-b border-neutral-50 px-6 py-4">
          <Lock className="h-4 w-4 text-brand-500" />
          <h3 className="font-display font-bold text-neutral-900">Segurança</h3>
        </div>
        <div className="divide-y divide-neutral-50">
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-sm font-medium text-neutral-700">Alterar senha</p>
            <a
              href="/recuperar-senha"
              className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition-all hover:text-brand-700"
            >
              Alterar
            </a>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-neutral-700">Autenticação de dois fatores</p>
              <p className="mt-0.5 text-xs text-neutral-400">Desativado</p>
            </div>
            <span className="rounded-full bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-400">
              Em breve
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-100 bg-white p-6">
        <h3 className="mb-2 font-display font-bold text-red-700">Zona de risco</h3>
        <p className="mb-4 text-sm text-neutral-500">Ações irreversíveis para sua conta.</p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}

