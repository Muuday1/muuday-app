import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getGuideUsefulCountService, toggleGuideUsefulService } from '@/lib/guides/guide-feedback-service'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const guideSlug = searchParams.get('guideSlug') || ''
  if (!guideSlug) {
    return NextResponse.json({ error: 'guideSlug is required' }, { status: 400 })
  }

  const supabase = await createApiClient(request)
  const count = await getGuideUsefulCountService(supabase, guideSlug)
  return NextResponse.json({ data: { count } })
})

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'guide', message: 'POST /api/v1/guides/useful', level: 'info' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { guideSlug, visitorId } = body as { guideSlug?: string; visitorId?: string }
  if (!guideSlug || !visitorId) {
    return NextResponse.json({ error: 'guideSlug and visitorId are required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1GuideUseful', `guide-useful-${visitorId.slice(0, 32)}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const result = await toggleGuideUsefulService(supabase, guideSlug, visitorId)

  if (!result.success) {
    return NextResponse.json({ error: 'Erro ao processar feedback.' }, { status: 400 })
  }

  return NextResponse.json({ data: { marked: result.marked } })
})