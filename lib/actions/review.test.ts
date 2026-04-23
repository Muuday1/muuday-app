import { describe, it, expect, vi } from 'vitest'
import { submitReviewAction } from './review'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/email/resend-events', () => ({
  emitUserReviewSubmitted: vi.fn(),
  emitProfessionalReceivedReview: vi.fn(),
}))

describe('submitReviewAction', () => {
  it('returns error when user is not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })

    const result = await submitReviewAction({
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      professionalId: '550e8400-e29b-41d4-a716-446655440001',
      rating: 5,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Sessão expirada.')
  })
})
