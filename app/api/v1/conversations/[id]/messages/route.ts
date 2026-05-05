import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { sendMessage, getMessages } from '@/lib/chat/chat-service'
import { maybeCachedResponse } from '@/lib/http/cache-headers'
import { validateApiCsrf } from '@/lib/http/csrf'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const GET = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: conversationId } = await params
  Sentry.addBreadcrumb({
    category: 'chat',
    message: `GET /api/v1/conversations/${conversationId}/messages`,
    level: 'info',
  })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1MessagesRead', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const cursor = searchParams.get('cursor') || undefined

  const result = await getMessages(supabase, user.id, conversationId, {
    limit: Number.isNaN(limit) ? 50 : Math.min(Math.max(limit, 1), 100),
    cursor,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return maybeCachedResponse(request, { success: true, data: result.data }, { cacheControl: 'private, max-age=15, must-revalidate' })
})

export const POST = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: conversationId } = await params
  Sentry.addBreadcrumb({
    category: 'chat',
    message: `POST /api/v1/conversations/${conversationId}/messages`,
    level: 'info',
  })

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
  const rl = await rateLimit('apiV1MessagesSend', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const content = (body as { content?: string })?.content
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const result = await sendMessage(supabase, user.id, conversationId, content)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
})