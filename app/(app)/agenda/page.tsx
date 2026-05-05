export const metadata = { title: 'Agenda | Muuday' }

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  Layers,
  MessageCircle,
  Package,
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
import BookingRealtimeListener from '@/components/agenda/BookingRealtimeListener'

import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { AppCard } from '@/components/ui/AppCard'
import { PageContainer, PageHeader } from '@/components/ui/AppShell'
import { Suspense } from 'react'
import ProfessionalAgendaLoader from '@/components/agenda/ProfessionalAgendaLoader'
import ProfessionalAgendaSkeleton from '@/components/agenda/ProfessionalAgendaSkeleton'
import { RecurringPackageCard } from '@/components/agenda/RecurringPackageCard'
import { safePromiseAll } from '@/lib/async/safe-promise-all'

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

// Time constants
const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 3_600_000
const HOURS_PER_DAY = 24
const DEFAULT_DURATION_MINUTES = 60
const MIN_DURATION_MINUTES = 15

// Query limit constants
const UPCOMING_BOOKINGS_LIMIT = 50
const PAST_BOOKINGS_LIMIT = 20
const REQUEST_BOOKINGS_LIMIT = 30
const CONVERSATIONS_LIMIT = 100
const REVIEWS_LIMIT = 200
const CLOSED_REQUESTS_SHOW_COUNT = 8

// Minimal interfaces for agenda data shapes (avoids `any` until Supabase types are regenerated)
interface AgendaBooking {
  id: string
  status: string
  scheduled_at: string
  duration_minutes?: number
  start_time_utc?: string
  end_time_utc?: string
  booking_type?: string
  recurrence_group_id?: string
  recurrence_periodicity?: string | null
  recurrence_occurrence_index?: number | null
  batch_booking_group_id?: string
  session_link?: string
  profiles?: { full_name?: string | null } | null
  professionals?: { profiles?: { full_name?: string | null } | null } | null
  metadata?: { confirmation_deadline_utc?: string } | null
}

interface RequestBooking {
  id: string
  status: RequestBookingStatus
  profiles?: { full_name?: string | null } | null
  professionals?: { profiles?: { full_name?: string | null } | null } | null
  preferred_start_utc: string
  preferred_end_utc: string
  proposal_start_utc?: string
  proposal_end_utc?: string
  proposal_timezone?: string
  proposal_expires_at?: string
  user_message?: string
  user_timezone?: string
}

interface ConversationLink {
  id: string
  booking_id?: string
}

interface ReviewLink {
  booking_id: string
}

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

function getConfirmationDeadline(booking: AgendaBooking): Date | null {
  const deadlineRaw = booking.metadata?.confirmation_deadline_utc
  if (!deadlineRaw || typeof deadlineRaw !== 'string') return null

  const deadline = new Date(deadlineRaw)
  if (Number.isNaN(deadline.getTime())) return null
  return deadline
}

function getSlaLabel(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now()
  if (diffMs <= 0) return 'SLA expirado'

  const diffHours = Math.ceil(diffMs / MS_PER_HOUR)
  if (diffHours < HOURS_PER_DAY) return `Expira em ${diffHours}h`

  const diffDays = Math.ceil(diffHours / HOURS_PER_DAY)
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
  if (!startValue || !endValue) return DEFAULT_DURATION_MINUTES
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return DEFAULT_DURATION_MINUTES
  return Math.max(MIN_DURATION_MINUTES, Math.round((end.getTime() - start.getTime()) / MS_PER_MINUTE))
}

function bookingModeMeta(booking: AgendaBooking) {
  const bookingType = String(booking.booking_type || '')
  if (booking.recurrence_group_id || bookingType.startsWith('recurring')) {
    return { label: 'Recorrência', className: 'bg-blue-50 text-blue-700' }
  }
  if (booking.batch_booking_group_id) {
    return { label: 'Várias datas', className: 'bg-purple-50 text-purple-700' }
  }
  return null
}

