'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { processRefund } from '@/lib/payments/refund/engine'
import { formatMinorUnits } from '@/lib/payments/format-utils'

export type AdminRefundResult =
  | { success: true; refundId: string; amountRefunded: string; disputeResolutionId?: string }
  | { success: false; error: string }

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return { success: false as const, error: 'Acesso restrito a administradores.' }
  }

  return { success: true as const, userId: user.id }
}

/**
 * Admin action: process a refund for a booking.
 *
 * @param bookingId — UUID of the booking to refund
 * @param reason — Human-readable reason for the refund
 * @param percentage — Percentage to refund (1-100)
 */
export async function processBookingRefund(
  bookingId: string,
  reason: string,
  percentage: number,
): Promise<AdminRefundResult> {
  const adminCheck = await requireAdmin()
  if (!adminCheck.success) {
    return { success: false, error: adminCheck.error }
  }

  const adminId = adminCheck.userId

  // Rate limit
  const rl = await rateLimit('bookingManage', adminId)
  if (!rl.allowed) {
    return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }
  }

  // Validate inputs
  if (!bookingId || typeof bookingId !== 'string') {
    return { success: false, error: 'ID do agendamento inválido.' }
  }
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'Forneça um motivo com pelo menos 5 caracteres.' }
  }
  if (typeof percentage !== 'number' || percentage <= 0 || percentage > 100) {
    return { success: false, error: 'Porcentagem de reembolso deve ser entre 1 e 100.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  const result = await processRefund(admin, {
    bookingId,
    reason: reason.trim(),
    percentage,
    adminId,
  })

  if (!result.success) {
    return { success: false, error: result.stripeError || 'Erro ao processar reembolso.' }
  }

  return {
    success: true,
    refundId: result.refundId || 'unknown',
    amountRefunded: formatMinorUnits(result.amountRefunded || BigInt(0)),
    disputeResolutionId: result.disputeResolutionId,
  }
}
