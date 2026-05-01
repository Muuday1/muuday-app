'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  createProfessionalTrolleyRecipient,
  getProfessionalPayoutStatus,
  syncTrolleyRecipientStatus,
} from '@/lib/payments/trolley/onboarding'
import { generateTrolleyPortalLink } from '@/lib/payments/trolley/client'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import type { PayoutPeriodicity } from '@/lib/payments/fees/calculator'

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

  // If recipient exists (new or existing), generate a portal link for KYC completion
  let portalUrl: string | null = null
  if (result.recipientId) {
    try {
      const portal = await generateTrolleyPortalLink(result.recipientId)
      portalUrl = portal.url
    } catch (portalErr) {
      // Don't fail setup if portal generation fails — user can retry
      console.error('[payout] Portal link generation failed:', portalErr)
    }
  }

  return {
    success: true,
    recipientId: result.recipientId,
    kycStatus: result.kycStatus,
    isActive: result.isActive,
    alreadyExists: result.alreadyExists,
    portalUrl,
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

  // Fetch payout periodicity preference
  const { data: settings } = await supabase
    .from('professional_settings')
    .select('payout_periodicity')
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
    periodicity: (settings?.payout_periodicity || 'weekly') as PayoutPeriodicity,
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

/**
 * Update the professional's payout periodicity preference.
 *
 * Allowed values: 'weekly' | 'biweekly' | 'monthly'
 */
/**
 * Generate a Trolley recipient portal URL for the current professional.
 * Used when they need to complete KYC or update payout details.
 */
export async function getTrolleyPortalUrl() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const rl = await rateLimit('payoutPortal', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id)
  if (!professional) {
    return { error: 'Perfil profissional não encontrado.' }
  }

  // Find the recipient ID
  const { data: recipient } = await supabase
    .from('trolley_recipients')
    .select('trolley_recipient_id')
    .eq('professional_id', professional.id)
    .maybeSingle()

  if (!recipient?.trolley_recipient_id) {
    return { error: 'Configuração de pagamento não encontrada. Inicie a configuração primeiro.' }
  }

  try {
    const portal = await generateTrolleyPortalLink(recipient.trolley_recipient_id)
    return { success: true, url: portal.url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar link do portal'
    return { error: msg }
  }
}

export async function updatePayoutPeriodicity(periodicity: PayoutPeriodicity) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const rl = await rateLimit('payoutPeriodicityUpdate', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const validValues: PayoutPeriodicity[] = ['weekly', 'biweekly', 'monthly']
  if (!validValues.includes(periodicity)) {
    return { error: 'Periodicidade inválida. Use: weekly, biweekly, ou monthly.' }
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id)
  if (!professional) {
    return { error: 'Perfil profissional não encontrado.' }
  }

  const { error } = await supabase
    .from('professional_settings')
    .update({ payout_periodicity: periodicity, updated_at: new Date().toISOString() })
    .eq('professional_id', professional.id)

  if (error) {
    return { error: `Erro ao atualizar periodicidade: ${error.message}` }
  }

  return { success: true, periodicity }
}
