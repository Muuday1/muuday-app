import { describe, it, expect } from 'vitest'
import { generateRecurrenceSlots, detectRecurrenceConflicts } from './recurrence-engine'
import type { RecurrenceInput } from './recurrence-engine'

function makeInput(overrides?: Partial<RecurrenceInput>): RecurrenceInput {
  const base = new Date('2026-04-25T10:00:00Z')
  return {
    startDateUtc: base,
    endDateUtc: new Date(base.getTime() + 60 * 60 * 1000),
    periodicity: 'weekly',
    bookingWindowDays: 30,
    ...overrides,
  }
}

describe('generateRecurrenceSlots', () => {
  it('generates weekly slots for 4 occurrences', () => {
    const result = generateRecurrenceSlots(makeInput({ periodicity: 'weekly', occurrences: 4 }))
    expect(result.slots).toHaveLength(4)
    expect(result.recurrenceGroupId).toBeDefined()

    const [s1, s2, s3, s4] = result.slots
    expect(s1.occurrenceIndex).toBe(1)
    expect(s2.occurrenceIndex).toBe(2)
    expect(s3.occurrenceIndex).toBe(3)
    expect(s4.occurrenceIndex).toBe(4)

    // Weekly = 7 days apart
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    expect(s2.startUtc.getTime() - s1.startUtc.getTime()).toBe(oneWeek)
    expect(s3.startUtc.getTime() - s2.startUtc.getTime()).toBe(oneWeek)
    expect(s4.startUtc.getTime() - s3.startUtc.getTime()).toBe(oneWeek)

    // Duration preserved
    expect(s1.endUtc.getTime() - s1.startUtc.getTime()).toBe(60 * 60 * 1000)
  })

  it('generates biweekly slots for 3 occurrences', () => {
    const result = generateRecurrenceSlots(makeInput({ periodicity: 'biweekly', occurrences: 3 }))
    expect(result.slots).toHaveLength(3)
    const twoWeeks = 14 * 24 * 60 * 60 * 1000
    expect(result.slots[1].startUtc.getTime() - result.slots[0].startUtc.getTime()).toBe(twoWeeks)
  })

  it('generates monthly slots for 3 occurrences', () => {
    const result = generateRecurrenceSlots(makeInput({
      periodicity: 'monthly',
      occurrences: 3,
      bookingWindowDays: 90,
    }))
    expect(result.slots).toHaveLength(3)
    expect(result.slots[0].startUtc.getUTCMonth()).toBe(3) // April
    expect(result.slots[1].startUtc.getUTCMonth()).toBe(4) // May
    expect(result.slots[2].startUtc.getUTCMonth()).toBe(5) // June
  })

  it('generates custom_days slots with intervalDays', () => {
    const result = generateRecurrenceSlots(makeInput({
      periodicity: 'custom_days',
      intervalDays: 3,
      occurrences: 3,
    }))
    expect(result.slots).toHaveLength(3)
    const threeDays = 3 * 24 * 60 * 60 * 1000
    expect(result.slots[1].startUtc.getTime() - result.slots[0].startUtc.getTime()).toBe(threeDays)
  })

  it('falls back to intervalDays=1 for custom_days when not provided', () => {
    const result = generateRecurrenceSlots(makeInput({
      periodicity: 'custom_days',
      occurrences: 3,
    }))
    const oneDay = 24 * 60 * 60 * 1000
    expect(result.slots[1].startUtc.getTime() - result.slots[0].startUtc.getTime()).toBe(oneDay)
  })

  it('stops at booking window even if more occurrences requested', () => {
    const result = generateRecurrenceSlots(makeInput({
      periodicity: 'weekly',
      occurrences: 100,
      bookingWindowDays: 14,
    }))
    // 14 days window with weekly = at most 3 slots (week 0, 1, 2)
    expect(result.slots.length).toBeGreaterThanOrEqual(1)
    expect(result.slots.length).toBeLessThanOrEqual(3)
  })

  it('stops at explicit endDateLimitUtc when earlier than window', () => {
    const result = generateRecurrenceSlots(makeInput({
      periodicity: 'weekly',
      occurrences: 10,
      bookingWindowDays: 365,
      endDateLimitUtc: new Date('2026-05-02T10:00:00Z'), // 7 days later
    }))
    expect(result.slots.length).toBeLessThanOrEqual(2)
  })

  it('defaults to at least 1 occurrence', () => {
    const result = generateRecurrenceSlots(makeInput({ occurrences: 0 }))
    expect(result.slots).toHaveLength(1)
  })

  it('defaults to at least 1 day booking window', () => {
    const result = generateRecurrenceSlots(makeInput({ bookingWindowDays: 0, occurrences: 5 }))
    expect(result.slots.length).toBeGreaterThanOrEqual(1)
    expect(result.slots.length).toBeLessThanOrEqual(2)
  })
})

describe('detectRecurrenceConflicts', () => {
  it('returns empty when no conflicts', () => {
    const slots = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
    ]
    const conflicts = detectRecurrenceConflicts(slots, [], [])
    expect(conflicts).toHaveLength(0)
  })

  it('detects existing booking overlap', () => {
    const slots = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
    ]
    const existing = [
      { startUtc: new Date('2026-04-25T10:30:00Z'), endUtc: new Date('2026-04-25T11:30:00Z') },
    ]
    const conflicts = detectRecurrenceConflicts(slots, existing, [])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].reason).toBe('existing_booking')
  })

  it('detects blocked slot overlap', () => {
    const slots = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
    ]
    const blocked = [
      { startUtc: new Date('2026-04-25T09:00:00Z'), endUtc: new Date('2026-04-25T10:30:00Z') },
    ]
    const conflicts = detectRecurrenceConflicts(slots, [], blocked)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].reason).toBe('blocked_slot')
  })

  it('prefers existing_booking over blocked_slot when both conflict', () => {
    const slots = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
    ]
    const existing = [
      { startUtc: new Date('2026-04-25T10:30:00Z'), endUtc: new Date('2026-04-25T11:30:00Z') },
    ]
    const blocked = [
      { startUtc: new Date('2026-04-25T09:00:00Z'), endUtc: new Date('2026-04-25T10:30:00Z') },
    ]
    const conflicts = detectRecurrenceConflicts(slots, existing, blocked)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].reason).toBe('existing_booking')
  })

  it('detects multiple conflicting slots independently', () => {
    const slots = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
      { startUtc: new Date('2026-04-26T10:00:00Z'), endUtc: new Date('2026-04-26T11:00:00Z') },
    ]
    const existing = [
      { startUtc: new Date('2026-04-26T10:30:00Z'), endUtc: new Date('2026-04-26T11:30:00Z') },
    ]
    const conflicts = detectRecurrenceConflicts(slots, existing, [])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].startUtc).toBe(slots[1].startUtc.toISOString())
  })

  it('ignores edge-touching ranges (no overlap)', () => {
    const slots = [
      { startUtc: new Date('2026-04-25T10:00:00Z'), endUtc: new Date('2026-04-25T11:00:00Z') },
    ]
    const existing = [
      { startUtc: new Date('2026-04-25T11:00:00Z'), endUtc: new Date('2026-04-25T12:00:00Z') },
    ]
    const conflicts = detectRecurrenceConflicts(slots, existing, [])
    expect(conflicts).toHaveLength(0)
  })
})
