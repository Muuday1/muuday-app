import { describe, it, expect, vi } from 'vitest'
import {
  getProfessionalBalance,
  getAllProfessionalBalances,
  updateProfessionalBalance,
  recordPayoutToProfessional,
  holdBalanceForDispute,
  releaseHeldBalance,
  addProfessionalDebt,
  validateBalance,
  canReceivePayouts,
} from './balance'

function buildAdminClient(overrides?: Record<string, unknown>) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  } as unknown as Parameters<typeof getProfessionalBalance>[0]
}

describe('getProfessionalBalance', () => {
  it('returns null when no balance exists', async () => {
    const admin = buildAdminClient()
    const result = await getProfessionalBalance(admin, 'prof-1')
    expect(result).toBeNull()
  })

  it('returns parsed balance when found', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            professional_id: 'prof-1',
            available_balance: '50000',
            withheld_balance: '10000',
            pending_balance: '20000',
            total_debt: '0',
            currency: 'BRL',
            last_payout_at: '2026-01-01T00:00:00Z',
            last_calculated_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
      }),
    })

    const result = await getProfessionalBalance(admin, 'prof-1')
    expect(result).not.toBeNull()
    expect(result!.professionalId).toBe('prof-1')
    expect(result!.availableBalance).toBe(BigInt(50000))
    expect(result!.withheldBalance).toBe(BigInt(10000))
    expect(result!.pendingBalance).toBe(BigInt(20000))
    expect(result!.totalDebt).toBe(BigInt(0))
    expect(result!.currency).toBe('BRL')
  })

  it('throws when query errors', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB down' } }),
      }),
    })

    await expect(getProfessionalBalance(admin, 'prof-1')).rejects.toThrow('DB down')
  })
})

describe('getAllProfessionalBalances', () => {
  it('returns empty array when no balances', async () => {
    const admin = buildAdminClient()
    const result = await getAllProfessionalBalances(admin)
    expect(result).toEqual([])
  })

  it('returns parsed balances', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) =>
          cb({
            data: [
              {
                professional_id: 'prof-1',
                available_balance: '1000',
                withheld_balance: '0',
                pending_balance: '0',
                total_debt: '0',
                currency: 'BRL',
                last_payout_at: null,
                last_calculated_at: '2026-01-01T00:00:00Z',
              },
            ],
            error: null,
          }),
        ),
      }),
    })

    // Override the chain since `.then` bypasses normal async
    admin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb) =>
        cb({
          data: [
            {
              professional_id: 'prof-1',
              available_balance: '1000',
              withheld_balance: '0',
              pending_balance: '0',
              total_debt: '0',
              currency: 'BRL',
              last_payout_at: null,
              last_calculated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      ),
    })

    const result = await getAllProfessionalBalances(admin)
    expect(result).toHaveLength(1)
    expect(result[0].availableBalance).toBe(BigInt(1000))
  })
})

describe('updateProfessionalBalance', () => {
  it('calls the atomic RPC with correct deltas', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          professional_id: 'prof-1',
          available_balance: '15000',
          withheld_balance: '5000',
          pending_balance: '10000',
          total_debt: '0',
          currency: 'BRL',
          last_payout_at: null,
          last_calculated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    })

    const result = await updateProfessionalBalance(admin, 'prof-1', {
      availableDelta: BigInt(5000),
      pendingDelta: BigInt(-2000),
    })

    expect(admin.rpc).toHaveBeenCalledWith('update_professional_balance_atomic', {
      p_professional_id: 'prof-1',
      p_available_delta: 5000,
      p_withheld_delta: 0,
      p_pending_delta: -2000,
      p_debt_delta: 0,
      p_last_payout_at: null,
    })

    expect(result.availableBalance).toBe(BigInt(15000))
  })

  it('throws when RPC returns error', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'Race condition' } }),
    })

    await expect(
      updateProfessionalBalance(admin, 'prof-1', { availableDelta: BigInt(100) }),
    ).rejects.toThrow('Race condition')
  })

  it('throws when RPC returns no data', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    await expect(
      updateProfessionalBalance(admin, 'prof-1', { availableDelta: BigInt(100) }),
    ).rejects.toThrow('returned no data')
  })
})

