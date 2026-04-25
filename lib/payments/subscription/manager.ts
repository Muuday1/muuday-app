/**
 * Professional Subscription Manager — Phase 6.2
 *
 * Creates and manages Stripe subscriptions for professional monthly fees.
 * Billed separately from payouts. Not deducted from professional earnings.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { env } from '@/lib/config/env'
import { getStripeClient } from '@/lib/stripe/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionCreationResult {
  success: boolean
  subscriptionId?: string
  customerId?: string
  status?: string
  error?: string
}

export interface SubscriptionSyncResult {
  success: boolean
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  updated: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_TRIAL_DAYS = env.MONTHLY_SUBSCRIPTION_TRIAL_DAYS
const FEE_MINOR = env.MONTHLY_SUBSCRIPTION_FEE_MINOR
const PRODUCT_NAME = env.STRIPE_SUBSCRIPTION_PRODUCT_NAME
const CURRENCY = 'BRL'

/**
 * Get or create the Stripe Product for professional subscriptions.
 * Uses a fixed lookup key so we don't create duplicates.
 */
async function getOrCreateSubscriptionProduct() {
  const stripe = getStripeClient()
  if (!stripe) throw new Error('Stripe not configured')

  const lookupKey = 'muuday-professional-monthly'

  // Try to find existing price
  const existingPrices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  })

  if (existingPrices.data.length > 0) {
    return {
      productId: existingPrices.data[0].product as string,
      priceId: existingPrices.data[0].id,
    }
  }

  // Create product + price
  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Assinatura mensal Muuday para profissionais',
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: FEE_MINOR,
    currency: CURRENCY,
    recurring: { interval: 'month' },
    lookup_key: lookupKey,
  })

  return { productId: product.id, priceId: price.id }
}

// ---------------------------------------------------------------------------
// Customer Management
// ---------------------------------------------------------------------------

/**
 * Get or create a Stripe Customer for a professional.
 */
async function getOrCreateCustomer(
  stripe: NonNullable<ReturnType<typeof getStripeClient>>,
  params: {
    email: string
    name: string
    professionalId: string
    userId: string
  },
): Promise<string> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0]
    // Update metadata if needed
    if (
      customer.metadata?.professional_id !== params.professionalId ||
      customer.metadata?.user_id !== params.userId
    ) {
      await stripe.customers.update(customer.id, {
        metadata: {
          professional_id: params.professionalId,
          user_id: params.userId,
        },
      })
    }
    return customer.id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      professional_id: params.professionalId,
      user_id: params.userId,
    },
  })

  return customer.id
}

// ---------------------------------------------------------------------------
// Subscription Creation
// ---------------------------------------------------------------------------

/**
 * Create a monthly subscription for a newly approved professional.
 *
 * Flow:
 * 1. Get/create Stripe Product + Price
 * 2. Get/create Stripe Customer
 * 3. Create Subscription with trial period
 * 4. Persist subscription record in DB
 */
export async function createProfessionalSubscription(
  admin: SupabaseClient,
  professionalId: string,
): Promise<SubscriptionCreationResult> {
  try {
    const stripe = getStripeClient()
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' }
    }

    // Get professional details
    const { data: professional, error: proError } = await admin
      .from('professionals')
      .select('id, user_id')
      .eq('id', professionalId)
      .maybeSingle()

    if (proError || !professional) {
      return { success: false, error: proError?.message || 'Professional not found' }
    }

    // Get profile for email/name
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', professional.user_id)
      .maybeSingle()

    if (profileError || !profile?.email) {
      return { success: false, error: profileError?.message || 'Profile email not found' }
    }

    // Check if subscription already exists
    const { data: existingSub } = await admin
      .from('professional_subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('professional_id', professionalId)
      .maybeSingle()

    if (existingSub && !['canceled', 'incomplete_expired'].includes(existingSub.status)) {
      return {
        success: true,
        subscriptionId: existingSub.stripe_subscription_id,
        status: existingSub.status,
      }
    }

    // Get or create product/price
    const { priceId } = await getOrCreateSubscriptionProduct()

    // Get or create customer
    const customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Profissional'
    const customerId = await getOrCreateCustomer(stripe, {
      email: profile.email,
      name: customerName,
      professionalId,
      userId: professional.user_id,
    })

    // Create subscription
    const subscription = (await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: DEFAULT_TRIAL_DAYS,
      metadata: {
        professional_id: professionalId,
        user_id: professional.user_id,
      },
      collection_method: 'charge_automatically',
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })) as Stripe.Subscription

    // Stripe v21 types omit current_period_* on Subscription; cast through unknown
    const subRaw = subscription as unknown as Record<string, unknown>
    const currentPeriodStart = typeof subRaw.current_period_start === 'number'
      ? subRaw.current_period_start
      : null
    const currentPeriodEnd = typeof subRaw.current_period_end === 'number'
      ? subRaw.current_period_end
      : null

    // Persist in DB
    const { error: insertError } = await admin.from('professional_subscriptions').insert({
      professional_id: professionalId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      amount_minor: FEE_MINOR,
      currency: CURRENCY,
      metadata: {
        stripe_price_id: priceId,
      },
    })

    if (insertError) {
      // Don't fail the whole operation, but log
      console.error('[subscription/manager] failed to persist subscription:', insertError.message)
    }

    return {
      success: true,
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscription/manager] createProfessionalSubscription failed:', msg)
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Subscription Sync
// ---------------------------------------------------------------------------

