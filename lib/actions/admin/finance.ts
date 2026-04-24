'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getTreasuryBalance } from '@/lib/payments/revolut/client'
import { processRefund } from '@/lib/payments/refund/engine'
import {
  createLedgerTransaction,
  buildPayoutTransaction,
} from '@/lib/payments/ledger/entries'
import { ADMIN_ADJUSTMENT, PROFESSIONAL_BALANCE } from '@/lib/payments/ledger/accounts'
import { updateProfessionalBalance } from '@/lib/payments/ledger/balance'
import { env } from '@/lib/config/env'
import { requireAdmin } from './shared'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FinanceActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface FinanceOverviewData {
  treasury: {
    balance: string | null
    currency: string
    pendingPayoutsTotal: string
    safetyBuffer: string
    availableAfterPayouts: string | null
    isBelowBuffer: boolean | null
  }
  payouts: {
    pendingCount: number
    pendingTotal: string
    completedLast30Days: number
    completedTotalLast30Days: string
    failedLast30Days: number
  }
  disputes: {
    openCount: number
    openTotal: string
    recoveredLast30Days: number
    recoveredTotalLast30Days: string
  }
  ledger: {
    totalRevenueLast30Days: string
    totalStripeFeesLast30Days: string
    totalTrolleyFeesLast30Days: string
    transactionCountLast30Days: number
  }
  professionalsWithHighDebt: Array<{
    professionalId: string
    name: string
    email: string
    totalDebt: string
  }>
}

export interface LedgerEntryRow {
  id: string
  transactionId: string
  createdAt: string
  accountId: string
  entryType: string
  amount: string
  currency: string
  bookingId?: string
  paymentId?: string
  payoutBatchId?: string
  description?: string
}

export interface PayoutBatchRow {
  id: string
  status: string
  totalAmount: string
  netAmount: string
  totalFees: string
  itemCount: number
  createdAt: string
  submittedAt?: string
  completedAt?: string
  failedAt?: string
  failureReason?: string
}

export interface DisputeRow {
  id: string
  bookingId: string
  professionalId: string
  professionalName?: string
  disputeAmount: string
  recoveredAmount: string
  remainingDebt: string
  status: string
  recoveryMethod: string
  createdAt: string
  resolvedAt?: string
  notes?: string
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function loadFinanceOverview(): Promise<FinanceActionResult<FinanceOverviewData>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()

