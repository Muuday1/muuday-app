import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockEnv = {
  TROLLEY_API_KEY: 'test-api-key',
  TROLLEY_API_SECRET: 'test-api-secret',
  TROLLEY_WEBHOOK_SECRET: 'test-webhook-secret',
  TROLLEY_API_BASE: 'https://api.trolley.com/v1',
}

vi.mock('@/lib/config/env', () => ({
  env: mockEnv,
}))

// Import after mocks
const {
  createTrolleyRecipient,
  getTrolleyRecipient,
  updateTrolleyRecipient,
  createTrolleyPayment,
  createTrolleyBatch,
  getTrolleyBatch,
  processTrolleyBatch,
  verifyTWebhookSignature,
  isTrolleyHealthy,
} = await import('./client')

describe('verifyTWebhookSignature', () => {
  const secret = 'super-secret'
  const payload = '{"type":"payment.updated"}'

  function makeSignature(secret: string, body: string): string {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const sig = crypto.createHmac('sha256', secret).update(timestamp + body, 'utf8').digest('hex')
    return `t=${timestamp},v1=${sig}`
  }

  beforeEach(() => {
    mockEnv.TROLLEY_WEBHOOK_SECRET = secret
  })

  afterEach(() => {
    mockEnv.TROLLEY_WEBHOOK_SECRET = 'test-webhook-secret'
  })

  it('returns true when webhook secret is not configured (skip verification)', () => {
    mockEnv.TROLLEY_WEBHOOK_SECRET = undefined as unknown as string
    expect(verifyTWebhookSignature(payload, 't=1,v1=abc')).toBe(true)
    mockEnv.TROLLEY_WEBHOOK_SECRET = secret
  })

  it('returns false for invalid signature format', () => {
    expect(verifyTWebhookSignature(payload, 'invalid')).toBe(false)
  })

  it('returns false when timestamp is missing', () => {
    expect(verifyTWebhookSignature(payload, 'v1=abc')).toBe(false)
  })

  it('returns false when v1 signature is missing', () => {
    expect(verifyTWebhookSignature(payload, 't=123')).toBe(false)
  })

  it('returns true for a valid signature', () => {
    const sig = makeSignature(secret, payload)
    expect(verifyTWebhookSignature(payload, sig)).toBe(true)
  })

  it('returns false for an invalid signature', () => {
    expect(verifyTWebhookSignature(payload, 't=123,v1=0000000000000000')).toBe(false)
  })
})

describe('createTrolleyRecipient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('creates a recipient with correct payload and auth headers', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'rec-1', email: 'test@example.com', status: 'pending' }),
        { status: 200 },
      ),
    )

    const result = await createTrolleyRecipient({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    })

    expect(result.id).toBe('rec-1')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.trolley.com/v1/recipients',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringMatching(/^prsign test-api-key:/),
          'X-PR-Timestamp': expect.any(String),
          'Content-Type': 'application/json',
        }),
      }),
    )

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ email: 'test@example.com', firstName: 'John', lastName: 'Doe', type: 'individual' })
  })
})

describe('getTrolleyRecipient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns recipient by id', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'rec-1', email: 'test@example.com', status: 'active' }),
        { status: 200 },
      ),
    )

    const result = await getTrolleyRecipient('rec-1')
    expect(result.status).toBe('active')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.trolley.com/v1/recipients/rec-1',
      expect.any(Object),
    )
  })
})

describe('updateTrolleyRecipient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('patches recipient with updates', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'rec-1', email: 'new@example.com', status: 'active' }),
        { status: 200 },
      ),
    )

    const result = await updateTrolleyRecipient('rec-1', { email: 'new@example.com' })
    expect(result.email).toBe('new@example.com')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.trolley.com/v1/recipients/rec-1',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })
})

describe('createTrolleyPayment', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('creates a payment within a batch with recipient and amount', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'pay-1', recipient: { id: 'rec-1' }, amount: '100.00', currency: 'BRL' }),
        { status: 200 },
      ),
    )

    const result = await createTrolleyPayment({
      batchId: 'batch-1',
      recipientId: 'rec-1',
      amount: '100.00',
      currency: 'BRL',
    })

    expect(result.id).toBe('pay-1')
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('/batches/batch-1/payments')
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({
      recipient: { id: 'rec-1' },
      amount: '100.00',
      currency: 'BRL',
    })
  })
})

describe('createTrolleyBatch', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('creates a batch with payment ids', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'batch-1', status: 'open', payments: [] }),
        { status: 200 },
      ),
    )

    const result = await createTrolleyBatch(['pay-1', 'pay-2'])
    expect(result.id).toBe('batch-1')
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.payments).toEqual([{ id: 'pay-1' }, { id: 'pay-2' }])
  })

  it('creates an empty batch when no payment ids provided', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'batch-2', status: 'open', payments: [] }),
        { status: 200 },
      ),
    )

    const result = await createTrolleyBatch()
    expect(result.id).toBe('batch-2')
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toEqual({})
  })
})

describe('getTrolleyBatch', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns batch by id', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'batch-1', status: 'processing', payments: [] }),
        { status: 200 },
      ),
    )

    const result = await getTrolleyBatch('batch-1')
    expect(result.status).toBe('processing')
  })
})

describe('processTrolleyBatch', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('posts to batch start-processing endpoint', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'batch-1', status: 'pending', payments: [] }),
        { status: 200 },
      ),
    )

    const result = await processTrolleyBatch('batch-1')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.trolley.com/v1/batches/batch-1/start-processing',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('isTrolleyHealthy', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockReset()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns true when API is reachable', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ recipients: [] }), { status: 200 }),
    )

    expect(await isTrolleyHealthy()).toBe(true)
  })

  it('returns false when API fails', async () => {
    fetchSpy.mockResolvedValue(new Response('Error', { status: 500 }))

    expect(await isTrolleyHealthy()).toBe(false)
  })
})
