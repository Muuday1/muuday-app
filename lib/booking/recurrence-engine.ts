import { addDays, addMonths } from 'date-fns'
import type { RecurrencePeriodicity } from './types'

export type RecurrenceInput = {
  startDateUtc: Date
  endDateUtc: Date
  periodicity: RecurrencePeriodicity
  intervalDays?: number
  occurrences?: number
  endDateLimitUtc?: Date | null
  bookingWindowDays: number
  now?: Date
}

export type RecurrenceConflict = {
  startUtc: string
  reason: 'existing_booking' | 'blocked_slot'
}

export type RecurrenceDecision = {
  recurrenceGroupId: string
  slots: Array<{ startUtc: Date; endUtc: Date; occurrenceIndex: number }>
}

function nextRecurrenceStart(
  current: Date,
  periodicity: RecurrencePeriodicity,
  intervalDays?: number,
): Date {
  if (periodicity === 'monthly') return addMonths(current, 1)
  if (periodicity === 'biweekly') return addDays(current, 14)
  if (periodicity === 'custom_days') return addDays(current, Math.max(1, intervalDays || 1))
  return addDays(current, 7)
}

export function generateRecurrenceSlots(input: RecurrenceInput): RecurrenceDecision {
  const recurrenceGroupId = crypto.randomUUID()
  const now = input.now ?? new Date()
  const maxEndByWindow = addDays(now, Math.max(1, input.bookingWindowDays))
  const hardEndDate = input.endDateLimitUtc && input.endDateLimitUtc < maxEndByWindow
    ? input.endDateLimitUtc
    : maxEndByWindow

  const count = Math.max(1, input.occurrences || 1)
  const slots: Array<{ startUtc: Date; endUtc: Date; occurrenceIndex: number }> = []

  let startCursor = new Date(input.startDateUtc)
  let endCursor = new Date(input.endDateUtc)

  for (let index = 1; index <= count; index += 1) {
    if (startCursor > hardEndDate) break

    slots.push({
      startUtc: new Date(startCursor),
      endUtc: new Date(endCursor),
      occurrenceIndex: index,
    })

    const nextStart = nextRecurrenceStart(startCursor, input.periodicity, input.intervalDays)
    const durationMs = endCursor.getTime() - startCursor.getTime()

    startCursor = nextStart
    endCursor = new Date(nextStart.getTime() + durationMs)
  }

  return {
    recurrenceGroupId,
    slots,
  }
}

export function detectRecurrenceConflicts(
  slots: Array<{ startUtc: Date; endUtc: Date }>,
  existingBookings: Array<{ startUtc: Date; endUtc: Date }>,
  blockedSlots: Array<{ startUtc: Date; endUtc: Date }>,
): RecurrenceConflict[] {
  const conflicts: RecurrenceConflict[] = []

  const hasRangeOverlap = (
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ) => aStart < bEnd && aEnd > bStart

  for (const slot of slots) {
    const bookingConflict = existingBookings.some(existing =>
      hasRangeOverlap(slot.startUtc, slot.endUtc, existing.startUtc, existing.endUtc),
    )

    if (bookingConflict) {
      conflicts.push({
        startUtc: slot.startUtc.toISOString(),
        reason: 'existing_booking',
      })
      continue
    }

    const blockedConflict = blockedSlots.some(blocked =>
      hasRangeOverlap(slot.startUtc, slot.endUtc, blocked.startUtc, blocked.endUtc),
    )

    if (blockedConflict) {
      conflicts.push({
        startUtc: slot.startUtc.toISOString(),
        reason: 'blocked_slot',
      })
    }
  }

  return conflicts
}
