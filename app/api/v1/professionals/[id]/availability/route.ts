import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getPublicVisibilityByProfessionalId } from '@/lib/professional/public-visibility'
import { maybeCachedResponse } from '@/lib/http/cache-headers'
import { formatInTimeZone } from 'date-fns-tz'

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use yyyy-MM-dd.').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use yyyy-MM-dd.').optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  Sentry.addBreadcrumb({ category: 'availability', message: 'GET /api/v1/professionals/:id/availability', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1BookingsDetail', `api-v1-professional-availability:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Professional ID is required.' }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const raw = {
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  }
  const parsed = querySchema.safeParse(
    Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === null ? undefined : v])),
  )
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters.', details: parsed.error.issues }, { status: 400 })
  }

  const supabase = await createApiClient(request)

  try {
    // Load professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id,status,user_id,timezone,minimum_notice_hours,max_booking_window_days,session_duration_minutes,is_publicly_visible')
      .eq('id', id)
      .maybeSingle()

    if (profError) {
      console.error('[api/v1/professionals/:id/availability] professional load error:', profError.message)
      return NextResponse.json({ error: 'Failed to load professional.' }, { status: 500 })
    }
    if (!professional) {
      return NextResponse.json({ error: 'Professional not found.' }, { status: 404 })
    }

    // Public visibility check
    const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(supabase, [
      professional as unknown as { id: string },
    ])
    const canGoLive = Boolean(visibilityByProfessionalId.get(String(professional.id))?.canGoLive)
    const isPubliclyVisible =
      (typeof professional.is_publicly_visible === 'boolean' ? professional.is_publicly_visible : false) || canGoLive
    if (!isPubliclyVisible || professional.status !== 'approved') {
      return NextResponse.json({ error: 'Professional not found.' }, { status: 404 })
    }

    const timezone = professional.timezone || 'America/Sao_Paulo'
    const now = new Date()
    const defaultStart = formatInTimeZone(now, timezone, 'yyyy-MM-dd')
    const defaultEnd = formatInTimeZone(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), timezone, 'yyyy-MM-dd')
    const startDate = parsed.data.startDate || defaultStart
    const endDate = parsed.data.endDate || defaultEnd

    // Load availability rules (new + legacy)
    const { data: rulesRows } = await supabase
      .from('availability_rules')
      .select('weekday,start_time_local,end_time_local,is_active')
      .eq('professional_id', id)
      .eq('is_active', true)
      .order('weekday')

    let rules = rulesRows || []
    if (rules.length === 0) {
      const { data: legacyRows } = await supabase
        .from('availability')
        .select('day_of_week,start_time,end_time,is_active')
        .eq('professional_id', id)
        .eq('is_active', true)
        .order('day_of_week')

      rules = (legacyRows || []).map(r => ({
        weekday: r.day_of_week,
        start_time_local: r.start_time,
        end_time_local: r.end_time,
        is_active: true,
      }))
    }

    // Load exceptions for the date range
    const { data: exceptionRows } = await supabase
      .from('availability_exceptions')
      .select('date_local,is_available,start_time_local,end_time_local')
      .eq('professional_id', id)
      .gte('date_local', startDate)
      .lte('date_local', endDate)

    // Load existing bookings for the date range
    const startUtc = new Date(`${startDate}T00:00:00Z`).toISOString()
    const endUtc = new Date(`${endDate}T23:59:59Z`).toISOString()
    const { data: bookingRows } = await supabase
      .from('bookings')
      .select('scheduled_at,duration_minutes')
      .eq('professional_id', id)
      .in('status', ['pending_confirmation', 'confirmed'])
      .gte('scheduled_at', startUtc)
      .lte('scheduled_at', endUtc)
      .limit(200)

    const response = {
      data: {
        rules,
        exceptions: exceptionRows || [],
        existingBookings: bookingRows || [],
        timezone,
        minimumNoticeHours: professional.minimum_notice_hours ?? 24,
        maxBookingWindowDays: professional.max_booking_window_days ?? 90,
        sessionDurationMinutes: professional.session_duration_minutes ?? 60,
      },
    }

    return maybeCachedResponse(request, response, {
      cacheControl: 'public, max-age=30, must-revalidate',
    })
  } catch (err) {
    console.error('[api/v1/professionals/:id/availability] unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
