/**
 * Payout Notification Service — Phase 4.5
 *
 * Sends email + in-app notifications to professionals about their payouts.
 * All notifications are non-blocking (fire-and-forget with catch).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  sendPayoutSentEmail,
  sendPayoutCompletedEmail,
  sendPayoutFailedEmail,
} from '@/lib/email/templates/payout'
import { formatMinorUnits } from '@/lib/payments/format-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayoutNotificationPayload {
  professionalId: string
  professionalEmail: string
  professionalName: string
  amount: bigint
  debtDeducted: bigint
  netAmount: bigint
  payoutBatchId: string
  payoutBatchItemId?: string
  status: 'submitted' | 'completed' | 'failed' | 'returned'
  reason?: string
  expectedArrival?: string
}

// ---------------------------------------------------------------------------
// In-app notifications
// ---------------------------------------------------------------------------

async function insertInAppNotification(
  admin: SupabaseClient,
  payload: PayoutNotificationPayload,
): Promise<void> {
  const { professionalId, payoutBatchId, status, amount, netAmount, debtDeducted, reason } = payload

  let title: string
  let body: string
  let type: string

  switch (status) {
    case 'submitted': {
      title = 'Pagamento enviado! 💸'
      const debtText = debtDeducted > BigInt(0) ? ` (dívida de ${formatMinorUnits(debtDeducted)} deduzida)` : ''
      body = `Seu pagamento de ${formatMinorUnits(netAmount)} foi enviado${debtText}. Chega em até 3 dias úteis.`
      type = 'payout_submitted'
      break
    }
    case 'completed': {
      title = 'Pagamento concluído! ✅'
      body = `Seu pagamento de ${formatMinorUnits(netAmount)} foi processado com sucesso.`
      type = 'payout_completed'
      break
    }
    case 'failed':
    case 'returned': {
      title = 'Pagamento falhou ⚠️'
      body = reason
        ? `Seu pagamento de ${formatMinorUnits(netAmount)} falhou: ${reason}. O valor foi devolvido ao seu saldo.`
        : `Seu pagamento de ${formatMinorUnits(netAmount)} falhou. O valor foi devolvido ao seu saldo.`
      type = 'payout_failed'
      break
    }
    default:
      return
  }

  await admin.from('notifications').insert({
    user_id: professionalId,
    type,
    title,
    body,
    payload: {
      payout_batch_id: payoutBatchId,
      amount: amount.toString(),
      net_amount: netAmount.toString(),
      debt_deducted: debtDeducted.toString(),
      status,
      reason,
    },
  })
}

// ---------------------------------------------------------------------------
// Email notifications
// ---------------------------------------------------------------------------

async function sendEmailNotification(
  payload: PayoutNotificationPayload,
): Promise<void> {
  const { professionalEmail, professionalName, status } = payload

  switch (status) {
    case 'submitted':
      await sendPayoutSentEmail(professionalEmail, professionalName, {
        amount: payload.amount,
        debtDeducted: payload.debtDeducted,
        netAmount: payload.netAmount,
        payoutBatchId: payload.payoutBatchId,
        expectedArrival: payload.expectedArrival,
      })
      break
    case 'completed':
      await sendPayoutCompletedEmail(professionalEmail, professionalName, {
        netAmount: payload.netAmount,
        payoutBatchId: payload.payoutBatchId,
      })
      break
    case 'failed':
    case 'returned':
      await sendPayoutFailedEmail(professionalEmail, professionalName, {
        netAmount: payload.netAmount,
        payoutBatchId: payload.payoutBatchId,
        reason: payload.reason,
      })
      break
  }
}

// ---------------------------------------------------------------------------
// Unified notification sender
// ---------------------------------------------------------------------------

/**
 * Send both email and in-app notification for a payout event.
 *
 * Non-blocking: catches and logs errors without throwing.
 */
export async function notifyProfessionalAboutPayout(
  admin: SupabaseClient,
  payload: PayoutNotificationPayload,
): Promise<void> {
  // Send in-app notification
  try {
    await insertInAppNotification(admin, payload)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[payout-notification] in-app failed:', {
      professionalId: payload.professionalId,
      status: payload.status,
      error: msg,
    })
  }

  // Send email notification
  try {
    await sendEmailNotification(payload)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[payout-notification] email failed:', {
      professionalId: payload.professionalId,
      status: payload.status,
      error: msg,
    })
  }
}

/**
 * Batch notify multiple professionals after a payout batch is submitted.
 *
 * Used by the Inngest payout batch creation function.
 */
export async function notifyProfessionalsOnBatchSubmitted(
  admin: SupabaseClient,
  batchId: string,
): Promise<void> {
  const { data: items } = await admin
    .from('payout_batch_items')
    .select('id, professional_id, amount, net_amount, debt_deducted')
    .eq('batch_id', batchId)

  if (!items || items.length === 0) return

  // Fetch professional emails and names in batch
  const professionalIds = items.map((i) => i.professional_id)
  const { data: professionals } = await admin
    .from('professionals')
    .select('id, email, name')
    .in('id', professionalIds)

  const proMap = new Map(
    (professionals ?? []).map((p) => [
      p.id,
      { email: p.email || '', name: p.name || 'Profissional' },
    ]),
  )

  for (const item of items) {
    const pro = proMap.get(item.professional_id)
    if (!pro || !pro.email) continue

    void notifyProfessionalAboutPayout(admin, {
      professionalId: item.professional_id,
      professionalEmail: pro.email,
      professionalName: pro.name,
      amount: BigInt(item.amount),
      debtDeducted: BigInt(item.debt_deducted || 0),
      netAmount: BigInt(item.net_amount),
      payoutBatchId: batchId,
      payoutBatchItemId: item.id,
      status: 'submitted',
    }).catch(() => {
      // Individual notification failures are non-blocking
    })
  }
}
