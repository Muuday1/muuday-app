import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getMaxProfessionalDebtThreshold,
  checkDebtThresholds,
  alertAdminOnDebtThreshold,
  runDebtMonitoring,
} from './monitor'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/config/env', () => ({
  env: {
    MAX_PROFESSIONAL_DEBT_MINOR: '300000',
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAdmin() {
  const tables: Record<string, any[]> = {}
  const inserted: any[] = []

  function makeQuery(table: string, data: any[]) {
    tables[table] = data
    let limitResult: any[] = data
    const chain: any = {
      eq: (col: string, val: any) => {
        limitResult = limitResult.filter((r) => r[col] === val)
        return chain
      },
      gt: (col: string, val: any) => {
        const target = typeof val === 'bigint' ? val.toString() : val
        limitResult = limitResult.filter((r) => {
          const rv = r[col]?.toString?.() ?? r[col]
          return rv > target
        })
        return chain
      },
      in: (col: string, vals: any[]) => {
        limitResult = limitResult.filter((r) => vals.includes(r[col]))
        return chain
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        limitResult.sort((a: any, b: any) => {
          const av = a[col] ?? 0
          const bv = b[col] ?? 0
          return opts?.ascending === false ? bv - av : av - bv
        })
        return chain
      },
      limit: () => chain,
      gte: () => chain,
      lte: () => chain,
      select: () => chain,
      then: (cb: (r: any) => any) =>
        Promise.resolve(cb({ data: limitResult, error: null })),
    }
    return chain
  }

  return {
    from: (table: string) => ({
      select: (...cols: string[]) => makeQuery(table, tables[table] || []),
      insert: (vals: any) => {
        inserted.push(vals)
        return {
          select: () => ({
            single: () => Promise.resolve({ data: vals, error: null }),
          }),
        }
      },
    }),
    _inserted: inserted,
    _tables: tables,
  } as unknown as SupabaseClient & { _inserted: any[]; _tables: Record<string, any[]> }
}

// ---------------------------------------------------------------------------
// getMaxProfessionalDebtThreshold
// ---------------------------------------------------------------------------

describe('getMaxProfessionalDebtThreshold', () => {
  it('returns env value when set', () => {
    expect(getMaxProfessionalDebtThreshold()).toBe(BigInt(300000))
  })

  it('falls back to default when env value is invalid', async () => {
    const { env } = await import('@/lib/config/env')
    const original = env.MAX_PROFESSIONAL_DEBT_MINOR
    ;(env as any).MAX_PROFESSIONAL_DEBT_MINOR = 'not_a_number'
    expect(getMaxProfessionalDebtThreshold()).toBe(BigInt(500000))
    ;(env as any).MAX_PROFESSIONAL_DEBT_MINOR = original
  })

  it('falls back to default when env value is empty', async () => {
    const { env } = await import('@/lib/config/env')
    const original = env.MAX_PROFESSIONAL_DEBT_MINOR
    ;(env as any).MAX_PROFESSIONAL_DEBT_MINOR = ''
    expect(getMaxProfessionalDebtThreshold()).toBe(BigInt(500000))
    ;(env as any).MAX_PROFESSIONAL_DEBT_MINOR = original
  })

  it('returns correct type (bigint)', () => {
    const result = getMaxProfessionalDebtThreshold()
    expect(typeof result).toBe('bigint')
  })
})

// ---------------------------------------------------------------------------
// checkDebtThresholds
// ---------------------------------------------------------------------------

describe('checkDebtThresholds', () => {
  it('returns empty array when no professional exceeds threshold', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 100000 },
      { professional_id: 'pro-2', total_debt: 200000 },
    ]
    admin._tables['professionals'] = []
    admin._tables['profiles'] = []

    const alerts = await checkDebtThresholds(admin)
    expect(alerts).toEqual([])
  })

  it('returns alerts for professionals exceeding threshold', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
      { professional_id: 'pro-2', total_debt: 100000 },
    ]
    admin._tables['professionals'] = [
      { id: 'pro-1', user_id: 'user-1' },
    ]
    admin._tables['profiles'] = [
      { id: 'user-1', first_name: 'Alice', last_name: 'Silva', email: 'alice@test.com' },
    ]

    const alerts = await checkDebtThresholds(admin)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].professionalId).toBe('pro-1')
    expect(alerts[0].professionalName).toBe('Alice Silva')
    expect(alerts[0].professionalEmail).toBe('alice@test.com')
    expect(alerts[0].totalDebt).toBe(BigInt(400000))
    expect(alerts[0].threshold).toBe(BigInt(300000))
    expect(alerts[0].exceededBy).toBe(BigInt(100000))
  })

  it('sorts alerts by total_debt descending', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
      { professional_id: 'pro-2', total_debt: 600000 },
      { professional_id: 'pro-3', total_debt: 250000 },
    ]
    admin._tables['professionals'] = [
      { id: 'pro-1', user_id: 'user-1' },
      { id: 'pro-2', user_id: 'user-2' },
      { id: 'pro-3', user_id: 'user-3' },
    ]
    admin._tables['profiles'] = [
      { id: 'user-1', first_name: 'A', last_name: '', email: 'a@test.com' },
      { id: 'user-2', first_name: 'B', last_name: '', email: 'b@test.com' },
      { id: 'user-3', first_name: 'C', last_name: '', email: 'c@test.com' },
    ]

    const alerts = await checkDebtThresholds(admin)
    expect(alerts.map((a) => a.professionalId)).toEqual(['pro-2', 'pro-1'])
  })

  it('uses fallback name when profile not found', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
    ]
    admin._tables['professionals'] = [
      { id: 'pro-1', user_id: 'user-1' },
    ]
    admin._tables['profiles'] = []

    const alerts = await checkDebtThresholds(admin)
    expect(alerts[0].professionalName).toBe('Profissional')
    expect(alerts[0].professionalEmail).toBe('')
  })

  it('uses Unknown name when professional not found in professionals table', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
    ]
    admin._tables['professionals'] = []
    admin._tables['profiles'] = []

    const alerts = await checkDebtThresholds(admin)
    expect(alerts[0].professionalName).toBe('Unknown')
    expect(alerts[0].professionalEmail).toBe('')
  })

  it('handles null total_debt as zero', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: null },
    ]
    admin._tables['professionals'] = []
    admin._tables['profiles'] = []

    const alerts = await checkDebtThresholds(admin)
    expect(alerts).toEqual([])
  })

  it('returns empty array on database error', async () => {
    const { captureException } = await import('@sentry/nextjs')
    // Override the query to return error
    const mockAdmin = {
      from: () => ({
        select: () => ({
          gt: () => ({
            order: () => ({
              then: (cb: any) =>
                Promise.resolve(cb({ data: null, error: new Error('db fail') })),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient

    const alerts = await checkDebtThresholds(mockAdmin)
    expect(alerts).toEqual([])
    expect(captureException).toHaveBeenCalled()
  })

  it('handles multiple professionals with same user_id correctly', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
      { professional_id: 'pro-2', total_debt: 500000 },
    ]
    admin._tables['professionals'] = [
      { id: 'pro-1', user_id: 'user-1' },
      { id: 'pro-2', user_id: 'user-1' },
    ]
    admin._tables['profiles'] = [
      { id: 'user-1', first_name: 'Alice', last_name: '', email: 'alice@test.com' },
    ]

    const alerts = await checkDebtThresholds(admin)
    expect(alerts).toHaveLength(2)
    expect(alerts[0].professionalName).toBe('Alice')
    expect(alerts[1].professionalName).toBe('Alice')
  })

  it('handles empty professional_balances table', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = []
    admin._tables['professionals'] = []
    admin._tables['profiles'] = []

    const alerts = await checkDebtThresholds(admin)
    expect(alerts).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// alertAdminOnDebtThreshold
// ---------------------------------------------------------------------------

describe('alertAdminOnDebtThreshold', () => {
  it('returns early when no alerts', async () => {
    const admin = createMockAdmin()
    await alertAdminOnDebtThreshold(admin, [])
    expect(admin._inserted).toEqual([])
  })

  it('creates notifications for each admin user', async () => {
    const admin = createMockAdmin()
    admin._tables['profiles'] = [
      { id: 'admin-1', role: 'admin' },
      { id: 'admin-2', role: 'admin' },
      { id: 'user-1', role: 'user' },
    ]

    const alerts = [
      {
        professionalId: 'pro-1',
        professionalName: 'Alice Silva',
        professionalEmail: 'alice@test.com',
        totalDebt: BigInt(400000),
        threshold: BigInt(300000),
        exceededBy: BigInt(100000),
      },
    ]

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await alertAdminOnDebtThreshold(admin, alerts)
    consoleWarn.mockRestore()

    expect(admin._inserted).toHaveLength(2)
    expect(admin._inserted[0].type).toBe('admin_debt_alert')
    expect(admin._inserted[0].user_id).toBe('admin-1')
    expect(admin._inserted[0].title).toBe('Alerta: Dívida profissional excedeu limite')
    expect(admin._inserted[0].body).toContain('Alice Silva')
    expect(admin._inserted[0].body).toContain('R$ 4000.00')
    expect(admin._inserted[0].body).toContain('R$ 3000.00')
    expect(admin._inserted[0].payload.professional_id).toBe('pro-1')
    expect(admin._inserted[1].user_id).toBe('admin-2')
  })

  it('creates multiple notifications for multiple alerts', async () => {
    const admin = createMockAdmin()
    admin._tables['profiles'] = [
      { id: 'admin-1', role: 'admin' },
    ]

    const alerts = [
      {
        professionalId: 'pro-1',
        professionalName: 'Alice',
        professionalEmail: 'alice@test.com',
        totalDebt: BigInt(400000),
        threshold: BigInt(300000),
        exceededBy: BigInt(100000),
      },
      {
        professionalId: 'pro-2',
        professionalName: 'Bob',
        professionalEmail: 'bob@test.com',
        totalDebt: BigInt(500000),
        threshold: BigInt(300000),
        exceededBy: BigInt(200000),
      },
    ]

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await alertAdminOnDebtThreshold(admin, alerts)
    consoleWarn.mockRestore()

    expect(admin._inserted).toHaveLength(2)
    expect(admin._inserted[0].payload.professional_id).toBe('pro-1')
    expect(admin._inserted[1].payload.professional_id).toBe('pro-2')
  })

  it('handles zero admin users', async () => {
    const admin = createMockAdmin()
    admin._tables['profiles'] = [
      { id: 'user-1', role: 'user' },
    ]

    const alerts = [
      {
        professionalId: 'pro-1',
        professionalName: 'Alice',
        professionalEmail: 'alice@test.com',
        totalDebt: BigInt(400000),
        threshold: BigInt(300000),
        exceededBy: BigInt(100000),
      },
    ]

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await alertAdminOnDebtThreshold(admin, alerts)
    consoleWarn.mockRestore()

    expect(admin._inserted).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// runDebtMonitoring
// ---------------------------------------------------------------------------

describe('runDebtMonitoring', () => {
  it('runs full debt monitoring pipeline end-to-end', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
    ]
    admin._tables['professionals'] = [
      { id: 'pro-1', user_id: 'user-1' },
    ]
    admin._tables['profiles'] = [
      { id: 'user-1', first_name: 'Alice', last_name: 'Silva', email: 'alice@test.com', role: 'admin' },
    ]

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await runDebtMonitoring(admin)
    consoleWarn.mockRestore()

    expect(admin._inserted).toHaveLength(1)
    expect(admin._inserted[0].type).toBe('admin_debt_alert')
  })

  it('runs without error when no alerts', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 100000 },
    ]
    admin._tables['professionals'] = []
    admin._tables['profiles'] = []

    await expect(runDebtMonitoring(admin)).resolves.toBeUndefined()
    expect(admin._inserted).toEqual([])
  })

  it('logs warning when threshold exceeded', async () => {
    const admin = createMockAdmin()
    admin._tables['professional_balances'] = [
      { professional_id: 'pro-1', total_debt: 400000 },
    ]
    admin._tables['professionals'] = [
      { id: 'pro-1', user_id: 'user-1' },
    ]
    admin._tables['profiles'] = [
      { id: 'user-1', first_name: 'Alice', last_name: 'Silva', email: 'alice@test.com' },
    ]

    const { captureMessage } = await import('@sentry/nextjs')
    await runDebtMonitoring(admin)
    expect(captureMessage).toHaveBeenCalled()
  })
})
