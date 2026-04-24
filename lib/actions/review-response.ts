'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  respondToReviewService,
  type ReviewResponseResult,
} from '@/lib/review/review-response-service'

export type { ReviewResponseResult }

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

  return respondToReviewService(supabase, professional.id, reviewId, responseText)
}
