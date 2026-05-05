import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const TEST_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAzmTGucP+1BT5Z8kpdv74+NSyg+iFyN7uIh17cmbndSztEADE
FTaA+xZrM+bkBQ6ZWscDeJ178DA+Kg98yvbkkxg2hzdtOSJN9mDyMrOBMvBcF4h0
CO5BC8AFo9/1TCYPxL7TZHSRKcRhiwUBybV1iZqyS17j/UMnJK8Zh1e2XzQlPECX
7IcHwTKtx9y/VUbjJj3okDs4UhCuRmO1WJ0KGLs7QtuOz4uC8FJ15W5dfnwpTDMw
UaesmXYyekgoesO0eu0awPoVzKYdaBMwApO2kdJFpfWChB3bWHZBXDE1Wjlkun8C
QfSO4bCRBj31Tr5ulrN3wT+w6cnv5JaUY2a6tQIDAQABAoIBACifVynK9MYDVs9h
nYKpTpGTM4uY4XQWxKH8UYbD0DyU2hfzPqS6NIq27+SoRirko7RlRT6hKHqu1B1t
LO+5xmVZN6pHc3zyTov2qtTl1cET49xR5By54B2S7slBVENnnmTn9i1ocAXbfCNj
meV8jKTHyN3i0FbRt8uVlx23WtLD0ws6mYjKOiWw2/pgaCiT6XqW8CmSxFKmK2s0
WyHG5FiSLXZ6YMX7h+FYRZLC03KLSis1bLKjG+0rYyt61AaHG4J3JdsSIAVRs3oc
g7gJCCZitI4VAV+9t54/o4OCa0W/+WycXYBPOtF5xQtGQ+EhbWXtTaJr4apGq+L6
cqWKKCECgYEA8z3Py3QCZ0dBat3FDUHVhJhCh1Tt/tiVkXiSpqLlzZYSwGhS52bP
X1Dkc15FC9eU9bhQjndhNn8aTCPsD/Y08ymB0qKQmy8OPRHc6iU0y/FLK5toOgNa
QIjRko75tySGER7cIk53hV8mLGuNTuVyl44p3hrWKb0e4JK1O1XQbckCgYEA2Tgu
YI7AOiY/5lh9sizsooTYIylXi/faiHvQu7WJY3W6SBLDGM4LlmCxIeKBxUpI5ELc
LxlU1r/4x5Pxh6aw4/BWN9w0WRsbqT8hdRGSbzGCYSK2u8bH3VZWHYChZfQ41J5R
1t4tul4wowVHijivozUE+YixF8DLuVT4PQKdq40CgYApXHFhHzDpbuxox50iS/eK
vHlTmdV+aEXGnsIRI9H/y20U2qh+QLUyeAbgtz72bIof3l+UWihlo+dM2y7g5/TJ
BF3W+12rhazeJZNzHTCFHVqy55IpizhlkN5SFY3Q3p0NfDnie4VHYI6VLxSwPcPm
kX39DoMsRcRiW5AFrunqQQKBgQCCGwp8P0SYD8z6VUqEbDAYb+Vduid76Kr2UOMH
a4atEhjPjp1YwCFkoum12AvOdd4PCpUDiPKt5jJGqDBlBcyx2oRp1PVt4bTBvNR3
YF0LSOZE9BvrgPa5djsCVMdXX96iS2nNfyp4lG4hVsow2h8pbFpcdClOhuX/TguZ
z3VNCQKBgEq6xwb3T7xDyiR8DUDRPp9gjc/QaBcKZUMTSj/g9jSvHK1xGhsY6E51
Hwn7b0ZkKrPi3tWtffLryqrQg3y38o8U3MdrayfIpap6WPHFfWtGuR6huCj+VO9Z
O9tNq/SlBo4rGsQ7Kzuk1Uiqi+W36+NfTPO5AgJKYdrusCa1TraY
-----END RSA PRIVATE KEY-----`

const mockEnv = {
  REVOLUT_API_KEY: 'test-api-key',
  REVOLUT_CLIENT_ID: 'test-client-id',
  REVOLUT_REFRESH_TOKEN: 'test-refresh-token',
  REVOLUT_WEBHOOK_SECRET: 'test-webhook-secret',
  REVOLUT_ACCOUNT_ID: 'test-account-id',
  REVOLUT_PRIVATE_KEY: TEST_PRIVATE_KEY,
}

vi.mock('@/lib/config/env', () => ({
  env: mockEnv,
}))

const mockReadFileSync = vi.fn()
vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
}))

// Import after mocks so the module reads the mocked env
const {
  getRevolutAccounts,
  getRevolutAccount,
  getRevolutTransactions,
  getTreasuryBalance,
  verifyRevolutWebhookSignature,
  isRevolutHealthy,
} = await import('./client')

describe('verifyRevolutWebhookSignature', () => {
  const secret = 'super-secret'
  const timestamp = '1700000000000'
  const payload = '{"event":"transaction.created"}'

  function makeSignature(secret: string, ts: string, body: string): string {
    const sig = crypto.createHmac('sha256', secret).update(`v1.${ts}.${body}`, 'utf8').digest('hex')
    return `v1=${sig}`
  }

  beforeEach(() => {
    mockEnv.REVOLUT_WEBHOOK_SECRET = secret
  })

  afterEach(() => {
    mockEnv.REVOLUT_WEBHOOK_SECRET = 'test-webhook-secret'
  })

  it('returns true when webhook secret is not configured (skip verification)', () => {
    mockEnv.REVOLUT_WEBHOOK_SECRET = undefined as unknown as string
    expect(verifyRevolutWebhookSignature(payload, 'v1=abc', timestamp)).toBe(true)
    mockEnv.REVOLUT_WEBHOOK_SECRET = secret
  })

  it('returns false when timestamp header is missing', () => {
    expect(verifyRevolutWebhookSignature(payload, 'v1=abc', null)).toBe(false)
  })

  it('returns true for a valid signature', () => {
    const sig = makeSignature(secret, timestamp, payload)
    expect(verifyRevolutWebhookSignature(payload, sig, timestamp)).toBe(true)
  })

  it('returns false for an invalid signature', () => {
    expect(verifyRevolutWebhookSignature(payload, 'v1=0000000000000000', timestamp)).toBe(false)
  })

  it('returns true when one of multiple comma-separated signatures matches (rotation)', () => {
    const goodSig = makeSignature(secret, timestamp, payload)
    const badSig = 'v1=0000000000000000000000000000000000000000000000000000000000000000'
    expect(verifyRevolutWebhookSignature(payload, `${badSig},${goodSig}`, timestamp)).toBe(true)
  })

  it('returns false for malformed signature format', () => {
    expect(verifyRevolutWebhookSignature(payload, 'invalid-format', timestamp)).toBe(false)
  })

  it('returns false for empty signature', () => {
    expect(verifyRevolutWebhookSignature(payload, '', timestamp)).toBe(false)
  })
})

describe('getRevolutAccounts', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns mapped accounts with bigint balances', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify([
        { id: 'acc-1', name: 'Main', currency: 'BRL', balance: 1234.56 },
        { id: 'acc-2', name: 'Reserve', currency: 'EUR', balance: 500 },
      ]), { status: 200 }),
    )

    const accounts = await getRevolutAccounts()

    expect(accounts).toHaveLength(2)
    expect(accounts[0].id).toBe('acc-1')
    expect(accounts[0].balance).toBe(BigInt(123456))
    expect(accounts[1].balance).toBe(BigInt(50000))
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://b2b.revolut.com/api/1.0/accounts',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-api-key' }),
      }),
    )
  })

  it('throws when API returns error', async () => {
    fetchSpy.mockResolvedValue(new Response('Unauthorized', { status: 401 }))

    // First 401 triggers refresh which also fails (no refresh token set up in this test)
    // Actually refreshAccessToken will attempt fetch again, so we need to mock accordingly
    // Simpler: just expect it to throw
    await expect(getRevolutAccounts()).rejects.toThrow()
  })
})

describe('getRevolutAccount', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns mapped account', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'acc-1', name: 'Treasury', currency: 'BRL', balance: 9999.99 }),
        { status: 200 },
      ),
    )

    const account = await getRevolutAccount('acc-1')
    expect(account.balance).toBe(BigInt(999999))
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://b2b.revolut.com/api/1.0/accounts/acc-1',
      expect.any(Object),
    )
  })
})

describe('getRevolutTransactions', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns mapped transactions with query params', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 'tx-1',
            type: 'transfer',
            amount: 100.5,
            currency: 'BRL',
            state: 'completed',
            created_at: '2024-01-01T00:00:00Z',
            reference: 'payout-123',
            counterparty: { type: 'external', account_id: 'ext-1' },
          },
          {
            id: 'tx-2',
            type: 'fee',
            amount: -2.5,
            currency: 'BRL',
            state: 'completed',
            created_at: '2024-01-02T00:00:00Z',
          },
        ]),
        { status: 200 },
      ),
    )

    const txs = await getRevolutTransactions({ from: '2024-01-01', to: '2024-01-31', limit: 50 })

    expect(txs).toHaveLength(2)
    expect(txs[0].amount).toBe(BigInt(10050))
    expect(txs[0].type).toBe('transfer')
    expect(txs[0].counterparty?.accountId).toBe('ext-1')
    expect(txs[1].amount).toBe(BigInt(-250))

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('from=2024-01-01')
    expect(url).toContain('to=2024-01-31')
    expect(url).toContain('limit=50')
  })

  it('works without params', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))

    await getRevolutTransactions()

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toBe('https://b2b.revolut.com/api/1.0/transactions')
  })
})

describe('getTreasuryBalance', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns balance when REVOLUT_ACCOUNT_ID is set', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'test-account-id', name: 'Treasury', currency: 'BRL', balance: 50000 }),
        { status: 200 },
      ),
    )

    const result = await getTreasuryBalance()
    expect(result).not.toBeNull()
    expect(result!.accountId).toBe('test-account-id')
    expect(result!.balance).toBe(BigInt(5000000))
    expect(result!.currency).toBe('BRL')
  })

  it('returns null when REVOLUT_ACCOUNT_ID is not set', async () => {
    const originalAccountId = mockEnv.REVOLUT_ACCOUNT_ID
    mockEnv.REVOLUT_ACCOUNT_ID = undefined as unknown as string

    const result = await getTreasuryBalance()
    expect(result).toBeNull()

    mockEnv.REVOLUT_ACCOUNT_ID = originalAccountId
  })
})

describe('isRevolutHealthy', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns true when API is reachable', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify([{ id: 'acc-1', name: 'A', currency: 'BRL', balance: 0 }]), { status: 200 }),
    )

    expect(await isRevolutHealthy()).toBe(true)
  })

  it('returns false when API fails', async () => {
    fetchSpy.mockResolvedValue(new Response('Error', { status: 500 }))

    expect(await isRevolutHealthy()).toBe(false)
  })
})

describe('revolutFetch — 401 refresh flow', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('retries after 401 when token refresh succeeds', async () => {
    // First call: 401, second call (refresh): token response, third call: success
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: 'new-token', refresh_token: 'new-refresh' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'acc-1', name: 'A', currency: 'BRL', balance: 0 }]), { status: 200 }),
      )

    const accounts = await getRevolutAccounts()
    expect(accounts).toHaveLength(1)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('throws when refresh fails after 401', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }))

    await expect(getRevolutAccounts()).rejects.toThrow('Revolut API error 401')
  })
})
