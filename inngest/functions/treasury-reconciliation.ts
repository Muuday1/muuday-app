/**
 * Treasury Reconciliation Inngest Function
 *
 * Daily reconciliation: matches Stripe settlements with Revolut transactions.
 * Auto-marks reconciled when amounts match within tolerance.
 * Flags mismatches for manual review.
 *
 * Cron: Daily at 6am UTC
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { runTreasuryReconciliation } from '@/lib/payments/revolut/reconciliation'
import { inngest } from '../client'

export const treasuryReconciliation = inngest.createFunction(
  {
    id: 'treasury-reconciliation',
    name: 'Treasury reconciliation',
    triggers: [
      { cron: '0 6 * * *' },
      { event: 'payments/treasury.reconcile.requested' },
    ],
  },
  async ({ step, event, logger }) => {
    const result = await step.run('run-reconciliation', async () => {
      const admin = createAdminClient()
      if (!admin) {
        throw new Error('Admin client not configured for treasury reconciliation.')
      }

      return runTreasuryReconciliation(admin)
    })

    if (result.mismatchesFound > 0) {
      logger.warn('Treasury reconciliation found mismatches.', {
        trigger: event.name,
        mismatches: result.mismatchesFound,
        settlementsChecked: result.settlementsChecked,
      })

      // TODO: Send alert to ops team with mismatch details
    }

    logger.info('Treasury reconciliation complete.', {
      trigger: event.name,
      settlementsChecked: result.settlementsChecked,
      matchesFound: result.matchesFound,
      mismatchesFound: result.mismatchesFound,
      unmatchedSettlements: result.unmatchedSettlements,
    })

    return {
      ok: true,
      source: 'inngest',
      settlementsChecked: result.settlementsChecked,
      matchesFound: result.matchesFound,
      mismatchesFound: result.mismatchesFound,
      unmatchedSettlements: result.unmatchedSettlements,
    }
  },
)
