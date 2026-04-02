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
})

const PRICE_ENV_KEYS: Record<
  StripePlatformRegion,
  Record<'professional' | 'premium', Record<'monthly' | 'annual', string>>
> = {
  uk: {
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
    return NextResponse.json({ error: 'Dados inválidos para checkout de plano.' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
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
    return NextResponse.json({ error: 'Perfil profissional não encontrado.' }, { status: 404 })
  }

  if (parsed.data.tier === 'basic') {
    return NextResponse.json(
      { error: 'Plano Básico é gratuito. Ajuste direto no painel de planos.' },
      { status: 400 },
    )
  }

  const region = (professional.platform_region as StripePlatformRegion | null) || resolveStripePlatformRegion(profile.country)
  const stripe = getStripeClientForRegion(region)
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe indisponível para esta região no momento.' },
      { status: 503 },
    )
  }

  const envKey = PRICE_ENV_KEYS[region][parsed.data.tier][parsed.data.billingCycle]
  const priceId = process.env[envKey]
  if (!priceId) {
    return NextResponse.json(
      { error: `Preço de plano não configurado (${envKey}).` },
      { status: 503 },
    )
  }

  const baseUrl = appBaseUrl(request)
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
    success_url: `${baseUrl}/planos?checkout=success`,
    cancel_url: `${baseUrl}/planos?checkout=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}

