/**
 * Treasury Snapshot Inngest Function
 *
 * Periodically reads Revolut treasury balance and stores a snapshot.
 * Alerts if balance falls below configured threshold.
 *
 * Cron: Every 15 minutes
 */

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTreasuryBalance } from '@/lib/payments/revolut/client'
import { inngest } from '../client'
import { env } from '@/lib/config/env'

export const treasuryBalanceSnapshot = inngest.createFunction(
  {
    id: 'treasury-balance-snapshot',
    name: 'Treasury balance snapshot',
    triggers: [
      { cron: '*/15 * * * *' },
      { event: 'revolut/webhook.received' },
    ],
  },
  async ({ step, event, logger }) => {
    try {
      const result = await step.run('capture-treasury-snapshot', async () => {
        const admin = createAdminClient()
        if (!admin) {
          throw new Error('Admin client not configured for treasury snapshot.')
        }

        const balance = await getTreasuryBalance()
        if (!balance) {
          return { skipped: true, reason: 'revolut_not_configured' } as const
        }

        // Store snapshot
        const { error } = await admin.from('revolut_treasury_snapshots').insert({
          account_id: balance.accountId,
          balance: balance.balance,
          currency: balance.currency,
          source: event.name === 'revolut/webhook.received' ? 'webhook' : 'api',
          metadata: {
            trigger: event.name,
            raw_event_type: (event.data as Record<string, unknown>)?.eventType,
          },
        })

        if (error) {
          throw new Error(`Failed to store treasury snapshot: ${error.message}`)
        }

        // Check against minimum buffer
        const minBuffer = BigInt(env.MINIMUM_TREASURY_BUFFER_MINOR)
        const isBelowBuffer = balance.balance < minBuffer

        return {
          skipped: false,
          accountId: balance.accountId,
          balance: balance.balance,
          currency: balance.currency,
          minBuffer,
          isBelowBuffer,
          alertFired: isBelowBuffer,
        } as const
      })

      if (!result.skipped && result.alertFired) {
        logger.warn('Treasury balance below minimum buffer!', {
          balance: result.balance,
          minBuffer: result.minBuffer,
          currency: result.currency,
        })

        // TODO: Send alert to ops team (Slack/email)
      }

      logger.info('Treasury snapshot captured.', {
        trigger: event.name,
        ...result,
      })

      return { ok: true, source: 'inngest', ...result }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      Sentry.captureException(err, {
        tags: { area: 'inngest', context: 'treasury_snapshot' },
        extra: { trigger: event.name },
      })
      logger.error('Treasury snapshot failed.', { error: err.message })
      return { ok: false, error: err.message }
    }
  },
)
