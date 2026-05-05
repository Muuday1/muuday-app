import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { completeAccountService } from '@/lib/onboarding/complete-account-service'
import { sendWelcomeEmail } from '@/lib/email/templates/user'
import { withApiHandler } from '@/lib/api/with-api-handler'
import {
  emitUserSignedUp,
  emitUserProfileCompleted,
  emitProfessionalSignedUp,
} from '@/lib/email/resend-events'

export const POST = withApiHandler(async (request: NextRequest) => {
  Sentry.addBreadcrumb({ category: 'onboarding', message: 'POST /api/v1/onboarding/complete-account', level: 'info' })

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
    country: string
    timezone: string
    currency: string
    roleHint: string
  }

  const result = await completeAccountService(supabase, user.id, input)

  if (!result.success || !result.user) {
    return NextResponse.json({ error: result.error || 'Failed to complete account.' }, { status: 400 })
  }

  const { user: userInfo } = result

  // Send welcome email (non-blocking)
  if (userInfo.email) {
    sendWelcomeEmail(userInfo.email, userInfo.displayName).catch(() => {
      // Non-critical
    })

    // Emit Resend automation events
    if (userInfo.role === 'profissional') {
      emitProfessionalSignedUp(userInfo.email, {
        first_name: userInfo.firstName,
        specialty: userInfo.specialty || '',
      })
    } else {
      emitUserSignedUp(userInfo.email, {
        first_name: userInfo.firstName,
        country: userInfo.country,
        user_type: userInfo.role === 'usuario' ? 'client' : 'unknown',
      })
      emitUserProfileCompleted(userInfo.email, { user_id: userInfo.id })
    }
  }

  return NextResponse.json({ success: true })
})