export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mensagens | Muuday' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ profissional?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { profissional } = await searchParams

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
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('booking_id', bookings[0].id)
        .maybeSingle()

      if (conversation) {
        redirect(`/mensagens/${conversation.id}`)
      }
    }
  }

  let conversationsList: any[] = []
  let loadError: string | null = null

  try {
    const { data: myParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)
      .limit(100)

    const conversationIds = myParticipants?.map(p => p.conversation_id) || []

    if (conversationIds.length > 0) {
      const [{ data: conversations }, { data: otherParticipants }] = await Promise.all([
        supabase.from('conversations').select('id, booking_id').in('id', conversationIds).limit(100),
        supabase.from('conversation_participants').select('conversation_id, user_id, role').in('conversation_id', conversationIds).neq('user_id', user.id).limit(100),
      ])

      const otherUserIds = (otherParticipants || []).map((p: any) => p.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', otherUserIds)
        .limit(100)

      conversationsList = ((conversations as any[]) || [])
        .map(conv => {
          const otherParticipant = (otherParticipants || []).find(
            (p: any) => p.conversation_id === conv.id,
          )
          const otherProfile = (profiles || []).find(
            (p: any) => p.id === otherParticipant?.user_id,
          )
          return {
            id: conv.id,
            bookingId: conv.booking_id,
            otherParticipantName: otherProfile?.full_name || 'Usuário',
            otherParticipantId: otherParticipant?.user_id || '',
            otherParticipantRole: otherParticipant?.role || '',
            lastMessageContent: null,
            lastMessageSentAt: null,
            lastMessageSenderId: null,
            unreadCount: 0,
          }
        })
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Erro desconhecido'
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Mensagens</h1>
      {loadError ? (
        <p className="mt-4 text-red-600">Erro: {loadError}</p>
      ) : (
        <p className="mt-4 text-slate-600">
          Conversas: {conversationsList.length}
        </p>
      )}
    </div>
  )
}
