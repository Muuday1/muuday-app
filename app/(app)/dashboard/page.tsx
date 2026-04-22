export const dynamic = 'force-dynamic'

export const metadata = { title: 'Dashboard | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock,
  Layers,
  ShieldAlert,
  Star,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserWithSessionFallback } from '@/lib/auth/get-user-with-fallback'
import { formatCurrency } from '@/lib/utils'
import { buildProfessionalWorkspaceAlerts } from '@/lib/professional/workspace-health'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { loadProfessionalTrackerMeta } from '@/lib/professional/onboarding-tracker-state'
import { ProfessionalOnboardingCard } from '@/components/dashboard/ProfessionalOnboardingCard'
import BookingRealtimeListener from '@/components/agenda/BookingRealtimeListener'
import { AppCard, AppCardHeader } from '@/components/ui/AppCard'
import { PageContainer, PageHeader } from '@/components/ui/AppShell'

const FIRST_BOOKING_RELEVANT_STATUSES = [
  'pending',
  'pending_confirmation',
  'confirmed',
  'completed',
  'no_show',
  'rescheduled',
]

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente de pagamento',
  pending_confirmation: 'Aguardando confirmação',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Concluída',
  no_show: 'Não compareceu',
  rescheduled: 'Reagendada',
}

const PROFESSIONAL_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending_review: 'Em revisão',
  draft: 'Rascunho',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
}

const CONFIRMATION_MODE_LABELS: Record<string, string> = {
  auto_accept: 'Aceite automático',
  manual: 'Confirmação manual',
}

function alertStyles(level: 'info' | 'warning' | 'critical') {
  if (level === 'critical') {
    return {
      wrapper: 'border-red-200 bg-red-50',
      title: 'text-red-800',
      description: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    }
  }
  if (level === 'warning') {
    return {
      wrapper: 'border-amber-200 bg-amber-50',
      title: 'text-amber-800',
      description: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    }
  }
  return {
    wrapper: 'border-blue-200 bg-blue-50',
    title: 'text-blue-800',
    description: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  }
}

