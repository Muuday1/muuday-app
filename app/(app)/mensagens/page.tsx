export const metadata = { title: 'Mensagens | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageCircle, Clock, ArrowRight } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'
import { AppCard } from '@/components/ui/AppCard'

type SearchParams = {
  profissional?: string
}

type ConversationRow = {
  id: string
  booking_id: string
}

type ParticipantRow = {
  conversation_id: string
  user_id: string
  role: string
  last_read_at: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
}

type MessageRow = {
  content: string
  sent_at: string
  sender_id: string
}

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  let userId: string | null = null
  let conversationsList: Array<{
    id: string
    bookingId: string
    otherParticipantName: string
    otherParticipantId: string
    otherParticipantRole: string
    lastMessageContent: string | null
    lastMessageSentAt: string | null
    lastMessageSenderId: string | null
    unreadCount: number
  }> = []
  let loadError: string | null = null
  let profissionalParam: string | undefined

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    userId = user.id
    const { profissional } = await searchParams
    profissionalParam = profissional

    // Handle "Mandar mensagem" from professional profiles
    if (profissional) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('professional_id', profissional)
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('scheduled_at', { ascending: false })
        .limit(1)

      if (bookings && bookings.length > 0) {
        const bookingId = bookings[0].id
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

    // Load conversations directly (avoid Server Action to prevent serialization issues)
    const { data: myParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)
      .limit(100)

    const conversationIds = myParticipants?.map(p => p.conversation_id) || []

    if (conversationIds.length > 0) {
      const [{ data: conversations }, { data: otherParticipants }] = await Promise.all([
        supabase
          .from('conversations')
          .select('id, booking_id')
          .in('id', conversationIds)
          .limit(100),
        supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, role')
          .in('conversation_id', conversationIds)
          .neq('user_id', user.id)
          .limit(100),
      ])

      const otherUserIds = (otherParticipants || []).map((p: ParticipantRow) => p.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', otherUserIds)
        .limit(100)

      // Load last message and unread count for each conversation
      const lastMessages = new Map<string, MessageRow>()
      const unreadCounts = new Map<string, number>()

      await Promise.all(
        conversationIds.map(async (convId: string) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, sent_at, sender_id')
            .eq('conversation_id', convId)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (lastMsg) {
            lastMessages.set(convId, lastMsg as MessageRow)
          }

          const myParticipant = (myParticipants || []).find(
            (p: { conversation_id: string }) => p.conversation_id === convId,
          )

          let unreadQuery = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', convId)

          if (myParticipant?.last_read_at) {
            unreadQuery = unreadQuery.gt('sent_at', myParticipant.last_read_at)
          }

          const { count } = await unreadQuery
          unreadCounts.set(convId, count || 0)
        }),
      )

      conversationsList = ((conversations as ConversationRow[]) || [])
        .map(conv => {
          const otherParticipant = (otherParticipants || []).find(
            (p: ParticipantRow) => p.conversation_id === conv.id,
          )
          const otherProfile = (profiles || []).find(
            (p: ProfileRow) => p.id === otherParticipant?.user_id,
          )
          const lastMsg = lastMessages.get(conv.id) || null

          return {
            id: conv.id,
            bookingId: conv.booking_id,
            otherParticipantName: otherProfile?.full_name || 'Usuário',
            otherParticipantId: otherParticipant?.user_id || '',
            otherParticipantRole: otherParticipant?.role || '',
            lastMessageContent: lastMsg?.content || null,
            lastMessageSentAt: lastMsg?.sent_at || null,
            lastMessageSenderId: lastMsg?.sender_id || null,
            unreadCount: unreadCounts.get(conv.id) || 0,
          }
        })
        .sort((a, b) => {
          const aTime = a.lastMessageSentAt
            ? new Date(a.lastMessageSentAt).getTime()
            : 0
          const bTime = b.lastMessageSentAt
            ? new Date(b.lastMessageSentAt).getTime()
            : 0
          return bTime - aTime
        })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    loadError = message
    console.error('[mensagens] Error loading conversations:', message)
  }

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Mensagens"
        subtitle="Conversas com profissionais e clientes."
      />

      {loadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p className="font-medium">Erro ao carregar conversas</p>
          <p className="mt-1 text-xs">{loadError}</p>
        </div>
      ) : profissionalParam && conversationsList.length === 0 ? (
        <AppEmptyState
          icon={MessageCircle}
          title="Nenhuma conversa disponível"
          description="Você só pode conversar com profissionais após confirmar um agendamento."
          action={
            <Link
              href={`/profissional/${profissionalParam}`}
              className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ed85f]"
            >
              Ver perfil do profissional
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : conversationsList.length === 0 ? (
        <AppEmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="As conversas aparecem quando um agendamento é confirmado."
        />
      ) : (
        <div className="space-y-2">
          {conversationsList.map(conv => {
            const isLastMessageFromMe = conv.lastMessageSenderId === userId
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
