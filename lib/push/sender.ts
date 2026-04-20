import { createAdminClient } from '@/lib/supabase/admin'

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

export interface PushPayload {
  title: string
  body: string
  url?: string
  badge?: string
  icon?: string
}

/**
 * Send a push notification to a specific user.
 * Returns number of successful deliveries.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const admin = createAdminClient()
  if (!admin) {
    console.warn('[push] Admin client not available')
    return 0
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
      sent++
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      // 410 Gone = subscription expired, remove it
      if (statusCode === 410 || statusCode === 404) {
        await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
      console.warn('[push] Failed to send notification:', statusCode || (err as Error).message)
    }
  }

  return sent
}

/**
 * Broadcast a push notification to multiple users.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  let total = 0
  for (const userId of userIds) {
    total += await sendPushToUser(userId, payload)
  }
  return total
}
