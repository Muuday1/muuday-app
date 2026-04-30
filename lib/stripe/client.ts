import Stripe from 'stripe'

const stripeClient: Stripe | null = (() => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null
  return new Stripe(secretKey, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
})()

export function getStripeClient(): Stripe | null {
  return stripeClient
}

/**
 * @deprecated Stripe is now UK-only. This function always returns 'uk'.
 * Kept for backward compatibility with existing DB rows and code paths.
 */
export function resolveStripePlatformRegion(_country?: string | null): 'uk' {
  return 'uk'
}

export function isStripeConfigured(): boolean {
  return Boolean(stripeClient)
}

// ─── Resilience helpers (migrated from lib/ops/stripe-resilience.ts) ──────

export function createStripeClientIfConfigured() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null
  return new Stripe(secretKey, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
}

export function isStripeRuntimeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
}
