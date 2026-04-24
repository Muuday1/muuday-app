'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  emitUserReviewSubmitted,
  emitProfessionalReceivedReview,
} from '@/lib/email/resend-events'
import { submitReview as submitReviewService, getProfessionalEmailForReview } from '@/lib/review/review-service'

export async function submitReviewAction(data: {
  bookingId: string
  professionalId: string
  rating: number
  comment?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada.' }
  }

  const rl = await rateLimit('reviewSubmit', user.id)
  if (!rl.allowed) {
    return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
  }

  const result = await submitReviewService(supabase, user.id, data)

  if (!result.success) {
    return result
  }

  // Emit Resend automation events (non-blocking)
  if (user.email) {
    emitUserReviewSubmitted(user.email, {
      booking_id: data.bookingId,
      rating: data.rating,
    })
  }

  const profEmail = await getProfessionalEmailForReview(supabase, data.professionalId)
  if (profEmail) {
    emitProfessionalReceivedReview(profEmail, {
      booking_id: data.bookingId,
      rating: data.rating,
    })
  }

  return { success: true }
}
