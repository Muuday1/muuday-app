'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, Clock, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { ProfessionalAvailabilityCalendar } from '@/components/calendar/ProfessionalAvailabilityCalendar'
import { getDefaultPlanConfigMap, getPlanConfigForTier, type PlanConfigMap } from '@/lib/plan-config'
import { WeeklyScheduleEditor } from './weekly-schedule-editor'
import { AvailabilityQuickSelect } from './availability-quick-select'
import {
  DAYS_OF_WEEK,
  type AvailabilityState,
  buildDefaultState,
  type SaveStatus,
  isValidTimeRange,
} from './availability-workspace-helpers'

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
  const [planConfigs, setPlanConfigs] = useState<PlanConfigMap | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [maxWindowDays, setMaxWindowDays] = useState(30)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarTimezone, setCalendarTimezone] = useState('America/Sao_Paulo')
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

  const hasErrors = DAYS_OF_WEEK.some(d => !isValidTimeRange(availability[d.value]))

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

      <div className="mb-6">
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

      <WeeklyScheduleEditor
        availability={availability}
        onToggleDay={toggleDay}
        onUpdateTime={updateTime}
      />

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

      <AvailabilityQuickSelect onChange={setAvailability} />

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


