import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { submitReview, getProfessionalEmailForReview } from '@/lib/review/review-service'
import {
  emitUserReviewSubmitted,
  emitProfessionalReceivedReview,
} from '@/lib/email/resend-events'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'reviews', message: 'POST /api/v1/reviews started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ReviewSubmit', `api-v1-review-submit:${ip}`)
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

  const result = await submitReview(supabase, user.id, {
    bookingId: String(body.bookingId || ''),
    professionalId: String(body.professionalId || ''),
    rating: Number(body.rating || 0),
    comment: body.comment !== undefined ? String(body.comment) : undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Emit Resend automation events (non-blocking)
  if (user.email) {
    emitUserReviewSubmitted(user.email, {
      booking_id: String(body.bookingId || ''),
      rating: Number(body.rating || 0),
    })
  }

  const profEmail = await getProfessionalEmailForReview(supabase, String(body.professionalId || ''))
  if (profEmail) {
    emitProfessionalReceivedReview(profEmail, {
      booking_id: String(body.bookingId || ''),
      rating: Number(body.rating || 0),
    })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
