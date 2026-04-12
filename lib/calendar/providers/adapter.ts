import type {
  CalendarBookingEventInput,
  CalendarBookingEventResult,
  CalendarIntegrationRow,
  CalendarProvider,
  CalendarPullBusyResult,
  CalendarTokenPayload,
  CaldavCredentialPayload,
} from '../types'

export type OAuthAuthorizeInput = {
  redirectUri: string
  state: string
  loginHint?: string | null
}

export type OAuthExchangeCodeInput = {
  code: string
  redirectUri: string
}

export type OAuthExchangeCodeResult = {
  token: CalendarTokenPayload
  accountEmail?: string | null
  accountId?: string | null
}

export type RefreshTokenResult = {
  token: CalendarTokenPayload
}

export type PullBusyInput = {
  integration: CalendarIntegrationRow
  token?: CalendarTokenPayload | null
  caldavCredentials?: CaldavCredentialPayload | null
  windowStartUtc: string
  windowEndUtc: string
}

export type BookingEventInput = {
  integration: CalendarIntegrationRow
  token?: CalendarTokenPayload | null
  caldavCredentials?: CaldavCredentialPayload | null
  payload: CalendarBookingEventInput
}

export interface CalendarProviderAdapter {
  readonly provider: CalendarProvider
  readonly authType: 'oauth2' | 'caldav'

  getAuthUrl?(input: OAuthAuthorizeInput): string
  exchangeCode?(input: OAuthExchangeCodeInput): Promise<OAuthExchangeCodeResult>
  refreshIfNeeded?(integration: CalendarIntegrationRow, token: CalendarTokenPayload): Promise<RefreshTokenResult>

  verifyCredentials?(credentials: CaldavCredentialPayload): Promise<{
    accountEmail?: string | null
    accountId?: string | null
    principalUrl?: string | null
    calendarUrl?: string | null
  }>

  upsertBookingEvent(input: BookingEventInput): Promise<CalendarBookingEventResult>
  cancelBookingEvent(input: BookingEventInput & { externalEventId: string }): Promise<void>
  pullBusyChanges(input: PullBusyInput): Promise<CalendarPullBusyResult>
}
