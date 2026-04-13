import type {
  CalendarBookingEventResult,
  CalendarPullBusyResult,
  CalendarTokenPayload,
} from '../types'
import type {
  BookingEventInput,
  CalendarProviderAdapter,
  OAuthAuthorizeInput,
  OAuthExchangeCodeInput,
  OAuthExchangeCodeResult,
  PullBusyInput,
  RefreshTokenResult,
} from './adapter'
import { fetchJson, toIsoFromSeconds, toQueryString } from './http'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'

const GOOGLE_DEFAULT_SCOPE = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

function getGoogleEnv() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim()
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.')
  }
  return { clientId, clientSecret }
}

async function exchangeToken(payload: Record<string, string>): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}> {
  const { clientId, clientSecret } = getGoogleEnv()

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...payload,
  })

  return fetchJson(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
}

async function getProfile(accessToken: string): Promise<{ email?: string; sub?: string }> {
  return fetchJson(USERINFO_URL, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })
}

function mapGoogleTokenToPayload(raw: {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}): CalendarTokenPayload {
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: toIsoFromSeconds(Date.now(), raw.expires_in),
    scope: raw.scope || GOOGLE_DEFAULT_SCOPE,
    tokenType: raw.token_type || 'Bearer',
  }
}

function mapCalendarId(input: string | null | undefined) {
  return input || 'primary'
}

