import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { updateUserProfile } from '@/lib/user/user-profile-service'

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'user', message: 'GET /api/v1/users/me', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1UsersMe', `api-v1-users-me:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,avatar_url,country,timezone,currency,language,created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[api/v1/users/me] profile error:', profileError.message, profileError.code)
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id,status,tier,market_code,session_price,session_price_currency')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      ...profile,
    },
    professional: professional || null,
  })
}

export async function PATCH(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'user', message: 'PATCH /api/v1/users/me', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ProfileUpdate', `api-v1-profile-update:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const input = body as { fullName?: string; country?: string; timezone?: string; currency?: string }

  const result = await updateUserProfile(supabase, user.id, {
    fullName: input.fullName || '',
    country: input.country || '',
    timezone: input.timezone || '',
    currency: input.currency || '',
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