  try {
    const treasury = await getTreasuryBalance()
    const { data: pendingBatches } = await admin
      .from('payout_batches')
      .select('net_amount')
      .in('status', ['submitted', 'processing'])

    const pendingPayoutsTotal = (pendingBatches || []).reduce(
      (sum, b) => sum + BigInt(b.net_amount || 0),
      BigInt(0),
    )
    const minBuffer = BigInt(env.MINIMUM_TREASURY_BUFFER_MINOR)

    const { data: pendingPayoutItems } = await admin
      .from('payout_batch_items')
      .select('id')
      .in('status', ['submitted', 'processing'])

    const { data: completedPayouts } = await admin
      .from('payout_batches')
      .select('net_amount')
      .eq('status', 'completed')
      .gte('completed_at', thirtyDaysAgoIso)

    const { data: failedPayouts } = await admin
      .from('payout_batches')
      .select('id')
      .eq('status', 'failed')
      .gte('updated_at', thirtyDaysAgoIso)

    const { data: openDisputes } = await admin
      .from('dispute_resolutions')
      .select('dispute_amount')
      .eq('status', 'open')

    const { data: recoveredDisputes } = await admin
      .from('dispute_resolutions')
      .select('recovered_amount')
      .eq('status', 'recovered')
      .gte('resolved_at', thirtyDaysAgoIso)

    const { data: ledgerEntries } = await admin
      .from('ledger_entries')
      .select('account_id, entry_type, amount, created_at')
      .gte('created_at', thirtyDaysAgoIso)

    let totalRevenue = BigInt(0)
    let totalStripeFees = BigInt(0)
    let totalTrolleyFees = BigInt(0)
    let transactionCount = 0

    for (const entry of ledgerEntries || []) {
      transactionCount += 1
      const amount = BigInt(entry.amount || 0)
      if (entry.account_id === '4100' && entry.entry_type === 'credit') {
        totalRevenue += amount
      }
      if (entry.account_id === '6100' && entry.entry_type === 'debit') {
        totalStripeFees += amount
      }
      if (entry.account_id === '6200' && entry.entry_type === 'debit') {
        totalTrolleyFees += amount
      }
    }

    const maxDebt = BigInt(env.MAX_PROFESSIONAL_DEBT_MINOR)
    const { data: highDebtPros } = await admin
      .from('professional_balances')
      .select('professional_id, total_debt, professionals(name, email)')
      .gt('total_debt', Number(maxDebt))
      .order('total_debt', { ascending: false })
      .limit(10)

    const professionalsWithHighDebt = (highDebtPros || []).map((row) => {
      const pro = (row as unknown as { professionals?: { name?: string; email?: string } }).professionals
      return {
        professionalId: row.professional_id,
        name: pro?.name || 'Unknown',
        email: pro?.email || '',
        totalDebt: String(row.total_debt || 0),
      }
    })

    const data: FinanceOverviewData = {
      treasury: {
        balance: treasury?.balance?.toString() || null,
        currency: treasury?.currency || 'BRL',
        pendingPayoutsTotal: pendingPayoutsTotal.toString(),
        safetyBuffer: minBuffer.toString(),
        availableAfterPayouts: treasury?.balance
          ? (treasury.balance - pendingPayoutsTotal).toString()
          : null,
        isBelowBuffer: treasury?.balance
          ? treasury.balance < (pendingPayoutsTotal + minBuffer)
          : null,
      },
      payouts: {
        pendingCount: pendingPayoutItems?.length || 0,
        pendingTotal: pendingPayoutsTotal.toString(),
        completedLast30Days: completedPayouts?.length || 0,
        completedTotalLast30Days: (completedPayouts || [])
          .reduce((sum, p) => sum + BigInt(p.net_amount || 0), BigInt(0))
          .toString(),
        failedLast30Days: failedPayouts?.length || 0,
      },
      disputes: {
        openCount: openDisputes?.length || 0,
        openTotal: (openDisputes || [])
          .reduce((sum, d) => sum + BigInt(d.dispute_amount || 0), BigInt(0))
          .toString(),
        recoveredLast30Days: recoveredDisputes?.length || 0,
        recoveredTotalLast30Days: (recoveredDisputes || [])
          .reduce((sum, d) => sum + BigInt(d.recovered_amount || 0), BigInt(0))
          .toString(),
      },
      ledger: {
        totalRevenueLast30Days: totalRevenue.toString(),
        totalStripeFeesLast30Days: totalStripeFees.toString(),
        totalTrolleyFeesLast30Days: totalTrolleyFees.toString(),
        transactionCountLast30Days: transactionCount,
      },
      professionalsWithHighDebt,
    }

    return { success: true, data }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/finance] loadFinanceOverview failed:', msg)
    return { success: false, error: 'Erro ao carregar dados financeiros.' }
  }
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export async function loadLedgerEntries(params: {
  limit?: number
  offset?: number
  accountId?: string
  bookingId?: string
}): Promise<FinanceActionResult<{ entries: LedgerEntryRow[]; total: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  try {
    let query = admin
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (params.accountId) {
      query = query.eq('account_id', params.accountId)
    }
    if (params.bookingId) {
      query = query.eq('booking_id', params.bookingId)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const entries: LedgerEntryRow[] = (data || []).map((e) => ({
      id: e.id,
      transactionId: e.transaction_id,
      createdAt: e.created_at,
      accountId: e.account_id,
      entryType: e.entry_type,
      amount: String(e.amount || 0),
      currency: e.currency,
      bookingId: e.booking_id,
      paymentId: e.payment_id,
      payoutBatchId: e.payout_batch_id,
      description: e.description,
    }))

    return { success: true, data: { entries, total: count ?? 0 } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

export async function loadPayoutBatches(params: {
  limit?: number
  offset?: number
  status?: string
}): Promise<FinanceActionResult<{ batches: PayoutBatchRow[]; total: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  try {
    let query = admin
      .from('payout_batches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const batches: PayoutBatchRow[] = (data || []).map((b) => ({
      id: b.id,
      status: b.status,
      totalAmount: String(b.total_amount || 0),
      netAmount: String(b.net_amount || 0),
      totalFees: String(b.total_fees || 0),
      itemCount: b.item_count || 0,
      createdAt: b.created_at,
      submittedAt: b.submitted_at,
      completedAt: b.completed_at,
      failedAt: b.failed_at,
      failureReason: b.failure_reason,
    }))

    return { success: true, data: { batches, total: count ?? 0 } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export async function loadDisputes(params: {
  limit?: number
  offset?: number
  status?: string
}): Promise<FinanceActionResult<{ disputes: DisputeRow[]; total: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  try {
    let query = admin
      .from('dispute_resolutions')
      .select('*, professionals(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const disputes: DisputeRow[] = (data || []).map((d) => {
      const pro = (d as unknown as { professionals?: { name?: string } }).professionals
      return {
        id: d.id,
        bookingId: d.booking_id,
        professionalId: d.professional_id,
        professionalName: pro?.name,
        disputeAmount: String(d.dispute_amount || 0),
        recoveredAmount: String(d.recovered_amount || 0),
        remainingDebt: String(d.remaining_debt || 0),
        status: d.status,
        recoveryMethod: d.recovery_method,
        createdAt: d.created_at,
        resolvedAt: d.resolved_at,
        notes: d.notes,
      }
    })

    return { success: true, data: { disputes, total: count ?? 0 } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Force Actions (Phase 6.2)
// ---------------------------------------------------------------------------

export type ForceActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

/**
 * Force a manual payout to a professional (emergency admin action).
 *
 * Creates a single-item payout batch and processes it immediately.
 * Always creates a ledger entry for audit trail.
 */
export async function forcePayout(
  professionalId: string,
  amount: number, // in minor units
  reason: string,
): Promise<ForceActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  try {
    const amountBig = BigInt(amount)
    if (amountBig <= BigInt(0)) {
      return { success: false, error: 'Amount must be positive.' }
    }

    // Create a special "force" payout batch
    const { data: batch } = await admin
      .from('payout_batches')
      .insert({
        status: 'completed',
        total_amount: amountBig,
        net_amount: amountBig,
        total_fees: BigInt(0),
        item_count: 1,
        metadata: {
          force_action: true,
          admin_reason: reason,
        },
      })
      .select('id')
      .single()

    if (!batch) {
      return { success: false, error: 'Failed to create force payout batch.' }
    }

    // Create batch item
    await admin.from('payout_batch_items').insert({
      batch_id: batch.id,
      professional_id: professionalId,
      amount: amountBig,
      net_amount: amountBig,
      fee_amount: BigInt(0),
      debt_deducted: BigInt(0),
      trolley_fee_absorbed: BigInt(0),
      status: 'completed',
      metadata: { force_action: true, admin_reason: reason },
    })

    // Create ledger entry
    const ledgerInput = buildPayoutTransaction({
      amount: amountBig,
      professionalId,
      payoutBatchId: batch.id,
    })
    await createLedgerTransaction(admin, ledgerInput)

    // Update professional balance
    await updateProfessionalBalance(admin, professionalId, {
      availableDelta: -amountBig,
    })

    return {
      success: true,
      message: `Force payout of ${amountBig} created for professional ${professionalId}.`,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/finance] forcePayout failed:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Force a refund bypassing eligibility checks (emergency admin action).
 */
export async function forceRefund(
  bookingId: string,
  percentage: number,
  reason: string,
): Promise<ForceActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  try {
    const { data: { user } } = await admin.auth.getUser()
    const adminId = user?.id || 'system'

    const result = await processRefund(admin, {
      bookingId,
      reason,
      percentage,
      adminId,
    })

    if (!result.success) {
      return { success: false, error: result.stripeError || 'Refund failed.' }
    }

    return {
      success: true,
      message: `Force refund processed: ${result.refundId}, amount: ${result.amountRefunded}`,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/finance] forceRefund failed:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Adjust a professional's balance (emergency admin action).
 *
 * Creates a ledger entry for audit trail.
 */
export async function adjustProfessionalBalance(
  professionalId: string,
  delta: number, // in minor units, can be negative
  reason: string,
): Promise<ForceActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Acesso negado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured.' }
  }

  try {
    const deltaBig = BigInt(delta)

    // Update balance
    await updateProfessionalBalance(admin, professionalId, {
      availableDelta: deltaBig,
    })

    // Create adjustment ledger entry
    // Admin adjustment: if adding to pro balance, we debit ADMIN_ADJUSTMENT (expense)
    // and credit PROFESSIONAL_BALANCE. If removing, reverse.
    const absAmount = deltaBig >= BigInt(0) ? deltaBig : -deltaBig

    await createLedgerTransaction(admin, {
      currency: 'BRL',
      description: `Admin balance adjustment: ${reason}`,
      entries: [
        {
          account: ADMIN_ADJUSTMENT,
          entryType: deltaBig >= BigInt(0) ? 'debit' : 'credit',
          amount: absAmount,
          description: reason,
        },
        {
          account: PROFESSIONAL_BALANCE,
          entryType: deltaBig >= BigInt(0) ? 'credit' : 'debit',
          amount: absAmount,
          description: reason,
        },
      ],
    })

    return {
      success: true,
      message: `Balance adjusted by ${deltaBig} for professional ${professionalId}.`,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/finance] adjustProfessionalBalance failed:', msg)
    return { success: false, error: msg }
  }
}
