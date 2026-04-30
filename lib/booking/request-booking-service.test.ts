import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getRequestBookingDetailService,
  createRequestBookingService,
  offerRequestBookingService,
  declineRequestBookingByProfessionalService,
  cancelRequestBookingByUserService,
  declineRequestBookingByUserService,
  acceptRequestBookingService,
} from './request-booking-service'

vi.mock('@/lib/booking/request-eligibility', () => ({
  professionalCanReceiveRequestBooking: vi.fn(),
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
    cancellationPolicyCode: row?.cancellation_policy_code || 'standard',
    requireSessionPurpose: row?.require_session_purpose || false,
  })),
  extractProfessionalTimezone: vi.fn().mockImplementation((professional: any) => {
    const profile = Array.isArray(professional?.profiles)
      ? professional.profiles[0]
      : professional?.profiles
    return profile?.timezone || 'America/Sao_Paulo'
  }),
  loadProfessionalSettings: vi.fn().mockImplementation(async (_supabase: any, _professionalId: string, timezoneFallback?: string) => ({
    timezone: timezoneFallback || 'America/Sao_Paulo',
    sessionDurationMinutes: 60,
    bufferMinutes: 0,
    minimumNoticeHours: 0,
    maxBookingWindowDays: 30,
    enableRecurring: false,
    confirmationMode: 'auto_accept',
    cancellationPolicyCode: 'standard',
    requireSessionPurpose: false,
  })),
}))

vi.mock('@/lib/booking/request-helpers', () => ({
  REQUEST_BOOKING_FIELDS: 'id,user_id,professional_id,status',
  toRequestBookingStatus: vi.fn((v: string) => v),
  expireRequestIfNeeded: vi.fn().mockImplementation(async (_supabase: any, request: any) => request),
}))

vi.mock('@/lib/booking/request-booking-state-machine', () => ({
  assertRequestBookingTransition: vi.fn().mockReturnValue({ ok: true }),
}))

vi.mock('@/lib/booking/slot-validation', () => ({
  validateSlotAvailability: vi.fn().mockResolvedValue({ valid: true }),
}))

vi.mock('@/lib/booking/transaction-operations', () => ({
  createBookingWithPaymentAtomic: vi.fn(),
}))

vi.mock('@/lib/exchange-rates', () => ({
  getExchangeRates: vi.fn().mockResolvedValue({ BRL: 1, USD: 0.18 }),
}))

vi.mock('@/lib/booking/cancellation-policy', () => ({
  roundCurrency: vi.fn((v: number) => Math.round(v * 100) / 100),
}))

vi.mock('@/lib/stripe/pii-guards', () => ({
  assertNoSensitivePaymentPayload: vi.fn(),
}))

vi.mock('@/lib/booking/request-validation', async () => {
  const actual = await vi.importActual<any>('./request-validation')
  return {
    ...actual,
    isActiveSlotCollision: vi.fn().mockReturnValue(false),
  }
})

vi.mock('@/lib/calendar/sync/events', () => ({
  enqueueBookingCalendarSync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import { professionalCanReceiveRequestBooking } from '@/lib/booking/request-eligibility'
import { createBookingWithPaymentAtomic } from '@/lib/booking/transaction-operations'
import { validateSlotAvailability } from '@/lib/booking/slot-validation'

function chainableEq(finalResult: any) {
  const singleMock = vi.fn().mockResolvedValue(finalResult)
  const maybeSingleMock = vi.fn().mockResolvedValue(finalResult)
  const innerEq = vi.fn().mockReturnValue({ single: singleMock, maybeSingle: maybeSingleMock })
  const outerEq = vi.fn().mockReturnValue({ eq: innerEq, single: singleMock, maybeSingle: maybeSingleMock })
  return { eq: outerEq, single: singleMock, maybeSingle: maybeSingleMock }
}

function chainableEqUpdate(finalResult: any) {
  const thirdEq = vi.fn().mockResolvedValue(finalResult)
  const secondEq = vi.fn().mockReturnValue({ eq: thirdEq })
  const firstEq = vi.fn().mockReturnValue({ eq: secondEq })
  return { eq: firstEq }
}

function chainableEqInSelect(finalResult: any) {
  const maybeSingleMock = vi.fn().mockResolvedValue(finalResult)
  const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
  const inMock = vi.fn().mockReturnValue({ select: selectMock })
  const secondEq = vi.fn().mockReturnValue({ in: inMock })
  const firstEq = vi.fn().mockReturnValue({ eq: secondEq })
  return { eq: firstEq }
}

function buildSupabase(tableResults: Record<string, { data?: any; error?: any }> = {}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const result = tableResults[table] || { data: null, error: null }
      if (table === 'request_bookings') {
        const chains = chainableEq(result)
        return {
          select: vi.fn().mockReturnValue(chains),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(result),
            }),
          }),
          update: vi.fn().mockReturnValue(chainableEqUpdate(result)),
        }
      }
      if (table === 'profiles') {
        const chains = chainableEq(result)
        return {
          select: vi.fn().mockReturnValue(chains),
        }
      }
      if (table === 'professionals') {
        const chains = chainableEq(result)
        return {
          select: vi.fn().mockReturnValue(chains),
        }
      }
      if (table === 'professional_settings') {
        const chains = chainableEq(result)
        return {
          select: vi.fn().mockReturnValue(chains),
        }
      }
      if (table === 'bookings') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(result),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(result),
          }),
        }
      }
      if (table === 'payments') {
        return {
          insert: vi.fn().mockResolvedValue(result),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(result),
          }),
        }
      }
      return {}
    }),
  } as any
}

