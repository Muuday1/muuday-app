import * as Sentry from '@sentry/nextjs'
import { inngest } from '@/inngest/client'
import type { CalendarProvider } from '@/lib/calendar/types'

type BookingCalendarSyncAction = 'upsert_booking' | 'cancel_booking'

type BookingCalendarSyncPayload = {
  bookingId: string
  action: BookingCalendarSyncAction
  source?: string
  provider?: CalendarProvider
}

type BusyPollPayload = {
  professionalId?: string
  provider?: CalendarProvider
  source?: string
}

export async function enqueueBookingCalendarSync(payload: BookingCalendarSyncPayload) {
  try {
    await inngest.send({
      name: 'calendar/booking.sync.requested',
      data: {
        bookingId: payload.bookingId,
        action: payload.action,
        provider: payload.provider,
        source: payload.source || 'app',
        requestedAt: new Date().toISOString(),
      },
    })
    return true
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { area: 'calendar_sync', subArea: 'enqueue_booking_sync' } })
    return false
  }
}

export async function enqueueCalendarBusyPoll(payload: BusyPollPayload = {}) {
  try {
    await inngest.send({
      name: 'calendar/integrations.sync.requested',
      data: {
        professionalId: payload.professionalId || null,
        provider: payload.provider || null,
        source: payload.source || 'app',
        requestedAt: new Date().toISOString(),
      },
    })
    return true
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { area: 'calendar_sync', subArea: 'enqueue_busy_poll' } })
    return false
  }
}

