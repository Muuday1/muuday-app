import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { z } from 'zod'

const webSubscriptionSchema = z.object({
  platform: z.literal('web'),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const nativeSubscriptionSchema = z.object({
  platform: z.enum(['ios', 'android']),
  pushToken: z.string().min(1),
  deviceId: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
  locale: z.string().optional(),
})

const subscriptionSchema = z.union([webSubscriptionSchema, nativeSubscriptionSchema])

/**
 * POST /api/v1/push/subscribe
 * Saves a push subscription for the authenticated user.
 * Supports both web (VAPID) and native (Expo Push Token) subscriptions.
 */
import { validateApiCsrf } from '@/lib/http/csrf'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'push', message: 'POST /api/v1/push/subscribe', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1PushSubscribe', `${user.id}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, rl.retryAfterSeconds)) } },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = subscriptionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
  }

  const data = parsed.data

  if (data.platform === 'web') {
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        platform: 'web',
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' },
    )

    if (error) {
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }
  } else {
    // Native (iOS/Android) — upsert by device_id or push_token
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        platform: data.platform,
        push_token: data.pushToken,
        device_id: data.deviceId || null,
        app_version: data.appVersion || null,
        os_version: data.osVersion || null,
        locale: data.locale || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,push_token' },
    )

    if (error) {
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