type GoogleEvent = {
  id: string
  htmlLink?: string
  etag?: string
  status?: string
  transparency?: string
  updated?: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

function eventToBusySlot(event: GoogleEvent) {
  const startUtc = event.start?.dateTime || event.start?.date
  const endUtc = event.end?.dateTime || event.end?.date
  if (!startUtc || !endUtc) return null

  if (event.status === 'cancelled') return null
  if (event.transparency === 'transparent') return null

  return {
    externalEventId: event.id,
    externalCalendarId: null,
    title: event.summary || null,
    startUtc,
    endUtc,
    sourceUpdatedAt: event.updated || null,
    payload: {
      status: event.status || null,
      transparency: event.transparency || null,
      etag: event.etag || null,
      htmlLink: event.htmlLink || null,
    },
  }
}

async function upsertEvent(
  token: CalendarTokenPayload,
  input: BookingEventInput,
): Promise<CalendarBookingEventResult> {
  const calendarId = mapCalendarId(input.payload.externalCalendarId || input.integration.external_calendar_id)
  const basePath = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`

  const body = {
    summary: input.payload.title,
    description: input.payload.description || '',
    start: {
      dateTime: input.payload.startUtc,
      timeZone: 'UTC',
    },
    end: {
      dateTime: input.payload.endUtc,
      timeZone: 'UTC',
    },
    attendees: input.payload.attendeeEmail ? [{ email: input.payload.attendeeEmail }] : undefined,
    extendedProperties: {
      private: {
        bookingId: input.payload.bookingId,
        source: 'muuday',
      },
    },
  }

  const url = input.payload.existingExternalEventId
    ? `${basePath}/${encodeURIComponent(input.payload.existingExternalEventId)}`
    : basePath

  const method = input.payload.existingExternalEventId ? 'PATCH' : 'POST'

  const event = await fetchJson<GoogleEvent>(url, {
    method,
    headers: {
      authorization: `Bearer ${token.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return {
    externalEventId: event.id,
    externalCalendarId: calendarId,
    eventEtag: event.etag || null,
    eventUrl: event.htmlLink || null,
    raw: event as unknown as Record<string, unknown>,
  }
}

async function cancelEvent(
  token: CalendarTokenPayload,
  input: BookingEventInput & { externalEventId: string },
): Promise<void> {
  const calendarId = mapCalendarId(input.payload.externalCalendarId || input.integration.external_calendar_id)
  const url = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(input.externalEventId)}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token.accessToken}`,
    },
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    throw new Error(`Failed to delete Google event: ${response.status} ${text.slice(0, 400)}`)
  }
}

async function pullBusy(token: CalendarTokenPayload, input: PullBusyInput): Promise<CalendarPullBusyResult> {
  const calendarId = mapCalendarId(input.integration.external_calendar_id)

  let nextPageToken: string | null = null
  let nextSyncToken: string | null = input.integration.sync_cursor || null
  const slots: ReturnType<typeof eventToBusySlot>[] = []

  let useSyncToken = Boolean(input.integration.sync_cursor)

  do {
    const query = toQueryString({
      singleEvents: 'true',
      showDeleted: 'true',
      maxResults: '2500',
      pageToken: nextPageToken,
      syncToken: useSyncToken ? nextSyncToken : null,
      timeMin: useSyncToken ? null : input.windowStartUtc,
      timeMax: useSyncToken ? null : input.windowEndUtc,
      fields:
        'items(id,htmlLink,etag,status,transparency,updated,summary,start,end),nextPageToken,nextSyncToken',
    })

    const url = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${query}`

    try {
      const page = await fetchJson<{
        items?: GoogleEvent[]
        nextPageToken?: string
        nextSyncToken?: string
      }>(url, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token.accessToken}`,
        },
      })

      ;(page.items || []).forEach(item => {
        const slot = eventToBusySlot(item)
        if (slot) slots.push(slot)
      })

      nextPageToken = page.nextPageToken || null
      if (page.nextSyncToken) {
        nextSyncToken = page.nextSyncToken
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (useSyncToken && message.includes('HTTP 410')) {
        useSyncToken = false
        nextSyncToken = null
        nextPageToken = null
        continue
      }
      throw error
    }
  } while (nextPageToken)

  const profile = await getProfile(token.accessToken)

  return {
    slots: slots.filter(Boolean) as CalendarPullBusyResult['slots'],
    nextCursor: nextSyncToken || null,
    accountEmail: profile.email || null,
    accountId: profile.sub || null,
  }
}

export const googleCalendarAdapter: CalendarProviderAdapter = {
  provider: 'google',
  authType: 'oauth2',

  getAuthUrl(input: OAuthAuthorizeInput) {
    const { clientId } = getGoogleEnv()

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: input.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      scope: GOOGLE_DEFAULT_SCOPE,
      state: input.state,
    })

    if (input.loginHint) params.set('login_hint', input.loginHint)

    return `${AUTH_URL}?${params.toString()}`
  },

  async exchangeCode(input: OAuthExchangeCodeInput): Promise<OAuthExchangeCodeResult> {
    const tokenResponse = await exchangeToken({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
    })

    const token = mapGoogleTokenToPayload(tokenResponse)
    const profile = await getProfile(token.accessToken)

    return {
      token,
      accountEmail: profile.email || null,
      accountId: profile.sub || null,
    }
  },

  async refreshIfNeeded(_integration, token): Promise<RefreshTokenResult> {
    const expiresAt = token.expiresAt ? new Date(token.expiresAt) : null
    const expiresSoon = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() - Date.now() < 60_000
    if (!expiresSoon) return { token }
    if (!token.refreshToken) return { token }

    const response = await exchangeToken({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    })

    return {
      token: {
        ...mapGoogleTokenToPayload(response),
        refreshToken: token.refreshToken,
      },
    }
  },

  async upsertBookingEvent(input: BookingEventInput) {
    if (!input.token) throw new Error('Google token is required to upsert booking event.')
    return upsertEvent(input.token, input)
  },

  async cancelBookingEvent(input: BookingEventInput & { externalEventId: string }) {
    if (!input.token) throw new Error('Google token is required to cancel booking event.')
    await cancelEvent(input.token, input)
  },

  async pullBusyChanges(input: PullBusyInput) {
    if (!input.token) throw new Error('Google token is required to pull busy changes.')
    return pullBusy(input.token, input)
  },
}
