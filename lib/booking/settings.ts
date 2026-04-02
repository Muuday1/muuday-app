import type { BookingConfirmationMode, ProfessionalBookingSettings } from './types'

export const DEFAULT_PROFESSIONAL_BOOKING_SETTINGS: ProfessionalBookingSettings = {
  timezone: 'America/Sao_Paulo',
  sessionDurationMinutes: 60,
  bufferMinutes: 15,
  minimumNoticeHours: 24,
  maxBookingWindowDays: 30,
  enableRecurring: false,
  confirmationMode: 'auto_accept',
  cancellationPolicyCode: 'platform_default',
  requireSessionPurpose: false,
  cancellationPolicyAccepted: false,
  termsAcceptedAt: null,
  termsVersion: null,
  calendarSyncProvider: null,
  notificationEmail: true,
  notificationPush: true,
  notificationWhatsapp: false,
}

function parseConfirmationMode(value: unknown): BookingConfirmationMode {
  return value === 'manual' ? 'manual' : 'auto_accept'
}

function pickBufferMinutes(row: Record<string, unknown>): number {
  if (typeof row.buffer_time_minutes === 'number') return row.buffer_time_minutes
  if (typeof row.buffer_minutes === 'number') return row.buffer_minutes
  return DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.bufferMinutes
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
    bufferMinutes: pickBufferMinutes(row),
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
    cancellationPolicyAccepted:
      typeof row.cancellation_policy_accepted === 'boolean'
        ? row.cancellation_policy_accepted
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.cancellationPolicyAccepted,
    termsAcceptedAt:
      typeof row.terms_accepted_at === 'string'
        ? row.terms_accepted_at
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.termsAcceptedAt,
    termsVersion:
      typeof row.terms_version === 'string'
        ? row.terms_version
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.termsVersion,
    calendarSyncProvider:
      typeof row.calendar_sync_provider === 'string'
        ? row.calendar_sync_provider
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.calendarSyncProvider,
    notificationEmail:
      typeof row.notification_email === 'boolean'
        ? row.notification_email
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.notificationEmail,
    notificationPush:
      typeof row.notification_push === 'boolean'
        ? row.notification_push
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.notificationPush,
    notificationWhatsapp:
      typeof row.notification_whatsapp === 'boolean'
        ? row.notification_whatsapp
        : DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.notificationWhatsapp,
  }
}
