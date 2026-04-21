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
import { fetchJson, toIsoFromSeconds } from './http'

const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const OUTLOOK_SCOPE = ['offline_access', 'User.Read', 'Calendars.ReadWrite'].join(' ')

function getOutlookEnv() {
  const clientId = (process.env.OUTLOOK_CLIENT_ID || '').trim()
  const clientSecret = (process.env.OUTLOOK_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error('OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET are required.')
  }
  return { clientId, clientSecret }
}

async function exchangeToken(payload: Record<string, string>) {
  const { clientId, clientSecret } = getOutlookEnv()
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...payload,
  })

  return fetchJson<{
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }>(TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
}

async function getMe(accessToken: string) {
  return fetchJson<{
    id?: string
    userPrincipalName?: string
    mail?: string
  }>(`${GRAPH_BASE}/me?$select=id,mail,userPrincipalName`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })
}

function mapToken(raw: {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}): CalendarTokenPayload {
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: toIsoFromSeconds(Date.now(), raw.expires_in),
    tokenType: raw.token_type || 'Bearer',
    scope: raw.scope || OUTLOOK_SCOPE,
  }
}

type OutlookEvent = {
  id: string
  webLink?: string
  changeKey?: string
  isCancelled?: boolean
  showAs?: string
  subject?: string
  lastModifiedDateTime?: string
  start?: { dateTime?: string; timeZone?: string }
  end?: { dateTime?: string; timeZone?: string }
}

function toUtcIso(dateTime: string | undefined, timeZone: string | undefined): string | null {
  if (!dateTime) return null

  if (dateTime.endsWith('Z') || /[+-]\d\d:\d\d$/.test(dateTime)) {
    const date = new Date(dateTime)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const candidate = timeZone ? `${dateTime} ${timeZone}` : dateTime
  const date = new Date(candidate)
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${dateTime}Z`)
    return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString()
  }
  return date.toISOString()
}

function eventToBusy(event: OutlookEvent) {
  if (event.isCancelled) return null
  if ((event.showAs || '').toLowerCase() === 'free') return null

  const startUtc = toUtcIso(event.start?.dateTime, event.start?.timeZone)
  const endUtc = toUtcIso(event.end?.dateTime, event.end?.timeZone)
  if (!startUtc || !endUtc) return null

  return {
    externalEventId: event.id,
    externalCalendarId: null,
    title: event.subject || null,
    startUtc,
    endUtc,
    sourceUpdatedAt: event.lastModifiedDateTime || null,
    payload: {
      showAs: event.showAs || null,
      changeKey: event.changeKey || null,
      webLink: event.webLink || null,
    },
  }
}

async function upsertEvent(token: CalendarTokenPayload, input: BookingEventInput): Promise<CalendarBookingEventResult> {
  const body = {
    subject: input.payload.title,
    body: {
      contentType: 'Text',
      content: input.payload.description || '',
    },
    start: {
      dateTime: input.payload.startUtc,
      timeZone: 'UTC',
    },
    end: {
      dateTime: input.payload.endUtc,
      timeZone: 'UTC',
    },
    attendees: input.payload.attendeeEmail
      ? [
          {
            emailAddress: { address: input.payload.attendeeEmail },
            type: 'required',
          },
        ]
      : [],
    transactionId: input.payload.bookingId,
  }

  const path = input.payload.existingExternalEventId
    ? `/me/events/${encodeURIComponent(input.payload.existingExternalEventId)}`
    : '/me/events'
  const method = input.payload.existingExternalEventId ? 'PATCH' : 'POST'

  const event = await fetchJson<OutlookEvent>(`${GRAPH_BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return {
    externalEventId: event.id,
    externalCalendarId: input.integration.external_calendar_id || null,
    eventEtag: event.changeKey || null,
    eventUrl: event.webLink || null,
    raw: event as unknown as Record<string, unknown>,
  }
}

async function cancelEvent(token: CalendarTokenPayload, externalEventId: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(`${GRAPH_BASE}/me/events/${encodeURIComponent(externalEventId)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token.accessToken}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok && response.status !== 404) {
      const text = await response.text()
      throw new Error(`Failed to delete Outlook event: ${response.status} ${text.slice(0, 400)}`)
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function pullBusy(token: CalendarTokenPayload, input: PullBusyInput): Promise<CalendarPullBusyResult> {
  type OutlookDeltaPage = {
    value?: OutlookEvent[]
    '@odata.nextLink'?: string
    '@odata.deltaLink'?: string
  }

  const slots: ReturnType<typeof eventToBusy>[] = []
  let nextLink: string | null =
    input.integration.sync_cursor ||
    `${GRAPH_BASE}/me/calendarView/delta?startDateTime=${encodeURIComponent(input.windowStartUtc)}&endDateTime=${encodeURIComponent(input.windowEndUtc)}&$select=id,subject,start,end,showAs,isCancelled,lastModifiedDateTime,webLink,changeKey`
  let deltaLink: string | null = null

  while (nextLink) {
    const page: OutlookDeltaPage = await fetchJson<OutlookDeltaPage>(nextLink, {
      headers: {
        authorization: `Bearer ${token.accessToken}`,
      },
    })

    ;(page.value || []).forEach((event: OutlookEvent) => {
      const slot = eventToBusy(event)
      if (slot) slots.push(slot)
    })

    nextLink = page['@odata.nextLink'] || null
    if (page['@odata.deltaLink']) {
      deltaLink = page['@odata.deltaLink']
    }
  }

  const me = await getMe(token.accessToken)

  return {
    slots: slots.filter(Boolean) as CalendarPullBusyResult['slots'],
    nextCursor: deltaLink,
    accountEmail: me.mail || me.userPrincipalName || null,
    accountId: me.id || null,
  }
}

export const outlookCalendarAdapter: CalendarProviderAdapter = {
  provider: 'outlook',
  authType: 'oauth2',

  getAuthUrl(input: OAuthAuthorizeInput) {
    const { clientId } = getOutlookEnv()
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: input.redirectUri,
      response_mode: 'query',
      scope: OUTLOOK_SCOPE,
      state: input.state,
      prompt: 'consent',
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

    const token = mapToken(tokenResponse)
    const me = await getMe(token.accessToken)

    return {
      token,
      accountEmail: me.mail || me.userPrincipalName || null,
      accountId: me.id || null,
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
      scope: OUTLOOK_SCOPE,
    })

    return {
      token: {
        ...mapToken(response),
        refreshToken: response.refresh_token || token.refreshToken,
      },
    }
  },

  async upsertBookingEvent(input: BookingEventInput) {
    if (!input.token) throw new Error('Outlook token is required to upsert booking event.')
    return upsertEvent(input.token, input)
  },

  async cancelBookingEvent(input: BookingEventInput & { externalEventId: string }) {
    if (!input.token) throw new Error('Outlook token is required to cancel booking event.')
    await cancelEvent(input.token, input.externalEventId)
  },

  async pullBusyChanges(input: PullBusyInput) {
    if (!input.token) throw new Error('Outlook token is required to pull busy changes.')
    return pullBusy(input.token, input)
  },
}
