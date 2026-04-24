import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { submitGuideReportService } from '@/lib/guides/guide-feedback-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'guide', message: 'POST /api/v1/guides/reports', level: 'info' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { guideSlug, visitorId, message } = body as {
    guideSlug?: string
    visitorId?: string
    message?: string
  }

  if (!guideSlug || !visitorId || !message) {
    return NextResponse.json({ error: 'guideSlug, visitorId, and message are required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1GuideReport', `guide-report-${visitorId.slice(0, 32)}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const result = await submitGuideReportService(supabase, guideSlug, visitorId, message)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
