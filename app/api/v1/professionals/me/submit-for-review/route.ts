import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { submitProfessionalForReview } from '@/lib/professional/submit-review'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'professional', message: 'POST /api/v1/professionals/me/submit-for-review', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ProfessionalProfile', `api-v1-professional-profile:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[api/v1/professionals/me/submit-for-review] profile query error:', profileError.message)
  }

  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Forbidden. Only professionals can submit for review.' }, { status: 403 })
  }

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (profError) {
    console.error('[api/v1/professionals/me/submit-for-review] getPrimaryProfessionalForUser error:', profError.message)
  }

  if (!professional?.id) {
    return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 })
  }

  const result = await submitProfessionalForReview(supabase, professional.id)

  if (!result.ok) {
    const status = result.code === 'missing_state' || result.code === 'missing_profile' ? 404 : 400
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  return NextResponse.json({ success: true, onboardingState: result.onboardingState })
}
