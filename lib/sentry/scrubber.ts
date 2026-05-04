import type { EventHint, ErrorEvent } from '@sentry/nextjs'

/**
 * Sentry beforeSend scrubber.
 *
 * Redacts sensitive values from events before they are transmitted:
 *   - Authorization headers
 *   - Cookie values
 *   - Supabase session tokens
 *   - Any value matching common secret patterns
 */

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'x-supabase-session',
  'x-api-key',
  'x-mobile-api-key',
  'api-key',
  'password',
  'token',
  'secret',
  'private_key',
  'api_secret',
])

const SECRET_PATTERN = /\b(sk_live_|sk_test_|pk_live_|pk_test_|re_|vcp_|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b/g

function scrubValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value
  const lowerKey = key.toLowerCase()
  if (SENSITIVE_KEYS.has(lowerKey)) {
    return '[REDACTED]'
  }
  return value.replace(SECRET_PATTERN, '[REDACTED]')
}

function scrubRecord(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = scrubRecord(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      out[key] = value.map((v, i) =>
        typeof v === 'object' && v !== null ? scrubRecord(v) : scrubValue(String(i), v)
      )
    } else {
      out[key] = scrubValue(key, value)
    }
  }
  return out
}

function scrubStringRecord(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const scrubbed = scrubValue(key, value)
    out[key] = typeof scrubbed === 'string' ? scrubbed : '[REDACTED]'
  }
  return out
}

function scrubEvent<T extends ErrorEvent>(event: T): T {
  // Scrub request headers
  if (event.request?.headers) {
    event.request.headers = scrubStringRecord(event.request.headers)
  }

  // Scrub request cookies
  if (event.request?.cookies) {
    event.request.cookies = scrubStringRecord(event.request.cookies)
  }

  // Scrub extra context
  if (event.extra) {
    event.extra = scrubRecord(event.extra as Record<string, unknown>)
  }

  // Scrub user context
  if (event.user) {
    event.user = scrubRecord(event.user as Record<string, unknown>)
  }

  // Scrub breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (crumb.data) {
        crumb.data = scrubRecord(crumb.data as Record<string, unknown>)
      }
      return crumb
    })
  }

  // Scrub exception messages and stacktraces
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((value) => {
      if (value.stacktrace?.frames) {
        value.stacktrace.frames = value.stacktrace.frames.map((frame) => {
          if (frame.vars) {
            frame.vars = scrubRecord(frame.vars as Record<string, unknown>)
          }
          return frame
        })
      }
      return value
    })
  }

  return event
}

export function sentryBeforeSend(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  return scrubEvent(event)
}

export function sentryClientBeforeSend(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  return scrubEvent(event)
}
