/**
 * Payout Batch Creation Inngest Function — Phase 4 Enhanced
 *
 * Scans all professionals for eligible bookings, calculates payouts with
 * real debt deduction, checks treasury sufficiency, submits to Trolley API,
 * creates ledger entries, and updates professional balances.
 *
 * Cron: Weekly (configurable, default Monday 8am UTC)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { scanPayoutEligibility } from '@/lib/payments/eligibility/engine'
import { calculatePayout } from '@/lib/payments/fees/calculator'
import { getTreasuryBalance } from '@/lib/payments/revolut/client'
import {
  createTrolleyPayment,
  createTrolleyBatch,
  processTrolleyBatch,
  type TrolleyPayment,
} from '@/lib/payments/trolley/client'
import {
  createLedgerTransaction,
  buildPayoutTransaction,
  buildPayoutWithDebtTransaction,
  buildTrolleyFeeTransaction,
} from '@/lib/payments/ledger/entries'
import { getProfessionalBalance, updateProfessionalBalance } from '@/lib/payments/ledger/balance'
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
    // Retry config for Trolley API calls
    retries: 3,
  },
  async ({ step, event, logger }) => {
    const admin = createAdminClient()
    if (!admin) {
      throw new Error('Admin client not configured for payout batch creation.')
    }

    // ------------------------------------------------------------------
    // Step 1: Scan eligibility
    // ------------------------------------------------------------------
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

    // Pre-calculate values before step.run to avoid bigint serialization issues
    const preCalculated = {
      eligiblePros: (eligibilityResult.eligibleProfessionals as Array<{
        professionalId: string
        totalEligibleAmount: bigint
        bookingIds: string[]
      }>).map((pro) => ({
        professionalId: pro.professionalId,
        totalEligibleAmount: pro.totalEligibleAmount.toString(),
        bookingIds: pro.bookingIds,
      })),
    }

    // ------------------------------------------------------------------
    // Step 2: Fetch trolley recipient IDs + professional debts
    // ------------------------------------------------------------------
    const enrichedData = await step.run('enrich-professional-data', async () => {
      const enriched: Array<{
        professionalId: string
        totalEligibleAmount: string
        bookingIds: string[]
        trolleyRecipientId: string | null
        currentDebt: string
        availableBalance: string
      }> = []

      for (const pro of preCalculated.eligiblePros) {
        // Get trolley recipient
        const { data: trolleyRecipient } = await admin
          .from('trolley_recipients')
          .select('trolley_recipient_id')
          .eq('professional_id', pro.professionalId)
          .eq('is_active', true)
          .maybeSingle()

        // Get professional balance (for debt)
        const balance = await getProfessionalBalance(admin, pro.professionalId)

        enriched.push({
          professionalId: pro.professionalId,
          totalEligibleAmount: pro.totalEligibleAmount,
          bookingIds: pro.bookingIds,
          trolleyRecipientId: trolleyRecipient?.trolley_recipient_id ?? null,
          currentDebt: balance?.totalDebt?.toString() ?? '0',
          availableBalance: balance?.availableBalance?.toString() ?? '0',
        })
      }

      return enriched
    })

    // Filter out professionals without trolley recipient IDs
    const readyPros = enrichedData.filter((p) => p.trolleyRecipientId !== null)
    const missingTrolley = enrichedData.filter((p) => p.trolleyRecipientId === null)

    if (missingTrolley.length > 0) {
      logger.warn('Professionals missing Trolley recipient IDs skipped.', {
        count: missingTrolley.length,
        professionalIds: missingTrolley.map((p) => p.professionalId),
      })
    }

    if (readyPros.length === 0) {
      return {
        ok: true,
        source: 'inngest',
        batchCreated: false,
        reason: 'no_professionals_with_trolley_recipients',
      }
    }

    // ------------------------------------------------------------------
    // Step 3: Create batch draft with debt deduction
    // ------------------------------------------------------------------
    const batchDraft = await step.run('create-batch-draft', async () => {
      const totalBatchAmount = readyPros.reduce(
        (sum, p) => sum + BigInt(p.totalEligibleAmount),
        BigInt(0),
      )

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

      // Create batch items with real debt deduction
      const items: Array<{
        batch_id: string
        professional_id: string
        amount: bigint
        fee_amount: bigint
        net_amount: bigint
        debt_deducted: bigint
        trolley_fee_absorbed: bigint
        professional_debt_before: bigint
        currency: string
        status: string
        booking_ids: string[]
        trolley_payment_id: string | null
      }> = []

      for (const pro of readyPros) {
        const eligibleAmount = BigInt(pro.totalEligibleAmount)
        const currentDebt = BigInt(pro.currentDebt)

        const calc = calculatePayout({
          eligibleAmount,
          professionalDebt: currentDebt,
        })

        items.push({
          batch_id: batch.id,
          professional_id: pro.professionalId,
          amount: eligibleAmount,
          fee_amount: BigInt(0), // No per-payout fee
          net_amount: calc.netAmount,
          debt_deducted: calc.professionalDebt,
          trolley_fee_absorbed: calc.trolleyFee,
          professional_debt_before: currentDebt,
          currency: 'BRL',
          status: 'pending',
          booking_ids: pro.bookingIds,
          trolley_payment_id: null,
        })
      }

      const { error: itemsError } = await admin
        .from('payout_batch_items')
        .insert(items as unknown as Record<string, unknown>[])

      if (itemsError) {
        throw new Error(`Failed to create payout batch items: ${itemsError.message}`)
      }

      // Create booking_payout_items junction records
      const junctionRecords: Array<{ booking_id: string; payout_batch_item_id: string }> = []
      for (const pro of readyPros) {
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
      const totalNet = items.reduce((sum, item) => sum + item.net_amount, BigInt(0))
      const totalTrolleyFees = items.reduce((sum, item) => sum + item.trolley_fee_absorbed, BigInt(0))

      await admin
        .from('payout_batches')
        .update({
          status: 'treasury_check',
          total_fees: totalTrolleyFees,
          net_amount: totalNet,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batch.id)

      return {
        batchId: batch.id,
        itemCount: items.length,
        totalAmountStr: totalBatchAmount.toString(),
        totalNetStr: totalNet.toString(),
        totalTrolleyFeesStr: totalTrolleyFees.toString(),
      }
    })

    // ------------------------------------------------------------------
    // Step 4: Treasury check
    // ------------------------------------------------------------------
    const treasuryResult = await step.run('treasury-check', async () => {
      const totalNet = BigInt(batchDraft.totalNetStr)
      const totalTrolleyFees = BigInt(batchDraft.totalTrolleyFeesStr)
      const totalRequired = totalNet + totalTrolleyFees

      const treasury = await getTreasuryBalance()
      if (!treasury) {
        return { passed: false as const, reason: 'revolut_not_configured' }
      }

      const minBuffer = BigInt(env.MINIMUM_TREASURY_BUFFER_MINOR)
      const required = totalRequired + minBuffer

      if (treasury.balance < required) {
        await admin
          .from('payout_batches')
          .update({
            status: 'insufficient_funds',
            treasury_balance_before: treasury.balance,
            failure_reason: `Treasury balance (${treasury.balance}) below required (${required}) including Trolley fees (${totalTrolleyFees})`,
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

    // ------------------------------------------------------------------
    // Step 5: Submit to Trolley API
    // ------------------------------------------------------------------
    const trolleyResult = await step.run('submit-to-trolley', async () => {
      const { data: batchItems } = await admin
        .from('payout_batch_items')
        .select('id, professional_id, net_amount, trolley_payment_id')
        .eq('batch_id', batchDraft.batchId)

      if (!batchItems || batchItems.length === 0) {
        throw new Error('No batch items found for Trolley submission.')
      }

      const trolleyPayments: TrolleyPayment[] = []
      const paymentIdMapping: Array<{ itemId: string; trolleyPaymentId: string }> = []

      for (const item of batchItems) {
        const pro = readyPros.find((p) => p.professionalId === item.professional_id)
        if (!pro || !pro.trolleyRecipientId) continue

        // Skip zero-amount items
        if (BigInt(item.net_amount) <= BigInt(0)) {
          logger.info('Skipping zero-amount payout item.', {
            itemId: item.id,
            professionalId: item.professional_id,
          })
          continue
        }

        try {
          // Convert minor units (e.g. 1050 = R$ 10.50) to major units string for Trolley API
          const amountMinor = BigInt(item.net_amount)
          const amountMajor = Number(amountMinor) / 100
          const amountStr = amountMajor.toFixed(2)

          const payment = await createTrolleyPayment({
            recipientId: pro.trolleyRecipientId,
            amount: amountStr,
            currency: 'BRL',
          })

          trolleyPayments.push(payment)
          paymentIdMapping.push({ itemId: item.id, trolleyPaymentId: payment.id })
        } catch (trolleyError) {
          const errorMsg = trolleyError instanceof Error ? trolleyError.message : String(trolleyError)
          logger.error('Failed to create Trolley payment.', {
            itemId: item.id,
            professionalId: item.professional_id,
            error: errorMsg,
          })
          // Continue with other items — will mark failed items later
        }
      }

      if (trolleyPayments.length === 0) {
        await admin
          .from('payout_batches')
          .update({
            status: 'failed',
            failure_reason: 'All Trolley payment creations failed.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchDraft.batchId)

        return { success: false as const, reason: 'all_trolley_payments_failed' }
      }

      // Update batch items with Trolley payment IDs
      for (const mapping of paymentIdMapping) {
        await admin
          .from('payout_batch_items')
          .update({
            trolley_payment_id: mapping.trolleyPaymentId,
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', mapping.itemId)
      }

      // Create batch in Trolley
      let trolleyBatchId: string | null = null
      try {
        const trolleyBatch = await createTrolleyBatch(trolleyPayments.map((p) => p.id))
        trolleyBatchId = trolleyBatch.id

        // Process the batch
        await processTrolleyBatch(trolleyBatch.id)

        // Update our batch record
        await admin
          .from('payout_batches')
          .update({
            status: 'processing',
            trolley_batch_id: trolleyBatch.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchDraft.batchId)

        return {
          success: true as const,
          trolleyBatchId: trolleyBatch.id,
          paymentsCreated: trolleyPayments.length,
          totalItems: batchItems.length,
        }
      } catch (batchError) {
        const errorMsg = batchError instanceof Error ? batchError.message : String(batchError)
        logger.error('Failed to create or process Trolley batch.', {
          batchId: batchDraft.batchId,
          error: errorMsg,
        })

        await admin
          .from('payout_batches')
          .update({
            status: 'failed',
            failure_reason: `Trolley batch failed: ${errorMsg}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchDraft.batchId)

        return { success: false as const, reason: 'trolley_batch_failed', error: errorMsg }
      }
    })

    if (!trolleyResult.success) {
      return {
        ok: true,
        source: 'inngest',
        batchCreated: true,
        batchId: batchDraft.batchId,
        submitted: false,
        reason: trolleyResult.reason,
      }
    }

    // ------------------------------------------------------------------
    // Step 6: Create ledger entries + update balances
    // ------------------------------------------------------------------
    const ledgerResult = await step.run('create-ledger-entries', async () => {
      const { data: batchItems } = await admin
        .from('payout_batch_items')
        .select('id, professional_id, amount, net_amount, debt_deducted, trolley_fee_absorbed')
        .eq('batch_id', batchDraft.batchId)

      if (!batchItems) {
        throw new Error('No batch items found for ledger creation.')
      }

      let ledgerEntriesCreated = 0
      let balancesUpdated = 0
      let trolleyFeesRecorded = 0

      for (const item of batchItems) {
        const eligibleAmount = BigInt(item.amount)
        const netAmount = BigInt(item.net_amount)
        const debtDeducted = BigInt(item.debt_deducted)
        const trolleyFee = BigInt(item.trolley_fee_absorbed)

        try {
          // Create payout ledger entry
          if (debtDeducted > BigInt(0)) {
            const ledgerInput = buildPayoutWithDebtTransaction({
              eligibleAmount,
              netAmount,
              debtDeducted,
              professionalId: item.professional_id,
              payoutBatchId: batchDraft.batchId,
            })
            await createLedgerTransaction(admin, ledgerInput)
          } else {
            const ledgerInput = buildPayoutTransaction({
              amount: netAmount,
              professionalId: item.professional_id,
              payoutBatchId: batchDraft.batchId,
            })
            await createLedgerTransaction(admin, ledgerInput)
          }
          ledgerEntriesCreated += 1

          // Record Trolley fee (absorbed by Muuday)
          if (trolleyFee > BigInt(0)) {
            const feeLedgerInput = buildTrolleyFeeTransaction({
              trolleyFee,
              payoutBatchId: batchDraft.batchId,
            })
            await createLedgerTransaction(admin, feeLedgerInput)
            trolleyFeesRecorded += 1
          }

          // Update professional balance
          // available_balance decreases by eligibleAmount (total bookings consumed)
          // total_debt decreases by debtDeducted (if applicable)
          const ZERO = BigInt(0)
          if (eligibleAmount > ZERO || debtDeducted > ZERO) {
            await updateProfessionalBalance(admin, item.professional_id, {
              availableDelta: eligibleAmount > ZERO ? -eligibleAmount : ZERO,
              debtDelta: debtDeducted > ZERO ? -debtDeducted : ZERO,
            })

            // Update last_payout_at
            await admin
              .from('professional_balances')
              .update({ last_payout_at: new Date().toISOString() })
              .eq('professional_id', item.professional_id)

            balancesUpdated += 1
          }
        } catch (ledgerError) {
          const errorMsg = ledgerError instanceof Error ? ledgerError.message : String(ledgerError)
          logger.error('Failed to create ledger entry or update balance.', {
            itemId: item.id,
            professionalId: item.professional_id,
            error: errorMsg,
          })
          // Non-blocking: continue with other items
        }
      }

      return { ledgerEntriesCreated, balancesUpdated, trolleyFeesRecorded }
    })

    logger.info('Payout batch created, submitted, and ledger entries recorded.', {
      trigger: event.name,
      batchId: batchDraft.batchId,
      itemCount: batchDraft.itemCount,
      totalAmount: batchDraft.totalAmountStr,
      totalNet: batchDraft.totalNetStr,
      totalTrolleyFees: batchDraft.totalTrolleyFeesStr,
      treasuryBalance: (treasuryResult as { treasuryBalanceStr?: string }).treasuryBalanceStr,
      trolleyBatchId: (trolleyResult as { trolleyBatchId?: string }).trolleyBatchId,
      ledgerEntriesCreated: ledgerResult.ledgerEntriesCreated,
      balancesUpdated: ledgerResult.balancesUpdated,
    })

    return {
      ok: true,
      source: 'inngest',
      batchCreated: true,
      batchId: batchDraft.batchId,
      submitted: true,
      trolleyBatchId: (trolleyResult as { trolleyBatchId?: string }).trolleyBatchId,
      itemCount: batchDraft.itemCount,
      totalAmount: batchDraft.totalAmountStr,
      totalNet: batchDraft.totalNetStr,
      ledgerEntriesCreated: ledgerResult.ledgerEntriesCreated,
      balancesUpdated: ledgerResult.balancesUpdated,
    }
  },
)
