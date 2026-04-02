import Stripe from 'stripe'

export type StripePlatformRegion = 'br' | 'uk'

type StripeClientMap = Partial<Record<StripePlatformRegion, Stripe>>

function buildStripeClient(secretKey?: string) {
  if (!secretKey) return null
  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}

const stripeClients: StripeClientMap = {
  uk: buildStripeClient(process.env.STRIPE_SECRET_KEY) || undefined,
  br:
    buildStripeClient(process.env.STRIPE_BR_SECRET_KEY || process.env.STRIPE_SECRET_KEY) || undefined,
}

export function getStripeClientForRegion(region: StripePlatformRegion): Stripe | null {
  return stripeClients[region] || stripeClients.uk || null
}

export function getDefaultStripeClient(): Stripe | null {
  return stripeClients.uk || stripeClients.br || null
}

export function resolveStripePlatformRegion(country?: string | null): StripePlatformRegion {
  const normalized = String(country || '').trim().toLowerCase()
  if (normalized === 'br' || normalized === 'brazil' || normalized === 'brasil') {
    return 'br'
  }
  return 'uk'
}

export function isStripeConfiguredForRegion(region: StripePlatformRegion): boolean {
  return Boolean(getStripeClientForRegion(region))
}

