import { describe, it, expect, vi } from 'vitest'
import { toRequestBookingStatus, expireRequestIfNeeded } from './request-helpers'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

describe('toRequestBookingStatus', () => {
  it('returns status for valid string', () => {
    expect(toRequestBookingStatus('open')).toBe('open')
    expect(toRequestBookingStatus('offered')).toBe('offered')
    expect(toRequestBookingStatus('accepted')).toBe('accepted')
    expect(toRequestBookingStatus('converted')).toBe('converted')
  })

  it('returns null for invalid string', () => {
    expect(toRequestBookingStatus('invalid')).toBeNull()
    expect(toRequestBookingStatus('')).toBeNull()
  })

  it('returns null for non-string values', () => {
    expect(toRequestBookingStatus(123)).toBeNull()
    expect(toRequestBookingStatus(null)).toBeNull()
    expect(toRequestBookingStatus(undefined)).toBeNull()
    expect(toRequestBookingStatus({})).toBeNull()
  })
})

describe('expireRequestIfNeeded', () => {
  function makeSupabase(updateResult?: { data: any; error: any }) {
    const result = updateResult ?? { data: null, error: null }
    return {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(result),
              }),
            }),
          }),
        }),
      }),
    } as any
  }

  it('returns request unchanged when status is not offered', async () => {
    const supabase = makeSupabase()
    const request = { id: 'req-1', status: 'open' }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result).toEqual(request)
  })

  it('returns request unchanged when no proposal_expires_at', async () => {
    const supabase = makeSupabase()
    const request = { id: 'req-1', status: 'offered' }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result).toEqual(request)
  })

  it('returns request unchanged when expiry is in the future', async () => {
    const supabase = makeSupabase()
    const request = {
      id: 'req-1',
      status: 'offered',
      proposal_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result).toEqual(request)
  })

  it('expires request when proposal has passed', async () => {
    const expiredRequest = {
      id: 'req-1',
      status: 'expired',
      proposal_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
    const supabase = makeSupabase({ data: expiredRequest, error: null })
    const request = {
      id: 'req-1',
      status: 'offered',
      proposal_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result.status).toBe('expired')
  })

  it('returns mutated request on DB error', async () => {
    const { captureException } = await import('@sentry/nextjs')
    const supabase = makeSupabase({ data: null, error: { message: 'update failed' } })
    const request = {
      id: 'req-1',
      status: 'offered',
      proposal_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result.status).toBe('expired')
    expect(captureException).toHaveBeenCalled()
  })

  it('returns unchanged request for invalid proposal_expires_at', async () => {
    const supabase = makeSupabase()
    const request = {
      id: 'req-1',
      status: 'offered',
      proposal_expires_at: 'not-a-date',
    }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result).toEqual(request)
  })

  it('does not expire if transition is invalid', async () => {
    // 'converted' -> 'expired' is not a valid transition
    const supabase = makeSupabase()
    const request = {
      id: 'req-1',
      status: 'converted',
      proposal_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = await expireRequestIfNeeded(supabase, request)
    expect(result).toEqual(request)
  })
})
