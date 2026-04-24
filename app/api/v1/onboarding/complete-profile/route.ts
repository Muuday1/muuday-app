import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { completeProfessionalProfileService } from '@/lib/onboarding/complete-profile-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'onboarding', message: 'POST /api/v1/onboarding/complete-profile', level: 'info' })

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1OnboardingWrite', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const input = body as {
    bio: string
    category: string
    tags: string[]
    languages: string[]
    yearsExperience: number
    sessionPriceBrl: number
    sessionDurationMinutes: number
  }

  const result = await completeProfessionalProfileService(supabase, user.id, input)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, professionalId: result.professionalId })
}
