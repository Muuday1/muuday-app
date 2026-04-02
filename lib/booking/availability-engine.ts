import { addDays, addMonths } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { ProfessionalBookingSettings, RecurrencePeriodicity } from './types'

type AvailabilityRule = {
  weekday: number
  start_time_local: string
  end_time_local: string
  timezone: string
  is_active: boolean
}

type LegacyAvailabilityRule = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

type ExistingBookingSlot = {
  startUtc: Date
  endUtc: Date
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function getWeekdayInTimezone(dateUtc: Date, timezone: string) {
  const weekdayIso = Number(formatInTimeZone(dateUtc, timezone, 'i')) // 1-7 (Mon-Sun)
  return weekdayIso % 7 // 0-6 (Sun-Sat)
}

function getMinutesInTimezone(dateUtc: Date, timezone: string) {
  return timeToMinutes(formatInTimeZone(dateUtc, timezone, 'HH:mm'))
}

function getPeriodicIncrementDays(periodicity: RecurrencePeriodicity, intervalDays?: number) {
  if (periodicity === 'custom_days') return Math.max(1, intervalDays || 1)
  if (periodicity === 'biweekly') return 14
  if (periodicity === 'weekly') return 7
  return 0
}

export function isSlotWithinWorkingHours(
  slotStartUtc: Date,
  slotEndUtc: Date,
  settings: ProfessionalBookingSettings,
  rules: AvailabilityRule[],
): boolean {
  const activeRules = rules.filter(rule => rule.is_active !== false)
  if (activeRules.length === 0) return false

  const weekday = getWeekdayInTimezone(slotStartUtc, settings.timezone)
  const slotStartMinutes = getMinutesInTimezone(slotStartUtc, settings.timezone)
  const slotEndMinutes = getMinutesInTimezone(slotEndUtc, settings.timezone)

  return activeRules
    .filter(rule => rule.weekday === weekday)
    .some(rule => {
      const startMinutes = timeToMinutes(rule.start_time_local)
      const endMinutes = timeToMinutes(rule.end_time_local)
      return slotStartMinutes >= startMinutes && slotEndMinutes <= endMinutes
    })
}

export function mapLegacyAvailabilityToRules(
  rules: LegacyAvailabilityRule[],
  timezone: string,
): AvailabilityRule[] {
  return rules.map(rule => ({
    weekday: rule.day_of_week,
    start_time_local: rule.start_time,
    end_time_local: rule.end_time,
    timezone,
    is_active: rule.is_active ?? true,
  }))
}

export function isSlotConflictWithBufferedRange(
  slotStartUtc: Date,
  slotEndUtc: Date,
  existingStartUtc: Date,
  existingEndUtc: Date,
  bufferMinutes: number,
): boolean {
  const bufferedStart = new Date(existingStartUtc.getTime() - bufferMinutes * 60 * 1000)
  const bufferedEnd = new Date(existingEndUtc.getTime() + bufferMinutes * 60 * 1000)
  return slotStartUtc < bufferedEnd && slotEndUtc > bufferedStart
}

export function hasConflictWithExistingBookings(
  slotStartUtc: Date,
  slotEndUtc: Date,
  existingBookings: ExistingBookingSlot[],
  bufferMinutes: number,
): boolean {
  return existingBookings.some(existing =>
    isSlotConflictWithBufferedRange(
      slotStartUtc,
      slotEndUtc,
      existing.startUtc,
      existing.endUtc,
      bufferMinutes,
    ),
  )
}

export function generateRecurringSlotStarts(
  initialStartUtc: Date,
  periodicity: RecurrencePeriodicity,
  bookingWindowDays: number,
  options?: {
    intervalDays?: number
    occurrences?: number
    endDateUtc?: Date | null
  },
): Date[] {
  const maxEndByWindow = addDays(new Date(), Math.max(1, bookingWindowDays))
  const explicitEndDate = options?.endDateUtc || null
  const hardEndDate = explicitEndDate && explicitEndDate < maxEndByWindow ? explicitEndDate : maxEndByWindow

  const starts: Date[] = []
  const maxOccurrences = Math.max(1, options?.occurrences || 1)
  let cursor = new Date(initialStartUtc)

  for (let i = 0; i < maxOccurrences; i += 1) {
    if (cursor > hardEndDate) break
    starts.push(new Date(cursor))

    if (periodicity === 'monthly') {
      cursor = addMonths(cursor, 1)
      continue
    }

    const incrementDays = getPeriodicIncrementDays(periodicity, options?.intervalDays)
    cursor = addDays(cursor, incrementDays)
  }

  return starts
}
