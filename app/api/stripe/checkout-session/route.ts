import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  getStripeClientForRegion,
  resolveStripePlatformRegion,
  type StripePlatformRegion,
} from '@/lib/stripe/client'

const payloadSchema = z.object({
  tier: z.enum(['basic', 'professional', 'premium']),
  billingCycle: z.enum(['monthly', 'annual']),
  source: z.enum(['plan_page', 'onboarding_modal']).optional().default('plan_page'),
})

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

function appBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
}

export async function POST(request: NextRequest) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados invalidos para checkout de plano.' }, { status: 400 })
  }

  const supabase = createClient()
  let {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const authorization = request.headers.get('authorization')
    const bearerToken =
      authorization && authorization.toLowerCase().startsWith('bearer ')
        ? authorization.slice(7).trim()
        : ''

    if (bearerToken) {
      const {
        data: { user: bearerUser },
      } = await supabase.auth.getUser(bearerToken)
      user = bearerUser ?? null
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Faca login para continuar.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role,email,country')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json(
      { error: 'Somente profissionais podem selecionar plano.' },
      { status: 403 },
    )
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id,tier,platform_region')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!professional?.id) {
    return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
  }

  const region =
    (professional.platform_region as StripePlatformRegion | null) ||
    resolveStripePlatformRegion(profile.country)

  const stripe = getStripeClientForRegion(region)
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe indisponivel para esta regiao no momento.' },
      { status: 503 },
    )
  }

  const envKey = PRICE_ENV_KEYS[region][parsed.data.tier][parsed.data.billingCycle]
  const priceId = process.env[envKey]
  if (!priceId) {
    const { data: settings } = await supabase
      .from('professional_settings')
      .select('onboarding_finance_bypass')
      .eq('professional_id', professional.id)
      .maybeSingle()
    const financeBypass = Boolean((settings as { onboarding_finance_bypass?: boolean } | null)?.onboarding_finance_bypass)
    const allowFallbackPlanSwitch =
      parsed.data.source === 'onboarding_modal' ||
      financeBypass ||
      String(process.env.PLAN_PRICING_ALLOW_FALLBACK || '').toLowerCase() === 'true'

    if (allowFallbackPlanSwitch) {
      await supabase
        .from('professionals')
        .update({ tier: parsed.data.tier, updated_at: new Date().toISOString() })
        .eq('id', professional.id)

      const baseUrl = appBaseUrl(request)
      const returnUrl =
        parsed.data.source === 'onboarding_modal'
          ? `${baseUrl}/dashboard?openOnboarding=1&planCheckout=success&mode=test`
          : `${baseUrl}/planos?checkout=success&mode=test`
      return NextResponse.json({ url: returnUrl })
    }

    console.error('[stripe] missing price configuration', {
      region,
      tier: parsed.data.tier,
      cycle: parsed.data.billingCycle,
    })
    return NextResponse.json({ error: 'Preco de plano nao configurado no momento.' }, { status: 503 })
  }

  const baseUrl = appBaseUrl(request)
  const successUrl =
    parsed.data.source === 'onboarding_modal'
      ? `${baseUrl}/dashboard?openOnboarding=1&planCheckout=success`
      : `${baseUrl}/planos?checkout=success`
  const cancelUrl =
    parsed.data.source === 'onboarding_modal'
      ? `${baseUrl}/dashboard?openOnboarding=1&planCheckout=cancelled`
      : `${baseUrl}/planos?checkout=cancelled`
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: profile.email || undefined,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 90,
      metadata: {
        professional_id: professional.id,
        selected_tier: parsed.data.tier,
        selected_cycle: parsed.data.billingCycle,
        annual_policy: '10x_monthly',
      },
    },
    metadata: {
      professional_id: professional.id,
      selected_tier: parsed.data.tier,
      selected_cycle: parsed.data.billingCycle,
      region,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return NextResponse.json({ url: session.url })
}
