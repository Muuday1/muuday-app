import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getPublicVisibilityByProfessionalId, type ProfessionalSearchRecord } from '@/lib/professional/public-visibility'
import { maybeCachedResponse } from '@/lib/http/cache-headers'

const PROFESSIONAL_PROFILE_FIELDS =
  'id,user_id,public_code,status,category,subcategories,tags,bio,languages,session_price_brl,session_duration_minutes,rating,total_reviews,total_bookings,years_experience,social_links,video_intro_url,cover_photo_url,first_booking_enabled,tier,whatsapp_number,market_code,session_price,session_price_currency,is_publicly_visible,profiles!professionals_user_id_fkey(full_name,country,avatar_url,role)'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  Sentry.addBreadcrumb({ category: 'professional', message: 'GET /api/v1/professionals/:id', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1BookingsDetail', `api-v1-professional-detail:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Professional ID is required.' }, { status: 400 })
  }

  const supabase = await createApiClient(request)

  try {
    // Load professional with visibility fallback
    let professionalQuery = supabase
      .from('professionals')
      .select(PROFESSIONAL_PROFILE_FIELDS)
      .eq('id', id)

    let professionalResult = (await professionalQuery.maybeSingle()) as unknown as {
      data: Record<string, unknown> | null
      error: { message?: string } | null
    }

    if (professionalResult.error?.message?.includes('is_publicly_visible')) {
      const fallbackFields = PROFESSIONAL_PROFILE_FIELDS.replace(',is_publicly_visible', '')
      professionalResult = (await supabase
        .from('professionals')
        .select(fallbackFields)
        .eq('id', id)
        .maybeSingle()) as unknown as {
        data: Record<string, unknown> | null
        error: { message?: string } | null
      }
    }

    const professional = professionalResult.data
    if (!professional) {
      return NextResponse.json({ error: 'Professional not found.' }, { status: 404 })
    }

    // Public visibility check
    const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(supabase, [
      professional as unknown as ProfessionalSearchRecord,
    ])
    const canGoLive = Boolean(visibilityByProfessionalId.get(String(professional.id))?.canGoLive)
    const isPubliclyVisible =
      (typeof professional.is_publicly_visible === 'boolean' ? professional.is_publicly_visible : false) ||
      canGoLive

    if (!isPubliclyVisible || professional.status !== 'approved') {
      return NextResponse.json({ error: 'Professional not found.' }, { status: 404 })
    }

    // Load reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id,rating,comment,professional_response,profiles(full_name)')
      .eq('professional_id', id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(20)

    const response = {
      data: {
        professional,
        reviews: reviews ?? [],
      },
    }

    return maybeCachedResponse(request, response, {
      cacheControl: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    })
  } catch (err) {
    console.error('[api/v1/professionals/:id] unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
