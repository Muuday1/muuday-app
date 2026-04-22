import { describe, it, expect } from 'vitest'
import {
  isSlotBlockedByException,
  hasUtcBookingConflict,
  hasUtcExternalConflict,
} from './slot-filtering'

describe('isSlotBlockedByException', () => {
  it('returns false when no exceptions match the date', () => {
    const result = isSlotBlockedByException('09:00', 60, '2024-06-15', [
      { date_local: '2024-06-16', is_available: false, start_time_local: null, end_time_local: null },
    ])
    expect(result).toBe(false)
  })

  it('blocks entire day when start/end are null', () => {
    const result = isSlotBlockedByException('09:00', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: false, start_time_local: null, end_time_local: null },
    ])
    expect(result).toBe(true)
  })

  it('blocks slot that overlaps exception time range', () => {
    const result = isSlotBlockedByException('09:30', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: false, start_time_local: '09:00', end_time_local: '10:00' },
    ])
    expect(result).toBe(true)
  })

  it('does not block slot that is completely before exception', () => {
    const result = isSlotBlockedByException('08:00', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: false, start_time_local: '09:00', end_time_local: '10:00' },
    ])
    expect(result).toBe(false)
  })

  it('does not block slot that is completely after exception', () => {
    const result = isSlotBlockedByException('10:00', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: false, start_time_local: '09:00', end_time_local: '10:00' },
    ])
    expect(result).toBe(false)
  })

  it('blocks slot that touches exception boundary (touching overlap)', () => {
    // Slot 09:00-10:00, exception 10:00-11:00 -> no overlap (touching at boundary)
    const touching = isSlotBlockedByException('09:00', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: false, start_time_local: '10:00', end_time_local: '11:00' },
    ])
    expect(touching).toBe(false)

    // Slot 09:30-10:30, exception 10:00-11:00 -> overlap
    const overlapping = isSlotBlockedByException('09:30', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: false, start_time_local: '10:00', end_time_local: '11:00' },
    ])
    expect(overlapping).toBe(true)
  })

  it('ignores available exceptions (is_available=true)', () => {
    const result = isSlotBlockedByException('09:00', 60, '2024-06-15', [
      { date_local: '2024-06-15', is_available: true, start_time_local: '09:00', end_time_local: '10:00' },
    ])
    expect(result).toBe(false)
  })
})

describe('hasUtcBookingConflict', () => {
  it('returns false when no bookings overlap', () => {
    const slotUtc = new Date('2024-06-15T09:00:00Z')
    const slotEndUtc = new Date('2024-06-15T10:00:00Z')
    const result = hasUtcBookingConflict(slotUtc, slotEndUtc, [
      { scheduled_at: '2024-06-15T10:00:00Z', duration_minutes: 60 },
    ])
    expect(result).toBe(false)
  })

  it('detects overlapping booking', () => {
    const slotUtc = new Date('2024-06-15T09:30:00Z')
    const slotEndUtc = new Date('2024-06-15T10:30:00Z')
    const result = hasUtcBookingConflict(slotUtc, slotEndUtc, [
      { scheduled_at: '2024-06-15T09:00:00Z', duration_minutes: 120 },
    ])
    expect(result).toBe(true)
  })

  it('detects booking that fully contains slot', () => {
    const slotUtc = new Date('2024-06-15T09:30:00Z')
    const slotEndUtc = new Date('2024-06-15T10:00:00Z')
    const result = hasUtcBookingConflict(slotUtc, slotEndUtc, [
      { scheduled_at: '2024-06-15T08:00:00Z', duration_minutes: 240 },
    ])
    expect(result).toBe(true)
  })

  it('ignores invalid scheduled_at dates', () => {
    const slotUtc = new Date('2024-06-15T09:00:00Z')
    const slotEndUtc = new Date('2024-06-15T10:00:00Z')
    const result = hasUtcBookingConflict(slotUtc, slotEndUtc, [
      { scheduled_at: 'invalid', duration_minutes: 60 },
    ])
    expect(result).toBe(false)
  })

  it('handles midnight-crossing bookings correctly', () => {
    // Booking: 23:00 - 01:00 (next day)
    const slotUtc = new Date('2024-06-15T23:30:00Z')
    const slotEndUtc = new Date('2024-06-16T00:30:00Z')
    const result = hasUtcBookingConflict(slotUtc, slotEndUtc, [
      { scheduled_at: '2024-06-15T23:00:00Z', duration_minutes: 120 },
    ])
    expect(result).toBe(true)
  })
})

describe('hasUtcExternalConflict', () => {
  it('returns false when no external slots overlap', () => {
    const slotUtc = new Date('2024-06-15T09:00:00Z')
    const slotEndUtc = new Date('2024-06-15T10:00:00Z')
    const result = hasUtcExternalConflict(slotUtc, slotEndUtc, [
      { start_utc: '2024-06-15T10:00:00Z', end_utc: '2024-06-15T11:00:00Z' },
    ])
    expect(result).toBe(false)
  })

  it('detects overlapping external busy slot', () => {
    const slotUtc = new Date('2024-06-15T09:30:00Z')
    const slotEndUtc = new Date('2024-06-15T10:30:00Z')
    const result = hasUtcExternalConflict(slotUtc, slotEndUtc, [
      { start_utc: '2024-06-15T09:00:00Z', end_utc: '2024-06-15T11:00:00Z' },
    ])
    expect(result).toBe(true)
  })

  it('ignores invalid external slot dates', () => {
    const slotUtc = new Date('2024-06-15T09:00:00Z')
    const slotEndUtc = new Date('2024-06-15T10:00:00Z')
    const result = hasUtcExternalConflict(slotUtc, slotEndUtc, [
      { start_utc: 'invalid', end_utc: 'invalid' },
    ])
    expect(result).toBe(false)
  })

  it('handles midnight-crossing external slots correctly', () => {
    const slotUtc = new Date('2024-06-15T23:30:00Z')
    const slotEndUtc = new Date('2024-06-16T00:30:00Z')
    const result = hasUtcExternalConflict(slotUtc, slotEndUtc, [
      { start_utc: '2024-06-15T23:00:00Z', end_utc: '2024-06-16T01:00:00Z' },
    ])
    expect(result).toBe(true)
  })
})
