import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prepareBookingSlots } from './prepare-slots'

vi.mock('@/lib/booking/recurrence-engine', () => ({
  generateRecurrenceSlots: vi.fn(),
}))

vi.mock('@/lib/booking/batch-booking', () => ({
  createBatchBookingGroup: vi.fn(),
}))

import { generateRecurrenceSlots } from '@/lib/booking/recurrence-engine'
import { createBatchBookingGroup } from '@/lib/booking/batch-booking'

const mockSettings = {
  timezone: 'America/Sao_Paulo',
  sessionDurationMinutes: 60,
  bufferMinutes: 0,
  minimumNoticeHours: 0,
  maxBookingWindowDays: 30,
  enableRecurring: true,
  confirmationMode: 'auto_accept' as const,
  cancellationPolicyCode: 'standard',
  requireSessionPurpose: false,
}

const tz = 'America/Sao_Paulo'

function futureDateTime(hoursFromNow = 2) {
  const d = new Date()
  d.setHours(d.getHours() + hoursFromNow)
  return d.toISOString().slice(0, 16)
}

describe('prepareBookingSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('one_off', () => {
    it('returns slot for valid scheduledAt', () => {
      const scheduledAt = futureDateTime(2)
      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt, bookingType: 'one_off' },
        mockSettings,
        tz,
      )

      expect('plannedSessions' in result).toBe(true)
      if ('plannedSessions' in result) {
        expect(result.plannedSessions).toHaveLength(1)
        expect(result.plannedSessions[0].localScheduledAt).toBe(scheduledAt)
        expect(result.plannedSessions[0].startUtc.getTime()).toBeGreaterThan(Date.now())
        expect(result.recurrenceGroupId).toBeNull()
        expect(result.batchBookingGroupId).toBeNull()
      }
    })

    it('returns error when scheduledAt is missing', () => {
      const result = prepareBookingSlots(
        { professionalId: 'p1', bookingType: 'one_off' },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('Escolha um horário')
      }
    })

    it('returns error for invalid scheduledAt', () => {
      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt: 'not-a-date', bookingType: 'one_off' },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('Horário inválido')
      }
    })

    it('returns error for past date', () => {
      const past = new Date()
      past.setDate(past.getDate() - 1)
      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt: past.toISOString().slice(0, 16), bookingType: 'one_off' },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('já passou')
      }
    })
  })

  describe('recurring', () => {
    it('returns slots from recurrence engine', () => {
      const scheduledAt = futureDateTime(2)
      const mockSlots = [
        { startUtc: new Date(Date.now() + 2 * 3600 * 1000), endUtc: new Date(Date.now() + 3 * 3600 * 1000), occurrenceIndex: 1 },
        { startUtc: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 2 * 3600 * 1000), endUtc: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 3 * 3600 * 1000), occurrenceIndex: 2 },
      ]
      vi.mocked(generateRecurrenceSlots).mockReturnValue({
        recurrenceGroupId: 'rec-group-1',
        slots: mockSlots,
      })

      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt, bookingType: 'recurring', recurringPeriodicity: 'weekly', recurringOccurrences: 4 },
        mockSettings,
        tz,
      )

      expect('plannedSessions' in result).toBe(true)
      if ('plannedSessions' in result) {
        expect(result.plannedSessions).toHaveLength(2)
        expect(result.recurrenceGroupId).toBe('rec-group-1')
        expect(result.plannedSessions[0].recurrenceOccurrenceIndex).toBe(1)
      }
    })

    it('returns error when scheduledAt is missing', () => {
      const result = prepareBookingSlots(
        { professionalId: 'p1', bookingType: 'recurring' },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
    })

    it('returns error for past first slot', () => {
      const past = new Date()
      past.setHours(past.getHours() - 2)
      vi.mocked(generateRecurrenceSlots).mockReturnValue({
        recurrenceGroupId: 'rec-1',
        slots: [
          { startUtc: past, endUtc: new Date(past.getTime() + 3600 * 1000), occurrenceIndex: 1 },
        ],
      })

      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt: past.toISOString().slice(0, 16), bookingType: 'recurring', recurringPeriodicity: 'weekly', recurringOccurrences: 2 },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('já passou')
      }
    })
  })

  describe('batch', () => {
    it('returns slots from batch engine', () => {
      const d1 = futureDateTime(2)
      const d2 = futureDateTime(26)
      const mockSlots = [
        { startUtc: new Date(Date.now() + 2 * 3600 * 1000), endUtc: new Date(Date.now() + 3 * 3600 * 1000), batchIndex: 1 },
        { startUtc: new Date(Date.now() + 26 * 3600 * 1000), endUtc: new Date(Date.now() + 27 * 3600 * 1000), batchIndex: 2 },
      ]
      vi.mocked(createBatchBookingGroup).mockReturnValue({
        batchBookingGroupId: 'batch-group-1',
        slots: mockSlots,
      })

      const result = prepareBookingSlots(
        { professionalId: 'p1', bookingType: 'batch', batchDates: [d1, d2] },
        mockSettings,
        tz,
      )

      expect('plannedSessions' in result).toBe(true)
      if ('plannedSessions' in result) {
        expect(result.plannedSessions).toHaveLength(2)
        expect(result.batchBookingGroupId).toBe('batch-group-1')
      }
    })

    it('returns error when batchDates has fewer than 2 items', () => {
      const result = prepareBookingSlots(
        { professionalId: 'p1', bookingType: 'batch', batchDates: [futureDateTime(2)] },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('ao menos duas datas')
      }
    })

    it('returns error when some batchDates are invalid', () => {
      const result = prepareBookingSlots(
        { professionalId: 'p1', bookingType: 'batch', batchDates: [futureDateTime(2), 'invalid'] },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('inválidas')
      }
    })

    it('returns error when all slots are in the past', () => {
      const past = new Date()
      past.setHours(past.getHours() - 2)
      const pastStr = past.toISOString().slice(0, 16)
      vi.mocked(createBatchBookingGroup).mockReturnValue({
        batchBookingGroupId: 'batch-1',
        slots: [
          { startUtc: past, endUtc: new Date(past.getTime() + 3600 * 1000), batchIndex: 1 },
        ],
      })

      const result = prepareBookingSlots(
        { professionalId: 'p1', bookingType: 'batch', batchDates: [pastStr, pastStr] },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('já passou')
      }
    })
  })

  describe('edge cases', () => {
    it('defaults to one_off when bookingType is undefined', () => {
      const scheduledAt = futureDateTime(2)
      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt },
        mockSettings,
        tz,
      )
      expect('plannedSessions' in result).toBe(true)
      if ('plannedSessions' in result) {
        expect(result.plannedSessions).toHaveLength(1)
      }
    })

    it('returns error for empty planned sessions', () => {
      vi.mocked(generateRecurrenceSlots).mockReturnValue({
        recurrenceGroupId: 'rec-1',
        slots: [],
      })

      const result = prepareBookingSlots(
        { professionalId: 'p1', scheduledAt: futureDateTime(2), bookingType: 'recurring', recurringPeriodicity: 'weekly' },
        mockSettings,
        tz,
      )
      expect('success' in result && result.success === false).toBe(true)
      if ('success' in result && !result.success) {
        expect(result.error).toContain('Não foi possível montar')
      }
    })
  })
})
