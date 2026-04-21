'use client'

import { useEffect, useState } from 'react'
import { X, Link2, RefreshCcw } from 'lucide-react'

type CalendarProvider = 'google' | 'outlook' | 'apple'
type CalendarConnectionStatus = 'disconnected' | 'pending' | 'connected' | 'error'
type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

type ProfessionalCalendarSyncModalProps = {
  isOpen: boolean
  onClose: () => void
  initialProvider: string
  initialConnected: boolean
  initialConnectionStatus: CalendarConnectionStatus
  initialAccountEmail: string
  initialLastSyncAt: string
  initialLastSyncError: string
  premiumProvidersEnabled: boolean
}

export function ProfessionalCalendarSyncModal({
  isOpen,
  onClose,
  initialProvider,
  initialConnected,
  initialConnectionStatus,
  initialAccountEmail,
  initialLastSyncAt,
  initialLastSyncError,
  premiumProvidersEnabled,
}: ProfessionalCalendarSyncModalProps) {
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>(
    initialProvider === 'outlook' || initialProvider === 'apple' ? initialProvider : 'google',
  )
  const [calendarConnected, setCalendarConnected] = useState(initialConnected)
  const [calendarConnectionStatus, setCalendarConnectionStatus] =
    useState<CalendarConnectionStatus>(initialConnectionStatus)
  const [calendarProviderAccountEmail, setCalendarProviderAccountEmail] =
    useState(initialAccountEmail)
  const [calendarLastSyncAt, setCalendarLastSyncAt] = useState(initialLastSyncAt)
  const [calendarLastSyncError, setCalendarLastSyncError] = useState(initialLastSyncError)
  const [calendarSyncState, setCalendarSyncState] = useState<SaveStatus>('idle')
  const [calendarSyncError, setCalendarSyncError] = useState('')
  const [appleCaldavUsername, setAppleCaldavUsername] = useState('')
  const [appleCaldavPassword, setAppleCaldavPassword] = useState('')
  const [appleCaldavServerUrl, setAppleCaldavServerUrl] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setCalendarProvider(
      initialProvider === 'outlook' || initialProvider === 'apple' ? initialProvider : 'google',
    )
    setCalendarConnected(initialConnected)
    setCalendarConnectionStatus(initialConnectionStatus)
    setCalendarProviderAccountEmail(initialAccountEmail)
    setCalendarLastSyncAt(initialLastSyncAt)
    setCalendarLastSyncError(initialLastSyncError)
    setCalendarSyncState('idle')
    setCalendarSyncError('')
    setAppleCaldavUsername('')
    setAppleCaldavPassword('')
    setAppleCaldavServerUrl('')
  }, [
    initialAccountEmail,
    initialConnected,
    initialConnectionStatus,
    initialLastSyncAt,
    initialLastSyncError,
    initialProvider,
    isOpen,
  ])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const premiumProviderLocked = calendarProvider !== 'google' && !premiumProvidersEnabled

  async function connectCalendarProvider() {
    if (premiumProviderLocked) {
      setCalendarSyncError('Esse provider está disponível apenas em plano superior.')
      return
    }

    if (calendarProvider === 'apple') {
      if (!appleCaldavUsername.trim() || !appleCaldavPassword.trim()) {
        setCalendarSyncError('Informe Apple ID e app-specific password para conectar Apple CalDAV.')
        return
      }

      setCalendarSyncState('saving')
      setCalendarSyncError('')

      const response = await fetch('/api/professional/calendar/connect/apple', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: appleCaldavUsername.trim(),
          appPassword: appleCaldavPassword.trim(),
          accountEmail: calendarProviderAccountEmail.trim() || appleCaldavUsername.trim(),
          serverUrl: appleCaldavServerUrl.trim() || undefined,
        }),
      })

      const result = (await response.json().catch(() => ({}))) as { error?: string; accountEmail?: string }
      if (!response.ok) {
        setCalendarSyncState('error')
        setCalendarSyncError(result.error || 'Não foi possível conectar Apple CalDAV.')
        return
      }

      setCalendarConnected(true)
      setCalendarConnectionStatus('connected')
      setCalendarProviderAccountEmail(result.accountEmail || appleCaldavUsername.trim())
      setCalendarLastSyncAt(new Date().toISOString())
      setCalendarLastSyncError('')
      setCalendarSyncState('success')
      window.setTimeout(() => setCalendarSyncState('idle'), 1800)
      return
    }

    setCalendarSyncState('saving')
    setCalendarSyncError('')
    const next = encodeURIComponent('/agenda?view=overview')
    window.location.href = `/api/professional/calendar/connect/${calendarProvider}?next=${next}`
  }

  async function runCalendarSyncNow() {
    setCalendarSyncState('saving')
    setCalendarSyncError('')

    const response = await fetch('/api/professional/calendar/sync', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: calendarProvider }),
    })

    const result = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      setCalendarSyncState('error')
      setCalendarSyncError(result.error || 'Não foi possível sincronizar o calendário.')
      return
    }

    setCalendarConnected(true)
    setCalendarConnectionStatus('connected')
    setCalendarLastSyncAt(new Date().toISOString())
    setCalendarLastSyncError('')
    setCalendarSyncState('success')
    window.setTimeout(() => setCalendarSyncState('idle'), 1800)
  }

  async function disconnectCalendarProvider() {
    setCalendarSyncState('saving')
    setCalendarSyncError('')

    const response = await fetch('/api/professional/calendar/disconnect', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: calendarProvider }),
    })

    const result = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      setCalendarSyncState('error')
      setCalendarSyncError(result.error || 'Não foi possível desconectar o calendário.')
      return
    }

    setCalendarConnected(false)
    setCalendarConnectionStatus('disconnected')
    setCalendarProviderAccountEmail('')
    setCalendarLastSyncAt('')
    setCalendarLastSyncError('')
    setCalendarSyncState('success')
    window.setTimeout(() => setCalendarSyncState('idle'), 1800)
  }

  const connectionBadgeLabel =
    calendarConnectionStatus === 'connected'
      ? 'Conectado'
      : calendarConnectionStatus === 'pending'
        ? 'Conexão pendente'
        : calendarConnectionStatus === 'error'
          ? 'Com erro'
          : 'Sem conexão'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Sync do calendário
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
              Integrações do calendário
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Conecte Google, Outlook ou Apple para importar ocupações externas e evitar conflitos de agenda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 p-2 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {connectionBadgeLabel}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(['google', 'outlook', 'apple'] as const).map(provider => {
            const locked = provider !== 'google' && !premiumProvidersEnabled
            const selected = calendarProvider === provider
            return (
              <button
                key={provider}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (locked) return
                  setCalendarProvider(provider)
                  setCalendarSyncError('')
                }}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition-all ${
                  selected
                    ? 'border-[#9FE870] bg-[#9FE870] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
                } ${locked ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {provider === 'google' ? 'Google' : provider === 'outlook' ? 'Outlook' : 'Apple'}
                {locked ? ' · plano superior' : ''}
              </button>
            )
          })}
        </div>

        <div className="mt-5 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm text-slate-700">
          <p>
            Conta conectada: <strong>{calendarProviderAccountEmail || 'nenhuma informada ainda'}</strong>
          </p>
          <p>
            Última sincronização:{' '}
            <strong>{calendarLastSyncAt ? new Date(calendarLastSyncAt).toLocaleString('pt-BR') : 'nunca'}</strong>
          </p>
          {calendarLastSyncError ? (
            <p className="font-medium text-red-700">Erro recente: {calendarLastSyncError}</p>
          ) : null}
        </div>

        {calendarProvider === 'apple' ? (
          <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              type="email"
              value={appleCaldavUsername}
              onChange={event => setAppleCaldavUsername(event.target.value)}
              placeholder="Apple ID"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={appleCaldavPassword}
              onChange={event => setAppleCaldavPassword(event.target.value)}
              placeholder="App-specific password"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="url"
              value={appleCaldavServerUrl}
              onChange={event => setAppleCaldavServerUrl(event.target.value)}
              placeholder="Servidor CalDAV (opcional)"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {calendarSyncError ? (
          <p className="mt-4 text-sm font-medium text-red-700">{calendarSyncError}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void connectCalendarProvider()}
            disabled={calendarSyncState === 'saving'}
            className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            {calendarSyncState === 'saving' ? 'Conectando...' : 'Conectar calendário'}
          </button>
          <button
            type="button"
            onClick={() => void runCalendarSyncNow()}
            disabled={calendarSyncState === 'saving' || !calendarConnected}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${calendarSyncState === 'saving' ? 'animate-spin' : ''}`} />
            Sincronizar agora
          </button>
          <button
            type="button"
            onClick={() => void disconnectCalendarProvider()}
            disabled={calendarSyncState === 'saving' || !calendarConnected}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
          >
            Desconectar
          </button>
        </div>
      </div>
    </div>
  )
}
