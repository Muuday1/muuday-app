import { fromZonedTime } from 'date-fns-tz'

export const MS_PER_MINUTE = 60 * 1000
export const MS_PER_HOUR = 60 * MS_PER_MINUTE

export interface ParsedBookingSlot {
  startUtc: Date
  endUtc: Date
}

/**
 * Parse a local datetime string into UTC start/end dates for a booking slot.
 * Validates the parsed date is not NaN.
 *
 * @returns The parsed slot or a localized error message.
 */
export function parseBookingSlot(
  startLocal: string,
  timezone: string,
  durationMinutes: number,
): { ok: true; slot: ParsedBookingSlot } | { ok: false; error: string } {
  let startUtc: Date
  try {
    startUtc = fromZonedTime(startLocal, timezone)
  } catch {
    return { ok: false, error: 'Horário inválido.' }
  }
  if (Number.isNaN(startUtc.getTime())) {
    return { ok: false, error: 'Horário inválido.' }
  }
  const endUtc = new Date(startUtc.getTime() + durationMinutes * MS_PER_MINUTE)
  return { ok: true, slot: { startUtc, endUtc } }
}
