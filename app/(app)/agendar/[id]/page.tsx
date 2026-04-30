export const metadata = { title: 'Agendar Sessão | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CATEGORIES } from '@/types'
import BookingForm from '@/components/booking/BookingForm'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'

function parseInitialBookingType(value?: string) {
  return value === 'recurring' ? 'recurring' : 'one_off'
}

function parseInitialRecurringSessionsCount(value?: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 4
  const normalized = Math.trunc(parsed)
  if (normalized < 2) return 2
  if (normalized > 12) return 12
  return normalized
}

function parseInitialDate(value?: string) {
  if (!value) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

function parseInitialTime(value?: string) {
  if (!value) return undefined
  return /^\d{2}:\d{2}$/.test(value) ? value : undefined
}

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const { data, hora, sessoes, tipo, servico } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(await searchParams || {})) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string') query.append(key, item)
        })
      } else if (typeof value === 'string') {
        query.set(key, value)
      }
    }
    const targetPath = `/agendar/${id}${query.toString() ? `?${query.toString()}` : ''}`
    redirect(`/login?redirect=${encodeURIComponent(targetPath)}`)
  }

  // Fetch user profile and professional in parallel
  const serviceId = Array.isArray(servico) ? servico[0] : servico

  const [
    { data: userProfile },
    { data: professional },
    { data: selectedService },
  ] = await Promise.all([
    supabase.from('profiles').select('role, timezone, currency, full_name').eq('id', user.id).single(),
    supabase.from('professionals').select('id,user_id,status,public_code,category,session_duration_minutes,session_price_brl').eq('id', id).single(),
    serviceId
      ? supabase
          .from('professional_services')
          .select('id, name, description, duration_minutes, price_brl, enable_recurring, enable_batch')
          .eq('id', serviceId)
          .eq('professional_id', id)
          .eq('is_active', true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Professional accounts are provider-only workspaces and cannot purchase sessions.
  if (userProfile?.role === 'profissional') {
    redirect('/dashboard?erro=conta-profissional-nao-pode-contratar')
  }

  if (!professional || professional.status !== 'approved') {
    notFound()
  }

  const { data: professionalProfile } = await supabase
    .from('profiles')
    .select('full_name, timezone')
    .eq('id', professional.user_id)
    .maybeSingle()
  const professionalProfileHref = buildProfessionalProfilePath({
    id: professional.id,
    fullName: professionalProfile?.full_name,
    publicCode: professional.public_code,
  })

  // Prevent professionals from booking themselves
  if (professional.user_id === user.id) {
    redirect(`${professionalProfileHref}?erro=auto-agendamento`)
  }

  const firstBookingEligibility = await evaluateFirstBookingEligibility(supabase, professional.id)
  if (!firstBookingEligibility.ok) {
    redirect(`${professionalProfileHref}?erro=primeiro-agendamento-bloqueado`)
  }

  // Fetch settings and availability in parallel
  const [
    { data: settingsRow, error: settingsError },
    { data: availabilityRulesRows, error: availabilityRulesError },
    { data: legacyAvailability },
  ] = await Promise.all([
    supabase
      .from('professional_settings')
      .select(
        'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose'
      )
      .eq('professional_id', professional.id)
      .maybeSingle(),
    supabase
      .from('availability_rules')
      .select('weekday, start_time_local, end_time_local, is_active')
      .eq('professional_id', professional.id)
      .eq('is_active', true)
      .order('weekday'),
    supabase
      .from('availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('professional_id', professional.id)
      .eq('is_active', true)
      .order('day_of_week'),
  ])

  const bookingSettings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalProfile?.timezone || 'America/Sao_Paulo'
  )

  const availability =
    !availabilityRulesError && availabilityRulesRows && availabilityRulesRows.length > 0
      ? availabilityRulesRows.map(rule => ({
          id: `rule-${rule.weekday}-${rule.start_time_local}-${rule.end_time_local}`,
          day_of_week: rule.weekday,
          start_time: rule.start_time_local,
          end_time: rule.end_time_local,
        }))
      : legacyAvailability || []

  // Fetch internal bookings + external busy slots to block unavailable times
  const now = new Date()
  const bookingWindowEnd = new Date(now)
  bookingWindowEnd.setDate(bookingWindowEnd.getDate() + Math.max(30, bookingSettings.maxBookingWindowDays))

  const [
    { data: bookingRows },
    { data: externalBusyRows },
    { data: availabilityExceptionsRows },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('scheduled_at, start_time_utc, end_time_utc, duration_minutes')
      .eq('professional_id', professional.id)
      .in('status', ['pending', 'pending_confirmation', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', bookingWindowEnd.toISOString())
      .limit(200),
    supabase
      .from('external_calendar_busy_slots')
      .select('start_time_utc, end_time_utc')
      .eq('professional_id', professional.id)
      .gte('start_time_utc', now.toISOString())
      .lte('start_time_utc', bookingWindowEnd.toISOString())
      .limit(200),
    supabase
      .from('availability_exceptions')
      .select('date_local, is_available, start_time_local, end_time_local')
      .eq('professional_id', professional.id)
      .eq('is_available', false)
      .limit(200),
  ])

  const existingBookings = [
    ...((bookingRows || []).map((row: Record<string, unknown>) => {
      const startIso = String(row.start_time_utc || row.scheduled_at || '')
      const endIso = String(row.end_time_utc || '')
      const start = new Date(startIso)
      const end = new Date(endIso)
      const fallbackDuration = Number(row.duration_minutes || 60)
      const durationMinutes =
        !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start
          ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
          : fallbackDuration
      return {
        scheduled_at: startIso,
        duration_minutes: durationMinutes,
      }
    })),
    ...((externalBusyRows || []).map((row: Record<string, unknown>) => {
      const startIso = String(row.start_time_utc || '')
      const endIso = String(row.end_time_utc || '')
      const start = new Date(startIso)
      const end = new Date(endIso)
      const durationMinutes =
        !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start
          ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
          : 60
      return {
        scheduled_at: startIso,
        duration_minutes: durationMinutes,
      }
    })),
  ]

  const queryTipo = tipo
  const querySessoes = sessoes
  const queryData = data
  const queryHora = hora
  const queryServico = servico

  const initialBookingType = parseInitialBookingType(
    Array.isArray(queryTipo) ? queryTipo[0] : queryTipo
  )
  const initialRecurringSessionsCount = parseInitialRecurringSessionsCount(
    Array.isArray(querySessoes) ? querySessoes[0] : querySessoes
  )
  const initialDate = parseInitialDate(Array.isArray(queryData) ? queryData[0] : queryData)
  const initialTime = parseInitialTime(Array.isArray(queryHora) ? queryHora[0] : queryHora)

  const category = CATEGORIES.find(c => c.slug === professional.category)

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200/80 px-6 md:px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-2xl text-slate-900">
            Agendar sessão
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {professionalProfile?.full_name}
            {category ? ` · ${category.icon} ${category.name}` : ''}
            {' · '}
            {selectedService ? `${selectedService.name} · ${selectedService.duration_minutes} min` : `${professional.session_duration_minutes} min`}
          </p>
        </div>
      </div>

      <BookingForm
        professional={{
          id: professional.id,
          session_price_brl: professional.session_price_brl,
          session_duration_minutes: bookingSettings.sessionDurationMinutes || professional.session_duration_minutes,
          category: professional.category,
        }}
        profileName={professionalProfile?.full_name || 'Profissional'}
        profileHref={professionalProfileHref}
        availability={availability || []}
        existingBookings={existingBookings || []}
        availabilityExceptions={
          (availabilityExceptionsRows || []) as {
            date_local: string
            is_available: boolean
            start_time_local: string | null
            end_time_local: string | null
          }[]
        }
        userTimezone={userProfile?.timezone || 'America/Sao_Paulo'}
        userCurrency={userProfile?.currency || 'BRL'}
        professionalTimezone={bookingSettings.timezone}
        minimumNoticeHours={bookingSettings.minimumNoticeHours}
        maxBookingWindowDays={bookingSettings.maxBookingWindowDays}
        confirmationMode={bookingSettings.confirmationMode}
        requireSessionPurpose={bookingSettings.requireSessionPurpose}
        enableRecurring={bookingSettings.enableRecurring}
        initialBookingType={initialBookingType}
        initialRecurringSessionsCount={initialRecurringSessionsCount}
        initialDate={initialDate}
        initialTime={initialTime}
        selectedService={selectedService || undefined}
      />
    </div>
  )
}
