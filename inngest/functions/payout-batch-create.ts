/**
 * Payout Batch Creation Inngest Function
 *
 * Scans all professionals for eligible bookings, calculates fees,
 * checks treasury sufficiency, and submits batch to Trolley.
 *
 * Cron: Weekly (configurable, default Monday 8am UTC)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { scanPayoutEligibility } from '@/lib/payments/eligibility/engine'
import { calculatePayout } from '@/lib/payments/fees/calculator'
import { getTreasuryBalance } from '@/lib/payments/revolut/client'
import { env } from '@/lib/config/env'
import { inngest } from '../client'

export const payoutBatchCreate = inngest.createFunction(
  {
    id: 'payout-batch-create',
    name: 'Payout batch creation',
    triggers: [
      { cron: env.PAYOUT_BATCH_SCHEDULE_CRON },
      { event: 'payments/payout.batch.requested' },
    ],
  },
  async ({ step, event, logger }) => {
    const admin = createAdminClient()
    if (!admin) {
      throw new Error('Admin client not configured for payout batch creation.')
    }

    // Step 1: Scan eligibility
    const eligibilityResult = await step.run('scan-eligibility', async () => {
      return scanPayoutEligibility(admin)
    })

    if (eligibilityResult.eligibleProfessionals.length === 0) {
      logger.info('No eligible professionals for payout.', {
        trigger: event.name,
        ineligibleCount: eligibilityResult.ineligibleProfessionals.length,
      })
      return { ok: true, source: 'inngest', batchCreated: false, reason: 'no_eligible_professionals' }
    }

    // Extract values before step.run to avoid type inference issues
    const eligiblePros = eligibilityResult.eligibleProfessionals as Array<{
      professionalId: string
      totalEligibleAmount: bigint
      bookingIds: string[]
    }>
    const totalBatchAmount = eligiblePros.reduce(
      (sum, p) => sum + p.totalEligibleAmount,
      BigInt(0),
    )

    // Pre-calculate values before step.run to avoid bigint serialization issues
    const preCalculated = {
      totalBatchAmount: totalBatchAmount.toString(),
      proData: eligiblePros.map((pro) => ({
        professionalId: pro.professionalId,
        totalEligibleAmount: pro.totalEligibleAmount.toString(),
        bookingIds: pro.bookingIds,
      })),
    }

    // Step 2: Create batch draft
    const batchDraft = await step.run('create-batch-draft', async () => {
      const totalBatchAmount = BigInt(preCalculated.totalBatchAmount)

      const { data: batch, error: batchError } = await admin
        .from('payout_batches')
        .insert({
          status: 'draft',
          total_amount: totalBatchAmount,
          total_fees: BigInt(0),
          net_amount: totalBatchAmount,
          currency: 'BRL',
          scheduled_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (batchError || !batch) {
        throw new Error(`Failed to create payout batch: ${batchError?.message}`)
      }

      // Create batch items
      const items: Array<{
        batch_id: string
        professional_id: string
        amount: bigint
        fee_amount: bigint
        net_amount: bigint
        currency: string
        status: string
        booking_ids: string[]
      }> = []

      for (const pro of preCalculated.proData) {
        const calc = calculatePayout({
          eligibleAmount: BigInt(pro.totalEligibleAmount),
          professionalDebt: BigInt(0),
        })

        items.push({
          batch_id: batch.id,
          professional_id: pro.professionalId,
          amount: BigInt(pro.totalEligibleAmount),
          fee_amount: calc.feeAmount,
          net_amount: calc.netAmount,
          currency: 'BRL',
          status: 'pending',
          booking_ids: pro.bookingIds,
        })
      }

      const { error: itemsError } = await admin.from('payout_batch_items').insert(items as unknown as Record<string, unknown>[])
      if (itemsError) {
        throw new Error(`Failed to create payout batch items: ${itemsError.message}`)
      }

      // Create booking_payout_items junction records
      const junctionRecords: Array<{ booking_id: string; payout_batch_item_id: string }> = []
      for (const pro of preCalculated.proData) {
        const { data: item } = await admin
          .from('payout_batch_items')
          .select('id')
          .eq('batch_id', batch.id)
          .eq('professional_id', pro.professionalId)
          .single()

        if (item) {
          for (const bookingId of pro.bookingIds) {
            junctionRecords.push({
              booking_id: bookingId,
              payout_batch_item_id: item.id,
            })
          }
        }
      }

      if (junctionRecords.length > 0) {
        const { error: junctionError } = await admin
          .from('booking_payout_items')
          .insert(junctionRecords)
        if (junctionError) {
          throw new Error(`Failed to create booking_payout_items: ${junctionError.message}`)
        }
      }

      // Update batch with calculated totals
      const totalFees = items.reduce((sum, item) => sum + item.fee_amount, BigInt(0))
      const netAmount = totalBatchAmount - totalFees

      await admin
        .from('payout_batches')
        .update({
          status: 'treasury_check',
          total_fees: totalFees,
          net_amount: netAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batch.id)

      return {
        batchId: batch.id,
        itemCount: items.length,
        totalAmountStr: totalBatchAmount.toString(),
        totalFeesStr: totalFees.toString(),
        netAmountStr: netAmount.toString(),
      }
    })

    // Step 3: Treasury check
    const treasuryResult = await step.run('treasury-check', async () => {
      const netAmount = BigInt(batchDraft.netAmountStr)
      const treasury = await getTreasuryBalance()
      if (!treasury) {
        return { passed: false as const, reason: 'revolut_not_configured' }
      }

      const minBuffer = BigInt(env.MINIMUM_TREASURY_BUFFER_MINOR)
      const required = netAmount + minBuffer

      if (treasury.balance < required) {
        await admin
          .from('payout_batches')
          .update({
            status: 'insufficient_funds',
            treasury_balance_before: treasury.balance,
            failure_reason: `Treasury balance (${treasury.balance}) below required (${required})`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchDraft.batchId)

        return {
          passed: false as const,
          reason: 'insufficient_funds',
          treasuryBalanceStr: treasury.balance.toString(),
          requiredStr: required.toString(),
          minBufferStr: minBuffer.toString(),
        }
      }

      await admin
        .from('payout_batches')
        .update({
          status: 'submitted',
          treasury_balance_before: treasury.balance,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchDraft.batchId)

      return {
        passed: true as const,
        treasuryBalanceStr: treasury.balance.toString(),
        requiredStr: required.toString(),
        minBufferStr: minBuffer.toString(),
      }
    })

    if (!treasuryResult.passed) {
      logger.warn('Payout batch blocked: insufficient treasury funds.', {
        batchId: batchDraft.batchId,
        reason: treasuryResult.reason,
        treasuryBalance: (treasuryResult as { treasuryBalanceStr?: string }).treasuryBalanceStr,
        required: (treasuryResult as { requiredStr?: string }).requiredStr,
      })

      return {
        ok: true,
        source: 'inngest',
        batchCreated: true,
        batchId: batchDraft.batchId,
        submitted: false,
        reason: treasuryResult.reason,
      }
    }

    logger.info('Payout batch created and submitted.', {
      trigger: event.name,
      batchId: batchDraft.batchId,
      itemCount: batchDraft.itemCount,
      totalAmount: batchDraft.totalAmountStr,
      netAmount: batchDraft.netAmountStr,
      treasuryBalance: (treasuryResult as { treasuryBalanceStr?: string }).treasuryBalanceStr,
    })

    return {
      ok: true,
      source: 'inngest',
      batchCreated: true,
      batchId: batchDraft.batchId,
      submitted: true,
      itemCount: batchDraft.itemCount,
      totalAmount: batchDraft.totalAmountStr,
      netAmount: batchDraft.netAmountStr,
    }
  },
)