function groupRecurringBookings(bookings: AgendaBooking[]) {
  const recurringGroups: Record<string, AgendaBooking[]> = {}
  const oneOffBookings: AgendaBooking[] = []

  for (const booking of bookings) {
    const groupId = booking.recurrence_group_id
    if (groupId) {
      if (!recurringGroups[groupId]) {
        recurringGroups[groupId] = []
      }
      recurringGroups[groupId].push(booking)
    } else {
      oneOffBookings.push(booking)
    }
  }

  return { recurringGroups, oneOffBookings }
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
    : { data: null }

  const professionalId: string | null = professional?.id ?? null
  const isProfessional = isProfessionalRole && Boolean(professionalId)
  const userTimezone = profile?.timezone || 'America/Sao_Paulo'
  const nowIso = new Date().toISOString()
  const { view, filter } = await searchParams

  // Map legacy view names to current agenda views so dashboard/workspace-health links work
  let resolvedView = view
  let resolvedFilter = filter
  if (isProfessional) {
    if (resolvedView === 'pending') {
      resolvedView = 'inbox'
      resolvedFilter = resolvedFilter || 'confirmations'
    } else if (resolvedView === 'requests') {
      resolvedView = 'inbox'
      resolvedFilter = resolvedFilter || 'requests'
    } else if (resolvedView === 'settings') {
      resolvedView = 'availability_rules'
    }
  }

  const activeView = normalizeView(resolvedView, isProfessional)
  const inboxFilter = normalizeInboxFilter(resolvedFilter)

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

  const [
    { error: expireError },
    { data: upcomingBookings, error: upcomingError },
    { data: pastBookings, error: pastError },
    { data: requestBookings, error: requestError },
  ] = await safePromiseAll([
    expireQuery,
    upcomingQuery
      ? upcomingQuery
          .in('status', ['pending', 'pending_confirmation', 'confirmed'])
          .gte('scheduled_at', nowIso)
          .order('scheduled_at', { ascending: true })
          .limit(UPCOMING_BOOKINGS_LIMIT)
      : Promise.resolve({ data: [] as AgendaBooking[], error: null }),
    pastQuery
      ? pastQuery
          .in('status', ['completed', 'cancelled', 'no_show', 'pending', 'pending_confirmation', 'confirmed'])
          .lt('scheduled_at', nowIso)
          .order('scheduled_at', { ascending: false })
          .limit(PAST_BOOKINGS_LIMIT)
      : Promise.resolve({ data: [] as AgendaBooking[], error: null }),
    requestBookingsQuery
      ? requestBookingsQuery.order('created_at', { ascending: false }).limit(REQUEST_BOOKINGS_LIMIT)
      : Promise.resolve({ data: [] as RequestBooking[], error: null }),
  ], [
    { error: null },
    { data: [] as AgendaBooking[], error: null },
    { data: [] as AgendaBooking[], error: null },
    { data: [] as RequestBooking[], error: null },
  ] as any, { area: 'agenda', context: 'bookings-parallel-queries' })

  if (expireError) {
    Sentry.captureException(expireError, {
      tags: { area: 'agenda', context: 'expire-stale-offers' },
    })
  }

  if (upcomingError) {
    Sentry.captureException(upcomingError, {
      tags: { area: 'agenda', context: 'upcoming-bookings-query' },
    })
  }
  if (pastError) {
    Sentry.captureException(pastError, {
      tags: { area: 'agenda', context: 'past-bookings-query' },
    })
  }
  if (requestError) {
    Sentry.captureException(requestError, {
      tags: { area: 'agenda', context: 'request-bookings-query' },
    })
  }

  let professionalSettings: Record<string, unknown> | null = null
  let activeAvailabilityCount = 0
  let calendarIntegrationConnected = false
  let overviewAvailabilityRules: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
  }> = []

  if (professionalId) {
    const [
      settingsResult,
      availabilityRulesResult,
      legacyAvailabilityResult,
      calendarIntegrationResult,
    ] = await safePromiseAll([
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
        .select('sync_enabled')
        .eq('professional_id', professionalId)
        .maybeSingle(),
    ], [
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ] as any, { area: 'agenda', context: 'settings-parallel-queries' })

    professionalSettings = settingsResult.data as Record<string, unknown> | null

    const useModernRules =
      !availabilityRulesResult.error &&
      availabilityRulesResult.data &&
      availabilityRulesResult.data.length > 0

    overviewAvailabilityRules = useModernRules
      ? (availabilityRulesResult.data || []).map((row: { weekday?: number | string; start_time_local?: string | null; end_time_local?: string | null }) => ({
          day_of_week: Number(row.weekday),
          start_time: String(row.start_time_local || ''),
          end_time: String(row.end_time_local || ''),
          is_active: true,
        }))
      : (legacyAvailabilityResult.data || []).map((row: { day_of_week?: number | string; start_time?: string | null; end_time?: string | null; is_active?: boolean }) => ({
          day_of_week: Number(row.day_of_week),
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
        is_active: Boolean(row.is_active),
      })) || []
    activeAvailabilityCount = overviewAvailabilityRules.length
    calendarIntegrationConnected = Boolean(calendarIntegrationResult.data?.sync_enabled)
  }

  const upcoming = upcomingBookings || []
  const past = pastBookings || []
  const requestList = (requestBookings || []) as RequestBooking[]
  const openRequestStatuses: RequestBookingStatus[] = ['open', 'offered']
  const activeRequests = requestList.filter(request =>
    openRequestStatuses.includes((request.status || 'open') as RequestBookingStatus),
  )
  const closedRequests = requestList.filter(
    request => !openRequestStatuses.includes((request.status || 'open') as RequestBookingStatus),
  )

  const pendingConfirmations = isProfessional
    ? upcoming.filter((booking: AgendaBooking) => booking.status === 'pending_confirmation')
    : []

  const completedBookingIds = past
    .filter((booking: AgendaBooking) => booking.status === 'completed')
    .map((booking: AgendaBooking) => booking.id)

  // Fetch conversations for chat links on confirmed bookings
  const allBookingIds = [...upcoming, ...past]
    .filter((b: AgendaBooking) => ['confirmed', 'completed'].includes(b.status))
    .map((b: AgendaBooking) => b.id)

  const [conversationsResult, reviewsResult] = await safePromiseAll([
    allBookingIds.length > 0
      ? supabase
          .from('conversations')
          .select('id, booking_id')
          .in('booking_id', allBookingIds)
          .limit(CONVERSATIONS_LIMIT)
      : Promise.resolve({ data: null, error: null }),
    !isProfessional && completedBookingIds.length > 0
      ? supabase
          .from('reviews')
          .select('booking_id')
          .in('booking_id', completedBookingIds)
          .eq('user_id', user.id)
          .limit(REVIEWS_LIMIT)
      : Promise.resolve({ data: null, error: null }),
  ], [
    { data: null, error: null },
    { data: null, error: null },
  ] as any, { area: 'agenda', context: 'conversations-reviews-parallel-queries' })

  const conversationMap = new Map<string, string>()
  if (conversationsResult.data) {
    ;(conversationsResult.data as ConversationLink[]).forEach((c: ConversationLink) => {
      if (c.booking_id) conversationMap.set(c.booking_id, c.id)
    })
  }

  const reviewedBookingIds = new Set<string>()
  if (reviewsResult.data) {
    ;(reviewsResult.data as ReviewLink[]).forEach((review: ReviewLink) => reviewedBookingIds.add(review.booking_id))
  }
  if (reviewsResult.error) {
    Sentry.captureException(reviewsResult.error, {
      tags: { area: 'agenda', context: 'existing-reviews-query' },
    })
  }

  const shouldShowRequests = !isProfessional
  const shouldShowUpcoming = true
  const shouldShowHistory = true

  const upcomingVisible = upcoming
  const { recurringGroups, oneOffBookings } = groupRecurringBookings(upcomingVisible)
  const hasRecurringUpcoming = Object.keys(recurringGroups).length > 0
  const hasOneOffUpcoming = oneOffBookings.length > 0

  if (isProfessional && professional && professionalId) {
    return (
      <>
        <BookingRealtimeListener />
        <Suspense fallback={<ProfessionalAgendaSkeleton />}>
          <ProfessionalAgendaLoader
            userId={user.id}
            professionalId={professionalId}
            professional={professional}
            activeView={activeView as 'overview' | 'inbox' | 'availability_rules'}
            inboxFilter={inboxFilter}
            userTimezone={userTimezone}
            pendingConfirmations={pendingConfirmations}
            upcoming={upcoming}
            past={past}
            activeRequests={activeRequests}
          />
        </Suspense>
      </>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <BookingRealtimeListener />
      <PageHeader
        title="Agenda"
        subtitle={isProfessional ? 'Central de controle das suas sessões e solicitações.' : 'Suas sessões agendadas'}
      />

      {isProfessional && (
        <section className="mb-6">
          <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="professional-agenda-view-switcher">
            <Link href="/agenda?view=overview" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'overview')}`}>
              Visão geral
            </Link>
            <Link href="/agenda?view=inbox&filter=confirmations" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'inbox')}`}>
              Pendências
            </Link>
            <Link href="/agenda?view=inbox&filter=requests" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'inbox')}`}>
              Solicitações
            </Link>
            <Link href="/agenda?view=availability_rules" className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'availability_rules')}`}>
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

      {isProfessional && activeView === 'availability_rules' && (
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
              Regras avançadas
            </Link>
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
            >
              <Settings className="h-4 w-4" />
              Configurações do negócio
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
            {activeRequests.map((request: RequestBooking) => {
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
                  Histórico de solicitações
                </p>
                <div className="space-y-2">
                  {closedRequests.slice(0, CLOSED_REQUESTS_SHOW_COUNT).map((request: RequestBooking) => {
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
            {isProfessional && activeView === 'inbox' && inboxFilter === 'confirmations' ? 'Pendências de confirmação' : 'Próximas sessões'}
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
          <div className="space-y-6">
            <>
              {hasRecurringUpcoming && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Package className="h-4 w-4 text-blue-500" />
                    Pacotes recorrentes
                  </h3>
                  {Object.entries(recurringGroups).map(([groupId, groupBookings]) => (
                    <RecurringPackageCard
                      key={groupId}
                      bookings={groupBookings as Array<{
                        id: string
                        status: string
                        scheduled_at: string
                        duration_minutes: number
                        session_link: string | null
                        booking_type: string | null
                        recurrence_group_id: string | null
                        recurrence_periodicity: string | null
                        recurrence_occurrence_index: number | null
                        professionals?: { profiles?: { full_name?: string | null } | null } | null
                        profiles?: { full_name?: string | null } | null
                      }>}
                      isProfessional={isProfessional}
                      userTimezone={userTimezone}
                    />
                  ))}
                </div>
              )}

              {hasOneOffUpcoming && (
                <div className="space-y-3">
                  {hasRecurringUpcoming && (
                    <h3 className="text-sm font-semibold text-slate-700">Sessões avulsas</h3>
                  )}
                  {oneOffBookings.map((booking: AgendaBooking) => {
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
                              ? 'Aguardando confirmação'
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
                                  <span>{booking.duration_minutes || DEFAULT_DURATION_MINUTES}min</span>
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
                              bookingType={booking.booking_type}
                              recurrenceGroupId={booking.recurrence_group_id}
                              professionalName={otherPerson}
                            />
                          </AppCard>
                        )
                      })}
                    </div>
                  )}
                </>
              </div>
        )}
        </div>
      )}

      {shouldShowHistory && past.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 font-display">
            <Clock className="h-5 w-5 text-slate-400" />
            Histórico
          </h2>
          <div className="space-y-2">
            {past.map((booking: AgendaBooking) => {
              const otherPerson = isProfessional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name

              const statusConfig: Record<string, { label: string; className: string }> = {
                completed: { label: 'Concluido', className: 'bg-green-50 text-green-700' },
                cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
                no_show: { label: 'Não compareceu', className: 'bg-slate-100 text-slate-500' },
                confirmed: { label: 'Confirmado (passado)', className: 'bg-amber-50 text-amber-700' },
                pending_confirmation: {
                  label: 'Aguardando confirmação',
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
                        bookingType={booking.booking_type}
                        recurrenceGroupId={booking.recurrence_group_id}
                        professionalName={otherPerson}
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



