import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkBookingEligibility,
  checkProfessionalEligibility,
  scanPayoutEligibility,
  shouldProfessionalReceivePayoutNow,
  DEFAULT_ELIGIBILITY_CONFIG,
} from './engine'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('../ledger/balance', () => ({
  getProfessionalBalance: vi.fn(),
  canReceivePayouts: vi.fn(),
}))

import { getProfessionalBalance, canReceivePayouts } from '../ledger/balance'

const mockedGetProfessionalBalance = vi.mocked(getProfessionalBalance)
const mockedCanReceivePayouts = vi.mocked(canReceivePayouts)

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildAdminClient(overrides?: Record<string, unknown>) {
  const rowData: Record<string, { data: unknown; error: unknown }> = {}
  const arrayData: Record<string, { data: unknown[]; error: unknown }> = {}

  function makeChain(table: string) {
    const arrayResult = arrayData[table] ?? { data: [], error: null }

    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'inserted-1' }, error: null }),
      })),
      update: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockImplementation(() => ({
        then: (onFulfilled: (v: unknown) => unknown) =>
          Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
      })),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
      single: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
      // Make chain awaitable — resolves to array data
      then: (onFulfilled: (v: unknown) => unknown) =>
        Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
    }

    return chain
  }

  const fromFn = vi.fn().mockImplementation((table: string) => makeChain(table))

  const client = {
    from: fromFn,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  } as unknown as Parameters<typeof checkBookingEligibility>[0]

  ;(client as any).__seedRow = (table: string, data: unknown, error: unknown = null) => {
    rowData[table] = { data, error }
  }
  ;(client as any).__seedArray = (table: string, data: unknown[], error: unknown = null) => {
    arrayData[table] = { data, error }
  }

  return client
}

function makeBooking(overrides?: Record<string, unknown>) {
  return {
    id: 'book-1',
    status: 'completed',
    scheduled_end_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    professional_id: 'prof-1',
    payments: { status: 'captured', amount_total_minor: 10000 },
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('shouldProfessionalReceivePayoutNow', () => {
  it('returns true for first payout (no lastPayoutAt)', () => {
    expect(shouldProfessionalReceivePayoutNow('weekly', null)).toBe(true)
    expect(shouldProfessionalReceivePayoutNow('monthly', undefined)).toBe(true)
  })

  it('returns true when weekly period has passed', () => {
    const last = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('weekly', last)).toBe(true)
  })

  it('returns false when weekly period has not passed', () => {
    const last = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('weekly', last)).toBe(false)
  })

  it('returns true when biweekly period has passed', () => {
    const last = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('biweekly', last)).toBe(true)
  })

  it('returns false when biweekly period has not passed', () => {
    const last = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('biweekly', last)).toBe(false)
  })

  it('returns true when monthly period has passed', () => {
    const last = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('monthly', last)).toBe(true)
  })

  it('returns false when monthly period has not passed', () => {
    const last = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('monthly', last)).toBe(false)
  })

  it('defaults to weekly for unknown periodicity', () => {
    const last = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldProfessionalReceivePayoutNow('unknown' as any, last)).toBe(true)
  })
})

describe('checkBookingEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns not found when booking does not exist', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', null, null)
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('not found')
  })

  it('returns ineligible when booking status is not completed', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking({ status: 'confirmed' }))
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain("'confirmed'")
  })

  it('returns ineligible when payment is not captured', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking({ payments: { status: 'pending', amount_total_minor: 10000 } }))
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain("'pending'")
  })

  it('returns ineligible when cooldown has not passed', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking({ scheduled_end_at: new Date().toISOString() }))
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('Cooldown')
  })

  it('returns ineligible when open dispute exists', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking())
    ;(admin as any).__seedRow('dispute_resolutions', { id: 'disp-1' })
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('open dispute')
  })

  it('returns ineligible when already in active batch', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking())
    ;(admin as any).__seedRow('dispute_resolutions', null, null)
    ;(admin as any).__seedArray('booking_payout_items', [{ payout_batch_item_id: 'bpi-1' }])
    ;(admin as any).__seedArray('payout_batch_items', [
      { id: 'bpi-1', batch_id: 'batch-1', payout_batches: { status: 'submitted' } },
    ])
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('already included')
  })

  it('returns ineligible when professional has no active trolley recipient', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking())
    ;(admin as any).__seedRow('dispute_resolutions', null, null)
    ;(admin as any).__seedArray('booking_payout_items', [])
    ;(admin as any).__seedRow('trolley_recipients', null, null)
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('no active Trolley')
  })

  it('returns ineligible when professional KYC is not approved', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking())
    ;(admin as any).__seedRow('dispute_resolutions', null, null)
    ;(admin as any).__seedArray('booking_payout_items', [])
    ;(admin as any).__seedRow('trolley_recipients', { is_active: true, kyc_status: 'pending' })
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain("'pending'")
  })

  it('returns eligible when all criteria met', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('bookings', makeBooking())
    ;(admin as any).__seedRow('dispute_resolutions', null, null)
    ;(admin as any).__seedArray('booking_payout_items', [])
    ;(admin as any).__seedRow('trolley_recipients', { is_active: true, kyc_status: 'approved' })
    const result = await checkBookingEligibility(admin, 'book-1')
    expect(result.eligible).toBe(true)
    expect(result.eligibleAmount).toBe(BigInt(10000))
  })
})

