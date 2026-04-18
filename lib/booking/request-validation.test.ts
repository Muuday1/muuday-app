import { describe, it, expect } from 'vitest'
import {
  isValidIsoLocalDateTime,
  hhmmToMinutes,
  getMinutesInTimezone,
  isUniqueConstraintError,
  isActiveSlotCollision,
  localDateTimeSchema,
} from './request-validation'

describe('isValidIsoLocalDateTime', () => {
  it('accepts valid ISO datetime without seconds', () => {
    expect(isValidIsoLocalDateTime('2024-06-15T14:30')).toBe(true)
  })

  it('accepts valid ISO datetime with seconds', () => {
    expect(isValidIsoLocalDateTime('2024-06-15T14:30:00')).toBe(true)
    expect(isValidIsoLocalDateTime('2024-06-15T14:30:59')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidIsoLocalDateTime('2024-06-15')).toBe(false)
    expect(isValidIsoLocalDateTime('14:30')).toBe(false)
    expect(isValidIsoLocalDateTime('2024-06-15 14:30')).toBe(false)
    expect(isValidIsoLocalDateTime('not-a-date')).toBe(false)
  })

  it('rejects invalid dates', () => {
    expect(isValidIsoLocalDateTime('2024-02-30T12:00')).toBe(false)
    expect(isValidIsoLocalDateTime('2024-13-01T12:00')).toBe(false)
    expect(isValidIsoLocalDateTime('2024-01-01T25:00')).toBe(false)
  })
})

describe('localDateTimeSchema', () => {
  it('parses valid datetime', () => {
    const result = localDateTimeSchema.safeParse('2024-06-15T14:30')
    expect(result.success).toBe(true)
  })

  it('rejects invalid datetime', () => {
    const result = localDateTimeSchema.safeParse('invalid')
    expect(result.success).toBe(false)
  })
})

describe('hhmmToMinutes', () => {
  it('converts HH:mm to minutes', () => {
    expect(hhmmToMinutes('00:00')).toBe(0)
    expect(hhmmToMinutes('01:00')).toBe(60)
    expect(hhmmToMinutes('14:30')).toBe(870)
    expect(hhmmToMinutes('23:59')).toBe(1439)
  })

  it('ignores extra characters beyond 5 chars', () => {
    expect(hhmmToMinutes('14:30:00')).toBe(870)
  })
})

describe('getMinutesInTimezone', () => {
  it('returns correct minutes for a date in timezone', () => {
    const date = new Date('2024-06-15T14:30:00Z')
    const result = getMinutesInTimezone(date, 'UTC')
    expect(result).toBe(870)
  })

  it('accounts for timezone offset', () => {
    const date = new Date('2024-06-15T14:30:00Z')
    const result = getMinutesInTimezone(date, 'America/Sao_Paulo')
    // Sao Paulo is UTC-3 in June, so 14:30 UTC = 11:30 BRT = 690 minutes
    expect(result).toBe(690)
  })
})

describe('isUniqueConstraintError', () => {
  it('returns true for 23505 with matching constraint', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint "my_idx"' }
    expect(isUniqueConstraintError(error, 'my_idx')).toBe(true)
  })

  it('returns false for non-23505 code', () => {
    const error = { code: '23503', message: 'foreign key violation' }
    expect(isUniqueConstraintError(error, 'my_idx')).toBe(false)
  })

  it('returns false for null error', () => {
    expect(isUniqueConstraintError(null, 'my_idx')).toBe(false)
  })
})

describe('isActiveSlotCollision', () => {
  it('returns true for unique constraint on active booking index', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint "bookings_unique_active_professional_start_idx"' }
    expect(isActiveSlotCollision(error, 'bookings_unique_active_professional_start_idx')).toBe(true)
  })

  it('returns true for generic professional_id + start_time_utc mention', () => {
    const error = { code: '23505', message: 'Key (professional_id, start_time_utc)=...' }
    expect(isActiveSlotCollision(error, 'some_idx')).toBe(true)
  })

  it('returns false for non-conflict errors', () => {
    const error = { code: '23505', message: 'some other constraint' }
    expect(isActiveSlotCollision(error, 'some_idx')).toBe(false)
  })
})
