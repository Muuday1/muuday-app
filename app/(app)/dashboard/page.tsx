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
  LineChart,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { buildProfessionalWorkspaceAlerts } from '@/lib/professional/workspace-health'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

const FIRST_BOOKING_RELEVANT_STATUSES = [
  'pending',
  'pending_confirmation',
  'confirmed',
  'completed',
  'no_show',
  'rescheduled',
]

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

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    'id, status, tier, bio, category, session_price_brl, session_duration_minutes, rating, total_reviews, total_bookings, first_booking_enabled, first_booking_gate_note',
  )

  if (!professional) redirect('/completar-perfil')

  const professionalId = professional.id
  const userTimezone = profile.timezone || 'America/Sao_Paulo'
  const now = new Date()
  const nowIso = now.toISOString()
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: professionalSettings } = await supabase
    .from('professional_settings')
    .select(
      'timezone, minimum_notice_hours, max_booking_window_days, confirmation_mode, enable_recurring',
    )
    .eq('professional_id', professionalId)
    .maybeSingle()

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('id, user_id, scheduled_at, duration_minutes, status, timezone_user, profiles!bookings_user_id_fkey(full_name)')
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .gte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(8)

  const { data: pendingConfirmations } = await supabase
    .from('bookings')
    .select('id', { count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('status', 'pending_confirmation')
    .gte('scheduled_at', nowIso)

  const pendingConfirmationCount = pendingConfirmations?.length || 0

  const { data: openRequests } = await supabase
    .from('request_bookings')
    .select('id', { count: 'exact' })
    .eq('professional_id', professionalId)
    .in('status', ['open', 'offered'])

  const openRequestCount = openRequests?.length || 0

  const { count: completedLast30Count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .gte('scheduled_at', thirtyDaysAgoIso)

  const { count: cancelledLast30Count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('status', 'cancelled')
    .gte('scheduled_at', thirtyDaysAgoIso)

  const { count: favoritesCount } = await supabase
    .from('favorites')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)

  const { count: activeAvailabilityCount } = await supabase
    .from('availability')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  const { count: availabilityExceptionsCount } = await supabase
    .from('availability_exceptions')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .gte('date_local', formatInTimeZone(now, userTimezone, 'yyyy-MM-dd'))

  const { data: calendarIntegration } = await supabase
    .from('calendar_integrations')
    .select('provider, provider_account_email, sync_enabled, last_sync_at')
    .eq('professional_id', professionalId)
    .maybeSingle()

  const { count: acceptedBookingsCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .in('status', FIRST_BOOKING_RELEVANT_STATUSES)

  const { data: paymentsWeek } = await supabase
    .from('payments')
    .select('amount_total')
    .eq('professional_id', professionalId)
    .eq('status', 'captured')
    .gte('created_at', sevenDaysAgoIso)

  const { data: paymentsMonth } = await supabase
    .from('payments')
    .select('amount_total')
    .eq('professional_id', professionalId)
    .eq('status', 'captured')
    .gte('created_at', thirtyDaysAgoIso)

  const earningsWeek = (paymentsWeek || []).reduce(
    (sum: number, payment: Record<string, unknown>) => sum + Number(payment.amount_total || 0),
    0,
  )
  const earningsMonth = (paymentsMonth || []).reduce(
    (sum: number, payment: Record<string, unknown>) => sum + Number(payment.amount_total || 0),
    0,
  )

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

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Painel operacional para decidir rapido o que fazer agora.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
          Plano: {String(professional.tier || 'basic').toUpperCase()}
        </span>
      </div>

      {alerts.length > 0 && (
        <section className="mb-6 space-y-3" data-testid="professional-alerts">
          {alerts.map(alert => {
            const styles = alertStyles(alert.level)
            return (
              <div
                key={alert.id}
                className={`rounded-2xl border px-4 py-3 ${styles.wrapper}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${styles.title}`}>
                      {alert.title}
                    </p>
                    <p className={`mt-1 text-xs ${styles.description}`}>
                      {alert.description}
                    </p>
                  </div>
                  {alert.actionHref && alert.actionLabel && (
                    <Link
                      href={alert.actionHref}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${styles.button}`}
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

      <section
        className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        data-testid="professional-dashboard-cards"
      >
        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <CalendarClock className="h-4 w-4 text-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-wide">Hoje / urgente</span>
          </div>
          {nextBooking ? (
            <>
              <p className="text-sm font-semibold text-neutral-900">
                Proxima: {(nextBooking as Record<string, any>)?.profiles?.full_name || 'Cliente'}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {formatInTimeZone(
                  new Date(String((nextBooking as Record<string, any>).scheduled_at)),
                  userTimezone,
                  "EEE, d MMM 'as' HH:mm",
                  { locale: ptBR },
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Sem sessoes confirmadas no momento.</p>
          )}
          <p className="mt-3 text-xs text-amber-700">
            {pendingConfirmationCount} pendencia(s) de confirmacao manual
          </p>
          <p className="mt-1 text-xs text-blue-700">
            {openRequestCount} solicitacao(oes) de horario em aberto
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <Wallet className="h-4 w-4 text-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-wide">Ganhos</span>
          </div>
          <p className="text-sm text-neutral-500">Semana</p>
          <p className="text-xl font-semibold text-neutral-900">
            {formatCurrency(earningsWeek, currency)}
          </p>
          <p className="mt-2 text-sm text-neutral-500">Mes</p>
          <p className="text-lg font-semibold text-neutral-900">
            {formatCurrency(earningsMonth, currency)}
          </p>
          <Link
            href="/financeiro"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Abrir financeiro
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <LineChart className="h-4 w-4 text-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-wide">Performance</span>
          </div>
          <p className="text-sm text-neutral-600">Nota: {Number(professional.rating || 0).toFixed(1)}</p>
          <p className="text-sm text-neutral-600">Reviews: {professional.total_reviews || 0}</p>
          <p className="text-sm text-neutral-600">Bookings: {professional.total_bookings || 0}</p>
          <p className="text-sm text-neutral-600">Favoritos: {favoritesCount || 0}</p>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <ShieldAlert className="h-4 w-4 text-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-wide">Saude da conta</span>
          </div>
          <p className="text-sm text-neutral-600">Status: {String(professional.status || 'draft')}</p>
          <p className="text-sm text-neutral-600">
            Confirmacao: {String(professionalSettings?.confirmation_mode || 'auto_accept')}
          </p>
          <p className="text-sm text-neutral-600">
            Janela agenda: {Number(professionalSettings?.max_booking_window_days || 30)} dias
          </p>
          <p className="text-sm text-neutral-600">
            Excecoes futuras: {availabilityExceptionsCount || 0}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5" data-testid="professional-quick-actions">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-500" />
          <h2 className="font-display text-lg font-bold text-neutral-900">Acoes rapidas</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/agenda?view=pending" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Confirmar pendencias
          </Link>
          <Link href="/agenda?view=requests" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Responder solicitacoes
          </Link>
          <Link href="/disponibilidade" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Atualizar disponibilidade
          </Link>
          <Link href="/configuracoes-agendamento" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Ajustar regras de booking
          </Link>
          <Link href="/editar-perfil-profissional" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Editar servico e perfil
          </Link>
          <Link href={`/profissional/${professionalId}`} className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Preview do perfil publico
          </Link>
          <Link href="/financeiro" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Revisar financeiro
          </Link>
          <Link href="/configuracoes" className="rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:text-brand-700">
            Ver status da conta
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-100 bg-white p-5" data-testid="professional-upcoming-list">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-500" />
          <h2 className="font-display text-lg font-bold text-neutral-900">Proximas sessoes</h2>
        </div>
        {!upcomingBookings || upcomingBookings.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma sessao agendada para os proximos dias.</p>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking: Record<string, any>) => (
              <div key={booking.id} className="flex flex-col gap-2 rounded-xl border border-neutral-100 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {booking.profiles?.full_name || 'Cliente'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatInTimeZone(new Date(String(booking.scheduled_at)), userTimezone, "EEE, d MMM 'as' HH:mm", {
                      locale: ptBR,
                    })}{' '}
                    · {booking.duration_minutes || 60} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    {booking.status}
                  </span>
                  <Link
                    href={`/agenda?booking=${booking.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
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
          <Link href="/agenda" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
            Ver calendario completo
          </Link>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Resumo de trabalho (30 dias)</p>
          <p className="mt-2 text-sm text-neutral-700">Sessoes concluidas: {completedLast30Count || 0}</p>
          <p className="text-sm text-neutral-700">Cancelamentos: {cancelledLast30Count || 0}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Integracao de calendario</p>
          <p className="mt-2 text-sm text-neutral-700">
            {calendarIntegration?.sync_enabled
              ? `Conectado (${calendarIntegration.provider || 'google'})`
              : 'Nao conectado'}
          </p>
          <p className="text-sm text-neutral-700">
            Ultimo sync:{' '}
            {calendarIntegration?.last_sync_at
              ? formatInTimeZone(
                  new Date(String(calendarIntegration.last_sync_at)),
                  userTimezone,
                  "d MMM HH:mm",
                  { locale: ptBR },
                )
              : 'nunca'}
          </p>
          <Link href="/agenda?view=settings" className="mt-2 inline-flex text-xs font-semibold text-brand-700 hover:text-brand-800">
            Abrir configuracoes de calendario
          </Link>
        </div>
      </section>
    </div>
  )
}
