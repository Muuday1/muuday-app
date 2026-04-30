export const metadata = { title: 'Conversa | Muuday' }

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMessagesAction, markConversationAsReadAction } from '@/lib/actions/chat'
import { MessageThread } from '@/components/chat/MessageThread'
import type { Message } from '@/components/chat/MessageThread'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id, role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!participant) {
    redirect('/mensagens')
  }

  // Get conversation and other participant info in parallel
  const [
    { data: conversation },
    { data: otherParticipant },
  ] = await Promise.all([
    supabase.from('conversations').select('id, booking_id').eq('id', conversationId).single(),
    supabase
      .from('conversation_participants')
      .select('user_id, role')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .maybeSingle(),
  ])

  // Load profile, messages, and mark as read in parallel
  const [{ data: otherProfile }, messagesResult, _markReadResult] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', otherParticipant?.user_id || '').maybeSingle(),
    getMessagesAction(conversationId, { limit: 50 }),
    markConversationAsReadAction(conversationId),
  ])

  const otherName = otherProfile?.full_name || 'Usuário'
  const messages = messagesResult.success ? messagesResult.data.messages : []

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-3xl flex-col px-4 py-4 md:h-[calc(100vh-0px)] md:px-8 md:py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/mensagens"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50/70 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold text-slate-900">{otherName}</h1>
          <p className="text-xs text-slate-500">
            {otherParticipant?.role === 'professional' ? 'Profissional' : 'Cliente'}
          </p>
        </div>
      </div>

      <MessageThread
        conversationId={conversationId}
        initialMessages={messages as Message[]}
        currentUserId={user.id}
        otherName={otherName}
        bookingId={conversation?.booking_id || ''}
      />
    </div>
  )
}
