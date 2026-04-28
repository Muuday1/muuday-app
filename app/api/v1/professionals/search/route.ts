import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { maybeCachedResponse } from '@/lib/http/cache-headers'

const querySchema = z.object({
  q: z.string().optional().default(''),
  category: z.string().optional().default(''),
  specialty: z.string().optional().default(''),
  language: z.string().optional().default(''),
  location: z.string().optional().default(''),
  market: z.string().optional().default('BR'),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'search', message: 'GET /api/v1/professionals/search', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ProfessionalsSearch', `api-v1-professionals-search:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const searchParams = request.nextUrl.searchParams
  const raw = {
    q: searchParams.get('q'),
    category: searchParams.get('category'),
    specialty: searchParams.get('specialty'),
    language: searchParams.get('language'),
    location: searchParams.get('location'),
    market: searchParams.get('market'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    cursor: searchParams.get('cursor'),
    limit: searchParams.get('limit'),
  }
  // Convert null → undefined so z.string().optional() accepts missing params
  const parsed = querySchema.safeParse(
    Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === null ? undefined : v])),
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters.', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const args = parsed.data
  const supabase = await createApiClient(request)

  try {
    const { data: rows, error } = await supabase.rpc('search_public_professionals_pgtrgm', {
      p_query: args.q || null,
      p_category: args.category || null,
      p_specialty: args.specialty || null,
      p_language: args.language || null,
      p_location: args.location || null,
      p_min_price_brl: args.minPrice ?? null,
      p_max_price_brl: args.maxPrice ?? null,
      p_limit: args.limit,
      p_market: args.market,
    })

    if (error) {
      console.error('[api/v1/professionals/search] rpc error:', error.message, error.code)
      return NextResponse.json({ error: 'Search failed.' }, { status: 500 })
    }

    const candidateIds = Array.from(
      new Set(
        (rows || [])
          .map((row: { professional_id?: string }) => String(row.professional_id || '').trim())
          .filter(Boolean),
      ),
    )

    if (candidateIds.length === 0) {
      return NextResponse.json({
        data: [],
        nextCursor: null,
        total: 0,
      })
    }

    // Apply cursor if provided (simple offset-based cursor for now)
    let offset = 0
    if (args.cursor) {
      try {
        const decoded = Number(Buffer.from(args.cursor, 'base64').toString('utf-8'))
        if (Number.isFinite(decoded) && decoded > 0) {
          offset = decoded
        }
      } catch {
        // ignore invalid cursor
      }
    }

    const paginatedIds = candidateIds.slice(offset, offset + args.limit)
    const nextOffset = offset + paginatedIds.length
    const nextCursor = nextOffset < candidateIds.length ? Buffer.from(String(nextOffset), 'utf-8').toString('base64') : null

    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select(
        'id,user_id,public_code,status,bio,category,subcategories,tags,languages,years_experience,session_price_brl,session_duration_minutes,rating,total_reviews,total_bookings,tier,first_booking_enabled,cover_photo_url,video_intro_url,whatsapp_number,social_links,market_code,session_price,session_price_currency,profiles!professionals_user_id_fkey(full_name,country,avatar_url,role)',
      )
      .in('id', paginatedIds)
      .eq('status', 'approved')
      .eq('is_publicly_visible', true)
      .eq('profiles.role', 'profissional')

    if (profError) {
      console.error('[api/v1/professionals/search] professionals error:', profError.message, profError.code)
      return NextResponse.json({ error: 'Failed to load professionals.' }, { status: 500 })
    }

    // Preserve search ranking order
    const idToIndex = new Map(paginatedIds.map((id, i) => [id, i]))
    const sorted = (professionals || []).sort((a, b) => {
      const ia = idToIndex.get(a.id) ?? Infinity
      const ib = idToIndex.get(b.id) ?? Infinity
      return ia - ib
    })

    return maybeCachedResponse(request, {
      data: sorted,
      nextCursor,
      total: candidateIds.length,
    }, { cacheControl: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' })
  } catch (err) {
    console.error('[api/v1/professionals/search] unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}
