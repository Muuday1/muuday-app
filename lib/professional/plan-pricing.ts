import {
  getStripeClientForRegion,
  resolveStripePlatformRegion,
  type StripePlatformRegion,
} from '@/lib/stripe/client'

export type PlanTier = 'basic' | 'professional' | 'premium'

export type PlanPricingPayload = {
  provider: string
  currency: string
  monthlyAmount: number
  annualAmount: number
  tier: PlanTier
  region: StripePlatformRegion
  fallback?: boolean
  mode?: string
}

export type PlanPricingResult =
  | { ok: true; data: PlanPricingPayload }
  | { ok: false; status: number; error: string }

const PRICE_ENV_KEYS: Record<
  StripePlatformRegion,
  Record<PlanTier, Record<'monthly' | 'annual', string>>
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

const PLAN_PRICE_BASE_MINOR_BRL: Record<PlanTier, number> = {
  basic: 4999,
  professional: 9999,
  premium: 14999,
}

export function readPlanTier(value: string | null | undefined): PlanTier {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'professional' || normalized === 'premium') return normalized
  return 'basic'
}

export function shouldAllowFallbackPricing(onboardingFinanceBypass: boolean) {
  return (
    onboardingFinanceBypass ||
    String(process.env.PLAN_PRICING_ALLOW_FALLBACK || '').toLowerCase() === 'true'
  )
}

export async function resolveProfessionalPlanPricing(args: {
  tierRaw: string | null | undefined
  platformRegionRaw: string | null | undefined
  countryRaw: string | null | undefined
  currencyRaw: string | null | undefined
  allowFallbackPricing: boolean
}): Promise<PlanPricingResult> {
  const tier = readPlanTier(args.tierRaw)
  const region =
    (String(args.platformRegionRaw || '').trim().toLowerCase() as StripePlatformRegion) ||
    resolveStripePlatformRegion(args.countryRaw)
  const stripe = getStripeClientForRegion(region)
  if (!stripe) {
    return {
      ok: false,
      status: 503,
      error: 'Provider de cobranca indisponivel para esta regiao.',
    }
  }

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
    if (!args.allowFallbackPricing) {
      return { ok: false, status: 503, error: 'Preco indisponivel no momento.' }
    }
    const fallbackMonthly = PLAN_PRICE_BASE_MINOR_BRL[tier]
    return {
      ok: true,
      data: {
        provider: 'fallback-test',
        currency: String(args.currencyRaw || (region === 'uk' ? 'GBP' : 'BRL')).toUpperCase(),
        monthlyAmount: fallbackMonthly,
        annualAmount: fallbackMonthly * 10,
        tier,
        region,
        fallback: true,
        mode: 'test',
      },
    }
  }

  try {
    const [monthlyPrice, annualPrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId),
      stripe.prices.retrieve(annualPriceId),
    ])
    return {
      ok: true,
      data: {
        provider: region === 'br' ? 'stripe-br' : 'stripe-uk',
        currency: String(monthlyPrice.currency || annualPrice.currency || 'brl').toUpperCase(),
        monthlyAmount: Number(monthlyPrice.unit_amount || 0),
        annualAmount: Number(annualPrice.unit_amount || 0),
        tier,
        region,
      },
    }
  } catch {
    return { ok: false, status: 503, error: 'Nao foi possivel carregar precos do provider.' }
  }
}
