import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reportBookingError, logBookingEvent } from './logging'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import * as Sentry from '@sentry/nextjs'

describe('reportBookingError', () => {
  it('sends exception and message to Sentry', () => {
    const error = new Error('test error')
    const context = { bookingId: '123' }

    reportBookingError(error, context, 'test_message')

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { area: 'booking_create' },
      extra: context,
    })
    expect(Sentry.captureMessage).toHaveBeenCalledWith('test_message', {
      level: 'error',
      tags: { area: 'booking_create' },
      extra: context,
    })
  })
})

describe('logBookingEvent', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs to console in development', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logBookingEvent('booking_created', { id: '123' })

    expect(consoleSpy).toHaveBeenCalledWith('[booking] booking_created', { id: '123' })
    expect(Sentry.captureMessage).toHaveBeenCalledWith('booking_created', {
      level: 'info',
      tags: { area: 'booking_create' },
      extra: { id: '123' },
    })
  })

  it('does not log to console in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logBookingEvent('booking_created', { id: '123' })

    expect(consoleSpy).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).toHaveBeenCalled()
  })

  it('sends info level message to Sentry', () => {
    vi.stubEnv('NODE_ENV', 'production')

    logBookingEvent('test_event', { foo: 'bar' })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('test_event', {
      level: 'info',
      tags: { area: 'booking_create' },
      extra: { foo: 'bar' },
    })
  })
})
