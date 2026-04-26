import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processBookingRefund } from './refund'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/payments/refund/engine', () => ({
  processRefund: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/security/rate-limit'
import { processRefund } from '@/lib/payments/refund/engine'

const mockedCreateClient = vi.mocked(createClient)
const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedProcessRefund = vi.mocked(processRefund)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeSupabaseClient(role: string | null, userId: string = 'user-1') {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: role ? { role } : null,
        error: null,
      }),
    })),
  } as unknown as ReturnType<typeof createClient>
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('processBookingRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 })
    mockedProcessRefund.mockResolvedValue({
      success: true,
      refundId: 're_test_123',
      amountRefunded: BigInt(5000),
    })
  })

  it('returns error when user is not admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await processBookingRefund('book-1', 'reason', 50)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Acesso restrito')
  })

  it('returns error when rate limit exceeded', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 })
    const result = await processBookingRefund('book-1', 'reason', 50)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Muitas tentativas')
  })

  it('returns error for invalid bookingId', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    const result = await processBookingRefund('', 'reason', 50)
    expect(result.success).toBe(false)
    expect(result.error).toContain('inválido')
  })

  it('returns error for too short reason', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    const result = await processBookingRefund('book-1', 'abc', 50)
    expect(result.success).toBe(false)
    expect(result.error).toContain('pelo menos 5')
  })

  it('returns error for invalid percentage', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    const result = await processBookingRefund('book-1', 'Valid reason', 0)
    expect(result.success).toBe(false)
    expect(result.error).toContain('1 e 100')
  })

  it('returns error when admin client is not configured', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    mockedCreateAdminClient.mockReturnValue(null)
    const result = await processBookingRefund('book-1', 'Valid reason', 50)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Admin client not configured')
  })

  it('processes refund successfully', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin', 'admin-1'))
    mockedCreateAdminClient.mockReturnValue({} as any)
    const result = await processBookingRefund('book-1', 'Valid reason', 50)
    expect(result.success).toBe(true)
    expect(result.refundId).toBe('re_test_123')
    expect(result.amountRefunded).toBe('R$\xa050,00')
    expect(mockedProcessRefund).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bookingId: 'book-1',
        reason: 'Valid reason',
        percentage: 50,
        adminId: 'admin-1',
      }),
    )
  })

  it('returns error when refund engine fails', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    mockedCreateAdminClient.mockReturnValue({} as any)
    mockedProcessRefund.mockResolvedValue({ success: false, stripeError: 'card_declined' })
    const result = await processBookingRefund('book-1', 'Valid reason', 50)
    expect(result.success).toBe(false)
    expect(result.error).toContain('card_declined')
  })

  it('includes dispute resolution id when present', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin', 'admin-1'))
    mockedCreateAdminClient.mockReturnValue({} as any)
    mockedProcessRefund.mockResolvedValue({
      success: true,
      refundId: 're_test_456',
      amountRefunded: BigInt(10000),
      disputeResolutionId: 'disp-123',
    })
    const result = await processBookingRefund('book-1', 'Valid reason', 100)
    expect(result.success).toBe(true)
    expect(result.disputeResolutionId).toBe('disp-123')
  })
})
