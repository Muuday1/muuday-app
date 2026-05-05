import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getOrCreateConversation, getConversations } from '@/lib/chat/chat-service'
import { maybeCachedResponse } from '@/lib/http/cache-headers'
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const GET = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'chat', message: 'GET /api/v1/conversations', level: 'info' })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ConversationsList', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const result = await getConversations(supabase, user.id)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return maybeCachedResponse(request, { success: true, data: result.data }, { cacheControl: 'private, max-age=30, must-revalidate' })
})

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'chat', message: 'POST /api/v1/conversations', level: 'info' })

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
  const rl = await rateLimit('apiV1ConversationsCreate', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const bookingId = (body as { bookingId?: string })?.bookingId
  if (!bookingId || typeof bookingId !== 'string') {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
  }

  const result = await getOrCreateConversation(supabase, user.id, bookingId)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data }, { status: 201 })
})