'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

const reviewIdSchema = z.string().uuid('Identificador de avaliação inválido.')
const responseSchema = z.string().trim().min(1, 'Resposta não pode estar vazia.').max(1000, 'Resposta muito longa.')

export type ReviewResponseResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Allow a professional to respond to a review they received.
 */
export async function respondToReview(
  reviewId: string,
  responseText: string,
): Promise<ReviewResponseResult<{ responseAt: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (profError) {
    console.error('[review-response] getPrimaryProfessionalForUser error:', profError.message)
  }
  if (!professional) {
    return { success: false, error: 'Apenas profissionais podem responder a avaliações.' }
  }

  const rl = await rateLimit('professionalProfile', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const idParsed = reviewIdSchema.safeParse(reviewId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const textParsed = responseSchema.safeParse(responseText)
  if (!textParsed.success) {
    return { success: false, error: textParsed.error.issues[0]?.message || 'Resposta inválida.' }
  }

  // Verify the review belongs to this professional
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('id, professional_id, professional_response')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (reviewError) {
    console.error('[review-response] review query error:', reviewError.message)
  }

  if (!review) {
    return { success: false, error: 'Avaliação não encontrada.' }
  }

  if (review.professional_id !== professional.id) {
    return { success: false, error: 'Você só pode responder a avaliações do seu perfil.' }
  }

  const responseAt = new Date().toISOString()

  const { error } = await supabase
    .from('reviews')
    .update({
      professional_response: textParsed.data,
      professional_response_at: responseAt,
    })
    .eq('id', idParsed.data)
    .eq('professional_id', professional.id)

  if (error) {
    return { success: false, error: 'Erro ao salvar resposta.' }
  }

  return { success: true, data: { responseAt } }
}
