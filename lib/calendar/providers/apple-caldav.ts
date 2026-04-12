import { randomUUID } from 'node:crypto'
import type {
  CaldavCredentialPayload,
  CalendarBookingEventResult,
  CalendarPullBusyResult,
} from '../types'
import type {
  BookingEventInput,
  CalendarProviderAdapter,
  PullBusyInput,
} from './adapter'

const ICLOUD_CALDAV_BASE = 'https://caldav.icloud.com'

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildBasicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

async function caldavRequest(input: {
  method: string
  url: string
  credentials: CaldavCredentialPayload
  depth?: '0' | '1'
  body?: string
  contentType?: string
}) {
  const response = await fetch(input.url, {
    method: input.method,
    headers: {
      authorization: buildBasicAuth(input.credentials.username, input.credentials.appPassword),
      depth: input.depth || '0',
      'content-type': input.contentType || 'application/xml; charset=utf-8',
      prefer: 'return-minimal',
    },
    body: input.body,
    cache: 'no-store',
  })

  const text = await response.text()

  if (!response.ok && response.status !== 207 && response.status !== 404) {
    throw new Error(`CalDAV request failed (${response.status}): ${text.slice(0, 500)}`)
  }

  return { status: response.status, text, headers: response.headers }
}

function extractFirstTag(xml: string, tagNames: string[]): string | null {
  for (const tag of tagNames) {
    const regex = new RegExp(`<[^:>]*:?${tag}[^>]*>([\\s\\S]*?)<\\/[^:>]*:?${tag}>`, 'i')
    const match = xml.match(regex)
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  return null
}

function normalizeHref(baseUrl: string, href: string | null): string | null {
  if (!href) return null
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  const base = new URL(baseUrl)
  if (!href.startsWith('/')) {
    return `${base.origin}/${href}`
  }
  return `${base.origin}${href}`
}

function parseCalendarDataToBusySlots(calendarData: string) {
  const events = calendarData.split('BEGIN:VEVENT').slice(1)

  const slots: Array<{
    uid: string | null
    startUtc: string | null
    endUtc: string | null
    summary: string | null
    updatedAt: string | null
  }> = []

  for (const rawEventChunk of events) {
    const chunk = `BEGIN:VEVENT${rawEventChunk}`
    const uid = (chunk.match(/\nUID:(.+)\r?\n/i)?.[1] || chunk.match(/\nUID;[^:]*:(.+)\r?\n/i)?.[1] || '').trim() || null
    const dtStartRaw = (chunk.match(/\nDTSTART(?:;[^:]*)?:(.+)\r?\n/i)?.[1] || '').trim()
    const dtEndRaw = (chunk.match(/\nDTEND(?:;[^:]*)?:(.+)\r?\n/i)?.[1] || '').trim()
    const summary = (chunk.match(/\nSUMMARY:(.+)\r?\n/i)?.[1] || '').trim() || null
    const updated = (chunk.match(/\nLAST-MODIFIED:(.+)\r?\n/i)?.[1] || chunk.match(/\nDTSTAMP:(.+)\r?\n/i)?.[1] || '').trim() || null

    const startUtc = icsDateToIso(dtStartRaw)
    const endUtc = icsDateToIso(dtEndRaw)

    if (!startUtc || !endUtc) continue

    slots.push({ uid, startUtc, endUtc, summary, updatedAt: updated ? icsDateToIso(updated) : null })
  }

  return slots
}

function icsDateToIso(value: string): string | null {
  if (!value) return null
  const normalized = value.trim()

  // UTC datetime: 20260412T130000Z
  const utcMatch = normalized.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  if (utcMatch) {
    const [, y, m, d, hh, mm, ss] = utcMatch
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))).toISOString()
  }

  // floating datetime -> treat as UTC fallback
  const localMatch = normalized.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  if (localMatch) {
    const [, y, m, d, hh, mm, ss] = localMatch
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))).toISOString()
  }

  // date-only all-day
  const dateOnly = normalized.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0)).toISOString()
  }

  return null
}

