export type CalendarProvider = 'google' | 'outlook' | 'apple'

export type CalendarConnectionStatus = 'disconnected' | 'pending' | 'connected' | 'error'

export type CalendarAuthType = 'oauth2' | 'caldav'

export type CalendarTokenPayload = {
  accessToken: string
  refreshToken?: string | null
  expiresAt?: string | null
  scope?: string | null
  tokenType?: string | null
}

export type CaldavCredentialPayload = {
  username: string
  appPassword: string
  serverUrl?: string | null
  calendarUrl?: string | null
}

export type CalendarIntegrationRow = {
  id: string
  professional_id: string
  provider: CalendarProvider
  auth_type: CalendarAuthType
  connection_status: CalendarConnectionStatus
  provider_account_email: string | null
  external_account_id: string | null
  external_calendar_id: string | null
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  token_metadata: Record<string, unknown>
  scope: string | null
  sync_cursor: string | null
  sync_enabled: boolean
  last_sync_at: string | null
  last_sync_error: string | null
  last_sync_started_at: string | null
  last_sync_completed_at: string | null
  caldav_principal_url: string | null
  caldav_calendar_url: string | null
  connected_at: string | null
  updated_at: string | null
}

export type CalendarBusySlotInput = {
  professionalId: string
  provider: CalendarProvider
  externalEventId: string | null
  externalCalendarId: string | null
  title?: string | null
  startUtc: string
  endUtc: string
  sourceUpdatedAt?: string | null
  payload?: Record<string, unknown>
}

export type CalendarBusySlot = {
  externalEventId: string | null
  externalCalendarId: string | null
  title?: string | null
  startUtc: string
  endUtc: string
  sourceUpdatedAt?: string | null
  payload?: Record<string, unknown>
}

export type CalendarPullBusyResult = {
  slots: CalendarBusySlot[]
  nextCursor: string | null
  accountEmail?: string | null
  accountId?: string | null
}

export type CalendarBookingEventInput = {
  bookingId: string
  title: string
  description?: string | null
  startUtc: string
  endUtc: string
  timezone: string
  attendeeEmail?: string | null
  existingExternalEventId?: string | null
  externalCalendarId?: string | null
}

export type CalendarBookingEventResult = {
  externalEventId: string
  externalCalendarId?: string | null
  eventEtag?: string | null
  eventUrl?: string | null
  raw?: Record<string, unknown>
}

export type CalendarSyncJobPayload = {
  professionalId: string
  bookingId?: string
  action: 'upsert_booking' | 'cancel_booking' | 'poll_busy'
  provider?: CalendarProvider
}
