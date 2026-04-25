'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireAdmin } from '../admin/shared'
import { cancelProfessionalSubscription } from '@/lib/payments/subscription/manager'

export interface SubscriptionListItem {
  id: string
  professionalId: string
  professionalName: string
  professionalEmail: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
  amountMinor: number
  currency: string
  failureCount: number
  lastPaymentAt: string | null
  lastFailureAt: string | null
  createdAt: string
}

export type LoadProfessionalSubscriptionsResult =
  | {
      success: true
      items: SubscriptionListItem[]
      total: number
      page: number
      pageSize: number
    }
  | {
      success: false
      error: string
    }

export async function loadProfessionalSubscriptions(options: {
  status?: string
  page?: number
  pageSize?: number
} = {}): Promise<LoadProfessionalSubscriptionsResult> {
  const { supabase } = await requireAdmin()

  const page = Math.max(1, options.page || 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20))

  let query = supabase
    .from('professional_subscriptions')
    .select('id, professional_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, cancel_at_period_end, trial_end, amount_minor, currency, failure_count, last_payment_at, last_failure_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data: subscriptions, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    return { success: false, error: error.message }
  }

  // Fetch professional names
  const professionalIds = [...new Set((subscriptions || []).map((s) => s.professional_id).filter(Boolean))]
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, user_id')
    .in('id', professionalIds)

  const userIds = [...new Set((professionals || []).map((p) => p.user_id).filter(Boolean))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles || []).map((p) => [
      p.id,
      {
        name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Profissional',
        email: p.email || '',
      },
    ]),
  )

  const proToUser = new Map((professionals || []).map((p) => [p.id, p.user_id]))

  const items: SubscriptionListItem[] = (subscriptions || []).map((s) => {
    const userId = proToUser.get(s.professional_id)
    const profile = userId ? profileMap.get(userId) : null

    return {
      id: s.id,
      professionalId: s.professional_id,
      professionalName: profile?.name || 'Desconhecido',
      professionalEmail: profile?.email || '',
      stripeSubscriptionId: s.stripe_subscription_id,
      stripeCustomerId: s.stripe_customer_id,
      status: s.status,
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      trialEnd: s.trial_end,
      amountMinor: s.amount_minor,
      currency: s.currency,
      failureCount: s.failure_count,
      lastPaymentAt: s.last_payment_at,
      lastFailureAt: s.last_failure_at,
      createdAt: s.created_at,
    }
  })

  return {
    success: true,
    items,
    total: count || items.length,
    page,
    pageSize,
  }
}

export async function adminCancelSubscription(
  professionalId: string,
  options: { atPeriodEnd?: boolean } = {},
) {
  const { supabase } = await requireAdmin()

  const rl = await rateLimit('apiV1AdminWrite', 'admin-cancel-subscription')
  if (!rl.allowed) {
    return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
  }

  if (!UUID_REGEX.test(professionalId)) {
    return { success: false, error: 'ID de profissional inválido.' }
  }

  const result = await cancelProfessionalSubscription(supabase, professionalId, options)

  if (result.success) {
    // Sync the cancellation status
    const { data: sub } = await supabase
      .from('professional_subscriptions')
      .select('stripe_subscription_id')
      .eq('professional_id', professionalId)
      .maybeSingle()

    if (sub) {
      // Update local status to reflect cancellation
      await supabase
        .from('professional_subscriptions')
        .update({
          cancel_at_period_end: options.atPeriodEnd !== false,
          updated_at: new Date().toISOString(),
        })
        .eq('professional_id', professionalId)
    }
  }

  return result
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function adminCreateSubscriptionForProfessional(professionalId: string) {
  const { supabase } = await requireAdmin()

  const rl = await rateLimit('apiV1AdminWrite', 'admin-create-subscription')
  if (!rl.allowed) {
    return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
  }

  if (!UUID_REGEX.test(professionalId)) {
    return { success: false, error: 'ID de profissional inválido.' }
  }

  const { createProfessionalSubscription } = await import('@/lib/payments/subscription/manager')
  const result = await createProfessionalSubscription(supabase, professionalId)

  return result
}
