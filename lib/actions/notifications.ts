'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/lib/notifications/notification-service'

const notificationIdSchema = z.string().uuid('Identificador de notificação inválido.')

export type NotificationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function getNotificationsAction({
  limit = 20,
  cursor,
  unreadOnly = false,
}: {
  limit?: number
  cursor?: string
  unreadOnly?: boolean
} = {}): Promise<NotificationResult<{ notifications: unknown[]; nextCursor: string | null }>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('notificationRead', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }
  return getNotifications(supabase, userId, { limit, cursor, unreadOnly })
}

export async function markNotificationAsReadAction(
  notificationId: string,
): Promise<NotificationResult<{ readAt: string }>> {
  const parsed = notificationIdSchema.safeParse(notificationId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('notificationWrite', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }
  return markNotificationAsRead(supabase, userId, parsed.data)
}

export async function markAllNotificationsAsReadAction(): Promise<NotificationResult<{ updatedCount: number }>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('notificationWrite', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }
  return markAllNotificationsAsRead(supabase, userId)
}

export async function getUnreadNotificationCountAction(): Promise<NotificationResult<{ count: number }>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const rl = await rateLimit('notificationRead', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }
  return getUnreadNotificationCount(supabase, userId)
}
