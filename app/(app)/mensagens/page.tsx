export const metadata = { title: 'Mensagens | Muuday' }

import Link from 'next/link'
import { MessageCircle, Clock } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { getConversations } from '@/lib/actions/chat'
import { createClient } from '@/lib/supabase/server'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

export default async function MensagensPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const result = await getConversations()
  const conversations = result.success ? result.data.conversations : []

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Mensagens"
        subtitle="Conversas com profissionais e clientes."
      />

      {conversations.length === 0 ? (
        <AppEmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="As conversas aparecem quando um agendamento é confirmado."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const isLastMessageFromMe = conv.lastMessageSenderId === user?.id
            const previewText = conv.lastMessageContent
              ? isLastMessageFromMe
                ? `Você: ${conv.lastMessageContent}`
                : conv.lastMessageContent
              : 'Nenhuma mensagem ainda'

            return (
              <Link
                key={conv.id}
                href={`/mensagens/${conv.id}`}
                className="flex items-center gap-4 rounded-lg border border-slate-200/80 bg-white p-4 transition hover:border-slate-300"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#9FE870]/8 text-[#3d6b1f] font-display font-bold text-lg">
                  {conv.otherParticipantName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {conv.otherParticipantName}
                    </p>
                    {conv.lastMessageSentAt && (
                      <span className="flex flex-shrink-0 items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatInTimeZone(
                          new Date(conv.lastMessageSentAt),
                          'America/Sao_Paulo',
                          'd MMM',
                          { locale: ptBR },
                        )}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      conv.unreadCount > 0
                        ? 'font-medium text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {previewText}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <div className="flex h-6 min-w-[24px] flex-shrink-0 items-center justify-center rounded-full bg-[#9FE870] px-1.5 text-xs font-bold text-white">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
