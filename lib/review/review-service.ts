import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const submitReviewSchema = z.object({
  bookingId: z.string().uuid(),
  professionalId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
})

export type ReviewResult =
  | { success: true }
  | { success: false; error: string }

export async function submitReview(
  supabase: SupabaseClient,
  userId: string,
  data: {
    bookingId: string
    professionalId: string
    rating: number
    comment?: string
  },
): Promise<ReviewResult> {
  const parsed = submitReviewSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  const { error: insertError } = await supabase.from('reviews').insert({
    booking_id: parsed.data.bookingId,
    user_id: userId,
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

  return { success: true }
}

export async function getProfessionalEmailForReview(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<string | null> {
  const { data: profData } = await supabase
    .from('professionals')
    .select('profiles!professionals_user_id_fkey(email)')
    .eq('id', professionalId)
    .maybeSingle()

  if (!profData) return null

  const profiles = (profData as Record<string, unknown>).profiles
  if (Array.isArray(profiles)) {
    return (profiles[0] as { email?: string })?.email || null
  }
  return (profiles as { email?: string })?.email || null
}
