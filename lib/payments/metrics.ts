/**
 * Financial Metrics — Phase 6.3
 *
 * Calculates key financial metrics for the admin dashboard and observability.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface FinancialMetrics {
  treasuryBufferPercent: number | null
  avgPayoutTimeHours: number | null
  disputeRate: number | null
  totalRevenue30d: bigint
  totalPayouts30d: bigint
  totalRefunds30d: bigint
  totalStripeFees30d: bigint
  totalTrolleyFees30d: bigint
}

export async function calculateFinancialMetrics(
  admin: SupabaseClient,
): Promise<FinancialMetrics> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()

  // Treasury buffer %
  const { data: treasurySnapshot } = await admin
    .from('revolut_treasury_snapshots')
    .select('balance')
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: pendingBatches } = await admin
    .from('payout_batches')
    .select('net_amount')
    .in('status', ['submitted', 'processing'])

  const treasuryBalance = BigInt(treasurySnapshot?.balance || 0)
  const pendingTotal = (pendingBatches || []).reduce(
    (sum, b) => sum + BigInt(b.net_amount || 0),
    BigInt(0),
  )

  const treasuryBufferPercent = treasuryBalance > BigInt(0)
    ? Number(((treasuryBalance - pendingTotal) * BigInt(100)) / treasuryBalance)
    : null

  // Avg payout time (hours from created_at to completed_at)
  const { data: completedBatches } = await admin
    .from('payout_batches')
    .select('created_at, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', thirtyDaysAgoIso)

  let avgPayoutTimeHours: number | null = null
  if (completedBatches && completedBatches.length > 0) {
    let totalHours = 0
    let count = 0
    for (const b of completedBatches) {
      if (b.created_at && b.completed_at) {
        const created = new Date(b.created_at).getTime()
        const completed = new Date(b.completed_at).getTime()
        const hours = (completed - created) / (1000 * 60 * 60)
        if (hours >= 0) {
          totalHours += hours
          count += 1
        }
      }
    }
    avgPayoutTimeHours = count > 0 ? totalHours / count : null
  }

  // Dispute rate (open disputes / total completed bookings in 30d)
  const { data: openDisputes } = await admin
    .from('dispute_resolutions')
    .select('id')
    .eq('status', 'open')

  const { data: completedBookings } = await admin
    .from('bookings')
    .select('id')
    .eq('status', 'completed')
    .gte('scheduled_end_at', thirtyDaysAgoIso)

  const disputeRate = completedBookings && completedBookings.length > 0
    ? (openDisputes?.length || 0) / completedBookings.length
    : null

  // Ledger aggregates (30d)
  const { data: ledgerEntries } = await admin
    .from('ledger_entries')
    .select('account_id, entry_type, amount')
    .gte('created_at', thirtyDaysAgoIso)

  let totalRevenue30d = BigInt(0)
  let totalPayouts30d = BigInt(0)
  let totalRefunds30d = BigInt(0)
  let totalStripeFees30d = BigInt(0)
  let totalTrolleyFees30d = BigInt(0)

  for (const entry of ledgerEntries || []) {
    const amount = BigInt(entry.amount || 0)
    switch (entry.account_id) {
      case '4100': // PLATFORM_FEE_REVENUE
        if (entry.entry_type === 'credit') totalRevenue30d += amount
        break
      case '3100': // PROFESSIONAL_BALANCE
        if (entry.entry_type === 'debit') totalPayouts30d += amount
        break
      case '2100': // CUSTOMER_DEPOSITS_HELD
        if (entry.entry_type === 'debit') totalRefunds30d += amount
        break
      case '6100': // STRIPE_FEE_EXPENSE
        if (entry.entry_type === 'debit') totalStripeFees30d += amount
        break
      case '6200': // TROLLEY_FEE_EXPENSE
        if (entry.entry_type === 'debit') totalTrolleyFees30d += amount
        break
    }
  }

  return {
    treasuryBufferPercent,
    avgPayoutTimeHours,
    disputeRate,
    totalRevenue30d,
    totalPayouts30d,
    totalRefunds30d,
    totalStripeFees30d,
    totalTrolleyFees30d,
  }
}