describe('checkProfessionalEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetProfessionalBalance.mockReset()
    mockedCanReceivePayouts.mockReset()
  })

  it('returns ineligible when balance check fails', async () => {
    const admin = buildAdminClient()
    mockedGetProfessionalBalance.mockResolvedValue({
      professionalId: 'prof-1',
      availableBalance: BigInt(0),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(999999),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: new Date().toISOString(),
    })
    mockedCanReceivePayouts.mockReturnValue({ eligible: false, reason: 'Debt too high' })

    const result = await checkProfessionalEligibility(admin, 'prof-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Debt too high')
  })

  it('returns ineligible when periodicity not met', async () => {
    const admin = buildAdminClient()
    const lastWeek = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    mockedGetProfessionalBalance.mockResolvedValue({
      professionalId: 'prof-1',
      availableBalance: BigInt(10000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: lastWeek,
      lastCalculatedAt: lastWeek,
    })
    mockedCanReceivePayouts.mockReturnValue({ eligible: true })
    ;(admin as any).__seedArray('professional_settings', [{ payout_periodicity: 'weekly' }])
    ;(admin as any).__seedArray('bookings', [])

    const result = await checkProfessionalEligibility(admin, 'prof-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('weekly')
  })

  it('returns ineligible when no eligible bookings', async () => {
    const admin = buildAdminClient()
    mockedGetProfessionalBalance.mockResolvedValue({
      professionalId: 'prof-1',
      availableBalance: BigInt(10000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: new Date().toISOString(),
    })
    mockedCanReceivePayouts.mockReturnValue({ eligible: true })
    ;(admin as any).__seedArray('professional_settings', [{ payout_periodicity: 'weekly' }])
    ;(admin as any).__seedArray('bookings', [])

    const result = await checkProfessionalEligibility(admin, 'prof-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('No eligible bookings')
  })

  it('returns ineligible when total below minimum', async () => {
    const admin = buildAdminClient()
    mockedGetProfessionalBalance.mockResolvedValue({
      professionalId: 'prof-1',
      availableBalance: BigInt(100),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: new Date().toISOString(),
    })
    mockedCanReceivePayouts.mockReturnValue({ eligible: true })
    ;(admin as any).__seedArray('professional_settings', [{ payout_periodicity: 'weekly' }])
    const eligibleBooking = makeBooking({ payments: { status: 'captured', amount_total_minor: 100 } })
    ;(admin as any).__seedArray('bookings', [eligibleBooking])
    ;(admin as any).__seedRow('bookings', eligibleBooking)
    ;(admin as any).__seedRow('dispute_resolutions', null, null)
    ;(admin as any).__seedArray('booking_payout_items', [])
    ;(admin as any).__seedRow('trolley_recipients', { is_active: true, kyc_status: 'approved' })

    const result = await checkProfessionalEligibility(admin, 'prof-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('below minimum')
  })
})

describe('scanPayoutEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetProfessionalBalance.mockReset()
    mockedCanReceivePayouts.mockReset()
  })

  it('returns empty when no active professionals', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedArray('trolley_recipients', [])
    const result = await scanPayoutEligibility(admin)
    expect(result.eligibleProfessionals).toHaveLength(0)
    expect(result.ineligibleProfessionals).toHaveLength(0)
    expect(result.totalBatchAmount).toBe(BigInt(0))
  })

  it('scans all active professionals', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedArray('trolley_recipients', [
      { professional_id: 'prof-1' },
      { professional_id: 'prof-2' },
    ])
    mockedGetProfessionalBalance.mockResolvedValue({
      professionalId: 'prof-1',
      availableBalance: BigInt(0),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: new Date().toISOString(),
    })
    mockedCanReceivePayouts.mockReturnValue({ eligible: true })
    ;(admin as any).__seedArray('professional_settings', [{ payout_periodicity: 'weekly' }])
    ;(admin as any).__seedArray('bookings', [])

    const result = await scanPayoutEligibility(admin)
    expect(result.ineligibleProfessionals.length).toBeGreaterThan(0)
  })
})
