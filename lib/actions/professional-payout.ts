'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  createProfessionalTrolleyRecipient,
  getProfessionalPayoutStatus,
  syncTrolleyRecipientStatus,
} from '@/lib/payments/trolley/onboarding'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

/**
 * Initiate Trolley payout setup for the current professional.
 *
 * Called when professional clicks "Configurar Pagamento" in dashboard.
 */
export async function initiatePayoutSetup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rl = await rateLimit('payoutSetup', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id)
  if (!professional) {
    return { error: 'Perfil profissional não encontrado.' }
  }

  const result = await createProfessionalTrolleyRecipient(supabase, professional.id)

  if (!result.success) {
    return { error: result.error || 'Erro ao configurar pagamento.' }
  }

  return {
    success: true,
    recipientId: result.recipientId,
    kycStatus: result.kycStatus,
    isActive: result.isActive,
    alreadyExists: result.alreadyExists,
  }
}

/**
 * Get current payout status for the professional dashboard.
 */
export async function getPayoutStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id)
  if (!professional) {
    return { error: 'Perfil profissional não encontrado.' }
  }

  const status = await getProfessionalPayoutStatus(supabase, professional.id)

  // Also fetch recent payouts
  const { data: recentPayouts } = await supabase
    .from('payout_batch_items')
    .select('id, amount, net_amount, debt_deducted, status, created_at')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch current balance
  const { data: balance } = await supabase
    .from('professional_balances')
    .select('available_balance, withheld_balance, pending_balance, total_debt, last_payout_at')
    .eq('professional_id', professional.id)
    .maybeSingle()

  return {
    success: true,
    payoutStatus: status,
    recentPayouts: recentPayouts || [],
    balance: balance
      ? {
          available: balance.available_balance,
          withheld: balance.withheld_balance,
          pending: balance.pending_balance,
          debt: balance.total_debt,
          lastPayoutAt: balance.last_payout_at,
        }
      : null,
  }
}

/**
 * Manually sync Trolley recipient status (for polling or refresh).
 */
export async function refreshPayoutStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const rl = await rateLimit('payoutSync', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id)
  if (!professional) {
    return { error: 'Perfil profissional não encontrado.' }
  }

  const result = await syncTrolleyRecipientStatus(supabase, professional.id)

  if (!result.success) {
    return { error: result.error || 'Erro ao sincronizar status.' }
  }

  return {
    success: true,
    kycStatus: result.kycStatus,
    isActive: result.isActive,
  }
}
