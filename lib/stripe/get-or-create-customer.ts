/**
 * Get or create a Stripe customer for a given user, with race-condition safety.
 *
 * The DB has a UNIQUE(user_id) constraint on stripe_customers. If two parallel
 * requests both find no existing customer, both may create one in Stripe. The
 * first insert succeeds; the second gets a 23505 unique-constraint violation.
 * In that case we fetch the existing row and return its stripe_customer_id,
 * avoiding a duplicate Stripe customer mapping.
 */

import * as Sentry from '@sentry/nextjs'
import type Stripe from 'stripe'

type SupabaseLikeClient = {
  from: (table: string) => any
}

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  supabase: SupabaseLikeClient,
  userId: string,
  userEmail: string | undefined,
): Promise<string | undefined> {
  // 1. Check for existing customer
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id
  }

  // 2. Create customer in Stripe
  let customer: Stripe.Customer
  try {
    customer = await stripe.customers.create({
      email: userEmail || undefined,
      metadata: { muuday_user_id: userId },
    })
  } catch (createError) {
    Sentry.captureException(createError instanceof Error ? createError : new Error(String(createError)), {
      tags: { area: 'stripe-customer', context: 'create-customer' },
    })
    return undefined
  }

  // 3. Persist mapping — if another request raced and won, fetch the winner
  const { error: insertError } = await supabase.from('stripe_customers').insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  })

  if (insertError) {
    const code = (insertError as { code?: string }).code
    if (code === '23505') {
      // Race lost — fetch the existing row
      const { data: racedExisting } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (racedExisting?.stripe_customer_id) {
        return racedExisting.stripe_customer_id
      }
    }

    Sentry.captureException(insertError, {
      tags: { area: 'stripe-customer', context: 'persist-customer-mapping' },
    })
  }

  return customer.id
}