function toUiLabel(value?: string | null, dictionary: Record<string, string> = {}) {
  if (!value) return 'Não definido'
  if (dictionary[value]) return dictionary[value]
  return value.replaceAll('_', ' ')
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ openOnboarding?: string; result?: string }>
}) {
  const { openOnboarding, result } = await searchParams
  const supabase = await createClient()
  const user = await getUserWithSessionFallback<{ id: string }>(supabase)

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, timezone, currency')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'usuario') redirect('/buscar')
  if (profile.role === 'admin') redirect('/admin')

  const { data: professional } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id, public_code, status, tier, bio, category, cover_photo_url, session_price_brl, session_duration_minutes, rating, total_reviews, total_bookings, first_booking_enabled, first_booking_gate_note',
  )

  if (!professional) redirect('/completar-perfil')

  const professionalId = professional.id
  const userTimezone = profile.timezone || 'America/Sao_Paulo'
  const now = new Date()
  const nowIso = now.toISOString()
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const todayLocalDate = formatInTimeZone(now, userTimezone, 'yyyy-MM-dd')

  const [
    { data: professionalSettings, error: settingsError },
    { data: upcomingBookings, error: upcomingError },
    { count: pendingConfirmationCountRaw, error: pendingCountError },
    { count: openRequestCountRaw, error: requestCountError },
    { count: completedLast30Count, error: completedCountError },
    { count: cancelledLast30Count, error: cancelledCountError },
    { count: favoritesCount, error: favoritesError },
    { count: activeAvailabilityCountLegacy, error: availabilityLegacyError },
    { count: activeAvailabilityRulesCount, error: availabilityRulesError },
    { count: availabilityExceptionsCount, error: exceptionsError },
    { data: calendarIntegration, error: calendarError },
    { count: acceptedBookingsCount, error: acceptedCountError },
    { data: paymentsMonthRows, error: paymentsError },
    onboardingState,
    onboardingTrackerMeta,
  ] = await Promise.all([
    supabase
      .from('professional_settings')
      .select('timezone, minimum_notice_hours, max_booking_window_days, confirmation_mode, enable_recurring')
      .eq('professional_id', professionalId)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select(
        'id, user_id, scheduled_at, duration_minutes, status, timezone_user, profiles!bookings_user_id_fkey(full_name)',
      )
      .eq('professional_id', professionalId)
      .in('status', ['pending', 'pending_confirmation', 'confirmed'])
      .gte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(8),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'pending_confirmation')
      .gte('scheduled_at', nowIso),
    supabase
      .from('request_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .in('status', ['open', 'offered']),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'completed')
      .gte('scheduled_at', thirtyDaysAgoIso),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'cancelled')
      .gte('scheduled_at', thirtyDaysAgoIso),
    supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId),
    supabase
      .from('availability')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('is_active', true),
    supabase
      .from('availability_rules')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('is_active', true),
    supabase
      .from('availability_exceptions')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .gte('date_local', todayLocalDate),
    supabase
      .from('calendar_integrations')
      .select('provider, provider_account_email, sync_enabled, last_sync_at')
      .eq('professional_id', professionalId)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .in('status', FIRST_BOOKING_RELEVANT_STATUSES),
    supabase
      .from('payments')
      .select('amount_total, created_at')
      .eq('professional_id', professionalId)
      .eq('status', 'captured')
      .gte('created_at', thirtyDaysAgoIso),
    loadProfessionalOnboardingState(supabase, professionalId, {
      resolveSignedMediaUrls: false,
    }),
    loadProfessionalTrackerMeta(supabase, professionalId),
  ])

  const logQueryError = (area: string, error: any) => {
    if (error) console.error(`[dashboard] ${area} query error:`, error.message, error.code)
  }
  logQueryError('settings', settingsError)
  logQueryError('upcoming bookings', upcomingError)
  logQueryError('pending count', pendingCountError)
  logQueryError('request count', requestCountError)
  logQueryError('completed count', completedCountError)
  logQueryError('cancelled count', cancelledCountError)
  logQueryError('favorites', favoritesError)
  logQueryError('availability legacy', availabilityLegacyError)
  logQueryError('availability rules', availabilityRulesError)
  const activeAvailabilityCount = Math.max(
    activeAvailabilityCountLegacy || 0,
    activeAvailabilityRulesCount || 0,
  )
  logQueryError('exceptions', exceptionsError)
  logQueryError('calendar', calendarError)
  logQueryError('accepted count', acceptedCountError)
  logQueryError('payments', paymentsError)

  const pendingConfirmationCount = pendingConfirmationCountRaw || 0
  const openRequestCount = openRequestCountRaw || 0
  const paymentsMonth = paymentsMonthRows || []
  const sevenDaysAgoMs = new Date(sevenDaysAgoIso).getTime()
  const earningsMonth = paymentsMonth.reduce(
    (sum: number, payment: Record<string, unknown>) => sum + Number(payment.amount_total || 0),
    0,
  )
  const earningsWeek = paymentsMonth.reduce((sum: number, payment: Record<string, unknown>) => {
    const createdAt = new Date(String(payment.created_at || '')).getTime()
    if (Number.isNaN(createdAt) || createdAt < sevenDaysAgoMs) return sum
    return sum + Number(payment.amount_total || 0)
  }, 0)

  const alerts = buildProfessionalWorkspaceAlerts({
    professional,
    settings: professionalSettings as Record<string, unknown> | null,
    pendingConfirmations: pendingConfirmationCount,
    openRequests: openRequestCount,
    hasCalendarIntegration: Boolean(calendarIntegration?.sync_enabled),
    hasActiveAvailability: (activeAvailabilityCount || 0) > 0,
    hasAcceptedBookings: (acceptedBookingsCount || 0) > 0,
  })

  const nextBooking = upcomingBookings?.[0]
  const currency = profile.currency || 'BRL'
  const onboardingEvaluation = onboardingState?.evaluation || null
  const normalizedProfessionalStatus = String(professional.status || '').toLowerCase()
  const onboardingIncomplete = Boolean(onboardingEvaluation && !onboardingEvaluation.summary.canGoLive)
  const showOnboardingCard = Boolean(
    onboardingEvaluation &&
      (onboardingIncomplete ||
        ['pending_review', 'approved', 'needs_changes', 'rejected'].includes(
          normalizedProfessionalStatus,
        )),
  )
  const shouldAutoOpenOnboarding = openOnboarding === '1'

  return (
    <PageContainer maxWidth="xl">
      <BookingRealtimeListener />
      {showOnboardingCard && onboardingEvaluation ? (
        <ProfessionalOnboardingCard
          professionalId={professionalId}
          tier={String(professional.tier || 'basic')}
          professionalStatus={String(professional.status || '')}
          initialEvaluation={onboardingEvaluation}
          initialReviewAdjustments={onboardingTrackerMeta.reviewAdjustments}
          initialTermsAcceptanceByKey={onboardingTrackerMeta.termsAcceptanceByKey}
          initialBio={String(professional.bio || '')}
          initialCoverPhotoUrl={String(professional.cover_photo_url || '')}
          autoOpen={shouldAutoOpenOnboarding}
          result={result}
        />
      ) : null}

      <div className={onboardingIncomplete ? 'pointer-events-none select-none blur-[1px] opacity-80' : ''}>
      <PageHeader
        title="Dashboard"
        subtitle="Veja o que precisa de ação agora e acompanhe agenda, ganhos e saúde da conta."
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Plano: {String(professional.tier || 'basic').toUpperCase()}
        </span>
      </PageHeader>

      {alerts.length > 0 && (
        <section className="mb-6 space-y-3" data-testid="professional-alerts">
          {alerts.map(alert => {
            const styles = alertStyles(alert.level)
            return (
              <div key={alert.id} className={`rounded-lg border px-4 py-3 ${styles.wrapper}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${styles.title}`}>{alert.title}</p>
                    <p className={`mt-1 text-xs ${styles.description}`}>{alert.description}</p>
                  </div>
                  {alert.actionHref && alert.actionLabel && (
                    <Link
                      href={alert.actionHref}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold transition ${styles.button}`}
                    >
                      {alert.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="professional-dashboard-cards">
        <AppCard className={pendingConfirmationCount > 0 || openRequestCount > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold uppercase tracking-wide">Urgente</span>
          </div>
          <p className="text-sm text-slate-700">{pendingConfirmationCount} pendência(s) de confirmação manual</p>
          <p className="mt-1 text-sm text-slate-700">{openRequestCount} solicitação(ões) de horário em aberto</p>
          <Link href="/agenda?view=pending" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#3d6b1f] hover:text-[#2d5016]">
            Resolver agora
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </AppCard>

        <AppCard>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <CalendarClock className="h-4 w-4 text-[#9FE870]" />
            <span className="text-xs font-semibold uppercase tracking-wide">Próxima sessão</span>
          </div>
          {nextBooking ? (
            <>
              <p className="text-sm font-semibold text-slate-900">
                {(nextBooking as Record<string, any>)?.profiles?.full_name || 'Cliente'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatInTimeZone(
                  new Date(String((nextBooking as Record<string, any>).scheduled_at)),
                  userTimezone,
                  "EEE, d MMM 'às' HH:mm",
                  { locale: ptBR },
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Sem sessões confirmadas no momento.</p>
          )}
          <p className="mt-2 text-xs text-slate-500">Total futuro: {upcomingBookings?.length || 0} sessão(ões)</p>
        </AppCard>

        <AppCard>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4 text-[#9FE870]" />
            <span className="text-xs font-semibold uppercase tracking-wide">Ganhos</span>
          </div>
          <p className="text-sm text-slate-500">Semana</p>
          <p className="text-xl font-semibold text-slate-900">{formatCurrency(earningsWeek, currency)}</p>
          <p className="mt-2 text-sm text-slate-500">Mês</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(earningsMonth, currency)}</p>
        </AppCard>

        <AppCard>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <ShieldAlert className="h-4 w-4 text-[#9FE870]" />
            <span className="text-xs font-semibold uppercase tracking-wide">Saúde da conta</span>
          </div>
          <p className="text-sm text-slate-600">Status: {toUiLabel(professional.status, PROFESSIONAL_STATUS_LABELS)}</p>
          <p className="text-sm text-slate-600">Confirmação: {toUiLabel(professionalSettings?.confirmation_mode, CONFIRMATION_MODE_LABELS)}</p>
          <p className="text-sm text-slate-600">Janela de agenda: {Number(professionalSettings?.max_booking_window_days || 30)} dias</p>
          <p className="text-sm text-slate-600">Exceções futuras: {availabilityExceptionsCount || 0}</p>
        </AppCard>
      </section>

      <AppCard className="mb-6" data-testid="professional-quick-actions">
        <AppCardHeader
          title="Ações rápidas"
          icon={<Layers className="h-4 w-4 text-[#9FE870]" />}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/agenda?view=pending" className={`rounded-md border p-3 text-sm font-medium transition ${pendingConfirmationCount > 0 ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'}`}>
            Confirmar pendências {pendingConfirmationCount > 0 && `(${pendingConfirmationCount})`}
          </Link>
          <Link href="/agenda?view=requests" className={`rounded-md border p-3 text-sm font-medium transition ${openRequestCount > 0 ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100' : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'}`}>
            Responder solicitações {openRequestCount > 0 && `(${openRequestCount})`}
          </Link>
          <Link href="/disponibilidade" className="rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]">
            Atualizar disponibilidade
          </Link>
          <Link href="/configuracoes-agendamento" className="rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]">
            Ajustar regras de agendamento
          </Link>
          <Link href="/editar-perfil-profissional" className="rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]">
            Editar serviço e perfil
          </Link>
          <Link
            href={buildProfessionalProfilePath({
              id: professionalId,
              fullName: profile.full_name,
              publicCode: professional.public_code,
            })}
            className="rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
          >
            Visualizar perfil público
          </Link>
          <Link href="/financeiro" className="rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]">
            Revisar financeiro
          </Link>
          <Link href="/configuracoes" className="rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]">
            Ver status da conta
          </Link>
        </div>
      </AppCard>

      <AppCard data-testid="professional-upcoming-list">
        <AppCardHeader
          title="Próximas sessões"
          icon={<Clock className="h-4 w-4 text-[#9FE870]" />}
        />
        {!upcomingBookings || upcomingBookings.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma sessão agendada para os próximos dias.</p>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking: Record<string, any>) => (
              <div key={booking.id} className="flex flex-col gap-2 rounded-md border border-slate-200/80 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{booking.profiles?.full_name || 'Cliente'}</p>
                  <p className="text-xs text-slate-500">
                    {formatInTimeZone(new Date(String(booking.scheduled_at)), userTimezone, "EEE, d MMM 'às' HH:mm", {
                      locale: ptBR,
                    })}{' '}
                    · {booking.duration_minutes || 60} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {toUiLabel(booking.status, BOOKING_STATUS_LABELS)}
                  </span>
                  <Link
                    href={`/agenda?booking=${booking.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8ed85f]"
                  >
                    Abrir
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-right">
          <Link href="/agenda" className="text-xs font-semibold text-[#3d6b1f] hover:text-[#2d5016]">
            Ver calendário completo
          </Link>
        </div>
      </AppCard>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumo de trabalho (30 dias)</p>
          <p className="mt-2 text-sm text-slate-700">Sessões concluídas: {completedLast30Count || 0}</p>
          <p className="text-sm text-slate-700">Cancelamentos: {cancelledLast30Count || 0}</p>
          <p className="text-sm text-slate-700">Favoritos: {favoritesCount || 0}</p>
        </AppCard>
        <AppCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Integração de calendário</p>
          <p className="mt-2 text-sm text-slate-700">
            {calendarIntegration?.sync_enabled ? `Conectado (${calendarIntegration.provider || 'google'})` : 'Não conectado'}
          </p>
          <p className="text-sm text-slate-700">
            Último sync:{' '}
            {calendarIntegration?.last_sync_at
              ? formatInTimeZone(new Date(String(calendarIntegration.last_sync_at)), userTimezone, 'd MMM HH:mm', {
                  locale: ptBR,
                })
              : 'nunca'}
          </p>
          <p className="mt-1 text-sm text-slate-700">Slots ativos: {activeAvailabilityCount || 0}</p>
          <Link href="/agenda?view=settings" className="mt-2 inline-flex text-xs font-semibold text-[#3d6b1f] hover:text-[#2d5016]">
            Abrir configurações de calendário
          </Link>
        </AppCard>
      </section>
      </div>
    </PageContainer>
  )
}
