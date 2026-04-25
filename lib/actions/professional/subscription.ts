'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'

export interface ProfessionalSubscriptionStatus {
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
  amountMinor: number
  currency: string
  failureCount: number
  lastPaymentAt: string | null
  lastFailureAt: string | null
  createdAt: string
}

export async function getProfessionalSubscription(): Promise<{
  success: true
  subscription: ProfessionalSubscriptionStatus | null
} | {
  success: false
  error: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  // Get professional ID for current user
  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional) {
    return { success: true, subscription: null }
  }

  const { data: sub } = await supabase
    .from('professional_subscriptions')
    .select('status, current_period_start, current_period_end, trial_end, cancel_at_period_end, amount_minor, currency, failure_count, last_payment_at, last_failure_at, created_at')
    .eq('professional_id', professional.id)
    .maybeSingle()

  if (!sub) {
    return { success: true, subscription: null }
  }

  return {
    success: true,
    subscription: {
      status: sub.status,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      trialEnd: sub.trial_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      amountMinor: sub.amount_minor,
      currency: sub.currency,
      failureCount: sub.failure_count,
      lastPaymentAt: sub.last_payment_at,
      lastFailureAt: sub.last_failure_at,
      createdAt: sub.created_at,
    },
  }
}

export async function createCustomerPortalSession(): Promise<{
  success: true
  url: string
} | {
  success: false
  error: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return { success: false, error: 'Stripe não configurado.' }
  }

  // Get professional and their Stripe customer ID
  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional) {
    return { success: false, error: 'Profissional não encontrado.' }
  }

  const { data: sub } = await supabase
    .from('professional_subscriptions')
    .select('stripe_customer_id')
    .eq('professional_id', professional.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return { success: false, error: 'Assinatura não encontrada.' }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.muuday.com'}/financeiro`,
    })

    if (!session.url) {
      return { success: false, error: 'URL do portal não retornada pelo Stripe.' }
    }

    return { success: true, url: session.url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[professional/subscription] failed to create portal session:', msg)
    return { success: false, error: 'Erro ao criar sessão do portal de billing.' }
  }
}
