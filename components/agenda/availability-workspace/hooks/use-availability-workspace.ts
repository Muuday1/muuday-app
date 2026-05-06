'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { saveAvailabilityAction } from '@/lib/actions/professional'
import { getDefaultPlanConfigMap, getPlanConfigForTier, type PlanConfigMap } from '@/lib/plan-config'
import {
  DAYS_OF_WEEK,
  type AvailabilityState,
  buildDefaultState,
  type SaveStatus,
  isValidTimeRange,
} from '../../availability-workspace-helpers'

function availabilityEqual(a: AvailabilityState, b: AvailabilityState): boolean {
  for (const day of DAYS_OF_WEEK) {
    const av = a[day.value]
    const bv = b[day.value]
    if (!av || !bv) return false
    if (av.is_available !== bv.is_available) return false
    if (av.start_time !== bv.start_time) return false
    if (av.end_time !== bv.end_time) return false
  }
  return true
}

export function useAvailabilityWorkspace() {
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilityState>(buildDefaultState())
  const initialAvailabilityRef = useRef<AvailabilityState>(buildDefaultState())
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
  const [availabilityExceptions, setAvailabilityExceptions] = useState<
    Array<{ date_local: string; is_available: boolean; start_time_local: string | null; end_time_local: string | null }>
  >([])

  const hasUnsavedChanges = !availabilityEqual(availability, initialAvailabilityRef.current)
  const hasErrors = DAYS_OF_WEEK.some((d: { value: number }) => !isValidTimeRange(availability[d.value]))

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges && saveStatus !== 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, saveStatus])

  const loadAvailability = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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

    const [{ data: settingsRow }, { data: calendarRow }, { data: bookingRows }, { data: externalBusyRows }, { data: exceptionRows }] = await Promise.all([
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
      supabase
        .from('availability_exceptions')
        .select('date_local, is_available, start_time_local, end_time_local')
        .eq('professional_id', professional.id)
        .eq('is_available', false)
        .gte('date_local', new Date().toISOString().slice(0, 10))
        .order('date_local', { ascending: true })
        .limit(200),
    ])

    const savedBufferMinutes = Number(settingsRow?.buffer_time_minutes || settingsRow?.buffer_minutes || 15)
    setBufferMinutes(Math.min(maxBufferMinutes, Math.max(0, savedBufferMinutes)))
    setCalendarTimezone(String(settingsRow?.timezone || 'America/Sao_Paulo'))
    setMaxWindowDays(Number(settingsRow?.max_booking_window_days || tierLimits.bookingWindowDays))
    setCalendarConnected(Boolean(calendarRow?.sync_enabled))
    setAvailabilityExceptions(
      (exceptionRows || []).map((row: Record<string, unknown>) => ({
        date_local: String(row.date_local || ''),
        is_available: Boolean(row.is_available),
        start_time_local: row.start_time_local ? String(row.start_time_local) : null,
        end_time_local: row.end_time_local ? String(row.end_time_local) : null,
      })),
    )
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

    const { data: modernRows } = await supabase
      .from('availability_rules')
      .select('weekday,start_time_local,end_time_local,is_active')
      .eq('professional_id', professional.id)
      .limit(50)

    const legacyRows = modernRows && modernRows.length > 0
      ? null
      : await supabase
          .from('availability')
          .select('day_of_week,start_time,end_time,is_active')
          .eq('professional_id', professional.id)
          .limit(50)
          .then(r => r.data)

    const rows = modernRows && modernRows.length > 0
      ? modernRows.map(row => ({
          day_of_week: row.weekday,
          start_time: row.start_time_local,
          end_time: row.end_time_local,
          is_active: row.is_active,
        }))
      : (legacyRows || [])

    let loadedState: AvailabilityState
    if (rows.length > 0) {
      loadedState = buildDefaultState()
      for (const row of rows) {
        loadedState[row.day_of_week] = {
          is_available: Boolean(row.is_active),
          start_time: String(row.start_time || '09:00').slice(0, 5),
          end_time: String(row.end_time || '17:00').slice(0, 5),
        }
      }
    } else {
      loadedState = buildDefaultState()
    }

    setAvailability(loadedState)
    initialAvailabilityRef.current = loadedState
    setLoading(false)
  }, [planConfigs, router])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  function toggleDay(dayValue: number) {
    setAvailability((prev: AvailabilityState) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        is_available: !prev[dayValue].is_available,
      },
    }))
  }

  function updateTime(dayValue: number, field: 'start_time' | 'end_time', value: string) {
    setAvailability((prev: AvailabilityState) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value,
      },
    }))
  }

  function handleCopyDay(fromDayValue: number, toDayValues: number[]) {
    setAvailability((prev: AvailabilityState) => {
      const next = { ...prev }
      const source = prev[fromDayValue]
      for (const to of toDayValues) {
        next[to] = { ...source }
      }
      return next
    })
  }

  async function handleSave() {
    if (!professionalId || hasErrors) return

    setSaveStatus('saving')
    setErrorMessage('')

    const result = await saveAvailabilityAction(availability, calendarTimezone)

    if (result.error) {
      setErrorMessage(
        result.restored
          ? `${result.error} Os dados anteriores foram restaurados automaticamente.`
          : result.error,
      )
      setSaveStatus('error')
      return
    }

    const visibilityRes = await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    if (!visibilityRes.ok) {
      Sentry.captureMessage('[AvailabilityWorkspace] recompute-visibility failed: ' + visibilityRes.status, { level: 'warning', tags: { area: 'availability-workspace' } })
    }

    initialAvailabilityRef.current = { ...availability }
    setSaveStatus('success')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  return {
    availability,
    setAvailability,
    loading,
    saveStatus,
    errorMessage,
    professionalId,
    accessDenied,
    bufferMinutes,
    maxWindowDays,
    calendarConnected,
    calendarTimezone,
    upcomingBookings,
    availabilityExceptions,
    hasUnsavedChanges,
    hasErrors,
    toggleDay,
    updateTime,
    handleCopyDay,
    handleSave,
  }
}
