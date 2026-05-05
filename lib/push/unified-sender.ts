/**
 * Unified Push Sender.
 *
 * Routes push notifications to the correct delivery mechanism based on platform:
 *   - web:     VAPID/web-push (existing)
 *   - ios:     Expo Push Service
 *   - android: Expo Push Service
 *
 * Decision doc: docs/project/mobile-app/13-push-strategy-decision.md
 *
 * Usage:
 *   const sent = await sendUnifiedPush(userId, {
 *     title: 'New message',
 *     body: 'You have a new message from John',
 *     url: '/mensagens/abc-123',
 *   }, { notifType: 'chat_message' })
 */

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { canSendPush, notifTypeToPreferenceKey } from './preferences'
import { sendPushToUser as sendWebPush } from './sender'
import type { PushPayload, SendPushOptions } from './sender'
import type { SupabaseClient } from '@supabase/supabase-js'

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[]
  errors?: Array<{ message: string; code: string }>
}

interface PushSubscription {
  endpoint: string | null
  p256dh: string | null
  auth: string | null
  platform: string
  push_token: string | null
}

/**
 * Send push notifications to a user across all their registered devices
 * (web + native). Returns total successful deliveries.
 */
export async function sendUnifiedPush(
  userId: string,
  payload: PushPayload,
  options?: SendPushOptions,
): Promise<number> {
  const admin = options?.admin ?? createAdminClient()
  if (!admin) {
    Sentry.captureMessage('[push/unified] Admin client not available', { level: 'warning', tags: { area: 'push/unified' } })
    return 0
  }

  // Check user preferences if notification type is provided
  if (options?.notifType) {
    const prefKey = notifTypeToPreferenceKey(options.notifType)
    if (prefKey) {
      const allowed = await canSendPush(admin, userId, prefKey)
      if (!allowed) return 0
    }
  }

  // Fetch all subscriptions for user
  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, platform, push_token')
    .eq('user_id', userId)

  if (error || !subscriptions || subscriptions.length === 0) {
    return 0
  }

  const typedSubs = subscriptions as PushSubscription[]
  const webSubs = typedSubs.filter(s => s.platform === 'web')
  const nativeSubs = typedSubs.filter(s => s.platform === 'ios' || s.platform === 'android')

  let totalSent = 0

  // 1. Send web pushes (existing logic)
  if (webSubs.length > 0) {
    totalSent += await sendWebPush(userId, payload, { ...options, admin })
  }

  // 2. Send native pushes via Expo
  if (nativeSubs.length > 0) {
    totalSent += await sendExpoPushes(nativeSubs, payload, admin)
  }

  return totalSent
}

/**
 * Send push to multiple users.
 */
export async function sendUnifiedPushToUsers(
  userIds: string[],
  payload: PushPayload,
  options?: SendPushOptions,
): Promise<number> {
  let total = 0
  for (const userId of userIds) {
    total += await sendUnifiedPush(userId, payload, options)
  }
  return total
}

async function sendExpoPushes(
  subscriptions: PushSubscription[],
  payload: PushPayload,
  admin: SupabaseClient,
): Promise<number> {
  const tokens = subscriptions
    .map(s => s.push_token)
    .filter((t): t is string => Boolean(t))

  if (tokens.length === 0) return 0

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: {
      url: payload.url,
      tag: payload.tag,
    },
    badge: 1,
  }))

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const responseText = await response.text()
      Sentry.captureMessage(`[push/unified] Expo Push API error: ${response.status} ${responseText}`, 'error')
      return 0
    }

    const result = (await response.json()) as ExpoPushResponse
    let sent = 0

    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i]
        const token = tokens[i]

        if (ticket.status === 'ok') {
          sent++
        } else {
          // Handle invalid tokens
          const errorType = ticket.details?.error
          if (errorType === 'DeviceNotRegistered' || errorType === 'InvalidCredentials') {
            await admin.from('push_subscriptions').delete().eq('push_token', token)
          }
          Sentry.captureMessage('[push/unified] Expo push failed: ' + ticket.message + ' ' + errorType, { level: 'warning', tags: { area: 'push/unified' } })
        }
      }
    }

    return sent
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { area: 'push_unified' } })
    return 0
  }
}
