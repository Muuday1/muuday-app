import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupBookingContext } from './lookup-context'

vi.mock('@/lib/professional/onboarding-state', () => ({
  evaluateFirstBookingEligibility: vi.fn(),
}))

vi.mock('@/lib/booking/settings', () => ({
  normalizeProfessionalSettingsRow: vi.fn().mockImplementation((row: any, tz: string) => ({
    timezone: tz,
    sessionDurationMinutes: row?.session_duration_minutes || 60,
    bufferMinutes: row?.buffer_minutes || 0,
    minimumNoticeHours: row?.minimum_notice_hours || 0,
    maxBookingWindowDays: row?.max_booking_window_days || 30,
    enableRecurring: row?.enable_recurring || false,
    confirmationMode: row?.confirmation_mode || 'auto_accept',
    requireSessionPurpose: row?.require_session_purpose || false,
  })),
}))

import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'

function mockSupabase(overrides?: {
  profile?: { data: any; error: any }
  professional?: { data: any; error: any }
  settings?: { data: any; error: any }
}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const builders: Record<string, any> = {}

      builders.profiles = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(overrides?.profile || { data: { currency: 'BRL', timezone: 'America/Sao_Paulo' }, error: null }),
          }),
        }),
      }

      builders.professionals = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(overrides?.professional || {
              data: {
                id: 'prof-1',
                user_id: 'other-user',
                tier: 'standard',
                session_price_brl: 150,
                session_duration_minutes: 60,
                status: 'approved',
                first_booking_enabled: true,
                profiles: { timezone: 'America/Sao_Paulo', email: 'prof@example.com', full_name: 'Dr. Test' },
              },
              error: null,
            }),
          }),
        }),
      }

      builders.professional_settings = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(overrides?.settings || { data: { timezone: 'America/Sao_Paulo', session_duration_minutes: 60 }, error: null }),
          }),
        }),
      }

      return builders[table] || {}
    }),
  } as any
}

describe('lookupBookingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(evaluateFirstBookingEligibility).mockResolvedValue({ ok: true })
  })

  it('returns context on success', async () => {
    const result = await lookupBookingContext(mockSupabase(), 'user-1', { professionalId: 'prof-1' })

    expect('profile' in result).toBe(true)
    if ('profile' in result && result.profile) {
      expect(result.profile.currency).toBe('BRL')
      expect(result.professional.status).toBe('approved')
      expect(result.settings.timezone).toBe('America/Sao_Paulo')
      expect(result.eligibility.ok).toBe(true)
    }
  })

  it('returns error when professional not found', async () => {
    const result = await lookupBookingContext(
      mockSupabase({ professional: { data: null, error: { message: 'not found' } } }),
      'user-1',
      { professionalId: 'prof-1' },
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('Profissional não disponível')
    }
  })

  it('returns error when professional not approved', async () => {
    const result = await lookupBookingContext(
      mockSupabase({
        professional: {
          data: { id: 'prof-1', user_id: 'other-user', status: 'pending', profiles: null },
          error: null,
        },
      }),
      'user-1',
      { professionalId: 'prof-1' },
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('Profissional não disponível')
    }
  })

  it('returns error when user tries to book themselves', async () => {
    const result = await lookupBookingContext(
      mockSupabase({
        professional: {
          data: {
            id: 'prof-1',
            user_id: 'user-1',
            status: 'approved',
            profiles: null,
          },
          error: null,
        },
      }),
      'user-1',
      { professionalId: 'prof-1' },
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('próprio perfil')
    }
  })

  it('returns error when eligibility fails', async () => {
    vi.mocked(evaluateFirstBookingEligibility).mockResolvedValue({
      ok: false,
      message: 'Onboarding incompleto',
      reasonCode: 'onboarding_incomplete' as any,
    })

    const result = await lookupBookingContext(mockSupabase(), 'user-1', { professionalId: 'prof-1' })

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toBe('Onboarding incompleto')
      expect(result.reasonCode).toBe('onboarding_incomplete')
    }
  })

  it('returns error when recurring not enabled', async () => {
    const result = await lookupBookingContext(
      mockSupabase({
        settings: {
          data: { enable_recurring: false, confirmation_mode: 'auto_accept' },
          error: null,
        },
      }),
      'user-1',
      { professionalId: 'prof-1', bookingType: 'recurring' },
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('não aceita pacotes recorrentes')
    }
  })

  it('returns error when session purpose required but missing', async () => {
    const result = await lookupBookingContext(
      mockSupabase({
        settings: {
          data: { require_session_purpose: true, confirmation_mode: 'auto_accept' },
          error: null,
        },
      }),
      'user-1',
      { professionalId: 'prof-1', bookingType: 'one_off' },
    )

    expect('success' in result && result.success === false).toBe(true)
    if ('success' in result && !result.success) {
      expect(result.error).toContain('objetivo da sessão')
    }
  })
})
