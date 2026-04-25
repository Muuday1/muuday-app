import * as Sentry from '@sentry/nextjs'

export function reportBookingError(
  error: unknown,
  context: Record<string, unknown>,
  message: string,
) {
  Sentry.captureException(error, {
    tags: { area: 'booking_create' },
    extra: context,
  })
  Sentry.captureMessage(message, {
    level: 'error',
    tags: { area: 'booking_create' },
    extra: context,
  })
}

export function logBookingEvent(
  message: string,
  context: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[booking] ${message}`, context)
  }
  Sentry.captureMessage(message, {
    level: 'info',
    tags: { area: 'booking_create' },
    extra: context,
  })
}
