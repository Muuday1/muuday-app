export const dynamic = 'force-dynamic'

export const metadata = { title: 'Agenda | Muuday' }

import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  Layers,
  MessageCircle,
  Settings,
  Star,
  Video,
} from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingActions from '@/components/booking/BookingActions'
import RequestBookingActions from '@/components/booking/RequestBookingActions'
import { ProfessionalAgendaPage } from '@/components/agenda/ProfessionalAgendaPage'
import BookingRealtimeListener from '@/components/agenda/BookingRealtimeListener'
import { DEFAULT_PROFESSIONAL_BOOKING_SETTINGS, normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { getPlanConfigForTier, loadPlanConfigMap, type PlanConfig } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { AppCard } from '@/components/ui/AppCard'
import { PageContainer, PageHeader } from '@/components/ui/AppShell'

type RequestBookingStatus =
  | 'open'
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'converted'

type AgendaView = 'overview' | 'inbox' | 'availability_rules' | 'pending' | 'requests' | 'settings'
type InboxFilter = 'all' | 'confirmations' | 'requests'

function normalizeView(rawView: string | undefined, isProfessional: boolean): AgendaView {
  if (!isProfessional) return 'overview'
  const allowed: AgendaView[] = ['overview', 'inbox', 'availability_rules']
  return allowed.includes((rawView || '') as AgendaView)
    ? (rawView as AgendaView)
    : 'overview'
}

function normalizeInboxFilter(rawFilter: string | undefined): InboxFilter {
  const allowed: InboxFilter[] = ['all', 'confirmations', 'requests']
  return allowed.includes((rawFilter || '') as InboxFilter) ? (rawFilter as InboxFilter) : 'all'
}

function viewLinkClass(activeView: AgendaView, currentView: AgendaView) {
  return activeView === currentView
    ? 'bg-[#9FE870] text-white border-[#9FE870]'
    : 'bg-white text-slate-600 border-slate-200 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
}

function getConfirmationDeadline(booking: Record<string, any>): Date | null {
  const deadlineRaw = booking?.metadata?.confirmation_deadline_utc
  if (!deadlineRaw || typeof deadlineRaw !== 'string') return null

  const deadline = new Date(deadlineRaw)
  if (Number.isNaN(deadline.getTime())) return null
  return deadline
}

function getSlaLabel(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now()
  if (diffMs <= 0) return 'SLA expirado'

  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000))
  if (diffHours < 24) return `Expira em ${diffHours}h`

  const diffDays = Math.ceil(diffHours / 24)
  return `Expira em ${diffDays} dia${diffDays === 1 ? '' : 's'}`
}

function getRequestStatusUi(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: 'Aberta', className: 'bg-slate-100 text-slate-700' },
    offered: { label: 'Proposta enviada', className: 'bg-amber-50 text-amber-700' },
    accepted: { label: 'Aceita', className: 'bg-green-50 text-green-700' },
    converted: { label: 'Convertida', className: 'bg-green-50 text-green-700' },
    declined: { label: 'Recusada', className: 'bg-red-50 text-red-700' },
    expired: { label: 'Expirada', className: 'bg-slate-100 text-slate-500' },
    cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-500' },
  }
  return map[status] || map.open
}

function getDurationMinutes(startValue: string | null, endValue: string | null) {
  if (!startValue || !endValue) return 60
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return 60
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000))
}

