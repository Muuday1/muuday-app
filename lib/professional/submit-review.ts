import type { SupabaseClient } from '@supabase/supabase-js'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import type { ProfessionalOnboardingEvaluation, ProfessionalOnboardingSnapshot } from '@/lib/professional/onboarding-gates'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'

type OnboardingStateResult = {
  snapshot: ProfessionalOnboardingSnapshot
  evaluation: ProfessionalOnboardingEvaluation
}

export type SubmitProfessionalForReviewResult =
  | { ok: true; onboardingState: OnboardingStateResult }
  | { ok: false; code: 'missing_profile' | 'missing_state' | 'blocked' | 'update_failed'; error: string }

export async function submitProfessionalForReview(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<SubmitProfessionalForReviewResult> {
  const onboardingState = await loadProfessionalOnboardingState(supabase, professionalId)
  if (!onboardingState) {
    return {
      ok: false,
      code: 'missing_state',
      error: 'Nao foi possivel carregar o estado atual do onboarding.',
    }
  }

  if (!onboardingState.evaluation.summary.canSubmitForReview) {
    return {
      ok: false,
      code: 'blocked',
      error: 'Ainda existem pendencias obrigatorias antes do envio para analise.',
    }
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
    .eq('id', professionalId)

  if (error) {
    return {
      ok: false,
      code: 'update_failed',
      error: 'Nao foi possivel enviar o perfil para analise agora.',
    }
  }

  await recomputeProfessionalVisibility(supabase, professionalId)

  const refreshedState = await loadProfessionalOnboardingState(supabase, professionalId)
  if (!refreshedState) {
    return {
      ok: false,
      code: 'missing_state',
      error: 'Perfil enviado, mas nao foi possivel atualizar o tracker.',
    }
  }

  return {
    ok: true,
    onboardingState: refreshedState,
  }
}