const validRequestId = '550e8400-e29b-41d4-a716-446655440000'
const validProfId = '550e8400-e29b-41d4-a716-446655440001'
const validUserId = '550e8400-e29b-41d4-a716-446655440002'

describe('getRequestBookingDetailService', () => {
  it('returns error for invalid requestId', async () => {
    const result = await getRequestBookingDetailService(buildSupabase(), validUserId, null, 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('invalida')
  })

  it('returns error when request not found', async () => {
    const supabase = buildSupabase({ request_bookings: { data: null, error: null } })
    const result = await getRequestBookingDetailService(supabase, validUserId, null, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrada')
  })

  it('returns error when user has no access', async () => {
    const supabase = buildSupabase({
      request_bookings: {
        data: { user_id: 'other-user', professional_id: 'other-prof' },
        error: null,
      },
    })
    const result = await getRequestBookingDetailService(supabase, validUserId, validProfId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('acesso')
  })

  it('returns success for client owner', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { user_id: validUserId, professional_id: validProfId }, error: null },
    })
    const result = await getRequestBookingDetailService(supabase, validUserId, null, validRequestId)
    expect(result.success).toBe(true)
  })

  it('returns success for professional owner', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { user_id: 'other-user', professional_id: validProfId }, error: null },
    })
    const result = await getRequestBookingDetailService(supabase, 'other-user', validProfId, validRequestId)
    expect(result.success).toBe(true)
  })
})

describe('createRequestBookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(professionalCanReceiveRequestBooking).mockResolvedValue({ ok: true } as any)
    vi.mocked(validateSlotAvailability).mockResolvedValue({ valid: true } as any)
  })

  it('returns error for invalid input', async () => {
    const result = await createRequestBookingService(buildSupabase(), validUserId, {
      professionalId: 'invalid',
      preferredStartLocal: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('returns error when professional not found', async () => {
    const supabase = buildSupabase({
      profiles: { data: { timezone: 'America/Sao_Paulo' }, error: null },
      professionals: { data: null, error: { message: 'not found' } },
    })
    const result = await createRequestBookingService(supabase, validUserId, {
      professionalId: validProfId,
      preferredStartLocal: '2025-06-15T14:30',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrado')
  })

  it('returns error when user tries to request themselves', async () => {
    const supabase = buildSupabase({
      profiles: { data: { timezone: 'America/Sao_Paulo' }, error: null },
      professionals: {
        data: { id: validProfId, user_id: validUserId, status: 'approved', profiles: null },
        error: null,
      },
    })
    const result = await createRequestBookingService(supabase, validUserId, {
      professionalId: validProfId,
      preferredStartLocal: '2025-06-15T14:30',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('próprio perfil')
  })

  it('returns error when professional cannot receive requests', async () => {
    vi.mocked(professionalCanReceiveRequestBooking).mockResolvedValue({
      ok: false,
      error: 'Profissional indisponível.',
      reasonCode: 'not_available',
    })
    const supabase = buildSupabase({
      profiles: { data: { timezone: 'America/Sao_Paulo' }, error: null },
      professionals: {
        data: { id: validProfId, user_id: 'other-user', status: 'approved', profiles: null },
        error: null,
      },
    })
    const result = await createRequestBookingService(supabase, validUserId, {
      professionalId: validProfId,
      preferredStartLocal: '2025-06-15T14:30',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.reasonCode).toBe('not_available')
  })

  it('returns error for past date', async () => {
    vi.mocked(validateSlotAvailability).mockResolvedValue({ valid: false, error: 'Horário indisponível.' })
    const past = new Date()
    past.setDate(past.getDate() - 1)
    const supabase = buildSupabase({
      profiles: { data: { timezone: 'UTC' }, error: null },
      professionals: {
        data: { id: validProfId, user_id: 'other-user', status: 'approved', profiles: null },
        error: null,
      },
      professional_settings: {
        data: { timezone: 'UTC', minimum_notice_hours: 0, max_booking_window_days: 30 },
        error: null,
      },
    })
    const result = await createRequestBookingService(supabase, validUserId, {
      professionalId: validProfId,
      preferredStartLocal: past.toISOString().slice(0, 16),
    })
    expect(result.success).toBe(false)
  })

  it('returns success when request is created', async () => {
    const future = new Date()
    future.setDate(future.getDate() + 2)
    const supabase = buildSupabase({
      profiles: { data: { timezone: 'UTC' }, error: null },
      professionals: {
        data: { id: validProfId, user_id: 'other-user', status: 'approved', profiles: null },
        error: null,
      },
      professional_settings: {
        data: { timezone: 'UTC', minimum_notice_hours: 0, max_booking_window_days: 30 },
        error: null,
      },
      request_bookings: { data: { id: 'req-1' }, error: null },
    })
    const result = await createRequestBookingService(supabase, validUserId, {
      professionalId: validProfId,
      preferredStartLocal: future.toISOString().slice(0, 16),
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.requestId).toBe('req-1')
  })
})

describe('declineRequestBookingByProfessionalService', () => {
  it('returns error when professionalId is null', async () => {
    const result = await declineRequestBookingByProfessionalService(buildSupabase(), validUserId, null, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('profissionais')
  })

  it('returns error when request not found', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: null, error: null },
    })
    const result = await declineRequestBookingByProfessionalService(supabase, validUserId, validProfId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrada')
  })

  it('returns error when request status is not open/offered', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'cancelled' }, error: null },
    })
    const result = await declineRequestBookingByProfessionalService(supabase, validUserId, validProfId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não pode ser recusada')
  })

  it('returns success for valid decline', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'open' }, error: null },
    })
    const result = await declineRequestBookingByProfessionalService(supabase, validUserId, validProfId, validRequestId)
    expect(result.success).toBe(true)
  })
})

