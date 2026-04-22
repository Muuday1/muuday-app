/**
 * Pure slot-filtering utilities shared between public profile slot picker
 * and checkout slot picker.
 *
 * All functions are timezone-agnostic where possible; callers are responsible
 * for converting to the correct timezone before invoking.
 */

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

export type ExternalCalendarBusySlot = {
  start_utc: string
  end_utc: string
}

/**
 * Check whether a raw slot (HH:mm in professional timezone) on a given
 * professional date is blocked by any availability exception.
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

  return exceptions.some(exc => {
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
 */
export function hasUtcBookingConflict(
  slotUtc: Date,
  slotEndUtc: Date,
  existingBookings: ExistingBooking[],
): boolean {
  return existingBookings.some(booking => {
    const bookingStart = new Date(booking.scheduled_at)
    if (Number.isNaN(bookingStart.getTime())) return false
    const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60 * 1000)
    return slotUtc < bookingEnd && slotEndUtc > bookingStart
  })
}

/**
 * Check whether a UTC slot overlaps with any external calendar busy slot.
 */
export function hasUtcExternalConflict(
  slotUtc: Date,
  slotEndUtc: Date,
  externalBusySlots: ExternalCalendarBusySlot[],
): boolean {
  return externalBusySlots.some(busy => {
    const busyStart = new Date(busy.start_utc)
    const busyEnd = new Date(busy.end_utc)
    if (Number.isNaN(busyStart.getTime()) || Number.isNaN(busyEnd.getTime())) return false
    return slotUtc < busyEnd && slotEndUtc > busyStart
  })
}
