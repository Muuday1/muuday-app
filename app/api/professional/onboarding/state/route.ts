import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { loadProfessionalTrackerMeta } from '@/lib/professional/onboarding-tracker-state'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id,status')
  if (!professional?.id) {
    return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
  }

  const onboardingState = await loadProfessionalOnboardingState(supabase, professional.id, {
    resolveSignedMediaUrls: false,
  })
  if (!onboardingState) {
    return NextResponse.json({ error: 'Nao foi possivel carregar o tracker.' }, { status: 500 })
  }

  const trackerMeta = await loadProfessionalTrackerMeta(supabase, professional.id)

  return NextResponse.json({
    professionalId: professional.id,
    professionalStatus: String(onboardingState.snapshot.professional.status || professional.status || ''),
    evaluation: onboardingState.evaluation,
    reviewAdjustments: trackerMeta.reviewAdjustments,
    termsAcceptanceByKey: trackerMeta.termsAcceptanceByKey,
  })
}