describe('cancelRequestBookingByUserService', () => {
  it('returns error when request not found', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: null, error: null },
    })
    const result = await cancelRequestBookingByUserService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrada')
  })

  it('returns error when request status is not open/offered', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'converted' }, error: null },
    })
    const result = await cancelRequestBookingByUserService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não pode ser cancelada')
  })

  it('returns success for valid cancel', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'open' }, error: null },
    })
    const result = await cancelRequestBookingByUserService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(true)
  })
})

describe('declineRequestBookingByUserService', () => {
  it('returns error when request not found', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: null, error: null },
    })
    const result = await declineRequestBookingByUserService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrada')
  })

  it('returns error when request is not offered', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'open' }, error: null },
    })
    const result = await declineRequestBookingByUserService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('propostas recebidas')
  })

  it('returns success for valid decline', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'offered' }, error: null },
    })
    const result = await declineRequestBookingByUserService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(true)
  })
})

describe('offerRequestBookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(professionalCanReceiveRequestBooking).mockResolvedValue({ ok: true } as any)
    vi.mocked(validateSlotAvailability).mockResolvedValue({ valid: true } as any)
  })

  it('returns error when professionalId is null', async () => {
    const result = await offerRequestBookingService(buildSupabase(), validUserId, null, validRequestId, {
      proposalStartLocal: '2025-06-15T14:30',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('profissionais')
  })

  it('returns error when request not found', async () => {
    const supabase = buildSupabase({
      request_bookings: { data: null, error: null },
    })
    const result = await offerRequestBookingService(supabase, validUserId, validProfId, validRequestId, {
      proposalStartLocal: '2025-06-15T14:30',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrada')
  })

  it('returns error when request expired', async () => {
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({ status: 'expired' } as any)
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'open' }, error: null },
    })
    const result = await offerRequestBookingService(supabase, validUserId, validProfId, validRequestId, {
      proposalStartLocal: '2025-06-15T14:30',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('expirou')
  })

  it('returns error when slot validation fails', async () => {
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({ status: 'open' } as any)
    vi.mocked(validateSlotAvailability).mockResolvedValue({ valid: false, error: 'Conflito detectado.' })
    const future = new Date()
    future.setDate(future.getDate() + 2)
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'open', professional_id: validProfId }, error: null },
      professionals: {
        data: { id: validProfId, user_id: validUserId, status: 'approved', profiles: null },
        error: null,
      },
      professional_settings: {
        data: { timezone: 'UTC', minimum_notice_hours: 0, max_booking_window_days: 30, buffer_minutes: 0 },
        error: null,
      },
    })
    const result = await offerRequestBookingService(supabase, validUserId, validProfId, validRequestId, {
      proposalStartLocal: future.toISOString().slice(0, 16),
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Conflito detectado.')
  })

  it('returns success for valid offer', async () => {
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({ status: 'open' } as any)
    const future = new Date()
    future.setDate(future.getDate() + 2)
    const supabase = buildSupabase({
      request_bookings: { data: { id: validRequestId, status: 'open', professional_id: validProfId }, error: null },
      professionals: {
        data: { id: validProfId, user_id: validUserId, status: 'approved', profiles: null },
        error: null,
      },
      professional_settings: {
        data: { timezone: 'UTC', minimum_notice_hours: 0, max_booking_window_days: 30, buffer_minutes: 0 },
        error: null,
      },
    })
    const result = await offerRequestBookingService(supabase, validUserId, validProfId, validRequestId, {
      proposalStartLocal: future.toISOString().slice(0, 16),
    })
    expect(result.success).toBe(true)
  })
})

