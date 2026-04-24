import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { addFavorite, removeFavorite } from '@/lib/favorites/favorites-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'favorites', message: 'POST /api/v1/favorites started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1FavoritesWrite', `api-v1-favorites-write:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await addFavorite(supabase, user.id, String(body.professionalId || ''))

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'favorites', message: 'DELETE /api/v1/favorites started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1FavoritesWrite', `api-v1-favorites-write:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const professionalId = searchParams.get('professionalId') || ''

  const result = await removeFavorite(supabase, user.id, professionalId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
