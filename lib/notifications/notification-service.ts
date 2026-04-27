import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const notificationIdSchema = z.string().uuid('Identificador de notificação inválido.')

export type NotificationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

function deriveActionUrl(type: string, bookingId: string | null, payload: Record<string, unknown>): string | null {
  // If payload already has an action_url, use it
  if (payload.action_url && typeof payload.action_url === 'string') {
    return payload.action_url
  }

  // Derive from notification type and booking_id
  switch (type) {
    case 'booking_confirmed':
    case 'booking_pending':
    case 'booking_cancelled':
    case 'booking_declined':
    case 'booking_rescheduled':
      return bookingId ? `/agenda` : '/agenda'
    case 'session_reminder':
    case 'session_started':
    case 'session_ended':
      return bookingId ? `/sessao/${bookingId}` : '/agenda'
    case 'review_reminder':
    case 'review_published':
      return bookingId ? `/avaliar/${bookingId}` : '/agenda'
    case 'payout_processed':
    case 'payout_available':
      return '/financeiro'
    case 'subscription_payment_failed':
    case 'subscription_trial_ending':
      return '/configuracoes'
    case 'message':
      if (payload.conversation_id && typeof payload.conversation_id === 'string') {
        return `/mensagens/${payload.conversation_id}`
      }
      return '/mensagens'
    case 'new_booking_request':
    case 'request_accepted':
    case 'request_proposed':
      return '/agenda?view=inbox'
    case 'onboarding_approved':
    case 'onboarding_adjustment':
      return '/configuracoes'
    case 'no_show_reported':
      return bookingId ? `/sessao/${bookingId}` : '/agenda'
    default:
      return null
  }
}

export type NotificationCategory = 'bookings' | 'sessions' | 'finance' | 'system' | 'chat'

const categoryTypeMap: Record<NotificationCategory, string[]> = {
  bookings: [
    'booking_confirmed',
    'booking_pending',
    'booking_cancelled',
    'booking_declined',
    'booking_rescheduled',
    'new_booking_request',
    'request_accepted',
    'request_proposed',
    'review_reminder',
    'review_published',
    'no_show_reported',
    'booking_no_show_detected',
  ],
  sessions: ['session_reminder', 'session_started', 'session_ended'],
  finance: ['payout_processed', 'payout_available', 'payout_failed', 'subscription_payment_failed', 'subscription_trial_ending'],
  system: ['onboarding_approved', 'onboarding_adjustment', 'ops.professional_no_show'],
  chat: ['message'],
}

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  {
    limit = 20,
    cursor,
    unreadOnly = false,
    category,
  }: {
    limit?: number
    cursor?: string
    unreadOnly?: boolean
    category?: NotificationCategory
  },
): Promise<NotificationResult<{ notifications: unknown[]; nextCursor: string | null }>> {
  let query = supabase
    .from('notifications')
    .select('id, booking_id, type, title, body, payload, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  if (unreadOnly) {
    query = query.is('read_at', null)
  }

  if (category && categoryTypeMap[category]) {
    query = query.in('type', categoryTypeMap[category])
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: 'Erro ao carregar notificações.' }
  }

  const notifications = (data || []).map(n => ({
    ...n,
    action_url: deriveActionUrl(
      n.type,
      n.booking_id,
      (n.payload as Record<string, unknown>) || {},
    ),
  }))
  const hasMore = notifications.length > limit
  const trimmed = hasMore ? notifications.slice(0, limit) : notifications
  const nextCursor = hasMore && trimmed.length > 0
    ? String(trimmed[trimmed.length - 1].created_at)
    : null

  return { success: true, data: { notifications: trimmed, nextCursor } }
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
): Promise<NotificationResult<{ readAt: string }>> {
  const parsed = notificationIdSchema.safeParse(notificationId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const readAt = new Date().toISOString()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: readAt })
    .eq('id', parsed.data)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: 'Erro ao marcar notificação como lida.' }
  }

  return { success: true, data: { readAt } }
}

export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationResult<{ updatedCount: number }>> {
  const readAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: readAt })
    .eq('user_id', userId)
    .is('read_at', null)
    .select('id')

  if (error) {
    return { success: false, error: 'Erro ao marcar notificações como lidas.' }
  }

  return { success: true, data: { updatedCount: data?.length ?? 0 } }
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationResult<{ count: number }>> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) {
    return { success: false, error: 'Erro ao contar notificações.' }
  }

  return { success: true, data: { count: count ?? 0 } }
}
