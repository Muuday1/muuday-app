'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, Clock, AlertCircle, ChevronLeft, RefreshCcw, Link2 } from 'lucide-react'
import Link from 'next/link'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { ProfessionalAvailabilityCalendar } from '@/components/calendar/ProfessionalAvailabilityCalendar'
import { getDefaultPlanConfigMap, getPlanConfigForTier, type PlanConfigMap } from '@/lib/plan-config'

// day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
// We display Mon-Sun (1-6, 0) but store as 0-6
const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
]

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    TIME_OPTIONS.push(`${hh}:${mm}`)
  }
}

type DayAvailability = {
  is_available: boolean
  start_time: string
  end_time: string
}

type AvailabilityState = Record<number, DayAvailability>

const DEFAULT_DAY: DayAvailability = {
  is_available: false,
  start_time: '09:00',
  end_time: '18:00',
}

function buildDefaultState(): AvailabilityState {
  const state: AvailabilityState = {}
  for (const day of DAYS_OF_WEEK) {
    state[day.value] = { ...DEFAULT_DAY }
  }
  return state
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'
type CalendarProvider = 'google' | 'outlook' | 'apple'

type ProfessionalAvailabilityWorkspaceProps = {
  variant?: 'standalone' | 'embedded'
}

export function ProfessionalAvailabilityWorkspace({
  variant = 'standalone',
}: ProfessionalAvailabilityWorkspaceProps) {
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilityState>(buildDefaultState())
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [professionalTier, setProfessionalTier] = useState('basic')
  const [planConfigs, setPlanConfigs] = useState<PlanConfigMap | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [maxWindowDays, setMaxWindowDays] = useState(30)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarTimezone, setCalendarTimezone] = useState('America/Sao_Paulo')
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>('google')
  const [calendarConnectionStatus, setCalendarConnectionStatus] = useState<
    'disconnected' | 'pending' | 'connected' | 'error'
  >('disconnected')
  const [calendarProviderAccountEmail, setCalendarProviderAccountEmail] = useState('')
  const [calendarLastSyncAt, setCalendarLastSyncAt] = useState('')
  const [calendarLastSyncError, setCalendarLastSyncError] = useState('')
  const [calendarSyncState, setCalendarSyncState] = useState<SaveStatus>('idle')
  const [calendarSyncError, setCalendarSyncError] = useState('')
  const [appleCaldavUsername, setAppleCaldavUsername] = useState('')
  const [appleCaldavPassword, setAppleCaldavPassword] = useState('')
  const [appleCaldavServerUrl, setAppleCaldavServerUrl] = useState('')
  const [upcomingBookings, setUpcomingBookings] = useState<
    Array<{ id: string; start_utc: string; end_utc: string; status: string }>
  >([])

  const loadAvailability = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Verify user has professional role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'profissional') {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    // Get professional profile
    const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id, tier')

    if (!professional) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    setProfessionalId(professional.id)
    let resolvedPlans = planConfigs
    if (!resolvedPlans) {
      const planResponse = await fetch('/api/plan-config', { credentials: 'include' })
      const planPayload = (await planResponse.json().catch(() => null)) as
        | { ok?: boolean; plans?: PlanConfigMap }
        | null
      resolvedPlans = planPayload?.ok && planPayload.plans ? planPayload.plans : getDefaultPlanConfigMap()
      setPlanConfigs(resolvedPlans)
    }
    const normalizedTier = String(professional.tier || 'basic').toLowerCase()
    const tierConfig = getPlanConfigForTier(resolvedPlans, normalizedTier)
    const tierLimits = tierConfig.limits
    const maxBufferMinutes = tierConfig.bufferConfig.maxMinutes
    setProfessionalTier(normalizedTier)

    const [{ data: settingsRow }, { data: calendarRow }, { data: bookingRows }, { data: externalBusyRows }] = await Promise.all([
      supabase
        .from('professional_settings')
        .select('timezone, buffer_minutes, buffer_time_minutes, max_booking_window_days')
        .eq('professional_id', professional.id)
        .maybeSingle(),
      supabase
        .from('calendar_integrations')
        .select('provider, sync_enabled, provider_account_email, connection_status, last_sync_at, last_sync_completed_at, last_sync_error')
        .eq('professional_id', professional.id)
        .maybeSingle(),
      supabase
        .from('bookings')
        .select('id,start_time_utc,end_time_utc,scheduled_at,duration_minutes,status')
        .eq('professional_id', professional.id)
        .in('status', ['pending', 'pending_confirmation', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(300),
      supabase
        .from('external_calendar_busy_slots')
        .select('id,start_time_utc,end_time_utc,provider')
        .eq('professional_id', professional.id)
        .gte('start_time_utc', new Date().toISOString())
        .order('start_time_utc', { ascending: true })
        .limit(300),
    ])

    const savedBufferMinutes = Number(settingsRow?.buffer_time_minutes || settingsRow?.buffer_minutes || 15)
    setBufferMinutes(Math.min(maxBufferMinutes, Math.max(0, savedBufferMinutes)))
    setCalendarTimezone(String(settingsRow?.timezone || 'America/Sao_Paulo'))
    setMaxWindowDays(Number(settingsRow?.max_booking_window_days || tierLimits.bookingWindowDays))
    setCalendarConnected(Boolean(calendarRow?.sync_enabled))
    const resolvedProvider = String(calendarRow?.provider || 'google')
    setCalendarProvider(resolvedProvider === 'outlook' || resolvedProvider === 'apple' ? resolvedProvider : 'google')
    setCalendarProviderAccountEmail(String(calendarRow?.provider_account_email || ''))
    setCalendarConnectionStatus(
      String(calendarRow?.connection_status || 'disconnected') === 'connected'
        ? 'connected'
        : String(calendarRow?.connection_status || 'disconnected') === 'pending'
          ? 'pending'
          : String(calendarRow?.connection_status || 'disconnected') === 'error'
            ? 'error'
            : 'disconnected',
    )
    setCalendarLastSyncAt(String(calendarRow?.last_sync_completed_at || calendarRow?.last_sync_at || ''))
    setCalendarLastSyncError(String(calendarRow?.last_sync_error || ''))
    setUpcomingBookings(
      [
        ...(bookingRows || []).map((row: Record<string, unknown>) => {
          const scheduledAt = new Date(String(row.scheduled_at || ''))
          const durationMinutes = Number(row.duration_minutes || 60)
          const startUtcIso = String(row.start_time_utc || row.scheduled_at || '')
          const endUtcIso =
            String(row.end_time_utc || '') ||
            (Number.isNaN(scheduledAt.getTime())
              ? ''
              : new Date(scheduledAt.getTime() + durationMinutes * 60000).toISOString())
          return {
            id: String(row.id || ''),
            start_utc: startUtcIso,
            end_utc: endUtcIso,
            status: String(row.status || 'pending'),
          }
        }),
        ...(externalBusyRows || []).map((row: Record<string, unknown>) => ({
          id: `external-${String(row.id || '')}`,
          start_utc: String(row.start_time_utc || ''),
          end_utc: String(row.end_time_utc || ''),
          status: `external_${String(row.provider || 'calendar')}`,
        })),
      ].filter(item => item.start_utc && item.end_utc),
    )

    // Load existing availability
    const { data: rows } = await supabase
      .from('availability')
      .select('day_of_week,start_time,end_time,is_active')
      .eq('professional_id', professional.id)

    if (rows && rows.length > 0) {
      const newState = buildDefaultState()
      for (const row of rows) {
        newState[row.day_of_week] = {
          is_available: Boolean(row.is_active),
          start_time: row.start_time.slice(0, 5), // "HH:MM:SS" -> "HH:MM"
          end_time: row.end_time.slice(0, 5),
        }
      }
      setAvailability(newState)
    }

    setLoading(false)
  }, [planConfigs, router])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  function toggleDay(dayValue: number) {
    setAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        is_available: !prev[dayValue].is_available,
      },
    }))
  }

  function updateTime(dayValue: number, field: 'start_time' | 'end_time', value: string) {
    setAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value,
      },
    }))
  }

  function isValidTimeRange(day: DayAvailability): boolean {
    if (!day.is_available) return true
    return day.start_time < day.end_time
  }

  async function connectCalendarProvider() {
    const tierFeatures = getPlanConfigForTier(planConfigs || getDefaultPlanConfigMap(), professionalTier).features
    const locked = calendarProvider !== 'google' && !tierFeatures.includes('outlook_sync')
    if (locked) {
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
      void loadAvailability()
      setTimeout(() => setCalendarSyncState('idle'), 1800)
      return
    }

    setCalendarSyncState('saving')
    const next = encodeURIComponent('/disponibilidade')
    window.location.href = `/api/professional/calendar/connect/${calendarProvider}?next=${next}`
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
    void loadAvailability()
    setTimeout(() => setCalendarSyncState('idle'), 1800)
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
    await loadAvailability()
    setTimeout(() => setCalendarSyncState('idle'), 1800)
  }

  const hasErrors = DAYS_OF_WEEK.some(d => !isValidTimeRange(availability[d.value]))
  const outlookLocked = !getPlanConfigForTier(planConfigs || getDefaultPlanConfigMap(), professionalTier).features.includes('outlook_sync')

  async function handleSave() {
    if (!professionalId || hasErrors) return

    setSaveStatus('saving')
    setErrorMessage('')

    const supabase = createClient()

    // Build rows to upsert (only available days)
    const rowsToUpsert = DAYS_OF_WEEK
      .map(day => ({
        professional_id: professionalId,
        day_of_week: day.value,
        start_time: availability[day.value].start_time + ':00',
        end_time: availability[day.value].end_time + ':00',
        is_active: availability[day.value].is_available,
      }))

    // Delete existing rows and insert new ones (clean upsert)
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('professional_id', professionalId)

    if (deleteError) {
      setErrorMessage('Erro ao salvar. Tente novamente.')
      setSaveStatus('error')
      return
    }

    const { error: insertError } = await supabase
      .from('availability')
      .insert(rowsToUpsert)

    if (insertError) {
      setErrorMessage('Erro ao salvar. Tente novamente.')
      setSaveStatus('error')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setSaveStatus('success')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">Acesso restrito</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Esta página é exclusiva para profissionais com perfil completo.
          </p>
          <Link
            href="/completar-perfil"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Completar perfil profissional
          </Link>
        </div>
      </div>
    )
  }

  const activeDaysCount = DAYS_OF_WEEK.filter(d => availability[d.value].is_available).length
  const wrapperClassName =
    variant === 'standalone' ? 'mx-auto max-w-5xl p-6 md:p-8' : 'space-y-6'

  return (
    <div className={wrapperClassName}>
      {variant === 'standalone' ? (
        <div className="mb-8">
          <Link
            href="/perfil"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao perfil
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="mb-1 font-display text-3xl font-bold text-neutral-900">Calendário e disponibilidade</h1>
              <p className="text-neutral-500">
                Defina seus horários recorrentes de trabalho e concentre aqui as integrações do seu calendário.
              </p>
            </div>
            {activeDaysCount > 0 ? (
              <span className="flex-shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                {activeDaysCount} {activeDaysCount === 1 ? 'dia ativo' : 'dias ativos'}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-[28px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Regras e disponibilidades
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-neutral-950">
                Disponibilidade semanal e integrações de agenda
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                Edite seus blocos recorrentes, acompanhe ocupações externas e mantenha a agenda operacional em um único fluxo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                {activeDaysCount} {activeDaysCount === 1 ? 'dia ativo' : 'dias ativos'}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
                Fuso {calendarTimezone.replaceAll('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
        <div className="space-y-1 text-sm text-brand-700">
          <p>Os horários abaixo representam sua disponibilidade recorrente de trabalho na Muuday.</p>
          <p>Compromissos pontuais fora da plataforma e períodos ocupados pelas integrações aparecem no calendário completo logo abaixo.</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Buffer ativo</p>
          <p className="text-sm font-semibold text-neutral-900">{bufferMinutes} min</p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Janela máxima</p>
          <p className="text-sm font-semibold text-neutral-900">{maxWindowDays} dias</p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500">Status de sync</p>
          <p className="text-sm font-semibold text-neutral-900">
            {calendarConnected ? 'Conectado' : 'Não conectado'}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Integrações do calendário</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Conecte Google, Outlook ou Apple para importar ocupações externas e evitar conflitos de agenda.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
              {calendarConnectionStatus === 'connected'
                ? 'Conectado'
                : calendarConnectionStatus === 'pending'
                  ? 'Conexão pendente'
                  : calendarConnectionStatus === 'error'
                    ? 'Com erro'
                    : 'Sem conexão'}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(['google', 'outlook', 'apple'] as const).map(provider => {
              const locked = provider !== 'google' && outlookLocked
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
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                    selected
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:text-brand-700'
                  } ${locked ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {provider === 'google' ? 'Google' : provider === 'outlook' ? 'Outlook' : 'Apple'}
                  {locked ? ' · plano superior' : ''}
                </button>
              )
            })}
          </div>

          <div className="mt-4 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
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
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                type="email"
                value={appleCaldavUsername}
                onChange={event => setAppleCaldavUsername(event.target.value)}
                placeholder="Apple ID"
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={appleCaldavPassword}
                onChange={event => setAppleCaldavPassword(event.target.value)}
                placeholder="App-specific password"
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
              <input
                type="url"
                value={appleCaldavServerUrl}
                onChange={event => setAppleCaldavServerUrl(event.target.value)}
                placeholder="Servidor CalDAV (opcional)"
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          {calendarSyncError ? <p className="mt-3 text-sm font-medium text-red-700">{calendarSyncError}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void connectCalendarProvider()}
              disabled={calendarSyncState === 'saving'}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" />
              {calendarSyncState === 'saving' ? 'Conectando...' : 'Conectar calendário'}
            </button>
            <button
              type="button"
              onClick={() => void runCalendarSyncNow()}
              disabled={calendarSyncState === 'saving' || !calendarConnected}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Sincronizar agora
            </button>
            <button
              type="button"
              onClick={() => void disconnectCalendarProvider()}
              disabled={calendarSyncState === 'saving' || !calendarConnected}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-60"
            >
              Desconectar
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <h2 className="text-base font-semibold text-neutral-900">
            {variant === 'standalone' ? 'Regras de agendamento' : 'Contexto operacional'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {variant === 'standalone'
              ? 'Ajuste buffer, confirmação, janela máxima e outras regras fora do editor semanal.'
              : 'As regras detalhadas ficam logo abaixo, mas estes números já resumem o impacto operacional atual.'}
          </p>
          {variant === 'standalone' ? (
            <Link
              href="/configuracoes-agendamento"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:text-neutral-900"
            >
              Ajustar regras de agendamento
            </Link>
          ) : (
            <div className="mt-4 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-700">
              <div className="flex items-center justify-between gap-3">
                <span>Buffer ativo</span>
                <strong className="font-semibold text-neutral-900">{bufferMinutes} min</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Janela máxima</span>
                <strong className="font-semibold text-neutral-900">{maxWindowDays} dias</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Sync externo</span>
                <strong className="font-semibold text-neutral-900">
                  {calendarConnected ? 'Conectado' : 'Não conectado'}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="space-y-3 mb-6">
        {DAYS_OF_WEEK.map(day => {
          const dayData = availability[day.value]
          const isEnabled = dayData.is_available
          const hasError = !isValidTimeRange(dayData)

          return (
            <div
              key={day.value}
              className={`bg-white rounded-2xl border transition-all ${
                isEnabled
                  ? hasError
                    ? 'border-red-200 shadow-sm'
                    : 'border-brand-100 shadow-sm'
                  : 'border-neutral-100'
              }`}
            >
              {/* Day header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-label={isEnabled ? `Desativar ${day.label}` : `Ativar ${day.label}`}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    isEnabled ? 'bg-brand-500' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Day name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm transition-colors ${
                    isEnabled ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </p>
                  {!isEnabled && (
                    <p className="text-xs text-neutral-300 hidden sm:block">Indisponível</p>
                  )}
                </div>

                {/* Time selectors - shown inline on desktop, stacked on mobile */}
                {isEnabled && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-400 whitespace-nowrap hidden sm:block">De</label>
                      <select
                        value={dayData.start_time}
                        onChange={e => updateTime(day.value, 'start_time', e.target.value)}
                        className={`text-sm border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                          hasError ? 'border-red-300 text-red-600' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <span className="text-neutral-300 text-sm">-</span>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-400 whitespace-nowrap hidden sm:block">Até</label>
                      <select
                        value={dayData.end_time}
                        onChange={e => updateTime(day.value, 'end_time', e.target.value)}
                        className={`text-sm border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                          hasError ? 'border-red-300 text-red-600' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Disabled state placeholder */}
                {!isEnabled && (
                  <span className="text-xs text-neutral-300 font-medium">Inativo</span>
                )}
              </div>

              {/* Error message */}
              {isEnabled && hasError && (
                <div className="px-5 pb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500">
                    O horário de início deve ser anterior ao horário de fim
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Calendário completo</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Use esta visão para acompanhar a sua disponibilidade base, sessões já marcadas e ocupações vindas dos calendários conectados.
            </p>
          </div>
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
            Fuso: {calendarTimezone}
          </div>
        </div>
        <ProfessionalAvailabilityCalendar
          timezone={calendarTimezone}
          availabilityRules={DAYS_OF_WEEK.map(day => ({
            day_of_week: day.value,
            start_time: availability[day.value].start_time,
            end_time: availability[day.value].end_time,
            is_active: availability[day.value].is_available,
          }))}
          bookings={upcomingBookings}
        />
      </div>

      {/* Quick select shortcuts */}
      <div className="bg-white rounded-2xl border border-neutral-100 px-5 py-4 mb-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Atalhos</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAvailability(prev => {
                const next = { ...prev }
                // Mon-Fri
                for (const day of [1, 2, 3, 4, 5]) {
                  next[day] = { is_available: true, start_time: '09:00', end_time: '18:00' }
                }
                // Sat-Sun
                for (const day of [6, 0]) {
                  next[day] = { ...next[day], is_available: false }
                }
                return next
              })
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
          >
            Segunda a Sexta
          </button>
          <button
            type="button"
            onClick={() => {
              setAvailability(prev => {
                const next = { ...prev }
                for (const day of DAYS_OF_WEEK) {
                  next[day.value] = { is_available: true, start_time: '09:00', end_time: '18:00' }
                }
                return next
              })
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
          >
            Todos os dias
          </button>
          <button
            type="button"
            onClick={() => {
              setAvailability(buildDefaultState())
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            Limpar tudo
          </button>
        </div>
      </div>

      {/* Error message */}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Success message */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-4 flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          Horas de trabalho salvas com sucesso!
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saveStatus === 'saving' || hasErrors || !professionalId}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
      >
        {saveStatus === 'saving' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : saveStatus === 'success' ? (
          <>
            <Check className="w-4 h-4" />
            Salvo!
          </>
        ) : (
          'Salvar horas de trabalho'
        )}
      </button>
    </div>
  )
}


