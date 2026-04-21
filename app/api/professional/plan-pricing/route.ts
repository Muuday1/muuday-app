import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  resolveProfessionalPlanPricing,
  shouldAllowFallbackPricing,
} from '@/lib/professional/plan-pricing'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
  }

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase.from('profiles').select('role,country,currency').eq('id', user.id).maybeSingle(),
    supabase
      .from('professionals')
      .select('id,tier,platform_region')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (profile?.role !== 'profissional' || !professional) {
    return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from('professional_settings')
    .select('onboarding_finance_bypass')
    .eq('professional_id', professional.id)
    .maybeSingle()
  const allowFallbackPricing = shouldAllowFallbackPricing(
    Boolean((settings as { onboarding_finance_bypass?: boolean } | null)?.onboarding_finance_bypass),
  )

  const pricing = await resolveProfessionalPlanPricing({
    tierRaw: professional.tier,
    platformRegionRaw: professional.platform_region,
    countryRaw: profile.country,
    currencyRaw: profile.currency,
    allowFallbackPricing,
  })
  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: pricing.status })
  }

  return NextResponse.json(pricing.data)
}
