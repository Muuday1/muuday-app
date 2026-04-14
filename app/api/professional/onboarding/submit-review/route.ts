import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { submitProfessionalForReview } from '@/lib/professional/submit-review'
import { PROFESSIONAL_TERMS_VERSION } from '@/lib/legal/professional-terms'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional?.id) {
    return NextResponse.json({ error: 'Perfil profissional não encontrado.' }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as { acceptedTerms?: boolean } | null
  if (!body?.acceptedTerms) {
    return NextResponse.json({ error: 'Aceite os termos obrigatórios antes do envio.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const db = admin ?? supabase
  const { error: termsError } = await db
    .from('professional_settings')
    .upsert(
      {
        professional_id: professional.id,
        terms_accepted_at: new Date().toISOString(),
        terms_version: PROFESSIONAL_TERMS_VERSION,
        cancellation_policy_code: 'platform_default',
        cancellation_policy_accepted: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'professional_id' },
    )

  if (termsError) {
    return NextResponse.json({ error: 'Não foi possível registrar o aceite dos termos.' }, { status: 500 })
  }

  const result = await submitProfessionalForReview(db, professional.id)
  if (!result.ok) {
    const status = result.code === 'blocked' ? 409 : result.code === 'missing_state' ? 500 : 400
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  return NextResponse.json({
    ok: true,
    evaluation: result.onboardingState.evaluation,
  })
}
