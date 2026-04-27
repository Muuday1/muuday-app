import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateSlotAvailability } from './slot-validation'

// Mock dependencies
vi.mock('./availability-checks', () => ({
  loadAvailabilityRules: vi.fn(),
  isSlotWithinRules: vi.fn(),
  isSlotAllowedByExceptions: vi.fn(),
  hasInternalConflict: vi.fn(),
}))

vi.mock('./external-calendar-conflicts', () => ({
  hasExternalBusyConflict: vi.fn(),
}))

import {
  loadAvailabilityRules,
  isSlotWithinRules,
  isSlotAllowedByExceptions,
  hasInternalConflict,
} from './availability-checks'
import { hasExternalBusyConflict } from './external-calendar-conflicts'

const mockedLoadAvailabilityRules = vi.mocked(loadAvailabilityRules)
const mockedIsSlotWithinRules = vi.mocked(isSlotWithinRules)
const mockedIsSlotAllowedByExceptions = vi.mocked(isSlotAllowedByExceptions)
const mockedHasInternalConflict = vi.mocked(hasInternalConflict)
const mockedHasExternalBusyConflict = vi.mocked(hasExternalBusyConflict)

function makeSupabase() {
  return { from: vi.fn() } as any
}

describe('validateSlotAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedLoadAvailabilityRules.mockResolvedValue([])
    mockedIsSlotWithinRules.mockReturnValue(true)
    mockedIsSlotAllowedByExceptions.mockResolvedValue(true)
    mockedHasInternalConflict.mockResolvedValue(false)
    mockedHasExternalBusyConflict.mockResolvedValue(false)
  })

  it('returns valid when all checks pass', async () => {
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endUtc: new Date(Date.now() + 49 * 60 * 60 * 1000),
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(true)
  })

  it('fails when minimum notice is not met', async () => {
    const start = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour from now
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
      minimumNoticeHours: 24,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('24 horas')
  })

  it('fails when booking exceeds max window', async () => {
    const start = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
      maxBookingWindowDays: 30,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('30 dias')
  })

  it('fails when slot is outside working hours', async () => {
    mockedIsSlotWithinRules.mockReturnValue(false)
    const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('não está disponível')
  })

  it('fails when blocked by exception', async () => {
    mockedIsSlotAllowedByExceptions.mockResolvedValue(false)
    const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('bloqueado')
  })

  it('fails when internal conflict exists', async () => {
    mockedHasInternalConflict.mockResolvedValue(true)
    const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('já está reservado')
  })

  it('fails when external calendar conflict exists', async () => {
    mockedHasExternalBusyConflict.mockResolvedValue(true)
    const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('agenda externa')
  })

  it('uses custom error messages when provided', async () => {
    mockedIsSlotWithinRules.mockReturnValue(false)
    const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
      errorMessages: {
        workingHours: 'Custom working hours error',
      },
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Custom working hours error')
  })

  it('skips minimum notice check when not provided', async () => {
    const start = new Date(Date.now() + 1 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(true)
  })

  it('skips max window check when not provided', async () => {
    const start = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const result = await validateSlotAvailability({
      supabase: makeSupabase(),
      professionalId: 'pro-123',
      startUtc: start,
      endUtc: end,
      timezone: 'America/Sao_Paulo',
      bufferMinutes: 15,
    })
    expect(result.valid).toBe(true)
  })
})
