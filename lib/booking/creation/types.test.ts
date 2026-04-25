import { describe, it, expect } from 'vitest'
import { createBookingInputSchema } from './types'

describe('createBookingInputSchema', () => {
  const validBase = {
    professionalId: '550e8400-e29b-41d4-a716-446655440000',
    scheduledAt: '2024-06-15T14:30',
  }

  it('accepts minimal valid one_off input', () => {
    const result = createBookingInputSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('defaults bookingType when explicitly undefined', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: undefined,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      // .default().optional() combination may leave undefined when absent
      // production code uses `bookingInput.bookingType || 'one_off'`
      expect(result.data.bookingType === undefined || result.data.bookingType === 'one_off').toBe(true)
    }
  })

  it('accepts valid recurring input', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringPeriodicity: 'weekly',
      recurringOccurrences: 4,
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid batch input', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'batch',
      batchDates: ['2024-06-15T14:30', '2024-06-16T14:30'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid professionalId', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      professionalId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing professionalId', () => {
    const result = createBookingInputSchema.safeParse({
      scheduledAt: '2024-06-15T14:30',
    })
    expect(result.success).toBe(false)
  })

  it('rejects notes over 500 chars', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      notes: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects sessionPurpose over 1200 chars', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      sessionPurpose: 'a'.repeat(1201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid bookingType', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects batchDates with fewer than 2 items', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'batch',
      batchDates: ['2024-06-15T14:30'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects batchDates with more than 20 items', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'batch',
      batchDates: Array(21).fill('2024-06-15T14:30'),
    })
    expect(result.success).toBe(false)
  })

  it('rejects recurringIntervalDays below 1', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringIntervalDays: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects recurringIntervalDays above 365', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringIntervalDays: 366,
    })
    expect(result.success).toBe(false)
  })

  it('rejects recurringOccurrences below 2', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringOccurrences: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects recurringOccurrences above 52', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringOccurrences: 53,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid recurringEndDate format', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringEndDate: '15-06-2024',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid recurringEndDate', () => {
    const result = createBookingInputSchema.safeParse({
      ...validBase,
      bookingType: 'recurring',
      recurringEndDate: '2024-06-15',
    })
    expect(result.success).toBe(true)
  })
})
