import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  endpoint: z.string().optional(),
  pushToken: z.string().optional(),
}).refine(data => data.endpoint || data.pushToken, {
  message: 'Either endpoint or pushToken is required',
})

/**
 * DELETE /api/v1/push/unsubscribe
 * Removes a push subscription for the authenticated user.
 */
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const DELETE = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'push', message: 'DELETE /api/v1/push/unsubscribe', level: 'info' })

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
  const parsed = unsubscribeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id)

  if (parsed.data.endpoint) {
    query = query.eq('endpoint', parsed.data.endpoint)
  } else if (parsed.data.pushToken) {
    query = query.eq('push_token', parsed.data.pushToken)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})