/**
 * Sync a Stripe subscription status with our DB.
 * Called by webhook handlers or cron jobs.
 */
export async function syncSubscriptionFromStripe(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
): Promise<SubscriptionSyncResult> {
  try {
    const stripe = getStripeClient()
    if (!stripe) {
      return { success: false, status: 'unknown', updated: false, error: 'Stripe not configured' }
    }

    const subscription = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as Stripe.Subscription

    const { data: existing, error: findError } = await admin
      .from('professional_subscriptions')
      .select('id, status')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (findError) {
      return { success: false, status: subscription.status, updated: false, error: findError.message }
    }

    const subRaw = subscription as unknown as Record<string, unknown>
    const currentPeriodStart = typeof subRaw.current_period_start === 'number'
      ? subRaw.current_period_start
      : null
    const currentPeriodEnd = typeof subRaw.current_period_end === 'number'
      ? subRaw.current_period_end
      : null

    const updateData = {
      status: subscription.status,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error: updateError } = await admin
        .from('professional_subscriptions')
        .update(updateData)
        .eq('id', existing.id)

      if (updateError) {
        return {
          success: false,
          status: subscription.status,
          updated: false,
          error: updateError.message,
        }
      }
    } else {
      // Subscription exists in Stripe but not in our DB — try to backfill
      const { error: insertError } = await admin.from('professional_subscriptions').insert({
        professional_id: subscription.metadata?.professional_id || null,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        ...updateData,
        amount_minor: FEE_MINOR,
        currency: CURRENCY,
      })

      if (insertError) {
        return {
          success: false,
          status: subscription.status,
          updated: false,
          error: insertError.message,
        }
      }
    }

    return {
      success: true,
      status: subscription.status,
      currentPeriodStart: updateData.current_period_start || undefined,
      currentPeriodEnd: updateData.current_period_end || undefined,
      cancelAtPeriodEnd: updateData.cancel_at_period_end,
      updated: true,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, status: 'unknown', updated: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Payment Event Handlers
// ---------------------------------------------------------------------------

/**
 * Record a successful payment for a subscription.
 */
export async function recordSubscriptionPayment(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
  params: {
    amountMinor: number
    currency: string
    paidAt: string
    invoiceId: string
  },
): Promise<void> {
  const { data: sub } = await admin
    .from('professional_subscriptions')
    .select('failure_count')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (!sub) {
    console.warn('[subscription/manager] no subscription found for payment:', stripeSubscriptionId)
    return
  }

  const { error } = await admin
    .from('professional_subscriptions')
    .update({
      last_payment_at: params.paidAt,
      failure_count: 0,
      last_failure_at: null,
      last_failure_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  if (error) {
    console.error('[subscription/manager] failed to record payment:', error.message)
  }
}

/**
 * Record a failed payment for a subscription.
 */
export async function recordSubscriptionPaymentFailure(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
  params: {
    failedAt: string
    reason?: string
  },
): Promise<void> {
  const { data: sub } = await admin
    .from('professional_subscriptions')
    .select('failure_count')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (!sub) {
    console.warn('[subscription/manager] no subscription found for failure:', stripeSubscriptionId)
    return
  }

  const { error } = await admin
    .from('professional_subscriptions')
    .update({
      failure_count: (sub.failure_count || 0) + 1,
      last_failure_at: params.failedAt,
      last_failure_reason: params.reason?.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  if (error) {
    console.error('[subscription/manager] failed to record failure:', error.message)
  }
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

/**
 * Cancel a professional's subscription (admin action or user request).
 */
export async function cancelProfessionalSubscription(
  admin: SupabaseClient,
  professionalId: string,
  options: { atPeriodEnd?: boolean } = {},
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = getStripeClient()
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' }
    }

    const { data: sub } = await admin
      .from('professional_subscriptions')
      .select('stripe_subscription_id')
      .eq('professional_id', professionalId)
      .maybeSingle()

    if (!sub) {
      return { success: false, error: 'No subscription found for professional' }
    }

    if (options.atPeriodEnd !== false) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    } else {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
