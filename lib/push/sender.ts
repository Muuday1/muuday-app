import { createAdminClient } from '@/lib/supabase/admin'
import { canSendPush, notifTypeToPreferenceKey } from './preferences'
import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

let webPush: typeof import('web-push') | null = null

try {
  webPush = require('web-push')
} catch {
  // web-push not installed
}

function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey }
}

function configureWebPush() {
  if (!webPush) return false
  const keys = getVapidKeys()
  if (!keys) return false
  webPush.setVapidDetails(
    'mailto:support@muuday.com',
    keys.publicKey,
    keys.privateKey,
  )
  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Determine if an error is retryable.
 * - 410/404: subscription expired → NOT retryable, remove it
 * - 4xx (except 404/410): client error → NOT retryable
 * - 5xx: server error → retryable
 * - Network errors (no statusCode): retryable
 */
function isRetryableError(err: unknown): boolean {
  const statusCode = (err as { statusCode?: number })?.statusCode
  if (statusCode === 410 || statusCode === 404) return false
  if (statusCode && statusCode >= 400 && statusCode < 500) return false
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  badge?: string
  icon?: string
  tag?: string
}

export interface SendPushOptions {
  /** Notification type (e.g. 'booking.reminder.1h', 'chat_message'). Used to respect user preferences. */
  notifType?: string
  /** Optional Supabase admin client. When provided, avoids creating a new client per call. */
  admin?: SupabaseClient
}

/**
 * Send a push notification to a single subscription with retry.
 * Returns true if sent successfully, false otherwise.
 */
async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
  admin: SupabaseClient,
): Promise<boolean> {
  const maxRetries = 2
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      await webPush!.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload),
      )
      return true
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode

      // 410 Gone = subscription expired, remove it immediately
      if (statusCode === 410 || statusCode === 404) {
        await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        return false
      }

      // Client errors (4xx except 404/410) → don't retry
      if (!isRetryableError(err)) {
        Sentry.captureMessage('[push] Failed to send notification (non-retryable): ' + (statusCode || (err as Error).message), { level: 'warning', tags: { area: 'push/sender' } })
        return false
      }

      // Last attempt failed → log and give up
      if (attempt === maxRetries) {
        Sentry.captureMessage('[push] Failed to send notification after retries: ' + (statusCode || (err as Error).message), { level: 'warning', tags: { area: 'push/sender' } })
        return false
      }

      // Retry with exponential backoff: 1s, 2s
      await sleep(1000 * (attempt + 1))
      attempt++
    }
  }

  return false
}

/**
 * Send a push notification to a specific user.
 * Returns number of successful deliveries.
 *
 * If notifType is provided, checks user notification preferences before sending.
 * Users can disable categories via their settings; default is opt-in.
 *
 * Performance: when calling in a loop (e.g. cron jobs), pass the same `admin`
 * client via `options.admin` to avoid creating a new client per iteration.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  options?: SendPushOptions,
): Promise<number> {
  const admin = options?.admin ?? createAdminClient()
  if (!admin) {
    Sentry.captureMessage('[push] Admin client not available', { level: 'warning', tags: { area: 'push/sender' } })
    return 0
  }

  // Check user preferences if notification type is provided
  if (options?.notifType) {
    const prefKey = notifTypeToPreferenceKey(options.notifType)
    if (prefKey) {
      const allowed = await canSendPush(admin, userId, prefKey)
      if (!allowed) {
        return 0
      }
    }
  }

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error || !subscriptions || subscriptions.length === 0) {
    return 0
  }

  const isConfigured = configureWebPush()
  if (!isConfigured) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[push] web-push not configured. Install web-push and set VAPID keys.')
    }
    return 0
  }

  let sent = 0
  for (const sub of subscriptions) {
    const success = await sendToSubscription(sub, payload, admin)
    if (success) sent++
  }

  return sent
}

/**
 * Broadcast a push notification to multiple users.
 * Returns total number of successful deliveries.
 *
 * Performance: pass `options.admin` to reuse the same Supabase client across
 * all recipients, avoiding repeated client instantiation.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
  options?: SendPushOptions,
): Promise<number> {
  let total = 0
  for (const userId of userIds) {
    total += await sendPushToUser(userId, payload, options)
  }
  return total
}
