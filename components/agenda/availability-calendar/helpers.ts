import { formatInTimeZone } from 'date-fns-tz'
import type { BookingSlot, LocalBookingInterval } from './types'

export function parseMinutes(value: string) {
  const [h, m] = value.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function weekdayFromDate(date: Date, timezone: string) {
  const isoWeekday = Number(formatInTimeZone(date, timezone, 'i')) // 1..7
  return isoWeekday % 7 // 0..6 (dom..sab)
}

export function getDateKey(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd')
}

export function buildLocalBookingIntervals(bookings: BookingSlot[], timezone: string) {
  const map = new Map<string, LocalBookingInterval[]>()

  for (const booking of bookings) {
    const startUtc = new Date(booking.start_utc)
    const endUtc = new Date(booking.end_utc)
    if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()) || endUtc <= startUtc) continue

    const key = getDateKey(startUtc, timezone)
    const startMinutes = parseMinutes(formatInTimeZone(startUtc, timezone, 'HH:mm'))
    const endMinutes = parseMinutes(formatInTimeZone(endUtc, timezone, 'HH:mm'))
    const current = map.get(key) || []
    current.push({ start: startMinutes, end: endMinutes, status: booking.status, id: booking.id, client_name: booking.client_name })
    map.set(key, current)
  }

  return map
}

export function roundDownToStep(minutes: number, step: number) {
  return Math.floor(minutes / step) * step
}

export function roundUpToStep(minutes: number, step: number) {
  return Math.ceil(minutes / step) * step
}
