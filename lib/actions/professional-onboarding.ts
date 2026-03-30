'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

export async function submitProfessionalForReviewAction() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'profissional') {
    redirect('/buscar')
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  if (!professional?.id) {
    redirect('/completar-perfil?result=missing-profile')
  }

  const onboardingState = await loadProfessionalOnboardingState(supabase, professional.id)
  if (!onboardingState) {
    redirect('/completar-perfil?result=missing-state')
  }

  if (!onboardingState.evaluation.summary.canSubmitForReview) {
    redirect('/onboarding-profissional?result=blocked')
  }

  const firstBookingBlocker = onboardingState.evaluation.gates.first_booking_acceptance.blockers[0]
  const firstBookingNote = firstBookingBlocker
    ? `${firstBookingBlocker.code}:${firstBookingBlocker.title}`
    : null

  const { error } = await supabase
    .from('professionals')
    .update({
      status: 'pending_review',
      first_booking_gate_note: firstBookingNote,
      first_booking_gate_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', professional.id)

  if (error) {
    redirect('/onboarding-profissional?result=error')
  }

  redirect('/onboarding-profissional?result=submitted')
}
