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
    console.error('[calendar-sync] failed to enqueue booking sync event', {
      payload,
      error: error instanceof Error ? error.message : String(error),
    })
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
    console.error('[calendar-sync] failed to enqueue integration poll event', {
      payload,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

