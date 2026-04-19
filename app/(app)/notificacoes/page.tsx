export const metadata = { title: 'Notificações | Muuday' }

import Link from 'next/link'
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { getNotifications } from '@/lib/actions/notifications'
import { NotificationMarkReadButton } from '@/components/notifications/NotificationMarkReadButton'
import { MarkAllReadButton } from '@/components/notifications/MarkAllReadButton'

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ unreadOnly?: string }>
}) {
  const { unreadOnly } = await searchParams
  const result = await getNotifications({
    limit: 50,
    unreadOnly: unreadOnly === '1',
  })

  const notifications = result.success ? result.data.notifications : []

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">Notificações</h1>
          <p className="mt-1 text-sm text-neutral-500">Acompanhe atualizações da sua conta e sessões.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notificacoes"
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              unreadOnly !== '1'
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300'
            }`}
          >
            Todas
          </Link>
          <Link
            href="/notificacoes?unreadOnly=1"
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              unreadOnly === '1'
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300'
            }`}
          >
            Não lidas
          </Link>
          <MarkAllReadButton />
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
            <Bell className="h-7 w-7 text-neutral-300" />
          </div>
          <p className="font-semibold text-neutral-900">Nenhuma notificação</p>
          <p className="mt-1 text-sm text-neutral-500">
            {unreadOnly === '1' ? 'Você leu todas as notificações.' : 'Novas notificações aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                n.read_at
                  ? 'border-neutral-100 bg-white/60 opacity-70'
                  : 'border-neutral-100 bg-white shadow-sm'
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                  n.type === 'booking_confirmed'
                    ? 'bg-green-50 text-green-600'
                    : n.type === 'booking_cancelled'
                      ? 'bg-red-50 text-red-600'
                      : n.type === 'reminder'
                        ? 'bg-amber-50 text-amber-600'
                        : n.type === 'message'
                          ? 'bg-brand-50 text-brand-600'
                          : 'bg-neutral-50 text-neutral-500'
                }`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="h-3 w-3" />
                    {formatInTimeZone(new Date(n.created_at), 'America/Sao_Paulo', 'd MMM yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </span>
                  {n.action_url && (
                    <Link
                      href={n.action_url}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
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
    </div>
  )
}
