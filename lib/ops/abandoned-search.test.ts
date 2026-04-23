import { describe, it, expect, vi } from 'vitest'
import { runAbandonedSearchSync } from './abandoned-search'

vi.mock('@/lib/email/resend-events', () => ({
  emitUserAbandonedSearch: vi.fn(),
}))

describe('runAbandonedSearchSync', () => {
  it('returns zero when no abandoned sessions exist', async () => {
    const admin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: [], error: null })),
      ),
    } as unknown as Parameters<typeof runAbandonedSearchSync>[0]

    const result = await runAbandonedSearchSync(admin)
    expect(result.checked).toBe(0)
    expect(result.emitted).toBe(0)
  })
})
