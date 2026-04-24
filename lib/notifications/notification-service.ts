import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const notificationIdSchema = z.string().uuid('Identificador de notificação inválido.')

export type NotificationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  {
    limit = 20,
    cursor,
    unreadOnly = false,
  }: {
    limit?: number
    cursor?: string
    unreadOnly?: boolean
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

  const { data, error } = await query

  if (error) {
    return { success: false, error: 'Erro ao carregar notificações.' }
  }

  const notifications = data || []
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
