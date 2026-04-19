export const metadata = { title: 'Mensagens | Muuday' }

import Link from 'next/link'
import { MessageCircle, Clock } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { getConversations } from '@/lib/actions/chat'
import { createClient } from '@/lib/supabase/server'

export default async function MensagensPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const result = await getConversations()
  const conversations = result.success ? result.data.conversations : []

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">Mensagens</h1>
        <p className="mt-1 text-sm text-neutral-500">Conversas com profissionais e clientes.</p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
            <MessageCircle className="h-7 w-7 text-neutral-300" />
          </div>
          <p className="font-semibold text-neutral-900">Nenhuma conversa ainda</p>
          <p className="mt-1 text-sm text-neutral-500">
            As conversas aparecem quando um agendamento é confirmado.
          </p>
        </div>
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
                className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4 transition hover:shadow-sm"
              >
                {/* Avatar */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-display font-bold text-lg">
                  {conv.otherParticipantName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {conv.otherParticipantName}
                    </p>
                    {conv.lastMessageSentAt && (
                      <span className="flex flex-shrink-0 items-center gap-1 text-xs text-neutral-400">
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
                        ? 'font-medium text-neutral-900'
                        : 'text-neutral-500'
                    }`}
                  >
                    {previewText}
                  </p>
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <div className="flex h-6 min-w-[24px] flex-shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
