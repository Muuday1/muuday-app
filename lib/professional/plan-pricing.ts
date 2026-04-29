import * as Sentry from '@sentry/nextjs'

export type PlanTier = 'basic' | 'professional' | 'premium'

export type PlanPricingPayload = {
  provider: string
  currency: string
  monthlyAmount: number
  annualAmount: number
  tier: PlanTier
  fallback?: boolean
  mode?: string
}

export type PlanPricingResult =
  | { ok: true; data: PlanPricingPayload }
  | { ok: false; status: number; error: string }

const PRICE_ENV_KEYS: Record<
  PlanTier,
  Record<'monthly' | 'annual', string>
> = {
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
}

const PLAN_PRICE_BASE_MINOR_GBP: Record<PlanTier, number> = {
  basic: 999,
  professional: 1999,
  premium: 2999,
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

  // Stripe is now UK-only. Import lazily to avoid bundling issues.
  const { getStripeClient } = await import('@/lib/stripe/client')
  const stripe = getStripeClient()
  if (!stripe) {
    return {
      ok: false,
      status: 503,
      error: 'Payment provider unavailable.',
    }
  }

  const monthlyKey = PRICE_ENV_KEYS[tier].monthly
  const annualKey = PRICE_ENV_KEYS[tier].annual
  const monthlyPriceId = process.env[monthlyKey]
  const annualPriceId = process.env[annualKey]

  if (!monthlyPriceId || !annualPriceId) {
    Sentry.captureMessage(`[plan-pricing] missing stripe price configuration for tier ${tier}`, 'warning')
    if (!args.allowFallbackPricing) {
      return { ok: false, status: 503, error: 'Pricing unavailable at the moment.' }
    }
    const fallbackMonthly = PLAN_PRICE_BASE_MINOR_GBP[tier]
    return {
      ok: true,
      data: {
        provider: 'fallback-test',
        currency: 'GBP',
        monthlyAmount: fallbackMonthly,
        annualAmount: fallbackMonthly * 10,
        tier,
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
        provider: 'stripe-uk',
        currency: String(monthlyPrice.currency || annualPrice.currency || 'gbp').toUpperCase(),
        monthlyAmount: Number(monthlyPrice.unit_amount || 0),
        annualAmount: Number(annualPrice.unit_amount || 0),
        tier,
      },
    }
  } catch {
    return { ok: false, status: 503, error: 'Could not load pricing from provider.' }
  }
}
