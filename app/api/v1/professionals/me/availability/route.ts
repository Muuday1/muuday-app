import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { updateAvailability } from '@/lib/professional/professional-profile-service'

export async function PUT(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'availability', message: 'PUT /api/v1/professionals/me/availability started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1AvailabilityUpdate', `api-v1-availability-update:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const slots = Array.isArray(body) ? body : []
  const result = await updateAvailability(supabase, user.id, slots as { day_of_week: number; start_time: string; end_time: string }[])

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