function bookingModeMeta(booking: Record<string, any>) {
  const bookingType = String(booking.booking_type || '')
  if (booking.recurrence_group_id || bookingType.startsWith('recurring')) {
    return { label: 'Recorrência', className: 'bg-blue-50 text-blue-700' }
  }
  if (booking.batch_booking_group_id) {
    return { label: 'Várias datas', className: 'bg-purple-50 text-purple-700' }
  }
  return null
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; booking?: string; filter?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role,timezone')
    .eq('id', user.id)
    .single()
  const isProfessionalRole = profile?.role === 'profissional'

  const { data: professional } = isProfessionalRole
    ? await getPrimaryProfessionalForUser(
        supabase,
        user.id,
        'id, status, tier, bio, category, session_price_brl, session_duration_minutes, first_booking_enabled, first_booking_gate_note',
      )
    : { data: null as any }

  const professionalId: string | null = professional?.id ?? null
  const isProfessional = isProfessionalRole && Boolean(professionalId)
  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const nowIso = new Date().toISOString()
  const { view, booking, filter } = await searchParams
  const activeView = normalizeView(view, isProfessional)
  const inboxFilter = normalizeInboxFilter(filter)

  const expireQuery = isProfessional && professionalId
    ? supabase
        .from('request_bookings')
        .update({ status: 'expired', expired_at: nowIso })
        .eq('professional_id', professionalId)
        .eq('status', 'offered')
        .lt('proposal_expires_at', nowIso)
    : supabase
        .from('request_bookings')
        .update({ status: 'expired', expired_at: nowIso })
        .eq('user_id', user.id)
        .eq('status', 'offered')
        .lt('proposal_expires_at', nowIso)

  const { error: expireError } = await expireQuery
  if (expireError) {
    console.error('[agenda] failed to expire stale offers:', expireError.message)
  }

  const upcomingQuery =
    isProfessional && professionalId
      ? supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(*), professionals(*, profiles!professionals_user_id_fkey(*))')
          .eq('professional_id', professionalId)
      : isProfessional
        ? null
        : supabase
            .from('bookings')
            .select('*, professionals(*, profiles!professionals_user_id_fkey(*))')
            .eq('user_id', user.id)

  const pastQuery =
    isProfessional && professionalId
      ? supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(*), professionals(*, profiles!professionals_user_id_fkey(*))')
          .eq('professional_id', professionalId)
      : isProfessional
        ? null
        : supabase
            .from('bookings')
            .select('*, professionals(*, profiles!professionals_user_id_fkey(*))')
            .eq('user_id', user.id)

  const requestBookingsQuery =
    isProfessional && professionalId
      ? supabase
          .from('request_bookings')
          .select('*, profiles!request_bookings_user_id_fkey(*), professionals(*, profiles!professionals_user_id_fkey(*))')
          .eq('professional_id', professionalId)
      : isProfessional
        ? null
        : supabase
            .from('request_bookings')
            .select('*, professionals(*, profiles!professionals_user_id_fkey(*))')
            .eq('user_id', user.id)

  const { data: upcomingBookings, error: upcomingError } = upcomingQuery
    ? await upcomingQuery
        .in('status', ['pending', 'pending_confirmation', 'confirmed'])
        .gte('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: true })
    : { data: [] as any[], error: null }
  if (upcomingError) {
    console.error('[agenda] upcoming bookings query error:', upcomingError.message, upcomingError.code)
  }

  const { data: pastBookings, error: pastError } = pastQuery
    ? await pastQuery
        .in('status', ['completed', 'cancelled', 'no_show', 'pending', 'pending_confirmation', 'confirmed'])
        .lt('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: false })
        .limit(20)
    : { data: [] as any[], error: null }
  if (pastError) {
    console.error('[agenda] past bookings query error:', pastError.message, pastError.code)
  }

  const { data: requestBookings, error: requestError } = requestBookingsQuery
    ? await requestBookingsQuery.order('created_at', { ascending: false }).limit(30)
    : { data: [] as any[], error: null }
  if (requestError) {
    console.error('[agenda] request bookings query error:', requestError.message, requestError.code)
  }

  let professionalSettings: Record<string, any> | null = null
  let activeAvailabilityCount = 0
  let calendarIntegrationConnected = false
  let calendarIntegrationProvider = 'google'
  let calendarIntegrationStatus: 'disconnected' | 'pending' | 'connected' | 'error' = 'disconnected'
  let calendarIntegrationLastSyncAt = ''
  let calendarIntegrationAccountEmail = ''
  let calendarIntegrationLastSyncError = ''
  let calendarTimezone = userTimezone
  let overviewAvailabilityRules: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
  }> = []
  let overviewExternalBusySlots: Array<{
    id: string
    start_time_utc: string
    end_time_utc: string
    provider: string
  }> = []
  let overviewAvailabilityExceptions: Array<{
    date_local: string
    is_available: boolean
    start_time_local: string | null
    end_time_local: string | null
  }> = []
  let professionalBookingRulesPanelProps: {
    userId: string
    professionalId: string
    tier: string
    initialPlanConfig: PlanConfig
    initialForm: BookingSettingsForm
  } | null = null

  if (professionalId) {
    const [
      settingsResult,
      availabilityRulesResult,
      legacyAvailabilityResult,
      calendarIntegrationResult,
      externalBusyResult,
      availabilityExceptionsResult,
      planConfigMap,
    ] = await Promise.all([
      supabase
        .from('professional_settings')
        .select(
          'timezone, session_duration_minutes, buffer_minutes, buffer_time_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
        )
        .eq('professional_id', professionalId)
        .maybeSingle(),
      supabase
        .from('availability_rules')
        .select('weekday, start_time_local, end_time_local, is_active')
        .eq('professional_id', professionalId)
        .eq('is_active', true)
        .order('weekday', { ascending: true }),
      supabase
        .from('availability')
        .select('day_of_week, start_time, end_time, is_active')
        .eq('professional_id', professionalId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true }),
      supabase
        .from('calendar_integrations')
        .select('id, provider, sync_enabled, connection_status, provider_account_email, last_sync_at, last_sync_completed_at, last_sync_error')
        .eq('professional_id', professionalId)
        .maybeSingle(),
      supabase
        .from('external_calendar_busy_slots')
        .select('id, start_time_utc, end_time_utc, provider')
        .eq('professional_id', professionalId)
        .gte('start_time_utc', nowIso)
        .order('start_time_utc', { ascending: true })
        .limit(120),
      supabase
        .from('availability_exceptions')
        .select('date_local, is_available, start_time_local, end_time_local')
        .eq('professional_id', professionalId)
        .eq('is_available', false),
      loadPlanConfigMap(),
    ])

    professionalSettings = settingsResult.data as Record<string, any> | null

    const useModernRules =
      !availabilityRulesResult.error &&
      availabilityRulesResult.data &&
      availabilityRulesResult.data.length > 0

    overviewAvailabilityRules = useModernRules
      ? (availabilityRulesResult.data || []).map(row => ({
          day_of_week: Number(row.weekday),
          start_time: String(row.start_time_local || ''),
          end_time: String(row.end_time_local || ''),
          is_active: true,
        }))
      : (legacyAvailabilityResult.data || []).map(row => ({
          day_of_week: Number(row.day_of_week),
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
        is_active: Boolean(row.is_active),
      })) || []
    activeAvailabilityCount = overviewAvailabilityRules.length
    overviewAvailabilityExceptions = (availabilityExceptionsResult.data || []) as Array<{
      date_local: string
      is_available: boolean
      start_time_local: string | null
      end_time_local: string | null
    }>
    calendarIntegrationConnected = Boolean(calendarIntegrationResult.data?.sync_enabled)
    calendarIntegrationProvider = String(calendarIntegrationResult.data?.provider || 'google')
    const rawConnectionStatus = String(calendarIntegrationResult.data?.connection_status || 'disconnected')
    calendarIntegrationStatus =
      rawConnectionStatus === 'connected'
        ? 'connected'
        : rawConnectionStatus === 'pending'
          ? 'pending'
          : rawConnectionStatus === 'error'
            ? 'error'
            : 'disconnected'
    calendarIntegrationLastSyncAt = String(
      calendarIntegrationResult.data?.last_sync_completed_at ||
        calendarIntegrationResult.data?.last_sync_at ||
        '',
    )
    calendarIntegrationAccountEmail = String(calendarIntegrationResult.data?.provider_account_email || '')
    calendarIntegrationLastSyncError = String(calendarIntegrationResult.data?.last_sync_error || '')
    overviewExternalBusySlots =
      (externalBusyResult.data || []).map(row => ({
        id: String(row.id),
        start_time_utc: String(row.start_time_utc),
        end_time_utc: String(row.end_time_utc),
        provider: String(row.provider || 'calendar'),
      })) || []
    calendarTimezone = String(professionalSettings?.timezone || userTimezone)

    const normalizedTier = String(professional?.tier || 'basic').toLowerCase()
    const tierConfig = getPlanConfigForTier(planConfigMap, normalizedTier)
    const normalizedSettings = normalizeProfessionalSettingsRow(
      professionalSettings,
      profile?.timezone || DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone,
    )
    const durationFromProfessional =
      typeof professional?.session_duration_minutes === 'number'
        ? professional.session_duration_minutes
        : normalizedSettings.sessionDurationMinutes

    professionalBookingRulesPanelProps = {
      userId: user.id,
      professionalId,
      tier: normalizedTier,
      initialPlanConfig: tierConfig,
      initialForm: {
        timezone: normalizedSettings.timezone,
        sessionDurationMinutes: durationFromProfessional,
        bufferMinutes: Math.min(
          tierConfig.bufferConfig.maxMinutes,
          Math.max(0, normalizedSettings.bufferMinutes),
        ),
        minimumNoticeHours: normalizedSettings.minimumNoticeHours,
        maxBookingWindowDays: Math.min(
          tierConfig.limits.bookingWindowDays,
          Math.max(1, normalizedSettings.maxBookingWindowDays),
        ),
        enableRecurring: normalizedSettings.enableRecurring,
        confirmationMode: normalizedSettings.confirmationMode,
        cancellationPolicyCode: normalizedSettings.cancellationPolicyCode,
        requireSessionPurpose: normalizedSettings.requireSessionPurpose,
      },
    }
  }

  const upcoming = upcomingBookings || []
  const past = pastBookings || []
  const requestList = (requestBookings || []) as Array<Record<string, any>>
  const openRequestStatuses: RequestBookingStatus[] = ['open', 'offered']
  const activeRequests = requestList.filter(request =>
    openRequestStatuses.includes((request.status || 'open') as RequestBookingStatus),
  )
  const closedRequests = requestList.filter(
    request => !openRequestStatuses.includes((request.status || 'open') as RequestBookingStatus),
  )

  const pendingConfirmations = isProfessional
    ? upcoming.filter((booking: any) => booking.status === 'pending_confirmation')
    : []

  const completedBookingIds = past
    .filter((booking: any) => booking.status === 'completed')
    .map((booking: any) => booking.id)

  // Fetch conversations for chat links on confirmed bookings
  const allBookingIds = [...upcoming, ...past]
    .filter((b: any) => ['confirmed', 'completed'].includes(b.status))
    .map((b: any) => b.id)

  const conversationMap = new Map<string, string>()
  if (allBookingIds.length > 0) {
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, booking_id')
      .in('booking_id', allBookingIds)
    ;(conversationsData || []).forEach((c: any) => {
      if (c.booking_id) conversationMap.set(c.booking_id, c.id)
    })
  }

  const reviewedBookingIds = new Set<string>()
  if (!isProfessional && completedBookingIds.length > 0) {
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('booking_id')
      .in('booking_id', completedBookingIds)
      .eq('user_id', user.id)

    if (reviewsError) {
      console.error('[agenda] failed to load existing reviews:', reviewsError.message)
    }

    ;(existingReviews || []).forEach((review: any) => reviewedBookingIds.add(review.booking_id))
  }

  const shouldShowRequests = !isProfessional
  const shouldShowUpcoming = true
  const shouldShowHistory = true

  const upcomingVisible = upcoming
  const overviewCalendarBookings = [
    ...upcoming
      .map((booking: any) => {
        const scheduledAt = new Date(String(booking.scheduled_at || ''))
        const durationMinutes = Number(booking.duration_minutes || 60)
        const startUtcIso = String(booking.start_time_utc || booking.scheduled_at || '')
        const endUtcIso =
          String(booking.end_time_utc || '') ||
          (Number.isNaN(scheduledAt.getTime())
            ? ''
            : new Date(scheduledAt.getTime() + durationMinutes * 60000).toISOString())

        if (!startUtcIso || !endUtcIso) return null
        return {
          id: String(booking.id),
          start_utc: startUtcIso,
          end_utc: endUtcIso,
          status: String(booking.status || 'pending'),
          client_name: booking.profiles?.full_name || undefined,
        }
      })
      .filter(Boolean),
    ...overviewExternalBusySlots
      .map(slot =>
        slot.start_time_utc && slot.end_time_utc
          ? {
              id: `external-${slot.id}`,
              start_utc: slot.start_time_utc,
              end_utc: slot.end_time_utc,
              status: `external_${slot.provider}`,
            }
          : null,
      )
      .filter(Boolean),
  ] as Array<{ id: string; start_utc: string; end_utc: string; status: string; client_name?: string }>

  if (isProfessional && professional && professionalId) {
    return (
      <>
        <BookingRealtimeListener />
        <ProfessionalAgendaPage
        activeView={activeView as 'overview' | 'inbox' | 'availability_rules'}
        inboxFilter={inboxFilter}
        userTimezone={userTimezone}
        pendingConfirmations={pendingConfirmations}
        upcoming={upcoming}
        past={past}
        activeRequests={activeRequests}
        calendarTimezone={calendarTimezone}
        activeAvailabilityCount={activeAvailabilityCount}
        calendarIntegrationConnected={calendarIntegrationConnected}
        calendarIntegrationProvider={calendarIntegrationProvider}
        calendarIntegrationStatus={calendarIntegrationStatus}
        calendarIntegrationLastSyncAt={calendarIntegrationLastSyncAt}
        calendarIntegrationAccountEmail={calendarIntegrationAccountEmail}
        calendarIntegrationLastSyncError={calendarIntegrationLastSyncError}
        overviewAvailabilityRules={overviewAvailabilityRules}
        overviewAvailabilityExceptions={overviewAvailabilityExceptions}
        overviewCalendarBookings={overviewCalendarBookings}
        professionalBookingRulesPanelProps={professionalBookingRulesPanelProps}
      />
      </>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <BookingRealtimeListener />
      <PageHeader
        title="Agenda"
        subtitle={isProfessional ? 'Control center das suas sessoes e solicitacoes.' : 'Suas sessoes agendadas'}
      />

      {isProfessional && (
        <section className="mb-6">
          <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="professional-agenda-view-switcher">
            <Link href="/agenda?view=overview" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'overview')}`}>
              Visao geral
            </Link>
            <Link href="/agenda?view=pending" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'pending')}`}>
              Pendencias
            </Link>
            <Link href="/agenda?view=requests" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'requests')}`}>
              Requests
            </Link>
            <Link href="/agenda?view=settings" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'settings')}`}>
              Regras e calendário
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <AppCard padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aguardando confirmação</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{pendingConfirmations.length}</p>
            </AppCard>
            <AppCard padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solicitações abertas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{activeRequests.length}</p>
            </AppCard>
            <AppCard padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disponibilidade ativa</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{activeAvailabilityCount}</p>
            </AppCard>
          </div>
        </section>
      )}

      {isProfessional && activeView === 'settings' && (
        <AppCard className="mb-8" data-testid="professional-calendar-control-center">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
            <Settings className="h-5 w-5 text-[#9FE870]" />
            Calendário e regras de agendamento
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-md bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modo de confirmação</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {professionalSettings?.confirmation_mode === 'manual' ? 'Manual (SLA 24h)' : 'Aceite automática'}
              </p>
            </div>
            <div className="rounded-md bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Antecedência mínima</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {Number(professionalSettings?.minimum_notice_hours || 24)}h
              </p>
            </div>
            <div className="rounded-md bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Janela máxima</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {Number(professionalSettings?.max_booking_window_days || 30)} dias
              </p>
            </div>
            <div className="rounded-md bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fuso profissional</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {String(professionalSettings?.timezone || userTimezone).replaceAll('_', ' ')}
              </p>
            </div>
            <div className="rounded-md bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendário externo</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {calendarIntegrationConnected ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
            <div className="rounded-md bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recorrência</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {professionalSettings?.enable_recurring ? 'Ativa' : 'Desativada'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/disponibilidade"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
            >
              <CalendarDays className="h-4 w-4" />
              Ajustar disponibilidade
            </Link>
            <Link
              href="/configuracoes-agendamento"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
            >
              <Layers className="h-4 w-4" />
              Regras avancadas
            </Link>
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
            >
              <Settings className="h-4 w-4" />
              Business setup
            </Link>
          </div>
        </AppCard>
      )}

      {shouldShowRequests && (
        <div className="mb-8" data-testid="agenda-requests-section">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 font-display">
          <MessageCircle className="h-5 w-5 text-[#9FE870]" />
          Solicitações de horário
        </h2>

        {activeRequests.length === 0 && closedRequests.length === 0 ? (
          <AppCard>
            <p className="text-sm font-medium text-slate-700 text-center">Nenhuma solicitação de horário no momento.</p>
          </AppCard>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((request: any) => {
              const otherPerson = isProfessional
                ? request.profiles?.full_name
                : request.professionals?.profiles?.full_name
              const statusUi = getRequestStatusUi(request.status)
              const preferredWindowLabel = `${formatInTimeZone(
                new Date(request.preferred_start_utc),
                userTimezone,
                'EEE, d MMM HH:mm',
                { locale: ptBR },
              )} - ${formatInTimeZone(new Date(request.preferred_end_utc), userTimezone, 'HH:mm')}`
              const proposalWindowLabel =
                request.proposal_start_utc && request.proposal_end_utc
                  ? `${formatInTimeZone(
                      new Date(request.proposal_start_utc),
                      userTimezone,
                      'EEE, d MMM HH:mm',
                      { locale: ptBR },
                    )} - ${formatInTimeZone(new Date(request.proposal_end_utc), userTimezone, 'HH:mm')}`
                  : null

              return (
                <AppCard key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{otherPerson || 'Profissional'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Preferência enviada por {request.user_timezone?.replaceAll('_', ' ') || 'fuso não definido'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusUi.className}`}>
                      {statusUi.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-700">Janela preferida:</span>{' '}
                      {preferredWindowLabel} ({userTimezone.replaceAll('_', ' ')})
                    </p>
                    {proposalWindowLabel && (
                      <p>
                        <span className="font-medium text-slate-700">Proposta:</span> {proposalWindowLabel}
                        {request.proposal_timezone
                          ? ` (${String(request.proposal_timezone).replaceAll('_', ' ')})`
                          : ''}
                      </p>
                    )}
                    {request.proposal_expires_at && request.status === 'offered' && (
                      <p className="text-xs text-amber-700">
                        Expira em{' '}
                        {new Date(request.proposal_expires_at).toLocaleString('pt-BR', {
                          hour12: false,
                        })}
                      </p>
                    )}
                    {request.user_message && (
                      <p className="text-xs text-slate-500">Mensagem: {request.user_message}</p>
                    )}
                  </div>

                  <RequestBookingActions
                    requestId={request.id}
                    status={request.status}
                    isProfessional={isProfessional}
                    proposalTimezone={request.proposal_timezone}
                    defaultProposalStartLocal={request.proposal_start_utc || request.preferred_start_utc}
                    defaultDurationMinutes={getDurationMinutes(
                      request.preferred_start_utc,
                      request.preferred_end_utc,
                    )}
                  />
                </AppCard>
              )
            })}

            {closedRequests.length > 0 && (
              <AppCard>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Historico de solicitacoes
                </p>
                <div className="space-y-2">
                  {closedRequests.slice(0, 8).map((request: any) => {
                    const otherPerson = isProfessional
                      ? request.profiles?.full_name
                      : request.professionals?.profiles?.full_name
                    const statusUi = getRequestStatusUi(request.status)
                    return (
                      <div key={request.id} className="flex items-center justify-between rounded-md bg-slate-50/70 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {otherPerson || 'Profissional'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatInTimeZone(
                              new Date(request.preferred_start_utc),
                              userTimezone,
                              'd MMM yyyy HH:mm',
                              { locale: ptBR },
                            )}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusUi.className}`}>
                          {statusUi.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </AppCard>
            )}
          </div>
        )}
        </div>
      )}

      {shouldShowUpcoming && (
        <div className="mb-8" data-testid="agenda-upcoming-section">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 font-display">
          <Calendar className="h-5 w-5 text-[#9FE870]" />
            {isProfessional && activeView === 'pending' ? 'Pendências de confirmação' : 'Próximas sessões'}
        </h2>

        {isProfessional && pendingConfirmations.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {pendingConfirmations.length} solicitação{pendingConfirmations.length === 1 ? '' : 'ões'} aguardando confirmação
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Confirme ou recuse dentro do SLA para evitar cancelamento automatico com reembolso.
                </p>
              </div>
            </div>
          </div>
        )}

        {upcomingVisible.length === 0 ? (
          <AppCard padding="lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-50/70">
              <Calendar className="h-7 w-7 text-slate-300" />
            </div>
            <p className="mb-1 font-semibold text-slate-900">Nenhuma sessão agendada</p>
            <p className="mb-4 text-sm text-slate-500">
              {isProfessional
                ? 'Não há sessões no contexto selecionado.'
                : 'Encontre um profissional e agende sua primeira sessão.'}
            </p>
            {!isProfessional && (
              <a
                href="/buscar"
                className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
              >
                Buscar profissional
                <ChevronRight className="h-4 w-4" />
              </a>
            )}
          </AppCard>
        ) : (
          <div className="space-y-3">
            {upcomingVisible.map((booking: any) => {
              const otherPerson = isProfessional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name
              const confirmationDeadline =
                booking.status === 'pending_confirmation' ? getConfirmationDeadline(booking) : null
              const slaLabel = confirmationDeadline ? getSlaLabel(confirmationDeadline) : null

              const statusLabel =
                booking.status === 'confirmed'
                  ? 'Confirmado'
                  : booking.status === 'pending_confirmation'
                    ? 'Aguardando confirma??o'
                    : 'Pendente'

              return (
                <AppCard key={booking.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#9FE870]/8 font-bold text-[#3d6b1f] font-display">
                      {otherPerson?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{otherPerson || 'Profissional'}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatInTimeZone(
                            new Date(booking.scheduled_at),
                            userTimezone,
                            'EEE, d MMM HH:mm',
                            { locale: ptBR },
                          )}
                        </span>
                        <span>{booking.duration_minutes || 50}min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bookingModeMeta(booking) ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${bookingModeMeta(booking)?.className}`}
                        >
                          {bookingModeMeta(booking)?.label}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {statusLabel}
                      </span>
                      {slaLabel && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            slaLabel === 'SLA expirado'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {slaLabel}
                        </span>
                      )}
                      {booking.status === 'confirmed' ? (
                        <>
                          <Link
                            href={`/sessao/${booking.id}`}
                            className="flex items-center gap-1.5 rounded-full bg-[#9FE870] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#8ed85f]"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Entrar na sessão
                          </Link>
                          {conversationMap.has(booking.id) && (
                            <Link
                              href={`/mensagens/${conversationMap.get(booking.id)}`}
                              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Mensagens
                            </Link>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                  {slaLabel && (
                    <div className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Prazo de confirmação: {confirmationDeadline?.toLocaleString('pt-BR', { hour12: false })}
                    </div>
                  )}
                  <BookingActions
                    bookingId={booking.id}
                    status={booking.status}
                    sessionLink={booking.session_link}
                    scheduledAt={booking.scheduled_at}
                    isProfessional={isProfessional}
                  />
                </AppCard>
              )
            })}
          </div>
        )}
        </div>
      )}

      {shouldShowHistory && past.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 font-display">
            <Clock className="h-5 w-5 text-slate-400" />
            Historico
          </h2>
          <div className="space-y-2">
            {past.map((booking: any) => {
              const otherPerson = isProfessional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name

              const statusConfig: Record<string, { label: string; className: string }> = {
                completed: { label: 'Concluido', className: 'bg-green-50 text-green-700' },
                cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
                no_show: { label: 'Não compareceu', className: 'bg-slate-100 text-slate-500' },
                confirmed: { label: 'Confirmado (passado)', className: 'bg-amber-50 text-amber-700' },
                pending_confirmation: {
                  label: 'Aguardando confirma??o',
                  className: 'bg-amber-50 text-amber-700',
                },
                pending: { label: 'Pendente (passado)', className: 'bg-amber-50 text-amber-700' },
              }
              const status = statusConfig[booking.status] || statusConfig.completed

              const canReview =
                !isProfessional &&
                booking.status === 'completed' &&
                !reviewedBookingIds.has(booking.id)

              return (
                <div key={booking.id} className="rounded-md border border-slate-200/80 bg-white p-4 opacity-80">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-slate-50/70 text-sm font-bold text-slate-400 font-display">
                      {otherPerson?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{otherPerson || 'Profissional'}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatInTimeZone(new Date(booking.scheduled_at), userTimezone, 'd MMM yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {bookingModeMeta(booking) ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${bookingModeMeta(booking)?.className}`}
                        >
                          {bookingModeMeta(booking)?.label}
                        </span>
                      ) : null}
                      {canReview && (
                        <Link
                          href={`/avaliar/${booking.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 transition-all hover:bg-accent-100"
                        >
                          <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                          Avaliar
                        </Link>
                      )}
                      {!canReview && booking.status === 'completed' && !isProfessional && (
                        <span className="text-xs font-medium text-slate-300">Avaliado</span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {booking.status === 'confirmed' ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <BookingActions
                        bookingId={booking.id}
                        status={booking.status}
                        sessionLink={booking.session_link}
                        scheduledAt={booking.scheduled_at}
                        isProfessional={isProfessional}
                      />
                      <Link
                        href={`/sessao/${booking.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Abrir sessão
                      </Link>
                      {conversationMap.has(booking.id) && (
                        <Link
                          href={`/mensagens/${conversationMap.get(booking.id)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Mensagens
                        </Link>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PageContainer>
  )
}



