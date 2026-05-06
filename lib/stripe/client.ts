import Stripe from 'stripe'

function sanitizeStripeKey(value: string | undefined): string | undefined {
  if (!value) return value
  // Remove surrounding quotes, trailing newlines, and carriage returns
  // that may have been introduced when copying keys into env vars.
  return value.trim().replace(/^["']|["']$/g, '').replace(/\r?\n/g, '')
}

const stripeClient: Stripe | null = (() => {
  const secretKey = getStripeSecretKey()
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
  const secretKey = getStripeSecretKey()
  if (!secretKey) return null
  return new Stripe(secretKey, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
}

export function isStripeRuntimeConfigured() {
  return Boolean(getStripeSecretKey() && getStripeWebhookSecret())
}

/**
 * Resolve Stripe secret key with fallback to live variant.
 * Production uses live keys; the _LIVE suffix is a legacy naming convention.
 */
export function getStripeSecretKey(): string | undefined {
  return sanitizeStripeKey(process.env.STRIPE_SECRET_KEY) || sanitizeStripeKey(process.env.STRIPE_LIVE_SECRET_KEY)
}

/**
 * Resolve Stripe webhook secret with fallback to live variant.
 * Production uses live webhooks; the _LIVE suffix is a legacy naming convention.
 */
export function getStripeWebhookSecret(): string | undefined {
  return sanitizeStripeKey(process.env.STRIPE_WEBHOOK_SECRET) || sanitizeStripeKey(process.env.STRIPE_WEBHOOK_LIVE_SECRET)
}
