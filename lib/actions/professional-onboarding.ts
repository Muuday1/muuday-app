'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { submitProfessionalForReview } from '@/lib/professional/submit-review'

const submitProfessionalForReviewInputSchema = z.object({})

export async function submitProfessionalForReviewAction() {
  submitProfessionalForReviewInputSchema.parse({})

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[professional-onboarding] profile query error:', profileError.message)
  }

  if (!profile || profile.role !== 'profissional') {
    redirect('/buscar')
  }

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (profError) {
    console.error('[professional-onboarding] getPrimaryProfessionalForUser error:', profError.message)
  }

  if (!professional?.id) {
    redirect('/completar-perfil?result=missing-profile')
  }

  const result = await submitProfessionalForReview(supabase, professional.id)
  if (!result.ok) {
    if (result.code === 'missing_state') redirect('/completar-perfil?result=missing-state')
    if (result.code === 'blocked') redirect('/dashboard?openOnboarding=1&result=blocked')
    redirect('/dashboard?openOnboarding=1&result=error')
  }

  redirect('/dashboard?openOnboarding=1&result=submitted')
}
