'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markConversationAsRead,
  getConversations,
} from '@/lib/chat/chat-service'

const messageContentSchema = z.string().trim().min(1, 'Mensagem não pode estar vazia.').max(2000, 'Mensagem muito longa.')
const conversationIdSchema = z.string().uuid('Identificador de conversa inválido.')
const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')

export type ChatResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function getOrCreateConversationAction(bookingId: string): Promise<ChatResult<{ conversationId: string }>> {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  const { supabase, userId } = await getAuthenticatedUser()
  return getOrCreateConversation(supabase, userId, parsed.data)
}

export async function sendMessageAction(
  conversationId: string,
  content: string,
): Promise<ChatResult<{ messageId: string; sentAt: string }>> {
  const idParsed = conversationIdSchema.safeParse(conversationId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  const contentParsed = messageContentSchema.safeParse(content)
  if (!contentParsed.success) {
    return { success: false, error: contentParsed.error.issues[0]?.message || 'Conteúdo inválido.' }
  }
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('messageSend', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas mensagens. Tente novamente em breve.' }
  return sendMessage(supabase, userId, idParsed.data, contentParsed.data)
}

export async function getMessagesAction(
  conversationId: string,
  {
    limit = 50,
    cursor,
  }: {
    limit?: number
    cursor?: string
  } = {},
): Promise<ChatResult<{ messages: unknown[]; nextCursor: string | null }>> {
  const idParsed = conversationIdSchema.safeParse(conversationId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('messageRead', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }
  return getMessages(supabase, userId, idParsed.data, { limit, cursor })
}

export async function markConversationAsReadAction(conversationId: string): Promise<ChatResult<{ updated: boolean }>> {
  const idParsed = conversationIdSchema.safeParse(conversationId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('messageRead', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }
  return markConversationAsRead(supabase, userId, idParsed.data)
}

export async function getConversationsAction(): Promise<
  ChatResult<{
    conversations: {
      id: string
      bookingId: string
      otherParticipantName: string
      otherParticipantId: string
      otherParticipantRole: string
      lastMessageContent: string | null
      lastMessageSentAt: string | null
      lastMessageSenderId: string | null
      unreadCount: number
    }[]
  }>
> {
  const { supabase, userId } = await getAuthenticatedUser()
  return getConversations(supabase, userId)
}
