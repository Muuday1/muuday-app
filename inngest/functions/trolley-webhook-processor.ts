/**
 * Trolley Webhook Processor — Inngest Function
 *
 * Processes Trolley webhook events received via app/api/webhooks/trolley/route.ts.
 * All events are handled idempotently.
 *
 * Events handled:
 * - recipient.created  → Insert into trolley_recipients
 * - recipient.updated  → Update KYC status, is_active
 * - payment.updated    → Sync status to payout_batch_items
 * - batch.updated      → Sync batch status to payout_batches
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notifyProfessionalAboutPayout } from '@/lib/notifications/payout-notifications'
import { trackPayoutCompleted, trackPayoutFailed } from '@/lib/analytics/server-events'
import { inngest } from '../client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrolleyWebhookPayload {
  type: string
  data?: Record<string, unknown>
}

interface TrolleyRecipientPayload {
  id?: string
  email?: string
  referenceId?: string
  status?: 'pending' | 'incomplete' | 'active' | 'inactive'
  payoutMethod?: string
  paypalEmail?: string
  firstName?: string
  lastName?: string
}

interface TrolleyPaymentPayload {
  id?: string
  recipient?: { id?: string }
  amount?: string
  currency?: string
  status?: 'pending' | 'in_transit' | 'completed' | 'failed' | 'returned'
  batch?: { id?: string }
}

interface TrolleyBatchPayload {
  id?: string
  status?: 'open' | 'pending' | 'processing' | 'completed' | 'failed'
}

// ---------------------------------------------------------------------------
// Helper: Extract payload safely
// ---------------------------------------------------------------------------

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

async function handleRecipientCreated(
  admin: ReturnType<typeof createAdminClient>,
  payload: TrolleyRecipientPayload,
): Promise<{ action: string; recipientId: string | null }> {
  if (!admin) throw new Error('Admin client not available')

  const trolleyRecipientId = asString(payload.id)
  const email = asString(payload.email)

  if (!trolleyRecipientId || !email) {
    return { action: 'skipped', recipientId: null }
  }

  // Check if already exists
  const { data: existing } = await admin
    .from('trolley_recipients')
    .select('id')
    .eq('trolley_recipient_id', trolleyRecipientId)
    .maybeSingle()

  if (existing) {
    return { action: 'already_exists', recipientId: trolleyRecipientId }
  }

  // Try to match by email to a professional via profiles
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let professional: { id: string } | null = null
  if (profile) {
    const { data: pro } = await admin
      .from('professionals')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle()
    professional = pro
  }

  if (!professional) {
    // Insert without professional_id for now — will need manual linking
    await admin.from('trolley_recipients').insert({
      trolley_recipient_id: trolleyRecipientId,
      email,
      kyc_status: 'pending',
      is_active: false,
      metadata: {
        source: 'trolley_webhook',
        event: 'recipient.created',
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
    })
    return { action: 'inserted_unlinked', recipientId: trolleyRecipientId }
  }

  // Insert linked to professional
  await admin.from('trolley_recipients').insert({
    professional_id: professional.id,
    trolley_recipient_id: trolleyRecipientId,
    email,
    kyc_status: 'pending',
    is_active: false,
    metadata: {
      source: 'trolley_webhook',
      event: 'recipient.created',
      firstName: payload.firstName,
      lastName: payload.lastName,
    },
  })

  return { action: 'inserted_linked', recipientId: trolleyRecipientId }
}

async function handleRecipientUpdated(
  admin: ReturnType<typeof createAdminClient>,
  payload: TrolleyRecipientPayload,
): Promise<{ action: string; recipientId: string | null }> {
  if (!admin) throw new Error('Admin client not available')

  const trolleyRecipientId = asString(payload.id)
  if (!trolleyRecipientId) {
    return { action: 'skipped_no_id', recipientId: null }
  }

  const status = asString(payload.status)
  const payoutMethod = asString(payload.payoutMethod)
  const paypalEmail = asString(payload.paypalEmail)

  // Map Trolley status to our KYC status
  let kycStatus: 'pending' | 'in_review' | 'approved' | 'rejected' = 'pending'
  let isActive = false

  switch (status) {
    case 'active':
      kycStatus = 'approved'
      isActive = true
      break
    case 'incomplete':
      kycStatus = 'in_review'
      isActive = false
      break
    case 'inactive':
      kycStatus = 'rejected'
      isActive = false
      break
    case 'pending':
    default:
      kycStatus = 'pending'
      isActive = false
  }

  const updateData: Record<string, unknown> = {
    kyc_status: kycStatus,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }

  if (payoutMethod) {
    updateData.payout_method = payoutMethod
  }
  if (paypalEmail) {
    updateData.paypal_email = paypalEmail
  }
  if (isActive) {
    updateData.activated_at = new Date().toISOString()
  }

  const { data: existing } = await admin
    .from('trolley_recipients')
    .select('id')
    .eq('trolley_recipient_id', trolleyRecipientId)
    .maybeSingle()

  if (!existing) {
    // Recipient doesn't exist yet — create it as unlinked
    await admin.from('trolley_recipients').insert({
      trolley_recipient_id: trolleyRecipientId,
      email: asString(payload.email) || 'unknown@example.com',
      kyc_status: kycStatus,
      is_active: isActive,
      activated_at: isActive ? new Date().toISOString() : null,
      metadata: { source: 'trolley_webhook', event: 'recipient.updated' },
    })
    return { action: 'created_unlinked', recipientId: trolleyRecipientId }
  }

  await admin
    .from('trolley_recipients')
    .update(updateData)
    .eq('trolley_recipient_id', trolleyRecipientId)

  // ── Handle inactive: hold pending payouts ───────────────────────────
  if (status === 'inactive') {
    try {
      const { data: recipient } = await admin
        .from('trolley_recipients')
        .select('professional_id')
        .eq('trolley_recipient_id', trolleyRecipientId)
        .maybeSingle()

      if (recipient?.professional_id) {
        // Find pending batch items for this professional
        const { data: pendingItems } = await admin
          .from('payout_batch_items')
          .select('id, batch_id, net_amount')
          .eq('professional_id', recipient.professional_id)
          .eq('status', 'processing')

        if (pendingItems && pendingItems.length > 0) {
          // Hold the funds by marking items as failed (inactive account)
          for (const item of pendingItems) {
            await admin
              .from('payout_batch_items')
              .update({
                status: 'failed',
                failure_reason: 'Professional Trolley account became inactive — funds held',
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id)
          }

          // Notify professional
          await admin.from('notifications').insert({
            user_id: recipient.professional_id,
            type: 'payout_held',
            title: 'Pagamento retido ⚠️',
            body: 'Sua conta de pagamento foi desativada e seu pagamento foi retido. Entre em contato com o suporte.',
            payload: {
              trolley_recipient_id: trolleyRecipientId,
              held_items_count: pendingItems.length,
              reason: 'account_inactive',
            },
          })
        }
      }
    } catch (holdError) {
      console.error('[trolley/webhook] failed to hold payouts for inactive recipient:',
        holdError instanceof Error ? holdError.message : holdError,
      )
    }
  }

  return { action: 'updated', recipientId: trolleyRecipientId }
}

async function handlePaymentUpdated(
  admin: ReturnType<typeof createAdminClient>,
  payload: TrolleyPaymentPayload,
): Promise<{ action: string; paymentId: string | null }> {
  if (!admin) throw new Error('Admin client not available')

  const trolleyPaymentId = asString(payload.id)
  if (!trolleyPaymentId) {
    return { action: 'skipped_no_id', paymentId: null }
  }

  const trolleyStatus = asString(payload.status)
  if (!trolleyStatus) {
    return { action: 'skipped_no_status', paymentId: trolleyPaymentId }
  }

  // Map Trolley payment status to our status
  const statusMap: Record<string, string> = {
    pending: 'processing',
    in_transit: 'processing',
    completed: 'completed',
    failed: 'failed',
    returned: 'returned',
  }

  const ourStatus = statusMap[trolleyStatus] || 'processing'

  // Find our batch item by trolley_payment_id
  const { data: batchItem } = await admin
    .from('payout_batch_items')
    .select('id, batch_id')
    .eq('trolley_payment_id', trolleyPaymentId)
    .maybeSingle()

  if (!batchItem) {
    return { action: 'item_not_found', paymentId: trolleyPaymentId }
  }

  // Update batch item status
  await admin
    .from('payout_batch_items')
    .update({
      status: ourStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchItem.id)

  // If payment failed, record failure reason in metadata
  if (ourStatus === 'failed' || ourStatus === 'returned') {
    await admin
      .from('payout_batch_items')
      .update({
        failure_reason: `Trolley payment ${trolleyStatus}`,
        metadata: {
          trolley_status: trolleyStatus,
          trolley_payment_id: trolleyPaymentId,
          updated_at: new Date().toISOString(),
        },
      })
      .eq('id', batchItem.id)
  }

  // Check if all items in the batch are completed/failed — update batch status
  const { data: allItems } = await admin
    .from('payout_batch_items')
    .select('status')
    .eq('batch_id', batchItem.batch_id)

  if (allItems) {
    const allCompleted = allItems.every(
      (item) => item.status === 'completed' || item.status === 'failed' || item.status === 'returned',
    )
    const anyFailed = allItems.some(
      (item) => item.status === 'failed' || item.status === 'returned',
    )
    const allCompletedSuccess = allItems.every((item) => item.status === 'completed')

    if (allCompleted) {
      const batchStatus = allCompletedSuccess ? 'completed' : 'failed'
      await admin
        .from('payout_batches')
        .update({
          status: batchStatus,
          completed_at: batchStatus === 'completed' ? new Date().toISOString() : null,
          failed_at: batchStatus === 'failed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchItem.batch_id)
    }
  }

  // ── Send notification to professional on terminal status ────────────
  if (ourStatus === 'completed' || ourStatus === 'failed' || ourStatus === 'returned') {
    try {
      const { data: itemDetails } = await admin
        .from('payout_batch_items')
        .select('professional_id, amount, net_amount, debt_deducted')
        .eq('id', batchItem.id)
        .single()

      const { data: pro } = await admin
        .from('professionals')
        .select('user_id, profiles!professionals_user_id_fkey(email, full_name, first_name)')
        .eq('id', itemDetails?.professional_id || '')
        .maybeSingle()

      const proProfile = pro?.profiles as Record<string, unknown> | undefined
      const proEmail = asString(proProfile?.email)
      const proName = asString(proProfile?.full_name) || asString(proProfile?.first_name) || 'Profissional'

      if (itemDetails && proEmail) {
        void notifyProfessionalAboutPayout(admin, {
          professionalId: itemDetails.professional_id,
          professionalEmail: proEmail,
          professionalName: proName,
          amount: BigInt(itemDetails.amount || 0),
          debtDeducted: BigInt(itemDetails.debt_deducted || 0),
          netAmount: BigInt(itemDetails.net_amount || 0),
          payoutBatchId: batchItem.batch_id,
          payoutBatchItemId: batchItem.id,
          status: ourStatus === 'returned' ? 'failed' : (ourStatus as 'completed' | 'failed'),
          reason: ourStatus === 'failed' || ourStatus === 'returned'
            ? `Trolley payment ${trolleyStatus}`
            : undefined,
        }).catch(() => {
          // Notification failures are non-blocking
        })

        // Track analytics
        if (ourStatus === 'completed') {
          trackPayoutCompleted(itemDetails.professional_id, {
            batchId: batchItem.batch_id,
            amount: Number(itemDetails.net_amount || 0),
          })
        } else if (ourStatus === 'failed' || ourStatus === 'returned') {
          trackPayoutFailed(itemDetails.professional_id, {
            batchId: batchItem.batch_id,
            amount: Number(itemDetails.net_amount || 0),
            reason: `Trolley payment ${trolleyStatus}`,
          })
        }
      }
    } catch {
      // Notification fetch failures are non-blocking
    }
  }

  return { action: 'updated', paymentId: trolleyPaymentId }
}

async function handleBatchUpdated(
  admin: ReturnType<typeof createAdminClient>,
  payload: TrolleyBatchPayload,
): Promise<{ action: string; batchId: string | null }> {
  if (!admin) throw new Error('Admin client not available')

  const trolleyBatchId = asString(payload.id)
  if (!trolleyBatchId) {
    return { action: 'skipped_no_id', batchId: null }
  }

  const trolleyStatus = asString(payload.status)
  if (!trolleyStatus) {
    return { action: 'skipped_no_status', batchId: trolleyBatchId }
  }

  // Map Trolley batch status to our status
  const statusMap: Record<string, string> = {
    open: 'submitted',
    pending: 'submitted',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed',
  }

  const ourStatus = statusMap[trolleyStatus] || 'processing'

  const { data: batch } = await admin
    .from('payout_batches')
    .select('id')
    .eq('trolley_batch_id', trolleyBatchId)
    .maybeSingle()

  if (!batch) {
    return { action: 'batch_not_found', batchId: trolleyBatchId }
  }

  const updateData: Record<string, unknown> = {
    status: ourStatus,
    updated_at: new Date().toISOString(),
  }

  if (ourStatus === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }
  if (ourStatus === 'failed') {
    updateData.failed_at = new Date().toISOString()
  }

  await admin.from('payout_batches').update(updateData).eq('id', batch.id)

  return { action: 'updated', batchId: trolleyBatchId }
}

// ---------------------------------------------------------------------------
// Inngest Function
// ---------------------------------------------------------------------------

export const processTrolleyWebhook = inngest.createFunction(
  {
    id: 'process-trolley-webhook',
    name: 'Process Trolley webhook',
    triggers: [{ event: 'trolley/webhook.received' }],
  },
  async ({ step, event, logger }) => {
    const payload = asRecord(event.data)
    const eventType = asString(payload.eventType) || 'unknown'
    const trolleyPayload = asRecord(payload.payload)
    const data = asRecord(trolleyPayload.data)

    const admin = createAdminClient()
    if (!admin) {
      throw new Error('Admin client not configured for Trolley webhook processing.')
    }

    type HandlerResult = { action: string; id: string | null }

    switch (eventType) {
      case 'recipient.created': {
        const result = await step.run('handle-recipient-created', async () => {
          return handleRecipientCreated(admin, data as TrolleyRecipientPayload)
        }) as unknown as HandlerResult

        logger.info('Trolley webhook processed.', { eventType, ...result })
        return { ok: true, source: 'inngest', handled: true, eventType, ...result }
      }

      case 'recipient.updated': {
        const result = await step.run('handle-recipient-updated', async () => {
          return handleRecipientUpdated(admin, data as TrolleyRecipientPayload)
        }) as unknown as HandlerResult

        logger.info('Trolley webhook processed.', { eventType, ...result })
        return { ok: true, source: 'inngest', handled: true, eventType, ...result }
      }

      case 'payment.updated': {
        const result = await step.run('handle-payment-updated', async () => {
          return handlePaymentUpdated(admin, data as TrolleyPaymentPayload)
        }) as unknown as HandlerResult

        logger.info('Trolley webhook processed.', { eventType, ...result })
        return { ok: true, source: 'inngest', handled: true, eventType, ...result }
      }

      case 'batch.updated': {
        const result = await step.run('handle-batch-updated', async () => {
          return handleBatchUpdated(admin, data as TrolleyBatchPayload)
        }) as unknown as HandlerResult

        logger.info('Trolley webhook processed.', { eventType, ...result })
        return { ok: true, source: 'inngest', handled: true, eventType, ...result }
      }

      default:
        logger.info('Unhandled Trolley webhook event type.', { eventType })
        return {
          ok: true,
          source: 'inngest',
          handled: false,
          eventType,
          reason: 'unhandled_event_type',
        }
    }
  },
)
