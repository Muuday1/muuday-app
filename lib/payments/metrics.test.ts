import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateFinancialMetrics } from './metrics'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAdmin(tables: Record<string, any[]> = {}) {
  return {
    from: (table: string) => {
      const data = tables[table] || []
      let result = data
      const chain: any = {
        select: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: () => Promise.resolve({ data: result[0] || null, error: null }),
        eq: (col: string, val: any) => {
          result = result.filter((r) => r[col] === val)
          return chain
        },
        in: (col: string, vals: any[]) => {
          result = result.filter((r) => vals.includes(r[col]))
          return chain
        },
        gte: () => chain,
        then: (cb: (r: any) => any) => Promise.resolve(cb({ data: result, error: null })),
      }
      return chain
    },
  } as unknown as SupabaseClient
}

// ---------------------------------------------------------------------------
// calculateFinancialMetrics
// ---------------------------------------------------------------------------

describe('calculateFinancialMetrics', () => {
  it('returns nulls and zeros when all tables are empty', async () => {
    const admin = createMockAdmin()
    const metrics = await calculateFinancialMetrics(admin)

    expect(metrics.treasuryBufferPercent).toBeNull()
    expect(metrics.avgPayoutTimeHours).toBeNull()
    expect(metrics.disputeRate).toBeNull()
    expect(metrics.totalRevenue30d).toBe(BigInt(0))
    expect(metrics.totalPayouts30d).toBe(BigInt(0))
    expect(metrics.totalRefunds30d).toBe(BigInt(0))
    expect(metrics.totalStripeFees30d).toBe(BigInt(0))
    expect(metrics.totalTrolleyFees30d).toBe(BigInt(0))
  })

  it('calculates treasury buffer percent correctly', async () => {
    const admin = createMockAdmin({
      revolut_treasury_snapshots: [{ balance: '1000000' }],
      payout_batches: [
        { net_amount: '100000', status: 'submitted' },
        { net_amount: '50000', status: 'processing' },
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    // (1_000_000 - 150_000) * 100 / 1_000_000 = 85
    expect(metrics.treasuryBufferPercent).toBe(85)
  })

  it('returns null treasury buffer when treasury balance is zero', async () => {
    const admin = createMockAdmin({
      revolut_treasury_snapshots: [{ balance: '0' }],
      payout_batches: [],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.treasuryBufferPercent).toBeNull()
  })

  it('calculates avg payout time for completed batches', async () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const admin = createMockAdmin({
      payout_batches: [
        { created_at: oneDayAgo.toISOString(), completed_at: now.toISOString(), status: 'completed' },
        { created_at: twoDaysAgo.toISOString(), completed_at: now.toISOString(), status: 'completed' },
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    // avg of 24h and 48h = 36h
    expect(metrics.avgPayoutTimeHours).toBe(36)
  })

  it('returns null avg payout time when no completed batches', async () => {
    const admin = createMockAdmin()
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.avgPayoutTimeHours).toBeNull()
  })

  it('ignores batches with negative hours', async () => {
    const now = new Date()
    const past = new Date(now.getTime() - 60 * 60 * 1000)

    const admin = createMockAdmin({
      payout_batches: [
        // completed_at is BEFORE created_at → negative hours
        { created_at: now.toISOString(), completed_at: past.toISOString(), status: 'completed' },
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.avgPayoutTimeHours).toBeNull()
  })

  it('calculates dispute rate correctly', async () => {
    const admin = createMockAdmin({
      dispute_resolutions: [{ id: 'd1', status: 'open' }, { id: 'd2', status: 'open' }],
      bookings: [{ id: 'b1', status: 'completed' }, { id: 'b2', status: 'completed' }, { id: 'b3', status: 'completed' }],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.disputeRate).toBe(2 / 3)
  })

  it('returns null dispute rate when no completed bookings', async () => {
    const admin = createMockAdmin({
      dispute_resolutions: [{ id: 'd1', status: 'open' }],
      bookings: [],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.disputeRate).toBeNull()
  })

  it('aggregates ledger revenue correctly', async () => {
    const admin = createMockAdmin({
      ledger_entries: [
        { account_id: '3000', entry_type: 'credit', amount: '50000' },
        { account_id: '3000', entry_type: 'credit', amount: '30000' },
        { account_id: '3000', entry_type: 'debit', amount: '10000' }, // should be ignored
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.totalRevenue30d).toBe(BigInt(80000))
  })

  it('aggregates ledger payouts correctly', async () => {
    const admin = createMockAdmin({
      ledger_entries: [
        { account_id: '4000', entry_type: 'debit', amount: '100000' },
        { account_id: '4000', entry_type: 'credit', amount: '20000' }, // should be ignored
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.totalPayouts30d).toBe(BigInt(100000))
  })

  it('aggregates ledger refunds correctly', async () => {
    const admin = createMockAdmin({
      ledger_entries: [
        { account_id: '2100', entry_type: 'debit', amount: '25000' },
        { account_id: '2100', entry_type: 'credit', amount: '5000' }, // ignored
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.totalRefunds30d).toBe(BigInt(25000))
  })

  it('aggregates stripe fees correctly', async () => {
    const admin = createMockAdmin({
      ledger_entries: [
        { account_id: '3100', entry_type: 'debit', amount: '1500' },
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.totalStripeFees30d).toBe(BigInt(1500))
  })

  it('aggregates trolley fees correctly', async () => {
    const admin = createMockAdmin({
      ledger_entries: [
        { account_id: '3200', entry_type: 'debit', amount: '750' },
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.totalTrolleyFees30d).toBe(BigInt(750))
  })

  it('ignores unrecognised account_ids in ledger', async () => {
    const admin = createMockAdmin({
      ledger_entries: [
        { account_id: '9999', entry_type: 'credit', amount: '100000' },
      ],
    })
    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.totalRevenue30d).toBe(BigInt(0))
    expect(metrics.totalPayouts30d).toBe(BigInt(0))
  })

  it('handles all metric types in a single comprehensive scenario', async () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const admin = createMockAdmin({
      revolut_treasury_snapshots: [{ balance: '2000000' }],
      payout_batches: [
        { net_amount: '200000', status: 'submitted' },
        { created_at: oneDayAgo.toISOString(), completed_at: now.toISOString(), status: 'completed' },
      ],
      dispute_resolutions: [{ id: 'd1', status: 'open' }],
      bookings: [{ id: 'b1', status: 'completed' }, { id: 'b2', status: 'completed' }],
      ledger_entries: [
        { account_id: '3000', entry_type: 'credit', amount: '100000' },
        { account_id: '4000', entry_type: 'debit', amount: '80000' },
        { account_id: '2100', entry_type: 'debit', amount: '5000' },
        { account_id: '3100', entry_type: 'debit', amount: '2000' },
        { account_id: '3200', entry_type: 'debit', amount: '1000' },
      ],
    })

    const metrics = await calculateFinancialMetrics(admin)
    expect(metrics.treasuryBufferPercent).toBe(90) // (2_000_000 - 200_000) * 100 / 2_000_000
    expect(metrics.avgPayoutTimeHours).toBe(24)
    expect(metrics.disputeRate).toBe(0.5)
    expect(metrics.totalRevenue30d).toBe(BigInt(100000))
    expect(metrics.totalPayouts30d).toBe(BigInt(80000))
    expect(metrics.totalRefunds30d).toBe(BigInt(5000))
    expect(metrics.totalStripeFees30d).toBe(BigInt(2000))
    expect(metrics.totalTrolleyFees30d).toBe(BigInt(1000))
  })
})
