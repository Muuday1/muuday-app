import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getNotifications, markAllNotificationsAsRead } from '@/lib/notifications/notification-service'
import { maybeCachedResponse } from '@/lib/http/cache-headers'

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'notifications', message: 'GET /api/v1/notifications', level: 'info' })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1NotificationsRead', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const cursor = searchParams.get('cursor') || undefined
  const unreadOnly = searchParams.get('unreadOnly') === 'true'

  const result = await getNotifications(supabase, user.id, { limit, cursor, unreadOnly })
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return maybeCachedResponse(request, { data: { notifications: result.data.notifications, nextCursor: result.data.nextCursor } }, { cacheControl: 'private, max-age=15, must-revalidate' })
}

export async function PATCH(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'notifications', message: 'PATCH /api/v1/notifications', level: 'info' })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1NotificationsWrite', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const result = await markAllNotificationsAsRead(supabase, user.id)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data })
}