describe('recordPayoutToProfessional', () => {
  it('decreases available balance and sets lastPayoutAt', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          professional_id: 'prof-1',
          available_balance: '30000',
          withheld_balance: '0',
          pending_balance: '0',
          total_debt: '0',
          currency: 'BRL',
          last_payout_at: expect.any(String),
          last_calculated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    })

    await recordPayoutToProfessional(admin, 'prof-1', BigInt(20000))

    expect(admin.rpc).toHaveBeenCalledWith(
      'update_professional_balance_atomic',
      expect.objectContaining({
        p_professional_id: 'prof-1',
        p_available_delta: -20000,
        p_last_payout_at: expect.any(String),
      }),
    )
  })
})

describe('holdBalanceForDispute', () => {
  it('moves amount from available to withheld', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          professional_id: 'prof-1',
          available_balance: '40000',
          withheld_balance: '10000',
          pending_balance: '0',
          total_debt: '0',
          currency: 'BRL',
          last_payout_at: null,
          last_calculated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    })

    await holdBalanceForDispute(admin, 'prof-1', BigInt(10000))

    expect(admin.rpc).toHaveBeenCalledWith(
      'update_professional_balance_atomic',
      expect.objectContaining({
        p_available_delta: -10000,
        p_withheld_delta: 10000,
      }),
    )
  })
})

describe('releaseHeldBalance', () => {
  it('moves amount from withheld back to available', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          professional_id: 'prof-1',
          available_balance: '50000',
          withheld_balance: '0',
          pending_balance: '0',
          total_debt: '0',
          currency: 'BRL',
          last_payout_at: null,
          last_calculated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    })

    await releaseHeldBalance(admin, 'prof-1', BigInt(10000))

    expect(admin.rpc).toHaveBeenCalledWith(
      'update_professional_balance_atomic',
      expect.objectContaining({
        p_available_delta: 10000,
        p_withheld_delta: -10000,
      }),
    )
  })
})

describe('addProfessionalDebt', () => {
  it('decreases available and increases debt', async () => {
    const admin = buildAdminClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          professional_id: 'prof-1',
          available_balance: '40000',
          withheld_balance: '0',
          pending_balance: '0',
          total_debt: '10000',
          currency: 'BRL',
          last_payout_at: null,
          last_calculated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    })

    await addProfessionalDebt(admin, 'prof-1', BigInt(10000))

    expect(admin.rpc).toHaveBeenCalledWith(
      'update_professional_balance_atomic',
      expect.objectContaining({
        p_available_delta: -10000,
        p_debt_delta: 10000,
      }),
    )
  })
})

describe('validateBalance', () => {
  it('returns empty array for valid balance', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(10000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(5000),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    expect(validateBalance(balance)).toEqual([])
  })

  it('flags negative available with zero debt', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(-1000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    const errors = validateBalance(balance)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('negative')
  })

  it('allows negative available when debt exists', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(-1000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(1000),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    expect(validateBalance(balance)).toEqual([])
  })
})

describe('canReceivePayouts', () => {
  it('returns eligible for positive available and no debt', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(10000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    const result = canReceivePayouts(balance, BigInt(50000))
    expect(result.eligible).toBe(true)
  })

  it('returns ineligible when debt exceeds threshold', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(10000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(60000),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    const result = canReceivePayouts(balance, BigInt(50000))
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('debt')
  })

  it('returns ineligible when available is zero', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(0),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(0),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    const result = canReceivePayouts(balance, BigInt(50000))
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('No available balance')
  })

  it('returns ineligible when available is negative', () => {
    const balance = {
      professionalId: 'prof-1',
      availableBalance: BigInt(-1000),
      withheldBalance: BigInt(0),
      pendingBalance: BigInt(0),
      totalDebt: BigInt(1000),
      currency: 'BRL',
      lastPayoutAt: null,
      lastCalculatedAt: '2026-01-01T00:00:00Z',
    }
    const result = canReceivePayouts(balance, BigInt(50000))
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('No available balance')
  })
})
