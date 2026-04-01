import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runBookingReminderSync } from '@/lib/ops/booking-reminders'

function parseAuthToken(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]?.trim()) return match[1].trim()
  const altHeader = request.headers.get('x-cron-secret') || ''
  if (altHeader.trim()) return altHeader.trim()
  // Never accept tokens via query string — they leak into logs, referrers, and browser history
  return ''
}

function normalizeSecret(value: string | undefined | null) {
  if (!value) return ''
  let normalized = value.trim()
  if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1)
  }
  normalized = normalized.replace(/\\n/g, '').trim()
  return normalized
}

function isAuthorizedCronRequest(request: NextRequest) {
  const expectedSecret = normalizeSecret(process.env.CRON_SECRET)
  // Always require a secret — preview/staging deployments are publicly accessible
  if (!expectedSecret) return false
  return normalizeSecret(parseAuthToken(request)) === expectedSecret
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.' },
      { status: 500 },
    )
  }

  try {
    const result = await runBookingReminderSync(admin)
    return NextResponse.json({
      ok: true,
      source: 'cron',
      checked: result.checked,
      inserted: result.inserted,
      at: result.at,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[cron/booking-reminders] sync error:', message)
    // Only include details in non-production to avoid leaking internal info
    const body: Record<string, string> = { error: 'Failed to save reminders.' }
    if (process.env.NODE_ENV !== 'production') body.details = message
    return NextResponse.json(body, { status: 500 })
  }
}