describe('acceptRequestBookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(professionalCanReceiveRequestBooking).mockResolvedValue({ ok: true } as any)
    vi.mocked(validateSlotAvailability).mockResolvedValue({ valid: true } as any)
    vi.mocked(createBookingWithPaymentAtomic).mockResolvedValue({ ok: true, bookingId: 'booking-atomic-1', paymentId: 'pay-1' })
  })

  it('returns error for invalid requestId', async () => {
    const result = await acceptRequestBookingService(buildSupabase(), validUserId, 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('inválida')
  })

  it('returns error when request not found', async () => {
    const supabase = buildSupabase({
      profiles: { data: { currency: 'BRL' }, error: null },
      request_bookings: { data: null, error: null },
    })
    const result = await acceptRequestBookingService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não encontrada')
  })

  it('returns error when request expired', async () => {
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({ status: 'expired', id: validRequestId } as any)
    const supabase = buildSupabase({
      profiles: { data: { currency: 'BRL' }, error: null },
      request_bookings: {
        data: { id: validRequestId, status: 'offered', user_id: validUserId, proposal_start_utc: new Date().toISOString(), proposal_end_utc: new Date().toISOString(), proposal_timezone: 'UTC' },
        error: null,
      },
    })
    const result = await acceptRequestBookingService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('expirou')
  })

  it('returns error when request is not offered', async () => {
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({ status: 'open', id: validRequestId } as any)
    const supabase = buildSupabase({
      profiles: { data: { currency: 'BRL' }, error: null },
      request_bookings: {
        data: { id: validRequestId, status: 'open', user_id: validUserId },
        error: null,
      },
    })
    const result = await acceptRequestBookingService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('não possui proposta')
  })

  it('returns error when professional has no price', async () => {
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({
      status: 'offered',
      id: validRequestId,
      proposal_start_utc: new Date().toISOString(),
      proposal_end_utc: new Date(Date.now() + 3600000).toISOString(),
      proposal_timezone: 'UTC',
      professional_id: validProfId,
      user_timezone: 'UTC',
    } as any)
    const supabase = buildSupabase({
      profiles: { data: { currency: 'BRL' }, error: null },
      request_bookings: {
        data: { id: validRequestId, status: 'offered', user_id: validUserId },
        error: null,
      },
      professionals: {
        data: { id: validProfId, user_id: 'other-user', status: 'approved', session_price_brl: 0, profiles: null },
        error: null,
      },
      professional_settings: {
        data: { timezone: 'UTC', confirmation_mode: 'auto_accept' },
        error: null,
      },
    })
    const result = await acceptRequestBookingService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('preço configurado')
  })

  it('returns success with atomic booking creation', async () => {
    const start = new Date()
    const end = new Date(start.getTime() + 3600000)
    const { expireRequestIfNeeded } = await import('@/lib/booking/request-helpers')
    vi.mocked(expireRequestIfNeeded).mockResolvedValue({
      status: 'offered',
      id: validRequestId,
      proposal_start_utc: start.toISOString(),
      proposal_end_utc: end.toISOString(),
      proposal_timezone: 'UTC',
      professional_id: validProfId,
      user_timezone: 'UTC',
      user_message: null,
    } as any)
    const supabase = buildSupabase({
      profiles: { data: { currency: 'BRL' }, error: null },
      request_bookings: {
        data: { id: validRequestId, status: 'offered', user_id: validUserId },
        error: null,
      },
      professionals: {
        data: { id: validProfId, user_id: 'other-user', status: 'approved', session_price_brl: 150, profiles: null },
        error: null,
      },
      professional_settings: {
        data: { timezone: 'UTC', confirmation_mode: 'auto_accept', cancellation_policy_code: 'standard' },
        error: null,
      },
    })
    const result = await acceptRequestBookingService(supabase, validUserId, validRequestId)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.bookingId).toBe('booking-atomic-1')
      expect(result.professionalId).toBe(validProfId)
    }
  })
})
