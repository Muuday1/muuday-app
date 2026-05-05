import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getBlogLikeCountService, toggleBlogLikeService } from '@/lib/blog/blog-engagement-service'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const articleSlug = searchParams.get('articleSlug') || ''
  if (!articleSlug) {
    return NextResponse.json({ error: 'articleSlug is required' }, { status: 400 })
  }

  const supabase = await createApiClient(request)
  const count = await getBlogLikeCountService(supabase, articleSlug)
  return NextResponse.json({ data: { count } })
})

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'blog', message: 'POST /api/v1/blog/likes', level: 'info' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { articleSlug, visitorId } = body as { articleSlug?: string; visitorId?: string }
  if (!articleSlug || !visitorId) {
    return NextResponse.json({ error: 'articleSlug and visitorId are required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1BlogLike', `blog-like-${visitorId.slice(0, 32)}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const result = await toggleBlogLikeService(supabase, articleSlug, visitorId)

  if (!result.success) {
    return NextResponse.json({ error: 'Erro ao processar curtida.' }, { status: 400 })
  }

  return NextResponse.json({ data: { liked: result.liked } })
})