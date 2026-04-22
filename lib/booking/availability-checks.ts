import { formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { hhmmToMinutes, getMinutesInTimezone } from './request-validation'
import { mapLegacyAvailabilityToRules } from './availability-engine'

export async function loadAvailabilityRules(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionalId: string,
  timezone: string,
) {
  const { data: availabilityRulesRows, error: availabilityRulesError } = await supabase
    .from('availability_rules')
    .select('weekday, start_time_local, end_time_local, timezone, is_active')
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if (!availabilityRulesError && availabilityRulesRows && availabilityRulesRows.length > 0) {
    return availabilityRulesRows
  }

  const { data: legacyAvailabilityRows, error: legacyError } = await supabase
    .from('availability')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if (legacyError) {
    console.error('[availability-checks] failed to load legacy availability:', legacyError.message)
  }

  return mapLegacyAvailabilityToRules(legacyAvailabilityRows || [], timezone)
}

export function isSlotWithinRules(
  startUtc: Date,
  endUtc: Date,
  timezone: string,
  rules: Array<Record<string, unknown>>,
) {
  const weekdayIso = Number(formatInTimeZone(startUtc, timezone, 'i'))
  const weekday = weekdayIso % 7
  const slotStartMinutes = getMinutesInTimezone(startUtc, timezone)
  const slotEndMinutes = getMinutesInTimezone(endUtc, timezone)

  return rules.some(rule => {
    if (!rule || Number(rule.weekday) !== weekday) return false
    const start = String(rule.start_time_local || '').slice(0, 5)
    const end = String(rule.end_time_local || '').slice(0, 5)
    if (!start || !end) return false
    const startMinutes = hhmmToMinutes(start)
    const endMinutes = hhmmToMinutes(end)
    return slotStartMinutes >= startMinutes && slotEndMinutes <= endMinutes
  })
}

export async function isSlotAllowedByExceptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionalId: string,
  timezone: string,
  startUtc: Date,
  endUtc: Date,
) {
  const localDate = formatInTimeZone(startUtc, timezone, 'yyyy-MM-dd')
  const { data: exceptionRows, error: exceptionError } = await supabase
    .from('availability_exceptions')
    .select('is_available, start_time_local, end_time_local')
    .eq('professional_id', professionalId)
    .eq('date_local', localDate)

  if (exceptionError) {
    console.error('[availability-checks] failed to load exceptions:', exceptionError.message)
    // Fail closed: if we can't verify exceptions, block the slot
    return false
  }

  const slotStartMinutes = getMinutesInTimezone(startUtc, timezone)
  const slotEndMinutes = getMinutesInTimezone(endUtc, timezone)
  const exceptions = (exceptionRows || []) as Array<{
    is_available: boolean
    start_time_local: string | null
    end_time_local: string | null
  }>

  if (exceptions.length === 0) return true

  const overlaps = (row: { start_time_local: string | null; end_time_local: string | null }) => {
    if (!row.start_time_local || !row.end_time_local) return true
    const start = hhmmToMinutes(row.start_time_local)
    const end = hhmmToMinutes(row.end_time_local)
    return slotStartMinutes < end && slotEndMinutes > start
  }

  const hasBlockedException = exceptions.some(row => row.is_available === false && overlaps(row))
  if (hasBlockedException) return false

  const allowedWindows = exceptions.filter(row => row.is_available)
  if (allowedWindows.length === 0) return true

  return allowedWindows.some(window => {
    if (!window.start_time_local || !window.end_time_local) return false
    const start = hhmmToMinutes(window.start_time_local)
    const end = hhmmToMinutes(window.end_time_local)
    return slotStartMinutes >= start && slotEndMinutes <= end
  })
}

export async function hasInternalConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionalId: string,
  startUtc: Date,
  endUtc: Date,
  bufferMinutes: number,
  ignoreBookingId?: string,
) {
  const conflictWindowStart = new Date(startUtc.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const conflictWindowEnd = new Date(endUtc.getTime() + 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('bookings')
    .select('id, scheduled_at, start_time_utc, end_time_utc, duration_minutes')
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .or(
      `and(start_time_utc.gte."${conflictWindowStart}",start_time_utc.lte."${conflictWindowEnd}"),and(scheduled_at.gte."${conflictWindowStart}",scheduled_at.lte."${conflictWindowEnd}")`,
    )

  if (ignoreBookingId) query = query.neq('id', ignoreBookingId)

  const { data: candidateConflicts, error: conflictError } = await query

  if (conflictError) {
    console.error('[availability-checks] failed to load conflicts:', conflictError.message)
    // Fail closed: if we can't verify conflicts, assume there is one
    return true
  }

  return (candidateConflicts || []).some((booking: Record<string, unknown>) => {
    const existingStart = new Date(
      (booking.start_time_utc as string) || (booking.scheduled_at as string) || '',
    )
    if (Number.isNaN(existingStart.getTime())) return false
    const existingDuration = Number(booking.duration_minutes) || 60
    const existingEnd = booking.end_time_utc
      ? new Date(String(booking.end_time_utc))
      : new Date(existingStart.getTime() + existingDuration * 60 * 1000)
    const bufferedExistingStart = new Date(existingStart.getTime() - bufferMinutes * 60 * 1000)
    const bufferedExistingEnd = new Date(existingEnd.getTime() + bufferMinutes * 60 * 1000)
    return startUtc < bufferedExistingEnd && endUtc > bufferedExistingStart
  })
}
