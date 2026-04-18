import { describe, it, expect } from 'vitest'
import {
  normalizeProfessionalSettingsRow,
  DEFAULT_PROFESSIONAL_BOOKING_SETTINGS,
} from './settings'

describe('normalizeProfessionalSettingsRow', () => {
  it('returns defaults when row is null', () => {
    const result = normalizeProfessionalSettingsRow(null)
    expect(result).toEqual(DEFAULT_PROFESSIONAL_BOOKING_SETTINGS)
  })

  it('returns defaults with fallback timezone when row is null', () => {
    const result = normalizeProfessionalSettingsRow(null, 'Europe/Lisbon')
    expect(result.timezone).toBe('Europe/Lisbon')
    expect(result.sessionDurationMinutes).toBe(
      DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.sessionDurationMinutes,
    )
  })

  it('overrides defaults with provided row values', () => {
    const row = {
      timezone: 'Europe/Lisbon',
      session_duration_minutes: 90,
      buffer_minutes: 30,
      minimum_notice_hours: 48,
      max_booking_window_days: 60,
      enable_recurring: true,
      confirmation_mode: 'manual',
      cancellation_policy_code: 'strict',
      require_session_purpose: true,
    }
    const result = normalizeProfessionalSettingsRow(row)
    expect(result.timezone).toBe('Europe/Lisbon')
    expect(result.sessionDurationMinutes).toBe(90)
    expect(result.bufferMinutes).toBe(30)
    expect(result.minimumNoticeHours).toBe(48)
    expect(result.maxBookingWindowDays).toBe(60)
    expect(result.enableRecurring).toBe(true)
    expect(result.confirmationMode).toBe('manual')
    expect(result.cancellationPolicyCode).toBe('strict')
    expect(result.requireSessionPurpose).toBe(true)
  })

  it('prefers buffer_time_minutes over buffer_minutes', () => {
    const row = {
      buffer_time_minutes: 20,
      buffer_minutes: 10,
    }
    const result = normalizeProfessionalSettingsRow(row)
    expect(result.bufferMinutes).toBe(20)
  })

  it('falls back to buffer_minutes when buffer_time_minutes is missing', () => {
    const row = {
      buffer_minutes: 25,
    }
    const result = normalizeProfessionalSettingsRow(row)
    expect(result.bufferMinutes).toBe(25)
  })

  it('treats invalid confirmation_mode as auto_accept', () => {
    const result = normalizeProfessionalSettingsRow({ confirmation_mode: 'unknown' })
    expect(result.confirmationMode).toBe('auto_accept')
  })
})