function toIcsUtc(dateIso: string) {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid ISO date for ICS conversion.')
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}${ss}Z`
}

function buildIcsEvent(input: {
  uid: string
  title: string
  description?: string | null
  startUtc: string
  endUtc: string
}) {
  const dtStamp = toIcsUtc(new Date().toISOString())
  const dtStart = toIcsUtc(input.startUtc)
  const dtEnd = toIcsUtc(input.endUtc)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Muuday//Calendar Sync//PT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${input.title.replace(/\r?\n/g, ' ')}`,
    `DESCRIPTION:${(input.description || '').replace(/\r?\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

async function discoverPrincipalAndCalendar(credentials: CaldavCredentialPayload) {
  const rootUrl = credentials.serverUrl || ICLOUD_CALDAV_BASE
  const principalProbe = await caldavRequest({
    method: 'PROPFIND',
    url: rootUrl,
    credentials,
    depth: '0',
    body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal />
  </d:prop>
</d:propfind>`,
  })

  const principalHref = extractFirstTag(principalProbe.text, ['href'])
  const principalUrl = normalizeHref(rootUrl, principalHref)

  if (!principalUrl) {
    throw new Error('Unable to resolve CalDAV principal URL.')
  }

  const homeProbe = await caldavRequest({
    method: 'PROPFIND',
    url: principalUrl,
    credentials,
    depth: '0',
    body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set />
  </d:prop>
</d:propfind>`,
  })

  const homeHref = extractFirstTag(homeProbe.text, ['href'])
  const homeUrl = normalizeHref(principalUrl, homeHref)

  if (!homeUrl) {
    throw new Error('Unable to resolve CalDAV calendar-home URL.')
  }

  const calendarsProbe = await caldavRequest({
    method: 'PROPFIND',
    url: homeUrl,
    credentials,
    depth: '1',
    body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:resourcetype />
    <d:displayname />
  </d:prop>
</d:propfind>`,
  })

  const calendarHref = extractFirstTag(calendarsProbe.text, ['href'])
  const calendarUrl = normalizeHref(homeUrl, calendarHref) || homeUrl

  return {
    principalUrl,
    calendarUrl,
  }
}

