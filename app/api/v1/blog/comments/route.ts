import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getBlogCommentsService, addBlogCommentService } from '@/lib/blog/blog-engagement-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const articleSlug = searchParams.get('articleSlug') || ''
  if (!articleSlug) {
    return NextResponse.json({ error: 'articleSlug is required' }, { status: 400 })
  }

  const supabase = await createApiClient(request)
  const comments = await getBlogCommentsService(supabase, articleSlug)
  return NextResponse.json({ data: comments })
}

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'blog', message: 'POST /api/v1/blog/comments', level: 'info' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { articleSlug, name, email, content } = body as {
    articleSlug?: string
    name?: string
    email?: string
    content?: string
  }

  if (!articleSlug || !name || !email || !content) {
    return NextResponse.json({ error: 'articleSlug, name, email, and content are required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1BlogComment', `blog-comment-${articleSlug}-${email.trim().toLowerCase().slice(0, 32)}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const result = await addBlogCommentService(supabase, articleSlug, name, email, content)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
