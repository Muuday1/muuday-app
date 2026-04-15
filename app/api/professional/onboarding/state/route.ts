import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { PROFESSIONAL_REQUIRED_TERMS, PROFESSIONAL_TERMS_VERSION } from '@/lib/legal/professional-terms'

export async function GET() {
  const supabase = createClient()
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

  const onboardingState = await loadProfessionalOnboardingState(supabase, professional.id)
  if (!onboardingState) {
    return NextResponse.json({ error: 'Nao foi possivel carregar o tracker.' }, { status: 500 })
  }

  const [adjustmentsResponse, termAcceptancesResponse] = await Promise.all([
    supabase
      .from('professional_review_adjustments')
      .select('id,stage_id,field_key,message,severity,status,created_at,resolved_at')
      .eq('professional_id', professional.id)
      .in('status', ['open', 'reopened'])
      .order('created_at', { ascending: false }),
    supabase
      .from('professional_term_acceptances')
      .select('term_key,term_version,accepted_at')
      .eq('professional_id', professional.id)
      .eq('term_version', PROFESSIONAL_TERMS_VERSION),
  ])

  const adjustments = (adjustmentsResponse.data || []).map(row => ({
    id: String(row.id || ''),
    stageId: String(row.stage_id || ''),
    fieldKey: String(row.field_key || ''),
    message: String(row.message || ''),
    severity: String(row.severity || 'medium'),
    status: String(row.status || 'open'),
    createdAt: String(row.created_at || ''),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
  }))

  const acceptedTermKeys = new Set(
    (termAcceptancesResponse.data || [])
      .map(row => String(row.term_key || ''))
      .filter(Boolean),
  )
  const termsAcceptanceByKey = PROFESSIONAL_REQUIRED_TERMS.reduce<Record<string, boolean>>(
    (acc, key) => {
      acc[key] = acceptedTermKeys.has(key)
      return acc
    },
    {},
  )

  return NextResponse.json({
    professionalId: professional.id,
    professionalStatus: String(professional.status || ''),
    evaluation: onboardingState.evaluation,
    reviewAdjustments: adjustments,
    termsAcceptanceByKey,
  })
}
