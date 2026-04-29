/**
 * Pure slot-generation and filtering utilities for mobile booking flow.
 * Self-contained — no dependencies on web codebase paths.
 */

export type AvailabilityRule = {
  weekday: number
  start_time_local: string
  end_time_local: string
  is_active: boolean
}

export type AvailabilityException = {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

export type ExistingBooking = {
  scheduled_at: string
  duration_minutes: number
}

export type TimeSlot = {
  time: string
  available: boolean
}

/**
 * Generate time slots between start and end times, spaced by durationMinutes.
 * Returns HH:mm strings.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): string[] {
  const slots: string[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end = eh * 60 + em

  while (current + durationMinutes <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += durationMinutes
  }

  return slots
}

/**
 * Build an ISO-like scheduled_at string from date and time.
 */
export function buildScheduledAt(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`
}

/**
 * Check whether a raw slot (HH:mm) on a given professional date is blocked
 * by any availability exception.
 */
export function isSlotBlockedByException(
  rawSlot: string,
  durationMinutes: number,
  professionalDate: string,
  exceptions: AvailabilityException[],
): boolean {
  const [slotH, slotM] = rawSlot.split(':').map(Number)
  const slotStartMinutes = slotH * 60 + slotM
  const slotEndMinutes = slotStartMinutes + durationMinutes

  return exceptions.some((exc) => {
    if (exc.is_available !== false) return false
    if (exc.date_local !== professionalDate) return false
    if (exc.start_time_local === null || exc.end_time_local === null) return true
    const [excStartH, excStartM] = exc.start_time_local.split(':').map(Number)
    const [excEndH, excEndM] = exc.end_time_local.split(':').map(Number)
    const excStartMinutes = excStartH * 60 + excStartM
    const excEndMinutes = excEndH * 60 + excEndM
    return slotStartMinutes < excEndMinutes && slotEndMinutes > excStartMinutes
  })
}

/**
 * Check whether a UTC slot overlaps with any existing booking.
 * slotUtc and slotEndUtc are Date objects in UTC.
 */
export function hasUtcBookingConflict(
  slotUtc: Date,
  slotEndUtc: Date,
  existingBookings: ExistingBooking[],
): boolean {
  return existingBookings.some((booking) => {
    const bookingStart = new Date(booking.scheduled_at)
    if (Number.isNaN(bookingStart.getTime())) return false
    const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60 * 1000)
    return slotUtc < bookingEnd && slotEndUtc > bookingStart
  })
}

export function getDayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export function generateDateRange(startDate: string, days: number): string[] {
  const dates: string[] = []
  const [y, m, d] = startDate.split('-').map(Number)
  for (let i = 0; i < days; i++) {
    const date = new Date(y, m - 1, d + i)
    dates.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    )
  }
  return dates
}

export function computeAvailableSlotsForDate(
  dateStr: string,
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  existingBookings: ExistingBooking[],
  timezone: string,
  sessionDurationMinutes: number,
  minimumNoticeHours: number,
): TimeSlot[] {
  const dayOfWeek = getDayOfWeek(dateStr)
  const applicableRules = rules.filter((r) => r.weekday === dayOfWeek)

  if (applicableRules.length === 0) return []

  const allSlots: string[] = []
  for (const rule of applicableRules) {
    const slots = generateTimeSlots(
      rule.start_time_local,
      rule.end_time_local,
      sessionDurationMinutes,
    )
    allSlots.push(...slots)
  }

  const uniqueSlots = Array.from(new Set(allSlots)).sort()
  const now = new Date()
  const noticeCutoff = new Date(now.getTime() + minimumNoticeHours * 60 * 60 * 1000)

  return uniqueSlots.map((time) => {
    if (isSlotBlockedByException(time, sessionDurationMinutes, dateStr, exceptions)) {
      return { time, available: false }
    }

    const scheduledAt = `${dateStr}T${time}:00`
    try {
      // Parse as local time and convert to UTC
      const slotLocal = new Date(scheduledAt)
      // For simplicity, treat the string as UTC since we're comparing against UTC bookings
      // The backend handles timezone properly; mobile just needs to match the backend's logic
      const slotUtc = new Date(
        Date.UTC(
          slotLocal.getFullYear(),
          slotLocal.getMonth(),
          slotLocal.getDate(),
          slotLocal.getHours(),
          slotLocal.getMinutes(),
        ),
      )
      const slotEndUtc = new Date(slotUtc.getTime() + sessionDurationMinutes * 60 * 1000)

      if (slotUtc < noticeCutoff) {
        return { time, available: false }
      }

      if (hasUtcBookingConflict(slotUtc, slotEndUtc, existingBookings)) {
        return { time, available: false }
      }

      return { time, available: true }
    } catch {
      return { time, available: false }
    }
  })
}

export const DAY_NAMES_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MONTH_NAMES_PT_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]
