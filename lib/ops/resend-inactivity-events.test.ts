import { describe, it, expect, vi } from 'vitest'
import {
  runUserInactivityScan,
  runProfessionalInactivityScan,
} from './resend-inactivity-events'

vi.mock('@/lib/email/resend-events', () => ({
  emitUserInactive: vi.fn(),
  emitProfessionalInactive: vi.fn(),
}))

describe('runUserInactivityScan', () => {
  it('returns early with empty data', async () => {
    const admin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: [], error: null })),
      ),
    } as unknown as Parameters<typeof runUserInactivityScan>[0]

    const result = await runUserInactivityScan(admin, 30)
    expect(result.checked).toBe(0)
    expect(result.emitted).toBe(0)
  })
})

describe('runProfessionalInactivityScan', () => {
  it('returns early with empty data', async () => {
    const admin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: [], error: null })),
      ),
    } as unknown as Parameters<typeof runProfessionalInactivityScan>[0]

    const result = await runProfessionalInactivityScan(admin)
    expect(result.checked).toBe(0)
    expect(result.emitted).toBe(0)
  })
})
