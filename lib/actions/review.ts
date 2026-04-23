'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  emitUserReviewSubmitted,
  emitProfessionalReceivedReview,
} from '@/lib/email/resend-events'

const submitReviewSchema = z.object({
  bookingId: z.string().uuid(),
  professionalId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
})

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

  const parsed = submitReviewSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  const { error: insertError } = await supabase.from('reviews').insert({
    booking_id: parsed.data.bookingId,
    user_id: user.id,
    professional_id: parsed.data.professionalId,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    is_visible: false,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'Você já avaliou esta sessão.' }
    }
    return { success: false, error: 'Erro ao enviar avaliação. Tente novamente.' }
  }

  // Emit Resend automation events (non-blocking)
  if (user.email) {
    emitUserReviewSubmitted(user.email, {
      booking_id: parsed.data.bookingId,
      rating: parsed.data.rating,
    })
  }

  const { data: profData } = await supabase
    .from('professionals')
    .select('profiles!professionals_user_id_fkey(email)')
    .eq('id', parsed.data.professionalId)
    .maybeSingle()

  const profEmail = profData
    ? (Array.isArray((profData as Record<string, unknown>).profiles)
      ? (((profData as Record<string, unknown>).profiles as unknown[])[0] as { email?: string })?.email
      : ((profData as Record<string, unknown>).profiles as { email?: string })?.email)
    : null

  if (profEmail) {
    emitProfessionalReceivedReview(profEmail, {
      booking_id: parsed.data.bookingId,
      rating: parsed.data.rating,
    })
  }

  return { success: true }
}
