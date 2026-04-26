import { describe, it, expect } from 'vitest'
import {
  isSlotWithinWorkingHours,
  mapLegacyAvailabilityToRules,
  isSlotConflictWithBufferedRange,
  hasConflictWithExistingBookings,
  generateRecurringSlotStarts,
} from './availability-engine'
import type { ProfessionalBookingSettings } from './types'

function makeSettings(overrides?: Partial<ProfessionalBookingSettings>): ProfessionalBookingSettings {
  return {
    timezone: 'America/Sao_Paulo',
    sessionDurationMinutes: 60,
    bufferMinutes: 15,
    minimumNoticeHours: 24,
    maxBookingWindowDays: 30,
    enableRecurring: true,
    confirmationMode: 'auto_accept',
    cancellationPolicyCode: 'flexible',
    requireSessionPurpose: false,
    ...overrides,
  }
}

describe('isSlotWithinWorkingHours', () => {
  const rules = [
    { weekday: 5, start_time_local: '09:00', end_time_local: '17:00', timezone: 'America/Sao_Paulo', is_active: true }, // Friday
    { weekday: 6, start_time_local: '10:00', end_time_local: '14:00', timezone: 'America/Sao_Paulo', is_active: true }, // Saturday
  ]

  it('returns true when slot is within active rule', () => {
    // 2026-04-24 is Friday (weekday 5 in ISO, but getWeekdayInTimezone uses Sun=0)
    // Let's use a known Friday: 2026-04-24 12:00 BRT = 2026-04-24 15:00 UTC
    const slotStart = new Date('2026-04-24T15:00:00Z')
    const slotEnd = new Date('2026-04-24T16:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), rules)).toBe(true)
  })

  it('returns false when slot is outside rule hours', () => {
    // Friday 18:00 BRT = 21:00 UTC
    const slotStart = new Date('2026-04-24T21:00:00Z')
    const slotEnd = new Date('2026-04-24T22:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), rules)).toBe(false)
  })

  it('returns false when no rules match weekday', () => {
    // Sunday 2026-04-26 — no rule for Sunday
    const slotStart = new Date('2026-04-26T15:00:00Z')
    const slotEnd = new Date('2026-04-26T16:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), rules)).toBe(false)
  })

  it('returns false when all rules are inactive', () => {
    const inactiveRules = rules.map(r => ({ ...r, is_active: false }))
    const slotStart = new Date('2026-04-24T15:00:00Z')
    const slotEnd = new Date('2026-04-24T16:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), inactiveRules)).toBe(false)
  })

  it('returns false when rules array is empty', () => {
    const slotStart = new Date('2026-04-24T15:00:00Z')
    const slotEnd = new Date('2026-04-24T16:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), [])).toBe(false)
  })

  it('returns true when slot exactly matches rule boundaries', () => {
    // Friday 09:00 BRT = 12:00 UTC
    const slotStart = new Date('2026-04-24T12:00:00Z')
    const slotEnd = new Date('2026-04-24T13:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), rules)).toBe(true)
  })

  it('returns false when slot partially exceeds rule end', () => {
    // Friday 16:00-18:00 BRT = 19:00-21:00 UTC
    const slotStart = new Date('2026-04-24T19:00:00Z')
    const slotEnd = new Date('2026-04-24T21:00:00Z')
    expect(isSlotWithinWorkingHours(slotStart, slotEnd, makeSettings(), rules)).toBe(false)
  })
})

describe('mapLegacyAvailabilityToRules', () => {
  it('maps legacy rules with default is_active true', () => {
    const legacy = [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00' },
      { day_of_week: 2, start_time: '10:00', end_time: '16:00', is_active: false },
    ]
    const result = mapLegacyAvailabilityToRules(legacy, 'Europe/London')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      weekday: 1,
      start_time_local: '09:00',
      end_time_local: '17:00',
      timezone: 'Europe/London',
      is_active: true,
    })
    expect(result[1].is_active).toBe(false)
  })

  it('returns empty array for empty input', () => {
    expect(mapLegacyAvailabilityToRules([], 'America/Sao_Paulo')).toEqual([])
  })
})

describe('isSlotConflictWithBufferedRange', () => {
  it('detects overlap within buffer', () => {
    expect(isSlotConflictWithBufferedRange(
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      new Date('2026-04-25T11:05:00Z'),
      new Date('2026-04-25T12:00:00Z'),
      10, // 10 min buffer
    )).toBe(true)
  })

  it('detects no overlap when buffered ranges do not touch', () => {
    expect(isSlotConflictWithBufferedRange(
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      new Date('2026-04-25T12:00:00Z'),
      new Date('2026-04-25T13:00:00Z'),
      30,
    )).toBe(false)
  })

  it('detects overlap when slot is entirely inside buffered range', () => {
    expect(isSlotConflictWithBufferedRange(
      new Date('2026-04-25T10:30:00Z'),
      new Date('2026-04-25T10:45:00Z'),
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      0,
    )).toBe(true)
  })

  it('detects overlap with zero buffer', () => {
    expect(isSlotConflictWithBufferedRange(
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      new Date('2026-04-25T10:30:00Z'),
      new Date('2026-04-25T11:30:00Z'),
      0,
    )).toBe(true)
  })

  it('returns false for edge-touching with zero buffer', () => {
    expect(isSlotConflictWithBufferedRange(
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      new Date('2026-04-25T12:00:00Z'),
      0,
    )).toBe(false)
  })
})

describe('hasConflictWithExistingBookings', () => {
  it('returns true when any booking conflicts', () => {
    const existing = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
    ]
    expect(hasConflictWithExistingBookings(
      new Date('2026-04-25T10:30:00Z'),
      new Date('2026-04-25T11:30:00Z'),
      existing,
      0,
    )).toBe(true)
  })

  it('returns false when no bookings conflict', () => {
    const existing = [
      { startUtc: new Date('2026-04-25T08:00:00Z'), endUtc: new Date('2026-04-25T09:00:00Z') },
    ]
    expect(hasConflictWithExistingBookings(
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      existing,
      0,
    )).toBe(false)
  })

  it('returns false for empty existing bookings', () => {
    expect(hasConflictWithExistingBookings(
      new Date('2026-04-25T10:00:00Z'),
      new Date('2026-04-25T11:00:00Z'),
      [],
      15,
    )).toBe(false)
  })
})

describe('generateRecurringSlotStarts', () => {
  it('generates weekly starts for 4 occurrences', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'weekly',
      30,
      { occurrences: 4 },
    )
    expect(starts).toHaveLength(4)
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    expect(starts[1].getTime() - starts[0].getTime()).toBe(oneWeek)
  })

  it('generates biweekly starts', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'biweekly',
      30,
      { occurrences: 3 },
    )
    expect(starts).toHaveLength(3)
    const twoWeeks = 14 * 24 * 60 * 60 * 1000
    expect(starts[1].getTime() - starts[0].getTime()).toBe(twoWeeks)
  })

  it('generates monthly starts', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'monthly',
      90,
      { occurrences: 3 },
    )
    expect(starts).toHaveLength(3)
    expect(starts[0].getUTCMonth()).toBe(3) // April
    expect(starts[1].getUTCMonth()).toBe(4) // May
    expect(starts[2].getUTCMonth()).toBe(5) // June
  })

  it('generates custom_days starts with interval', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'custom_days',
      30,
      { occurrences: 3, intervalDays: 5 },
    )
    expect(starts).toHaveLength(3)
    const fiveDays = 5 * 24 * 60 * 60 * 1000
    expect(starts[1].getTime() - starts[0].getTime()).toBe(fiveDays)
  })

  it('stops at booking window even with more occurrences', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'weekly',
      10,
      { occurrences: 100 },
    )
    expect(starts.length).toBeGreaterThanOrEqual(1)
    expect(starts.length).toBeLessThanOrEqual(2)
  })

  it('stops at explicit endDate when earlier than window', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'weekly',
      365,
      { occurrences: 10, endDateUtc: new Date('2026-05-02T10:00:00Z') },
    )
    expect(starts.length).toBeLessThanOrEqual(2)
  })

  it('defaults to at least 1 occurrence', () => {
    const starts = generateRecurringSlotStarts(
      new Date('2026-04-25T10:00:00Z'),
      'weekly',
      30,
      { occurrences: 0 },
    )
    expect(starts).toHaveLength(1)
  })
})
