import { formatInTimeZone } from 'date-fns-tz'
import type { ProfessionalBookingSettings } from './types'

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
