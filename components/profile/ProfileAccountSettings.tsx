'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AUTH_MESSAGES, mapPasswordUpdateErrorMessage } from '@/lib/auth/messages'

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

const EDITABLE_PROFILE_FIELDS = ['notification_preferences'] as const

export function ProfileAccountSettings() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string>('N/A')
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [hasPasswordProvider, setHasPasswordProvider] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState('')
  const [securitySuccess, setSecuritySuccess] = useState('')

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
      const providers = new Set<string>()
      const appProvider = user.app_metadata?.provider
      if (typeof appProvider === 'string' && appProvider) providers.add(appProvider)
      const appProviders = user.app_metadata?.providers
      if (Array.isArray(appProviders)) {
        appProviders.forEach(provider => {
          if (typeof provider === 'string' && provider) providers.add(provider)
        })
      }

      // If metadata is unavailable for older sessions, default to allowing password update.
      const hasEmailProvider = providers.size === 0 || providers.has('email')
      setHasPasswordProvider(hasEmailProvider)

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences, created_at')
        .eq('id', user.id)
        .single()

      if (profile) {
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

  async function handleUpdatePassword(event: React.FormEvent) {
    event.preventDefault()
    setSecurityError('')
    setSecuritySuccess('')

    if (newPassword.length < 8) {
      setSecurityError(AUTH_MESSAGES.password.minLength)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setSecurityError(AUTH_MESSAGES.password.mismatch)
      return
    }

    setSecurityLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setSecurityError(mapPasswordUpdateErrorMessage(error.message || ''))
      setSecurityLoading(false)
      return
    }

    setSecuritySuccess(AUTH_MESSAGES.password.updateSuccess)
    setNewPassword('')
    setConfirmNewPassword('')
    setSecurityLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200/80 p-6 animate-pulse">
        <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded-md" />
          <div className="h-16 bg-slate-100 rounded-md" />
          <div className="h-16 bg-slate-100 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200/80 p-6">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Conta</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100/80">
            <div>
              <p className="text-sm font-medium text-slate-700">Membro desde</p>
              <p className="text-xs text-slate-400">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>


      <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-[#9FE870]" />
            <h3 className="font-display font-bold text-slate-900">Notificações</h3>
          </div>
          {savedField === 'notification_preferences' && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3 w-3" /> Salvo!
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-100/80">
          {NOTIFICATION_ITEMS.map(item => (
            <div
              key={item.key}
              className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/70/50"
              onClick={() => handleToggle(item.key)}
            >
              <div className="mr-6 flex-1">
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  handleToggle(item.key)
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:ring-offset-1 ${
                  notifications[item.key] ? 'bg-[#9FE870]' : 'bg-slate-200'
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

      <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100/80 px-6 py-4">
          <Lock className="h-4 w-4 text-[#9FE870]" />
          <h3 className="font-display font-bold text-slate-900">Segurança</h3>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div className="rounded-md border border-slate-200/80 bg-slate-50/70 p-3">
            <p className="text-sm font-medium text-slate-700">
              {hasPasswordProvider ? 'Alterar senha' : 'Definir senha para login com e-mail'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasPasswordProvider
                ? 'Use este formulário para atualizar sua senha de acesso.'
                : 'Sua conta foi criada com login social. Defina uma senha para também entrar com e-mail e senha.'}
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3" noValidate>
            <div>
              <label htmlFor="profile-new-password" className="mb-1 block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <input
                id="profile-new-password"
                type="password"
                minLength={8}
                required
                value={newPassword}
                onChange={event => {
                  setNewPassword(event.target.value)
                  if (securityError) setSecurityError('')
                  if (securitySuccess) setSecuritySuccess('')
                }}
                placeholder="Mínimo de 8 caracteres"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
                aria-invalid={Boolean(securityError)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="profile-confirm-password" className="mb-1 block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                minLength={8}
                required
                value={confirmNewPassword}
                onChange={event => {
                  setConfirmNewPassword(event.target.value)
                  if (securityError) setSecurityError('')
                  if (securitySuccess) setSecuritySuccess('')
                }}
                placeholder="Repita a nova senha"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
                aria-invalid={Boolean(securityError)}
                autoComplete="new-password"
              />
            </div>

            {securityError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
                {securityError}
              </div>
            ) : null}

            {securitySuccess ? (
              <div
                className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700"
                role="status"
              >
                {securitySuccess}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <button
                type="submit"
                disabled={securityLoading}
                className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
              >
                {securityLoading ? 'Salvando...' : hasPasswordProvider ? 'Atualizar senha' : 'Definir senha'}
              </button>

              <a
                href="/recuperar-senha"
                className="rounded-full bg-[#9FE870]/8 px-3 py-1.5 text-xs font-medium text-[#3d6b1f] transition-all hover:text-[#3d6b1f]"
              >
                Esqueci minha senha
              </a>
            </div>
          </form>

          <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Autenticação de dois fatores</p>
              <p className="mt-0.5 text-xs text-slate-400">Desativado</p>
            </div>
            <span className="rounded-full bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-400">
              Em breve
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-red-100 bg-white p-6">
        <h3 className="mb-2 font-display font-bold text-red-700">Zona de risco</h3>
        <p className="mb-4 text-sm text-slate-500">Ações irreversíveis para sua conta.</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}


