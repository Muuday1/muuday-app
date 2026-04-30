export const metadata = { title: 'Notificações | Muuday' }

import Link from 'next/link'
import { Bell, Clock, ArrowRight, Circle } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { isToday, isYesterday, startOfWeek, isAfter } from 'date-fns'
import { getNotificationsAction } from '@/lib/actions/notifications'
import { NotificationMarkReadButton } from '@/components/notifications/NotificationMarkReadButton'
import { MarkAllReadButton } from '@/components/notifications/MarkAllReadButton'
import { NotificationRealtimeListener } from '@/components/notifications/NotificationRealtimeListener'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

interface NotificationItem {
  id: string
  booking_id: string | null
  type: string
  title: string | null
  body: string | null
  payload: unknown
  read_at: string | null
  created_at: string
  action_url: string | null
}

function ctaLabel(type: string): string {
  switch (type) {
    case 'session_reminder':
    case 'session_started':
      return 'Entrar na sessão'
    case 'review_reminder':
    case 'review_published':
      return 'Ver avaliação'
    case 'payout_processed':
    case 'payout_available':
      return 'Ver financeiro'
    case 'message':
      return 'Abrir mensagem'
    case 'subscription_payment_failed':
    case 'subscription_trial_ending':
      return 'Gerenciar assinatura'
    case 'booking_confirmed':
    case 'booking_pending':
      return 'Ver agenda'
    default:
      return 'Abrir'
  }
}

function groupNotificationsByDate(notifications: NotificationItem[]) {
  const groups: { label: string; items: NotificationItem[] }[] = []
  const today: NotificationItem[] = []
  const yesterday: NotificationItem[] = []
  const thisWeek: NotificationItem[] = []
  const older: NotificationItem[] = []

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  for (const n of notifications) {
    const d = new Date(n.created_at)
    if (isToday(d)) {
      today.push(n)
    } else if (isYesterday(d)) {
      yesterday.push(n)
    } else if (isAfter(d, weekStart)) {
      thisWeek.push(n)
    } else {
      older.push(n)
    }
  }

  if (today.length) groups.push({ label: 'Hoje', items: today })
  if (yesterday.length) groups.push({ label: 'Ontem', items: yesterday })
  if (thisWeek.length) groups.push({ label: 'Esta semana', items: thisWeek })
  if (older.length) groups.push({ label: 'Mais antigas', items: older })

  return groups
}

type CategoryTab = 'all' | 'unread' | 'bookings' | 'system'

const categoryParamMap: Record<Exclude<CategoryTab, 'all' | 'unread'>, string> = {
  bookings: 'bookings',
  system: 'system',
}

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab: CategoryTab =
    tab === 'unread' || tab === 'bookings' || tab === 'system' ? tab : 'all'

  const result = await getNotificationsAction({
    limit: 50,
    unreadOnly: activeTab === 'unread',
    category: activeTab === 'bookings' || activeTab === 'system' ? activeTab : undefined,
  })

  const notifications = result.success ? (result.data.notifications as NotificationItem[]) : []
  const groups = groupNotificationsByDate(notifications)

  return (
    <>
      <NotificationRealtimeListener />
      <PageContainer maxWidth="md">
        <PageHeader title="Notificações" subtitle="Acompanhe atualizações da sua conta e sessões.">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: 'all', label: 'Todas' },
              { key: 'unread', label: 'Não lidas' },
              { key: 'bookings', label: 'Agendamentos' },
              { key: 'system', label: 'Sistema' },
            ] as { key: CategoryTab; label: string }[]).map(t => (
              <Link
                key={t.key}
                href={t.key === 'all' ? '/notificacoes' : `/notificacoes?tab=${t.key}`}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  activeTab === t.key
                    ? 'border-[#9FE870] bg-[#9FE870] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40'
                }`}
              >
                {t.label}
              </Link>
            ))}
            <MarkAllReadButton />
          </div>
        </PageHeader>

        {notifications.length === 0 ? (
          <AppEmptyState
            icon={Bell}
            title="Nenhuma notificação"
            description={
              activeTab === 'unread'
                ? 'Você leu todas as notificações.'
                : activeTab === 'bookings'
                  ? 'Nenhuma notificação de agendamento.'
                  : activeTab === 'system'
                    ? 'Nenhuma notificação do sistema.'
                    : 'Novas notificações aparecerão aqui.'
            }
          />
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.items.map((n: NotificationItem) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 rounded-lg border p-4 transition ${
                        n.read_at
                          ? 'border-slate-200/80 bg-white/60 opacity-70'
                          : 'border-slate-200/80 bg-white'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${
                          n.type === 'booking_confirmed'
                            ? 'bg-green-50 text-green-600'
                            : n.type === 'booking_cancelled'
                              ? 'bg-red-50 text-red-600'
                              : n.type === 'reminder'
                                ? 'bg-amber-50 text-amber-600'
                                : n.type === 'message'
                                  ? 'bg-[#9FE870]/8 text-[#3d6b1f]'
                                  : 'bg-slate-50/70 text-slate-500'
                        }`}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          {!n.read_at && (
                            <Circle className="mt-1.5 h-2 w-2 flex-shrink-0 fill-blue-500 text-blue-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {formatInTimeZone(
                              new Date(n.created_at),
                              'America/Sao_Paulo',
                              'd MMM yyyy HH:mm',
                              { locale: ptBR },
                            )}
                          </span>
                          {n.action_url && (
                            <Link
                              href={n.action_url}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d6b1f] hover:text-[#2d5016]"
                            >
                              {ctaLabel(n.type)}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                      {!n.read_at && <NotificationMarkReadButton notificationId={n.id} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )
}
