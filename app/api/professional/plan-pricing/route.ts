import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getStripeClientForRegion,
  resolveStripePlatformRegion,
  type StripePlatformRegion,
} from '@/lib/stripe/client'

const PRICE_ENV_KEYS: Record<
  StripePlatformRegion,
  Record<'basic' | 'professional' | 'premium', Record<'monthly' | 'annual', string>>
> = {
  uk: {
    basic: {
      monthly: 'STRIPE_PRICE_BASIC_MONTHLY_UK',
      annual: 'STRIPE_PRICE_BASIC_ANNUAL_UK',
    },
    professional: {
      monthly: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY_UK',
      annual: 'STRIPE_PRICE_PROFESSIONAL_ANNUAL_UK',
    },
    premium: {
      monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY_UK',
      annual: 'STRIPE_PRICE_PREMIUM_ANNUAL_UK',
    },
  },
  br: {
    basic: {
      monthly: 'STRIPE_PRICE_BASIC_MONTHLY_BR',
      annual: 'STRIPE_PRICE_BASIC_ANNUAL_BR',
    },
    professional: {
      monthly: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY_BR',
      annual: 'STRIPE_PRICE_PROFESSIONAL_ANNUAL_BR',
    },
    premium: {
      monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY_BR',
      annual: 'STRIPE_PRICE_PREMIUM_ANNUAL_BR',
    },
  },
}

const PLAN_PRICE_BASE_MINOR_BRL: Record<'basic' | 'professional' | 'premium', number> = {
  basic: 4999,
  professional: 9999,
  premium: 14999,
}

function readTier(value: string | null | undefined): 'basic' | 'professional' | 'premium' {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'professional' || normalized === 'premium') return normalized
  return 'basic'
}

export async function GET() {
  const supabase = createClient()
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

  const region =
    (professional.platform_region as StripePlatformRegion | null) ||
    resolveStripePlatformRegion(profile.country)

  const stripe = getStripeClientForRegion(region)
  if (!stripe) {
    return NextResponse.json({ error: 'Provider de cobranca indisponivel para esta regiao.' }, { status: 503 })
  }

  const tier = readTier(professional.tier)
  const { data: settings } = await supabase
    .from('professional_settings')
    .select('onboarding_finance_bypass')
    .eq('professional_id', professional.id)
    .maybeSingle()
  const allowFallbackPricing =
    Boolean((settings as { onboarding_finance_bypass?: boolean } | null)?.onboarding_finance_bypass) ||
    String(process.env.PLAN_PRICING_ALLOW_FALLBACK || '').toLowerCase() === 'true'
  const monthlyKey = PRICE_ENV_KEYS[region][tier].monthly
  const annualKey = PRICE_ENV_KEYS[region][tier].annual
  const monthlyPriceId = process.env[monthlyKey]
  const annualPriceId = process.env[annualKey]

  if (!monthlyPriceId || !annualPriceId) {
    console.error('[plan-pricing] missing stripe price configuration', {
      region,
      tier,
      monthlyConfigured: Boolean(monthlyPriceId),
      annualConfigured: Boolean(annualPriceId),
    })
    if (!allowFallbackPricing) {
      return NextResponse.json({ error: 'Preco de plano nao configurado no momento.' }, { status: 503 })
    }
    const fallbackMonthly = PLAN_PRICE_BASE_MINOR_BRL[tier]
    return NextResponse.json({
      provider: 'fallback-test',
      currency: String(profile?.currency || (region === 'uk' ? 'GBP' : 'BRL')).toUpperCase(),
      monthlyAmount: fallbackMonthly,
      annualAmount: fallbackMonthly * 10,
      tier,
      region,
      fallback: true,
      mode: 'test',
    })
  }

  try {
    const [monthlyPrice, annualPrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId),
      stripe.prices.retrieve(annualPriceId),
    ])

    return NextResponse.json({
      provider: region === 'br' ? 'stripe-br' : 'stripe-uk',
      currency: String(monthlyPrice.currency || annualPrice.currency || 'brl').toUpperCase(),
      monthlyAmount: Number(monthlyPrice.unit_amount || 0),
      annualAmount: Number(annualPrice.unit_amount || 0),
      tier,
      region,
    })
  } catch {
    return NextResponse.json({ error: 'Nao foi possivel carregar precos do provider.' }, { status: 503 })
  }
}
