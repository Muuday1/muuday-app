import type { BookingConfirmationMode, ProfessionalBookingSettings } from './types'

export const DEFAULT_PROFESSIONAL_BOOKING_SETTINGS: ProfessionalBookingSettings = {
  timezone: 'America/Sao_Paulo',
  sessionDurationMinutes: 60,
  bufferMinutes: 0,
  minimumNoticeHours: 24,
  maxBookingWindowDays: 30,
  enableRecurring: false,
  confirmationMode: 'auto_accept',
  cancellationPolicyCode: 'platform_default',
  requireSessionPurpose: false,
}

function parseConfirmationMode(value: unknown): BookingConfirmationMode {
  return value === 'manual' ? 'manual' : 'auto_accept'
}

export function normalizeProfessionalSettingsRow(
  row: Record<string, unknown> | null | undefined,
  fallbackTimezone?: string,
): ProfessionalBookingSettings {
  if (!row) {
    return {
      ...DEFAULT_PROFESSIONAL_BOOKING_SETTINGS,
      timezone: fallbackTimezone || DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone,
    }
  }

  return {
    timezone:
      (typeof row.timezone === 'string' && row.timezone) ||
      fallbackTimezone ||
      DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone,
    sessionDurationMinutes:
      typeof row.session_duration_minutes === 'number'
        ? row.session_duration_minutes
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.sessionDurationMinutes,
    bufferMinutes:
      typeof row.buffer_minutes === 'number'
        ? row.buffer_minutes
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.bufferMinutes,
    minimumNoticeHours:
      typeof row.minimum_notice_hours === 'number'
        ? row.minimum_notice_hours
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.minimumNoticeHours,
    maxBookingWindowDays:
      typeof row.max_booking_window_days === 'number'
        ? row.max_booking_window_days
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.maxBookingWindowDays,
    enableRecurring:
      typeof row.enable_recurring === 'boolean'
        ? row.enable_recurring
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.enableRecurring,
    confirmationMode: parseConfirmationMode(row.confirmation_mode),
    cancellationPolicyCode:
      (typeof row.cancellation_policy_code === 'string' && row.cancellation_policy_code) ||
      DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.cancellationPolicyCode,
    requireSessionPurpose:
      typeof row.require_session_purpose === 'boolean'
        ? row.require_session_purpose
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.requireSessionPurpose,
  }
}
