export const metadata = { title: 'Notificações | Muuday' }

import Link from 'next/link'
import { Bell, Clock, ArrowRight } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { getNotificationsAction } from '@/lib/actions/notifications'
import { NotificationMarkReadButton } from '@/components/notifications/NotificationMarkReadButton'
import { MarkAllReadButton } from '@/components/notifications/MarkAllReadButton'
import { NotificationRealtimeListener } from '@/components/notifications/NotificationRealtimeListener'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ unreadOnly?: string }>
}) {
  const { unreadOnly } = await searchParams
  const result = await getNotificationsAction({
    limit: 50,
    unreadOnly: unreadOnly === '1',
  })

  const notifications = result.success ? result.data.notifications : []

  return (
    <>
      <NotificationRealtimeListener />
      <PageContainer maxWidth="md">
      <PageHeader title="Notificações" subtitle="Acompanhe atualizações da sua conta e sessões.">
        <div className="flex items-center gap-2">
          <Link
            href="/notificacoes"
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
              unreadOnly !== '1'
                ? 'border-[#9FE870] bg-[#9FE870] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40'
            }`}
          >
            Todas
          </Link>
          <Link
            href="/notificacoes?unreadOnly=1"
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
              unreadOnly === '1'
                ? 'border-[#9FE870] bg-[#9FE870] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40'
            }`}
          >
            Não lidas
          </Link>
          <MarkAllReadButton />
        </div>
      </PageHeader>

      {notifications.length === 0 ? (
        <AppEmptyState
          icon={Bell}
          title="Nenhuma notificação"
          description={
            unreadOnly === '1'
              ? 'Você leu todas as notificações.'
              : 'Novas notificações aparecerão aqui.'
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition ${
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
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatInTimeZone(new Date(n.created_at), 'America/Sao_Paulo', 'd MMM yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </span>
                  {n.action_url && (
                    <Link
                      href={n.action_url}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d6b1f] hover:text-[#2d5016]"
                    >
                      Abrir
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
              {!n.read_at && <NotificationMarkReadButton notificationId={n.id} />}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
    </>
  )
}
