import { describe, it, expect, vi } from 'vitest'
import { runAbandonedCheckoutSync } from './abandoned-checkout'

vi.mock('@/lib/email/resend-events', () => ({
  emitUserAbandonedCheckout: vi.fn(),
}))

describe('runAbandonedCheckoutSync', () => {
  it('returns zero when no abandoned checkouts exist', async () => {
    const admin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: [], error: null })),
      ),
    } as unknown as Parameters<typeof runAbandonedCheckoutSync>[0]

    const result = await runAbandonedCheckoutSync(admin)
    expect(result.checked).toBe(0)
    expect(result.emitted).toBe(0)
  })
})
