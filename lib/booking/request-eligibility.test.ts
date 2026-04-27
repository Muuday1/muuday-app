import { describe, it, expect, vi, beforeEach } from 'vitest'
import { professionalCanReceiveRequestBooking, REQUEST_BOOKING_ALLOWED_TIERS } from './request-eligibility'

vi.mock('@/lib/professional/onboarding-state', () => ({
  evaluateFirstBookingEligibility: vi.fn(),
}))

import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
const mockedEvaluateFirstBookingEligibility = vi.mocked(evaluateFirstBookingEligibility)

describe('REQUEST_BOOKING_ALLOWED_TIERS', () => {
  it('contains professional and premium only', () => {
    expect(REQUEST_BOOKING_ALLOWED_TIERS).toEqual(['professional', 'premium'])
  })
})

describe('professionalCanReceiveRequestBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok when all conditions are met', async () => {
    mockedEvaluateFirstBookingEligibility.mockResolvedValue({ ok: true } as any)
    const supabase = { from: vi.fn() } as any
    const result = await professionalCanReceiveRequestBooking(supabase, {
      status: 'approved',
      tier: 'professional',
      id: 'pro-123',
    })
    expect(result.ok).toBe(true)
  })

  it('fails when professional is not approved', async () => {
    const supabase = { from: vi.fn() } as any
    const result = await professionalCanReceiveRequestBooking(supabase, {
      status: 'pending_review',
      tier: 'professional',
      id: 'pro-123',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reasonCode).toBe('pending_admin_approval')
    }
  })

  it('fails when tier is basic', async () => {
    const supabase = { from: vi.fn() } as any
    const result = await professionalCanReceiveRequestBooking(supabase, {
      status: 'approved',
      tier: 'basic',
      id: 'pro-123',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reasonCode).toBe('missing_plan_selection')
    }
  })

  it('fails when first-booking eligibility is not met', async () => {
    mockedEvaluateFirstBookingEligibility.mockResolvedValue({
      ok: false,
      message: 'Onboarding incompleto',
      reasonCode: 'onboarding_incomplete',
    } as any)
    const supabase = { from: vi.fn() } as any
    const result = await professionalCanReceiveRequestBooking(supabase, {
      status: 'approved',
      tier: 'premium',
      id: 'pro-123',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reasonCode).toBe('onboarding_incomplete')
    }
  })

  it('allows premium tier', async () => {
    mockedEvaluateFirstBookingEligibility.mockResolvedValue({ ok: true } as any)
    const supabase = { from: vi.fn() } as any
    const result = await professionalCanReceiveRequestBooking(supabase, {
      status: 'approved',
      tier: 'premium',
      id: 'pro-123',
    })
    expect(result.ok).toBe(true)
  })
})
