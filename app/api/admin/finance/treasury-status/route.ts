import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTreasuryBalance } from '@/lib/payments/revolut/client'
import { env } from '@/lib/config/env'

/**
 * GET /api/admin/finance/treasury-status
 *
 * Returns current treasury status for admin dashboard:
 * - Current Revolut balance
 * - Pending payouts total
 * - Safety buffer threshold
 * - Historical snapshots (last 30 days)
 *
 * Admin-only access.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'Admin client not configured' },
      { status: 500 },
    )
  }

  try {
    // 1. Current treasury balance from Revolut
    const treasury = await getTreasuryBalance()

    // 2. Pending payouts total (batches in submitted/processing status)
    const { data: pendingBatches, error: batchError } = await admin
      .from('payout_batches')
      .select('net_amount')
      .in('status', ['submitted', 'processing'])

    if (batchError) {
      throw new Error(`Failed to load pending batches: ${batchError.message}`)
    }

    const pendingPayoutsTotal = (pendingBatches || []).reduce(
      (sum, batch) => sum + BigInt(batch.net_amount || 0),
      BigInt(0),
    )

    // 3. Safety buffer from env
    const minBuffer = BigInt(env.MINIMUM_TREASURY_BUFFER_MINOR)

    // 4. Historical snapshots (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: snapshots, error: snapshotError } = await admin
      .from('revolut_treasury_snapshots')
      .select('snapshot_at, balance')
      .gte('snapshot_at', thirtyDaysAgo.toISOString())
      .order('snapshot_at', { ascending: true })
      .limit(1000)

    if (snapshotError) {
      throw new Error(`Failed to load snapshots: ${snapshotError.message}`)
    }

    // 5. Recent settlements (last 30 days)
    const { data: settlements, error: settlementError } = await admin
      .from('stripe_settlements')
      .select('stripe_payout_id, amount, fee, net_amount, status, settlement_date, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (settlementError) {
      throw new Error(`Failed to load settlements: ${settlementError.message}`)
    }

    return NextResponse.json({
      currentBalance: treasury?.balance?.toString() || null,
      currency: treasury?.currency || 'BRL',
      pendingPayoutsTotal: pendingPayoutsTotal.toString(),
      safetyBuffer: minBuffer.toString(),
      availableAfterPayouts: treasury?.balance
        ? (treasury.balance - pendingPayoutsTotal).toString()
        : null,
      isBelowBuffer: treasury?.balance
        ? treasury.balance < (pendingPayoutsTotal + minBuffer)
        : null,
      snapshots: (snapshots || []).map((s) => ({
        at: s.snapshot_at,
        balance: s.balance.toString(),
      })),
      recentSettlements: (settlements || []).map((s) => ({
        stripePayoutId: s.stripe_payout_id,
        amount: s.amount.toString(),
        fee: s.fee.toString(),
        netAmount: s.net_amount.toString(),
        status: s.status,
        settlementDate: s.settlement_date,
        createdAt: s.created_at,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[treasury-status] Failed:', message)
    return NextResponse.json(
      { error: 'Failed to load treasury status', details: message },
      { status: 500 },
    )
  }
}
