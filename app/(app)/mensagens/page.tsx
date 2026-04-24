export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mensagens | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageCircle, Clock, ArrowRight } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { getConversationsAction } from '@/lib/actions/chat'
import { createClient } from '@/lib/supabase/server'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'
import { AppCard } from '@/components/ui/AppCard'

type SearchParams = {
  profissional?: string
}

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { profissional } = await searchParams

  // Handle "Mandar mensagem" from professional profiles
  if (profissional) {
    // Find confirmed bookings between current user and this professional
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('professional_id', profissional)
      .eq('user_id', user?.id)
      .in('status', ['confirmed', 'completed'])
      .order('scheduled_at', { ascending: false })
      .limit(1)

    if (bookings && bookings.length > 0) {
      const bookingId = bookings[0].id
      // Find the conversation for this booking
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (conversation) {
        redirect(`/mensagens/${conversation.id}`)
      }
    }
  }

  const result = await getConversationsAction()
  const conversations = result.success ? result.data.conversations : []

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Mensagens"
        subtitle="Conversas com profissionais e clientes."
      />

      {profissional && conversations.length === 0 ? (
        <AppEmptyState
          icon={MessageCircle}
          title="Nenhuma conversa disponível"
          description="Você só pode conversar com profissionais após confirmar um agendamento."
          action={
            <Link
              href={`/profissional/${profissional}`}
              className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ed85f]"
            >
              Ver perfil do profissional
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : conversations.length === 0 ? (
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
              <AppCard key={conv.id} hover padding="sm">
                <Link
                  href={`/mensagens/${conv.id}`}
                  className="flex items-center gap-4"
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
              </AppCard>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