async function pullBusyFromCalendar(
  credentials: CaldavCredentialPayload,
  calendarUrl: string,
  windowStartUtc: string,
  windowEndUtc: string,
): Promise<CalendarPullBusyResult> {
  const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${toIcsUtc(windowStartUtc)}" end="${toIcsUtc(windowEndUtc)}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`

  const response = await caldavRequest({
    method: 'REPORT',
    url: calendarUrl,
    credentials,
    depth: '1',
    body: reportBody,
  })

  const calendarDataBlocks: string[] = []
  const calendarDataRegex = /<[^:>]*:?calendar-data[^>]*>([\s\S]*?)<\/[^:>]*:?calendar-data>/gi
  let calendarDataMatch: RegExpExecArray | null
  while ((calendarDataMatch = calendarDataRegex.exec(response.text)) !== null) {
    calendarDataBlocks.push(calendarDataMatch[1])
  }

  const slots = calendarDataBlocks.flatMap(block => {
    const parsed = parseCalendarDataToBusySlots(block)
    return parsed.map(item => ({
      externalEventId: item.uid,
      externalCalendarId: calendarUrl,
      title: item.summary,
      startUtc: item.startUtc || '',
      endUtc: item.endUtc || '',
      sourceUpdatedAt: item.updatedAt,
      payload: {
        source: 'caldav',
      },
    }))
  })

  return {
    slots: slots.filter(slot => Boolean(slot.startUtc && slot.endUtc)),
    nextCursor: null,
    accountEmail: credentials.username,
    accountId: credentials.username,
  }
}

async function upsertCalendarEvent(
  credentials: CaldavCredentialPayload,
  calendarUrl: string,
  input: BookingEventInput,
): Promise<CalendarBookingEventResult> {
  const uid = input.payload.existingExternalEventId || `${input.payload.bookingId}-${randomUUID()}@muuday`
  const resourceUrl = `${calendarUrl.replace(/\/+$/, '')}/${encodeURIComponent(uid)}.ics`

  const icsBody = buildIcsEvent({
    uid,
    title: input.payload.title,
    description: input.payload.description,
    startUtc: input.payload.startUtc,
    endUtc: input.payload.endUtc,
  })

  const response = await fetch(resourceUrl, {
    method: 'PUT',
    headers: {
      authorization: buildBasicAuth(credentials.username, credentials.appPassword),
      'content-type': 'text/calendar; charset=utf-8',
      'if-none-match': '*',
    },
    body: icsBody,
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 412) {
    const text = await response.text()
    throw new Error(`Failed to upsert CalDAV event (${response.status}): ${text.slice(0, 500)}`)
  }

  const etag = response.headers.get('etag')

  return {
    externalEventId: uid,
    externalCalendarId: calendarUrl,
    eventEtag: etag,
    eventUrl: resourceUrl,
    raw: {
      status: response.status,
      etag,
    },
  }
}

async function cancelCalendarEvent(
  credentials: CaldavCredentialPayload,
  calendarUrl: string,
  externalEventId: string,
) {
  const resourceUrl = `${calendarUrl.replace(/\/+$/, '')}/${encodeURIComponent(externalEventId)}.ics`
  const response = await fetch(resourceUrl, {
    method: 'DELETE',
    headers: {
      authorization: buildBasicAuth(credentials.username, credentials.appPassword),
    },
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    throw new Error(`Failed to delete CalDAV event (${response.status}): ${text.slice(0, 500)}`)
  }
}

export const appleCaldavAdapter: CalendarProviderAdapter = {
  provider: 'apple',
  authType: 'caldav',

  async verifyCredentials(credentials) {
    const discovery = await discoverPrincipalAndCalendar(credentials)
    return {
      accountEmail: credentials.username,
      accountId: credentials.username,
      principalUrl: discovery.principalUrl,
      calendarUrl: discovery.calendarUrl,
    }
  },

  async upsertBookingEvent(input) {
    if (!input.caldavCredentials) {
      throw new Error('Apple CalDAV credentials are required to upsert booking event.')
    }

    const calendarUrl =
      input.caldavCredentials.calendarUrl ||
      input.integration.caldav_calendar_url ||
      input.integration.external_calendar_id ||
      ICLOUD_CALDAV_BASE

    return upsertCalendarEvent(input.caldavCredentials, calendarUrl, input)
  },

  async cancelBookingEvent(input) {
    if (!input.caldavCredentials) {
      throw new Error('Apple CalDAV credentials are required to cancel booking event.')
    }

    const calendarUrl =
      input.caldavCredentials.calendarUrl ||
      input.integration.caldav_calendar_url ||
      input.integration.external_calendar_id ||
      ICLOUD_CALDAV_BASE

    await cancelCalendarEvent(input.caldavCredentials, calendarUrl, input.externalEventId)
  },

  async pullBusyChanges(input) {
    if (!input.caldavCredentials) {
      throw new Error('Apple CalDAV credentials are required to pull busy changes.')
    }

    const calendarUrl =
      input.caldavCredentials.calendarUrl ||
      input.integration.caldav_calendar_url ||
      input.integration.external_calendar_id

    if (!calendarUrl) {
      const discovery = await discoverPrincipalAndCalendar(input.caldavCredentials)
      input.caldavCredentials.calendarUrl = discovery.calendarUrl
      input.caldavCredentials.serverUrl = input.caldavCredentials.serverUrl || ICLOUD_CALDAV_BASE
      return pullBusyFromCalendar(
        input.caldavCredentials,
        discovery.calendarUrl,
        input.windowStartUtc,
        input.windowEndUtc,
      )
    }

    return pullBusyFromCalendar(
      input.caldavCredentials,
      calendarUrl,
      input.windowStartUtc,
      input.windowEndUtc,
    )
  },
}
