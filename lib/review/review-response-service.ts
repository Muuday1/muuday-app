import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const reviewIdSchema = z.string().uuid('Identificador de avaliação inválido.')
const responseSchema = z.string().trim().min(1, 'Resposta não pode estar vazia.').max(1000, 'Resposta muito longa.')

export type ReviewResponseResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function respondToReviewService(
  supabase: SupabaseClient,
  professionalId: string,
  reviewId: string,
  responseText: string,
): Promise<ReviewResponseResult<{ responseAt: string }>> {
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
    Sentry.captureException(reviewError, { tags: { area: 'review_response' } })
  }

  if (!review) {
    return { success: false, error: 'Avaliação não encontrada.' }
  }

  if (review.professional_id !== professionalId) {
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
    .eq('professional_id', professionalId)

  if (error) {
    return { success: false, error: 'Erro ao salvar resposta.' }
  }

  return { success: true, data: { responseAt } }
}
