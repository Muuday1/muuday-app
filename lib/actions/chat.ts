'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'

const messageContentSchema = z.string().trim().min(1, 'Mensagem não pode estar vazia.').max(2000, 'Mensagem muito longa.')
const conversationIdSchema = z.string().uuid('Identificador de conversa inválido.')
const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')

export type ChatResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

/**
 * Get or create a conversation for a booking.
 * Returns the conversation id.
 */
export async function getOrCreateConversation(bookingId: string): Promise<ChatResult<{ conversationId: string }>> {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { supabase, userId } = await getAuthenticatedUser()

  // Verify user is a participant in the booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, professional_id')
    .eq('id', parsed.data)
    .maybeSingle()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  // Check if user is client or professional of this booking
  const isClient = booking.user_id === userId
  let isProfessional = false
  if (!isClient && booking.professional_id) {
    const { data: prof } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', booking.professional_id)
      .eq('user_id', userId)
      .maybeSingle()
    isProfessional = !!prof
  }

  if (!isClient && !isProfessional) {
    return { success: false, error: 'Você não tem acesso a esta conversa.' }
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('booking_id', parsed.data)
    .maybeSingle()

  if (!conversation) {
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ booking_id: parsed.data })
      .select('id')
      .single()

    if (error || !created) {
      return { success: false, error: 'Erro ao criar conversa.' }
    }

    conversation = created
  }

  return { success: true, data: { conversationId: conversation.id } }
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
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

  // Verify participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', idParsed.data)
    .eq('user_id', userId)
    .maybeSingle()

  if (!participant) {
    return { success: false, error: 'Você não participa desta conversa.' }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: idParsed.data,
      sender_id: userId,
      content: contentParsed.data,
    })
    .select('id, sent_at')
    .single()

  if (error || !message) {
    return { success: false, error: 'Erro ao enviar mensagem.' }
  }

  return { success: true, data: { messageId: message.id, sentAt: message.sent_at } }
}

/**
 * Get messages for a conversation with pagination.
 */
export async function getMessages(
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

  const rl = await rateLimit('messageSend', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  // Verify participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', idParsed.data)
    .eq('user_id', userId)
    .maybeSingle()

  if (!participant) {
    return { success: false, error: 'Você não participa desta conversa.' }
  }

  let query = supabase
    .from('messages')
    .select('id, sender_id, content, sent_at, edited_at, is_deleted')
    .eq('conversation_id', idParsed.data)
    .eq('is_deleted', false)
    .order('sent_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('sent_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: 'Erro ao carregar mensagens.' }
  }

  const messages = data || []
  const hasMore = messages.length > limit
  const trimmed = hasMore ? messages.slice(0, limit) : messages
  const nextCursor = hasMore && trimmed.length > 0
    ? String(trimmed[trimmed.length - 1].sent_at)
    : null

  return { success: true, data: { messages: trimmed, nextCursor } }
}

/**
 * Mark all messages in a conversation as read for the current user.
 */
export async function markConversationAsRead(conversationId: string): Promise<ChatResult<{ updated: boolean }>> {
  const idParsed = conversationIdSchema.safeParse(conversationId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('messageSend', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  const readAt = new Date().toISOString()

  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: readAt })
    .eq('conversation_id', idParsed.data)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: 'Erro ao marcar conversa como lida.' }
  }

  return { success: true, data: { updated: true } }
}
